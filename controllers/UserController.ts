import { User } from '../models/UserModel';
import { Confirmations } from '../models/Confirmations';
import { Request, Response, NextFunction } from 'express';
import { MailService } from '../utils/MailService';
import { SecurityService } from '../utils/SecurityService';
import { ResponseHandler } from '../utils/ResponseHandler';
import _ from 'lodash';
import moment from 'moment';
import HttpStatus from 'http-status-codes';
import { Types } from 'mongoose';
export class UserController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    const existingUser = await User.findOne({ email: req.body.email }).exec();
    if (!_.isNil(existingUser)) {
      return ResponseHandler.SendResponse({ res, status: HttpStatus.BAD_REQUEST, body: 'Email already exists' });
    }
    const session = await User.startSession();
    session.startTransaction();
    try {
      const user = new User(req.body);
      const emailConfirmation: any = new Confirmations({ type: 'emailConfirmation', user: user._id });
      await user.save({ session });
      await emailConfirmation.save({ session });
      await session.commitTransaction();
      session.endSession();
      const mail = await MailService.formEmailTemplate('EmailConfirmation.hbs', {
        expirationDate: moment(emailConfirmation.expirationDate).format('YYYY-MM-DD HH:mm:ss'),
        hash: emailConfirmation.hash,
      });
      MailService.sendEmail({
        to: req.body.email,
        subject: 'Successful registration',
        html: mail,
      });
      ResponseHandler.SendResponse({ res, status: HttpStatus.CREATED });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      next(err);
    }
  }
  async registerConfirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { hash } = req.params;
    const confirmation: any = await Confirmations.findOne(
      { hash, type: 'emailConfirmation' },
      { _id: 1, expirationDate: 1, user: 1 },
    ).exec();
    if (_.isNil(confirmation)) {
      return ResponseHandler.SendResponse({ res, status: HttpStatus.NOT_FOUND, body: 'Confirmation not found' });
    } else if (new Date() > confirmation.expirationDate) {
      const session = await User.startSession();
      session.startTransaction();
      try {
        await confirmation.remove({ session });
        await User.findByIdAndDelete(confirmation.user, { session }).exec();
        await session.commitTransaction();
        session.endSession();
        return ResponseHandler.SendResponse({
          res,
          status: HttpStatus.BAD_REQUEST,
          body: 'Confirmation token expired',
        });
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return next(err);
      }
    }
    const session = await User.startSession();
    session.startTransaction();
    try {
      await confirmation.remove({ session });
      await User.findByIdAndUpdate(confirmation.user, { $set: { emailConfirmation: true } }, { session }).exec();
      await session.commitTransaction();
      session.endSession();
      ResponseHandler.SendResponse({ res, status: HttpStatus.OK });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      next(err);
    }
  }
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password } = req.body;
    const { ip, userAgent } = res.locals;
    const user: any = await User.findOne(
      { email, password: SecurityService.generatePasswordHash(password) },
      { _id: 1, emailConfirmation: 1, sessions: 1 },
    ).exec();
    if (_.isNil(user)) {
      return ResponseHandler.SendResponse({ res, status: HttpStatus.BAD_REQUEST, body: 'Invalid email or password' });
    } else if (_.eq(user.emailConfirmation, false)) {
      return ResponseHandler.SendResponse({ res, status: HttpStatus.BAD_REQUEST, body: 'Email is not confirmed' });
    }
    const { accessToken, refreshToken } = SecurityService.generateJWTPair(user._id);
    try {
      _.remove(user.sessions, { sessionId: req.signedCookies['mdt_sessionId'] });
      const sessionId = String(Types.ObjectId());
      user.sessions.unshift({ ip, userAgent, accessToken, refreshToken, sessionId });
      await user.save();
      res.cookie('mdt_sessionId', sessionId, { httpOnly: true, signed: true });
      ResponseHandler.SendResponse({ res, status: HttpStatus.OK, body: { accessToken, refreshToken } });
    } catch (err) {
      next(err);
    }
  }
  async refreshTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
    const {
      headers: { authorization },
      signedCookies: { mdt_sessionId },
    } = req;
    const { ip, userAgent } = res.locals;
    const token = SecurityService.validateAuthHeader(authorization);
    if (_.isNil(token) || _.isNil(mdt_sessionId) || !Types.ObjectId.isValid(mdt_sessionId)) {
      return ResponseHandler.SendResponse({ res, status: HttpStatus.UNAUTHORIZED, body: 'Unauthorized' });
    }
    let userId;
    try {
      userId = SecurityService.validateJWTToken({ token, type: 'refresh' });
    } catch (err) {
      return next(err);
    }
    const user: any = await User.findOne({
      _id: userId,
      sessions: { $elemMatch: { userAgent, refreshToken: token, sessionId: mdt_sessionId } },
    }).exec();
    if (_.isNil(user)) {
      return ResponseHandler.SendResponse({ res, status: HttpStatus.NOT_FOUND, body: 'User not found' });
    }
    const { accessToken, refreshToken } = SecurityService.generateJWTPair(user._id);
    const currentSession = _.find(user.sessions, { userAgent, refreshToken: token, sessionId: mdt_sessionId });
    Object.assign(currentSession, { ip, lastUpdated: String(new Date()), accessToken, refreshToken });
    user.sessions = user.sessions.filter(
      (session: any) => String(session.sessionId) !== String(currentSession.sessionId),
    );
    user.sessions.unshift(currentSession);
    try {
      await User.updateOne({ _id: userId }, { $set: { sessions: user.sessions, lastVisited: String(new Date()) } });
      ResponseHandler.SendResponse({ res, status: HttpStatus.OK, body: { accessToken, refreshToken } });
    } catch (err) {
      next(err);
    }
  }
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { user } = res.locals;
    const { mdt_sessionId } = req.signedCookies;
    try {
      res.clearCookie('mdt_sessionId');
      await User.updateOne({ _id: user._id }, { $pull: { sessions: { sessionId: mdt_sessionId } } });
      ResponseHandler.SendResponse({ res, status: HttpStatus.OK });
    } catch (err) {
      next(err);
    }
  }
  async resendConfirmEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email } = req.body;
    const user: any = await User.findOne({ email }, { _id: 1, emailConfirmation: 1 }).exec();
    if (_.isNil(user)) {
      return ResponseHandler.SendResponse({ res, status: HttpStatus.NOT_FOUND, body: 'User not found' });
    } else if (_.eq(user.emailConfirmation, true)) {
      return ResponseHandler.SendResponse({ res, status: HttpStatus.BAD_REQUEST, body: 'User is already confirmed' });
    }
    try {
      const emailConfirmation: any = await Confirmations.findOneAndUpdate(
        { type: 'emailConfirmation', user: user._id },
        {
          $set: {
            hash: Confirmations.schema.obj.hash.default(),
            expirationDate: Confirmations.schema.obj.expirationDate.default(),
          },
        },
        { new: true },
      ).exec();
      const mail = await MailService.formEmailTemplate('EmailConfirmation.hbs', {
        expirationDate: moment(emailConfirmation.expirationDate).format('YYYY-MM-DD HH:mm:ss'),
        hash: emailConfirmation.hash,
      });
      MailService.sendEmail({
        to: email,
        subject: 'Successful registration',
        html: mail,
      });
      ResponseHandler.SendResponse({ res, status: HttpStatus.OK });
    } catch (err) {
      next(err);
    }
  }
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email } = req.body;
    const user: any = await User.findOne({ email }, { _id: 1, emailConfirmation: 1 }).exec();
    if (_.isNil(user)) {
      return ResponseHandler.SendResponse({ res, status: HttpStatus.NOT_FOUND, body: 'User not found' });
    } else if (_.eq(user.emailConfirmation, false)) {
      return ResponseHandler.SendResponse({ res, status: HttpStatus.BAD_REQUEST, body: 'Email is not confirmed' });
    }
    try {
      const passwordReset: any = await Confirmations.findOneAndUpdate(
        { type: 'passwordReset', user: user._id },
        {
          $set: {
            hash: Confirmations.schema.obj.hash.default(),
            expirationDate: Confirmations.schema.obj.expirationDate.default(),
          },
        },
        { new: true, upsert: true },
      ).exec();
      const mail = await MailService.formEmailTemplate('ResetPasswordConfirmation.hbs', {
        expirationDate: moment(passwordReset.expirationDate).format('YYYY-MM-DD HH:mm:ss'),
        hash: passwordReset.hash,
      });
      MailService.sendEmail({
        to: email,
        subject: 'Reset password',
        html: mail,
      });
      ResponseHandler.SendResponse({ res, status: HttpStatus.OK });
    } catch (err) {
      next(err);
    }
  }
  async resetPasswordConfirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { hash } = req.params;
    const { password } = req.body;
    const confirmation: any = await Confirmations.findOne(
      { hash, type: 'passwordReset' },
      { _id: 1, expirationDate: 1 },
    )
      .populate({ path: 'user', select: '_id password' })
      .exec();
    if (_.isNil(confirmation)) {
      return ResponseHandler.SendResponse({ res, status: HttpStatus.NOT_FOUND, body: 'Confirmation not found' });
    } else if (new Date() > confirmation.expirationDate) {
      try {
        await confirmation.remove();
        return ResponseHandler.SendResponse({
          res,
          status: HttpStatus.BAD_REQUEST,
          body: 'Confirmation token expired',
        });
      } catch (err) {
        return next(err);
      }
    } else if (_.eq(SecurityService.generatePasswordHash(password), confirmation.user.password)) {
      return ResponseHandler.SendResponse({
        res,
        status: HttpStatus.BAD_REQUEST,
        body: 'Cannot set the same password',
      });
    }
    const session = await User.startSession();
    session.startTransaction();
    try {
      await confirmation.remove({ session });
      await User.findByIdAndUpdate(confirmation.user, { $set: { password, sessions: [] } }, { session }).exec();
      await session.commitTransaction();
      session.endSession();
      ResponseHandler.SendResponse({ res, status: HttpStatus.OK });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      next(err);
    }
  }
  async dashboard(req: Request, res: Response): Promise<void> {
    ResponseHandler.SendResponse({
      res,
      status: HttpStatus.OK,
      body: _.pick(res.locals.user, [
        'firstName',
        'lastName',
        'email',
        'emailConfirmation',
        'gender',
        'created',
        'lastVisited',
      ]),
    });
  }
}
