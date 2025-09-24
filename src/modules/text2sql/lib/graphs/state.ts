import { Annotation } from '@langchain/langgraph';

export enum InputType {
  VALID_QUERY = 'VALID_QUERY',
  DISCOVERY_REQUEST = 'DISCOVERY_REQUEST',
  INVALID_INPUT = 'INVALID_INPUT',
}

export type QuestionType = InputType.VALID_QUERY | InputType.DISCOVERY_REQUEST | InputType.INVALID_INPUT;

export const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
});

export const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  questionType: Annotation<QuestionType>,
  rejectionReason: Annotation<string>,
  query: Annotation<string>,
  result: Annotation<string>,
  answer: Annotation<string>,
});

export type InputState = typeof InputStateAnnotation.State;
export type State = typeof StateAnnotation.State;
