import { Controller, Get } from '@nestjs/common';

@Controller()
export class RootController {
  @Get('/')
  root() {
    return 'Text2Sql says: Hello World!';
  }
}
