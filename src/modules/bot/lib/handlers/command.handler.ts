import { Injectable } from '@nestjs/common';
import { Context } from 'grammy';

@Injectable()
export class CommandHandler {
  async handleStart(ctx: Context): Promise<void> {
    const welcomeMessage = `Welcome to Text2SQL Bot! 🤖

I can help you convert natural language questions into SQL queries.

Just send me a question like:
• "Show me all users"
• "What are the top 5 products by sales?"
• "Find customers who haven't placed orders this month"

Let's get started!`;

    await ctx.reply(welcomeMessage);
  }

  async handleHelp(ctx: Context): Promise<void> {
    const helpMessage = `Text2SQL Bot Help 📖

Commands:
• /start - Start the bot and see welcome message
• /help - Show this help message

Usage:
Simply send me any natural language question about your database, and I'll convert it to SQL and execute it for you.

Examples:
• "Show me all users"
• "What are the top products?"
• "Find orders from last week"`;

    await ctx.reply(helpMessage);
  }
}