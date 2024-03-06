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

const safe = bot.errorBoundary(error => {
  console.error(error)
  return error.ctx.reply('Не удалось добавить стикер')
})
const privateChat = safe.chatType('private')

privateChat.command('start', async ctx => {
  const sticker = /** @type string */ await kv.getdel(ctx.match)
  const name = `${ctx.chat.id}_by_${ctx.me.username}`
  const input = { sticker, emoji_list: ['✨'] }
  try {
    await ctx.api.addStickerToSet(ctx.chat.id, name, input)
  } catch {
    await ctx.api.createNewStickerSet(
      ctx.chat.id,
      name,
      'Stickers by @DiventDigital',
      [input],
      'static'
    )
  }
  await ctx.replyWithSticker(sticker)
  await ctx.reply(`Стикер добавлен в набор: t.me/addstickers/${name}`)
})
