import * as Crypto from 'crypto';
import _ from 'lodash';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
export class SecurityService {
  static generatePasswordHash(password: string): string {
    const { PASSWORD_SECRET } = process.env;
    if (_.isNil(PASSWORD_SECRET)) {
      throw new Error('PASSWORD_SECRET should be specified');
    }
    return Crypto.createHmac('sha1', PASSWORD_SECRET).update(password).digest('hex');
  }
  static generateJWTPair(userId: Types.ObjectId): { accessToken: string; refreshToken: string } {
    const { JWT_SECRET } = process.env;
    if (_.isNil(JWT_SECRET)) {
      throw new Error('JWT_SECRET should be specified');
    }
    return {
      accessToken: jwt.sign({ userId, type: 'access' }, JWT_SECRET, { expiresIn: '15m' }),
      refreshToken: jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, { expiresIn: '1h' }),
    };
  }
  static validateJWTToken({ token, type }: { token: string; type: 'access' | 'refresh' }): string | void {
    const { JWT_SECRET } = process.env;
    if (_.isNil(JWT_SECRET)) {
      throw new Error('JWT_SECRET should be specified');
    }
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (err instanceof jwt.JsonWebTokenError) {
        throw new Error(`Not ${type} token is provided`);
      }
    }
    if (!_.isNil(type) && payload.type !== type) {
      throw new Error(`Not ${type} token is provided`);
    }
    return payload.userId;
  }
  static validateAuthHeader(authHeader: string | undefined): string | null {
    if (!(!_.isNil(authHeader) && _.eq(_.size(authHeader.split(' ')), 2))) {
      return null;
    }
    const [prefix, token] = authHeader.split(' ');
    if (!_.eq(prefix, 'Bearer')) {
      return null;
    }
    return token;
  }
}
