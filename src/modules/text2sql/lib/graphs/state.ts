import { Annotation } from '@langchain/langgraph';
import { messagesReducer } from './utils/message.utils';
import { IntentType, TextMessage } from './types';

export const StateAnnotation = Annotation.Root({
  messages: Annotation<TextMessage[]>({
    reducer: messagesReducer,
    default: () => [],
  }),
  intent: Annotation<{ type: IntentType; reason: string }>,
  rejectionReason: Annotation<string>,
  query: Annotation<string>,
  result: Annotation<string>,
  answer: Annotation<string>,
});

export type State = typeof StateAnnotation.State;
