import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/ResponseHandler';
import HttpStatus from 'http-status-codes';
export const NotFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  ResponseHandler.SendResponse({ res, status: HttpStatus.NOT_FOUND, body: 'No such route' });
};
