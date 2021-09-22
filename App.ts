import express, { Express } from 'express';
import * as bodyParser from 'body-parser';
import { IApp } from './interfaces/IAppConfig';
import { AppRoutes } from './routes/ApplicationRouter';
import { DatabaseConnector } from './utils/DatabaseConnector';
import { Cors } from './middleware/Cors';
import { GetConnectionInfo } from './middleware/GetConnectionInfo';
import { ErrorHandler } from './middleware/ErrorHandler';
import { NotFoundHandler } from './middleware/NotFoundHandler';
import helmet from 'helmet';
import swaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
import cookieParser from 'cookie-parser';
export class App {
  private static app: App;
  private expressApp: Express;
  constructor(private config: IApp) {
    this.config = config;
    this.expressApp = express();
    App.app = this;
  }
  public static getInstance(): App {
    return App.app;
  }
  run(): void {
    const { port, type, limit } = this.config;
    this.expressApp.use(helmet());
    this.expressApp.use(bodyParser.json({ type, limit }));
    this.expressApp.use(bodyParser.urlencoded({ type: 'application/x-www-form-urlencoded', extended: true }));
    this.expressApp.use(cookieParser(process.env.COOKIE_SECRET));
    this.expressApp.use(Cors);
    this.expressApp.use(GetConnectionInfo);
    const swaggerDocument = YAML.load('./swagger.yaml');
    this.expressApp.use('/swagger', swaggerUI.serve, swaggerUI.setup(swaggerDocument));
    const applicationRouter = new AppRoutes();
    applicationRouter.mount(this.expressApp);
    /* TODO: extend with logging / determining possible error */
    this.expressApp.use(NotFoundHandler);
    this.expressApp.use(ErrorHandler);
    Promise.all([this.expressApp.listen(process.env.PORT || port), DatabaseConnector.connect()]).catch((err) => {
      throw new Error(err);
    });
  }
}
