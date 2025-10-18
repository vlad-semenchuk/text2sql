import { BaseMessage, HumanMessage, isHumanMessage } from '@langchain/core/messages';
import { TextMessage } from '../types';

export function sanitize(
  message: string,
  options: {
    maxLength: number;
    allowEmptyInput: boolean;
  },
): string {
  let sanitized = message.trim();

  // Remove all control characters using Unicode property
  sanitized = sanitized.replace(/\p{Control}/gu, '');

  // Enforce max length
  if (sanitized.length > options.maxLength) {
    sanitized = sanitized.slice(0, options.maxLength);
  }

  // Check for empty input
  if (!options.allowEmptyInput && sanitized.length === 0) {
    throw new Error('Input cannot be empty');
  }

  return sanitized;
}

export function messagesReducer(existing: TextMessage[], updates: BaseMessage[]): TextMessage[] {
  const sanitized = updates.map((msg) => {
    if (isHumanMessage(msg)) {
      if (typeof msg.content !== 'string') {
        throw new Error('Only text messages are supported');
      }

      const sanitizedContent = sanitize(msg.content, {
        maxLength: 1000,
        allowEmptyInput: false,
      });

      return new HumanMessage({
        id: msg.id,
        content: sanitizedContent,
      });
    }

    return msg;
  });

  return existing.concat(sanitized as TextMessage[]);
}
