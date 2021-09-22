import { Request, Response, NextFunction } from 'express';
export const GetConnectionInfo = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  Object.assign(res.locals, { ip, userAgent });
  return next();
};
