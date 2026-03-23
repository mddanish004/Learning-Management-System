import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { getMysqlSslOptions } from './src/db/sslConfig.js';

function mysqlCredentials() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('DATABASE_URL is required');
  }
  const u = new URL(raw);
  const database = u.pathname.replace(/^\//, '').split('?')[0] || '';
  const ssl = getMysqlSslOptions();
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database,
    ...(ssl ? { ssl } : {}),
  };
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.js',
  dialect: 'mysql',
  dbCredentials: mysqlCredentials(),
});
