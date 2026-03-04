import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './core/exceptions/exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    cors: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ── Security: Validate critical secrets at startup ──────────────
  const jwtSecret = configService.get<string>('security.jwt.secret');
  const encryptionKey = configService.get<string>('security.encryption.key');

  if (nodeEnv === 'production') {
    if (!jwtSecret || jwtSecret.length < 32) {
      logger.error('FATAL: JWT_SECRET is not set or is too short (min 32 chars). Refusing to start.');
      process.exit(1);
    }
    if (!encryptionKey || encryptionKey.length !== 32) {
      logger.error('FATAL: ENCRYPTION_KEY is not set or is not exactly 32 chars. Refusing to start.');
      process.exit(1);
    }
    logger.log('✅ Security secrets validated for production');
  } else {
    if (!jwtSecret) {
      logger.warn('⚠️  JWT_SECRET is not set — using undefined. Set it in .env for proper auth.');
    }
    if (!encryptionKey) {
      logger.warn('⚠️  ENCRYPTION_KEY is not set — using undefined. Set it in .env for encryption.');
    }
  }

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  if (nodeEnv === 'development' || configService.get<boolean>('ENABLE_SWAGGER_DOCS', true)) {
    const config = new DocumentBuilder()
      .setTitle('Nivesh API')
      .setDescription('AI-Native Financial Reasoning Platform API Documentation')
      .setVersion('1.0')
      .addTag('health', 'Health check endpoints')
      .addTag('users', 'User management')
      .addTag('financial-data', 'Financial data ingestion and management')
      .addTag('knowledge-graph', 'Financial knowledge graph operations')
      .addTag('ai-reasoning', 'AI-powered financial reasoning')
      .addTag('simulations', 'Financial scenario simulations')
      .addTag('goals', 'Goal planning and tracking')
      .addTag('alerts', 'Smart alerts and notifications')
      .addTag('analytics', 'Analytics and insights')
      .addTag('payments', 'Payment processing and management')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`📚 Swagger documentation available at http://localhost:${port}/api/docs`);
  }

  // Start server
  await app.listen(port);

  logger.log(`🚀 Nivesh Backend is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`📊 Health check: http://localhost:${port}/${apiPrefix}/health`);
}

bootstrap();
