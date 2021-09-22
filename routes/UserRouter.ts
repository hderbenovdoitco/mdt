import { IRoute } from '../interfaces/IRoute';
import { UserController } from '../controllers/UserController';
import { UserSchema } from '../schemas/UserSchema';
import { ValidateInput } from '../middleware/ValidateInput';
import { Authorization } from '../middleware/Authorization';
export const UserRoute: IRoute = {
  createRouter(router) {
    const userController = new UserController();
    return router()
      .post('/register', ValidateInput({ validate: UserSchema.register }), userController.register)
      .post('/register-confirm/:hash', userController.registerConfirm)
      .post('/login', ValidateInput({ validate: UserSchema.login }), userController.login)
      .post('/refreshTokens', userController.refreshTokens)
      .post('/logout', Authorization, userController.logout)
      .post(
        '/resendConfirmEmail',
        ValidateInput({ validate: UserSchema.resendConfirmEmail }),
        userController.resendConfirmEmail,
      )
      .post('/resetPassword', ValidateInput({ validate: UserSchema.resetPassword }), userController.resetPassword)
      .post(
        '/resetPassword-confirm/:hash',
        ValidateInput({ validate: UserSchema.resetPasswordConfirm }),
        userController.resetPasswordConfirm,
      )
      .get('/dashboard', Authorization, userController.dashboard);
  },
};
