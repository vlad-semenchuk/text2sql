import { BaseMessage } from '@langchain/core/messages';

export enum IntentType {
  QUERY_REQUEST = 'QUERY_REQUEST',
  INVALID_QUERY = 'INVALID_QUERY',
  AMBIGUOUS_QUERY = 'AMBIGUOUS_QUERY',
  DISCOVERY_REQUEST = 'DISCOVERY_REQUEST',
  GREETING = 'GREETING',
}

export type TextMessage = BaseMessage & { content: string };
