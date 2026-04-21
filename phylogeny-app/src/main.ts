import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    //Added the Validation pipe globally to validate all requests
    //Transform : True = automatically transform payloads to be objects typed according to their DTO classes.
    //Whitelist : True = automatically remove properties that do not have any decorators in the DTOs.
    //forbidNonWhitelisted : True = throw an error if non-whitelisted properties are present in the request.
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((error) => {
    console.error('Error starting the application:', error);
    process.exit(1);
});
