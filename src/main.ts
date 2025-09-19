import { AppModule } from './app.module';
import { AppBuilder } from '@modules/config';

function bootstrap() {
  AppBuilder.create(AppModule)
    .enableValidation()
    .beforeStart((app) => {
      app.setGlobalPrefix('api/v2');
    })
    .launch();
}
bootstrap();
