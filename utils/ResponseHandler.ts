import { Response } from 'express';
import _ from 'lodash';
export class ResponseHandler {
  static SendResponse({ res, status, body }: { res: Response; status: number; body?: any }): void {
    res.status(status);
    const hasBody = !_.isNil(body);
    hasBody ? res.json(_.startsWith(String(status), '2') ? body : { error: body }) : res.end();
  }
}
