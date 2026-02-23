/**
 * Environment Configuration
 * Centralized configuration from environment variables
 */

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT || process.env.PORT || '5000', 10),
  host: process.env.API_HOST || '0.0.0.0',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || '',

  // RabbitMQ
  rabbitmqUrl: process.env.RABBITMQ_URL || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Fiscal APIs
  albaniaFiscalApiUrl: process.env.ALBANIA_FISCAL_API_URL || '',
  albaniaFiscalApiKey: process.env.ALBANIA_FISCAL_API_KEY || '',
  kosovoFiscalApiUrl: process.env.KOSOVO_FISCAL_API_URL || '',
  kosovoFiscalApiKey: process.env.KOSOVO_FISCAL_API_KEY || '',

  // Email
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  fromEmail: process.env.FROM_EMAIL || 'noreply@fiscalnext.com',

  // SMS
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',

  // File Storage
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || '',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  s3Bucket: process.env.S3_BUCKET || '',
  s3Region: process.env.S3_REGION || 'nyc3',
  s3Endpoint: process.env.S3_ENDPOINT || '',

  // Sentry
  sentryDsn: process.env.SENTRY_DSN || '',
  sentryEnvironment: process.env.SENTRY_ENVIRONMENT || 'development',
} as const;

// Validate required environment variables
export function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
        'Please check your .env file.'
    );
  }
}
