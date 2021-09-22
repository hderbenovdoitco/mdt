import mongoose, { Mongoose } from 'mongoose';
export class DatabaseConnector {
  static connect(): Promise<Mongoose> {
    const { DB_USER, DB_PASSWORD, DB_NAME } = process.env;
    return mongoose.connect(
      `mongodb+srv://${DB_USER}:${DB_PASSWORD}@mdt-cluster.bo1tx.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`,
      { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true },
    );
  }
}
