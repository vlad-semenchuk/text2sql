import { Env } from '@modules/config';

export interface BotConfig {
  botToken: string;
  enabled: boolean;
}

export const getBotConfig = (): BotConfig => ({
  botToken: Env.string('BOT_TOKEN'),
  enabled: Env.optionalBoolean('BOT_ENABLED', true),
});