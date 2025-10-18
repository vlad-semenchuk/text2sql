import { Injectable } from '@nestjs/common';
import { State } from '../state';

@Injectable()
export abstract class BaseNode {
  abstract execute(state: State): Promise<Partial<State>>;
}
