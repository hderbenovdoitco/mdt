import { App } from './App';
import { config as dotenv } from 'dotenv';
import _ from 'lodash';
dotenv({ path: _.eq(process.env.NODE_ENV, 'production') ? '.env' : '.env.dev' });
try {
  if (_.isNil(process.env.HTTP_PORT)) {
    throw new Error('HTTP_PORT should be specified');
  }
  new App({
    port: parseInt(process.env.HTTP_PORT, 10),
    type: 'application/json',
    limit: '10mb',
  }).run();
} catch (e) {
  console.log(e);
}
/* TODO: remove when upgrading to Node v.15 */
process.on('unhandledRejection', function (reason) {
  throw reason;
});
process.on('uncaughtException', function () {
  process.exit(1);
});
