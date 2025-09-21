import { Injectable } from '@nestjs/common';
import { InputState, State } from '../state';

@Injectable()
export abstract class BaseNode {
  abstract execute(state: InputState | State): Promise<Partial<State>>;
}
