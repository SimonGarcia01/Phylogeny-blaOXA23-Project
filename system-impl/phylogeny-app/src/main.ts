import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';
import { JwtAuthGuard } from './common/guards/auth.guard';
import { PermissionsGuard } from './common/guards/permission.guard';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    //Added the Validation pipe globally to validate all requests
    //Transform : True = automatically transform payloads to be objects typed according to their DTO classes.
    //Whitelist : True = automatically remove properties that do not have any decorators in the DTOs.
    //forbidNonWhitelisted : True = throw an error if non-whitelisted properties are present in the request.
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));

    //We are going to set everything to be protected by default authentication, you must use @Public() to make a route public
    const reflector: Reflector = app.get('Reflector');
    app.useGlobalGuards(new JwtAuthGuard(reflector), new PermissionsGuard(reflector));

    //Run the app on the port defined in the .env file or 3001 if not defined
    await app.listen(process.env.PORT ?? 3001);
}
bootstrap().catch((error) => {
    console.error('Error starting the application:', error);
    process.exit(1);
});
