import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApiConfigService } from '@/config';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { swagger, port } = app.get(ApiConfigService);

  if (swagger.enabled) {
    const config = new DocumentBuilder()
      .setTitle(swagger.title)
      .setDescription(swagger.description)
      .setVersion(swagger.version)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          in: 'header',
          name: 'Authorization',
        },
        'bearerAuth',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    document.security = [{ bearerAuth: [] }];
    SwaggerModule.setup(swagger.prefix, app, document);
  }

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(port);
}

bootstrap();
