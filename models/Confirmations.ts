import { Schema, model, Types } from 'mongoose';
import * as Crypto from 'crypto';
const { ObjectId } = Types;
const UserSchema: Schema = new Schema(
  {
    user: {
      type: ObjectId,
      ref: 'users',
      required: true,
    },
    type: {
      type: String,
      enum: ['emailConfirmation', 'passwordReset'],
      required: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
      default: () => Crypto.createHash('md5').update(String(Date.now())).digest('hex'),
    },
    expirationDate: {
      type: Date,
      required: true,
      default: () => String(new Date(Date.now() + 3600 * 1000 * 24)),
    },
  },
  { versionKey: false },
);
export const Confirmations = model('confirmations', UserSchema);
