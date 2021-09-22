import { Router } from 'express';
export interface IRoute {
  createRouter(router: any): Router;
}
