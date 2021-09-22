import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/ResponseHandler';
import HttpStatus from 'http-status-codes';
export const ErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  ResponseHandler.SendResponse({ res, status: HttpStatus.INTERNAL_SERVER_ERROR, body: err.message });
};
