import { Schema, model } from 'mongoose';
import { SecurityService } from '../utils/SecurityService';
import _ from 'lodash';
const UserSchema: Schema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['Male', 'Female', 'Other'],
    },
    created: {
      type: Date,
      immutable: true,
      required: true,
      default: () => String(new Date()),
    },
    lastVisited: {
      type: Date,
      required: true,
      default: () => String(new Date()),
    },
    emailConfirmation: {
      type: Boolean,
      required: true,
      default: false,
    },
    sessions: [
      {
        ip: {
          type: String,
          required: true,
        },
        userAgent: {
          type: String,
          required: true,
        },
        accessToken: {
          type: String,
          required: true,
        },
        refreshToken: {
          type: String,
          required: true,
        },
        lastUpdated: {
          type: Date,
          required: true,
          default: () => String(new Date()),
        },
        sessionId: {
          type: String,
        },
      },
    ],
  },
  { versionKey: false },
);
UserSchema.pre('save', function () {
  if (this.isModified('password')) {
    const password = this.get('password');
    this.set('password', SecurityService.generatePasswordHash(password));
  }
  if (this.isModified('sessions')) {
    this.set('lastVisited', String(new Date()));
  }
});
UserSchema.pre('findOneAndUpdate', function () {
  const password = _.get(this.getUpdate(), '$set.password');
  if (!_.isNil(password)) {
    this.set('password', SecurityService.generatePasswordHash(password));
  }
});
export const User = model('users', UserSchema);
