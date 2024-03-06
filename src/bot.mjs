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

safe.command('start', async ctx => {
  const sticker = /** @type string */ await kv.get(ctx.match)
  const name = `${ctx.chat.id}by_${ctx.me.username}`
  try {
    await ctx.api.addStickerToSet(ctx.chat.id, name, {
      sticker,
      emoji_list: ['✨'],
    })
  } catch {
    await ctx.api.createNewStickerSet(
      ctx.chat.id,
      name,
      '@DiventDigital',
      [
        {
          sticker,
          emoji_list: ['✨'],
        },
      ],
      'static'
    )
  } finally {
    await ctx.reply(`t.me/addstickers/${name}`)
  }
})
