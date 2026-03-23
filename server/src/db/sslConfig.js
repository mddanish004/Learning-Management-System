export function getMysqlSslOptions() {
  const url = process.env.DATABASE_URL || '';
  const sslFromUrl =
    /ssl-mode=REQUIRED/i.test(url) || /[?&]ssl=true\b/i.test(url);
  if (process.env.DATABASE_SSL === 'false') {
    return undefined;
  }
  if (process.env.DATABASE_SSL === 'true' || sslFromUrl) {
    return {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
    };
  }
  return undefined;
}
