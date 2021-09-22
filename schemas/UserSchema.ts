import { validator } from '../utils/validator';
const schemas = {
  register: {
    type: 'object',
    properties: {
      firstName: {
        type: 'string',
        allOf: [
          {
            transform: ['trim'],
          },
          {
            minLength: 1,
            maxLength: 120,
          },
        ],
      },
      lastName: {
        type: 'string',
        allOf: [
          {
            transform: ['trim'],
          },
          {
            minLength: 1,
            maxLength: 120,
          },
        ],
      },
      email: {
        type: 'string',
        format: 'email',
        transform: ['toLowerCase'],
      },
      password: {
        type: 'string',
        allOf: [
          {
            transform: ['trim'],
          },
          {
            minLength: 8,
            maxLength: 32,
          },
        ],
      },
      gender: {
        type: 'string',
        enum: ['Male', 'Female', 'Other'],
      },
    },
    required: ['firstName', 'lastName', 'email', 'password', 'gender'],
    additionalProperties: false,
  },
  login: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        transform: ['toLowerCase'],
      },
      password: {
        type: 'string',
      },
    },
    required: ['email', 'password'],
    additionalProperties: false,
  },
  resendConfirmEmail: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        transform: ['toLowerCase'],
      },
    },
    required: ['email'],
    additionalProperties: false,
  },
  resetPassword: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        transform: ['toLowerCase'],
      },
    },
    required: ['email'],
    additionalProperties: false,
  },
  resetPasswordConfirm: {
    type: 'object',
    properties: {
      password: {
        type: 'string',
        allOf: [
          {
            transform: ['trim'],
          },
          {
            minLength: 8,
            maxLength: 32,
          },
        ],
      },
    },
    required: ['password'],
    additionalProperties: false,
  },
};
export const UserSchema = {
  register: validator.compile(schemas.register),
  login: validator.compile(schemas.login),
  resendConfirmEmail: validator.compile(schemas.resendConfirmEmail),
  resetPassword: validator.compile(schemas.resetPassword),
  resetPasswordConfirm: validator.compile(schemas.resetPasswordConfirm),
};
