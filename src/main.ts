import { AppBuilder } from '@libs/core';
import { AppModule } from './app.module';

AppBuilder.create(AppModule).enableValidation().launch();
