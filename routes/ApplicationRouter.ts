import { Express, Router } from 'express';
import { IPathRoute } from '../interfaces/IPathRouter';
import { UserRoute } from './UserRouter';
export class AppRoutes {
  private routeList: IPathRoute[] = [{ path: '/user', router: UserRoute }];
  mount(expressApp: Express): void {
    this.routeList.map((el) => {
      expressApp.use(el.path, el.router.createRouter(Router));
    });
  }
}
