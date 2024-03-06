import { Bot } from 'grammy'
import { kv } from '@vercel/kv'

export const {
  // Telegram bot token from t.me/BotFather
  TELEGRAM_BOT_TOKEN: token,

  // Secret token to validate incoming updates
  TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(':').pop(),
} = process.env

// Default grammY bot instance
export const bot = new Bot(token)

const safe = bot.errorBoundary(console.error)

// Sample handler for a simple echo bot
safe.on('message:text', ctx => {
  console.log(ctx.match)
  console.log(ctx.msg.text)
  return ctx.reply(ctx.msg.text)
})

safe.command('start', async ctx => {
  const id = /** @type string */ await kv.get(ctx.match)
  await ctx.replyWithSticker(id)
})
