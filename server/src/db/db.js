import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from './schema.js';
import { getMysqlSslOptions } from './sslConfig.js';

function getMysqlConnectionOptions() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL is required');
  }
  const u = new URL(raw);
  const database = u.pathname.replace(/^\//, '').split('?')[0] || '';
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database,
  };
}

const ssl = getMysqlSslOptions();

const connection = mysql.createPool({
  ...getMysqlConnectionOptions(),
  ...(ssl ? { ssl } : {}),
});

export const db = drizzle(connection, { schema, mode: "default" });
