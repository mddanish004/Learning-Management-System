import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from './schema.js';
import { getMysqlSslOptions } from './sslConfig.js';

const ssl = getMysqlSslOptions();

const connection = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ...(ssl ? { ssl } : {}),
});

export const db = drizzle(connection, { schema, mode: "default" });
