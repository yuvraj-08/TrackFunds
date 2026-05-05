import 'reflect-metadata'

import { ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'

import { HttpExceptionFilter } from './common/filters/http-exception.filter.js'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js'
import { AppModule } from './modules/app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const corsOrigin = process.env.CORS_ORIGIN ?? '*'

  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api')
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((value) => value.trim()),
    credentials: true,
  })
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  )
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new LoggingInterceptor())

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TrackFunds API')
    .setDescription('Backend foundation for the shared savings ledger app.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build()

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('docs', app, swaggerDocument)

  app.getHttpAdapter().get('/', (_req, res: { json: (body: unknown) => void }) => {
    res.json({
      name: 'TrackFunds API',
      version: '1.0.0',
      docs: '/docs',
      health: '/api/v1/health',
    })
  })

  const port = Number(process.env.PORT ?? 4000)
  await app.listen(port)
}

bootstrap()
