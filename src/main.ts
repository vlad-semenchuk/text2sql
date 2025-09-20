import { AppModule } from './app.module';
import { AppBuilder } from '@modules/config';

AppBuilder.create(AppModule).enableValidation().launch();
