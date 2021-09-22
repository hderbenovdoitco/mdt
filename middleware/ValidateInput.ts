import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/ResponseHandler';
import HttpStatus from 'http-status-codes';
export const ValidateInput = (opts = {} as any) => (req: Request, res: Response, next: NextFunction): void => {
  const { validate } = opts;
  const isValid = validate(req.body);
  if (!isValid) {
    return ResponseHandler.SendResponse({ res, status: HttpStatus.BAD_REQUEST, body: validate.errors });
  }
  return next();
};
