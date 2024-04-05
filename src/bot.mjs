import { Bot } from 'grammy'
import { kv } from '@vercel/kv'

export const {
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(':').pop(),
  DEFAULT_STICKER_URL: sticker,
  STICKERS_SET_PREFIX: prefix,
} = process.env

export const bot = new Bot(token)

const safe = bot.errorBoundary(async ({ error, ctx }) => {
  await ctx.reply('Не удалось добавить стикер')
  console.error(error)
})

const privateChat = safe.chatType('private')

privateChat.command('start', async ctx => {
  console.debug(ctx.match)
  const images = await kv.lrange(ctx.match, 0, -1)
  const name = `${prefix}_${ctx.chat.id}_by_${ctx.me.username}`
  const stickers = images.map(sticker => ({
    emoji_list: ['✨'],
    format: 'static',
    sticker,
  }))
  try {
    console.debug(
      await ctx.api.createNewStickerSet(
        ctx.chat.id,
        name,
        'Stickers by @DiventDigital',
        [{ sticker, emoji_list: ['✨'], format: 'static' }, ...stickers]
      )
    )
  } catch {
    console.debug(
      await Promise.all(
        stickers.map(sticker =>
          ctx.api.addStickerToSet(ctx.chat.id, name, sticker)
        )
      )
    )
  }
  await kv.unlink(/** @type any */ ctx.match)
  await ctx.reply(`Стикеры добавлены в набор: t.me/addstickers/${name}`)
  console.debug(name, '+', stickers.length)
})
