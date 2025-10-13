import { Env } from '@modules/config';

export interface BotConfig {
  botToken: string;
  enabled: boolean;
}

export const getBotConfig = (): BotConfig => {
  const botToken = Env.string('BOT_TOKEN');
  if (!botToken.match(/^\d+:[A-Za-z0-9_-]{35}$/)) {
    throw new Error('Invalid bot token format');
  }
  return {
    botToken,
    enabled: Env.optionalBoolean('BOT_ENABLED', true),
  };
};
