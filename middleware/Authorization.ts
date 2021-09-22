import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../utils/SecurityService';
import HttpStatus from 'http-status-codes';
import { ResponseHandler } from '../utils/ResponseHandler';
import { User } from '../models/UserModel';
import _ from 'lodash';
import { Types } from 'mongoose';
export const Authorization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const {
    headers: { authorization },
    signedCookies: { mdt_sessionId },
  } = req;
  const token = SecurityService.validateAuthHeader(authorization);
  if (_.isNil(token) || _.isNil(mdt_sessionId) || !Types.ObjectId.isValid(mdt_sessionId)) {
    return ResponseHandler.SendResponse({ res, status: HttpStatus.UNAUTHORIZED, body: 'Unauthorized' });
  }
  let userId;
  try {
    userId = SecurityService.validateJWTToken({ token, type: 'access' });
  } catch (err) {
    ResponseHandler.SendResponse({ res, status: HttpStatus.BAD_REQUEST, body: err.message });
    return;
  }
  const { ip, userAgent } = res.locals;
  const user: any = await User.findOne({
    _id: userId,
    sessions: { $elemMatch: { userAgent, accessToken: token, sessionId: mdt_sessionId } },
  }).exec();
  if (_.isNil(user)) {
    ResponseHandler.SendResponse({ res, status: HttpStatus.NOT_FOUND, body: 'User not found' });
    return;
  }
  const currentSession = _.find(user.sessions, { userAgent, accessToken: token, sessionId: mdt_sessionId });
  Object.assign(currentSession, { ip, lastUpdated: String(new Date()) });
  user.sessions = user.sessions.filter(
    (session: any) => String(session.sessionId) !== String(currentSession.sessionId),
  );
  user.sessions.unshift(currentSession);
  try {
    Object.assign(res.locals, {
      user: await User.findByIdAndUpdate(
        userId,
        { $set: { sessions: user.sessions, lastVisited: String(new Date()) } },
        { new: true },
      ).exec(),
    });
    return next();
  } catch (err) {
    return ResponseHandler.SendResponse({ res, status: HttpStatus.BAD_REQUEST, body: err.message });
  }
};
