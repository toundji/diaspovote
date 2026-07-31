// ============================================================
// swagger-config.ts — Configuration Swagger / OpenAPI
// Modifiez le titre, la description et les headers d'auth
// selon votre projet.
// ============================================================
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';

const _swagger_config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription(
        `Documentation du webservice.\n\n` +
        `Contact : https://atoundji.com`,
    )
    .setVersion('1.0')
    .addApiKey(
        {
            type: 'apiKey',
            name: 'api-key',
            description: 'Clé API client (web, back-office, swagger)',
            in: 'header',
        },
        'apiKey',
    )
    .addBearerAuth(
        {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Access token JWT',
            in: 'header',
        },
        'token',
    )
    .build();

export const swagger_config = (app: any) => {
    const document = SwaggerModule.createDocument(app, _swagger_config);
    SwaggerModule.setup('/docs', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });
    writeFileSync('./swagger.json', JSON.stringify(document));
};
