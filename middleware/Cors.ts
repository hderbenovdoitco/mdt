import _ from 'lodash';
import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/ResponseHandler';
import HttpStatus from 'http-status-codes';
export function Cors(req: Request, res: Response, next: NextFunction): void {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (_.eq(req.method, 'OPTIONS')) {
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE');
    return ResponseHandler.SendResponse({ res, status: HttpStatus.OK });
  }
  return next();
}
