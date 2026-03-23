export function getMysqlSslOptions() {
  const url = process.env.DATABASE_URL || '';
  const sslFromUrl =
    /ssl-mode=REQUIRED/i.test(url) || /[?&]ssl=true\b/i.test(url);
  if (process.env.DATABASE_SSL === 'false') {
    return undefined;
  }
  const rejectUnauthorizedEnvRaw = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED;
  const rejectUnauthorizedEnv =
    rejectUnauthorizedEnvRaw === 'true' || rejectUnauthorizedEnvRaw === 'false'
      ? rejectUnauthorizedEnvRaw
      : undefined;
  const rejectUnauthorized =
    rejectUnauthorizedEnv != null ? rejectUnauthorizedEnv === 'true' : !sslFromUrl;
  if (process.env.DATABASE_SSL === 'true' || sslFromUrl) {
    return {
      rejectUnauthorized,
    };
  }
  return undefined;
}
