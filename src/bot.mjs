import { Bot, InlineKeyboard } from 'grammy'
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
  const { href } = new URL(name, 'https://t.me/addstickers/')
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
    await ctx
      .reply(`Добро пожаловать в бота @${ctx.me.username}!`)
      .catch(console.error)
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
  await ctx.reply(`${stickers.length} стикера загружены в ваш набор`, {
    reply_markup: new InlineKeyboard()
      .url('Добавить набор', href)
      .text('Нужна помощь ?', 'help')
      .toFlowed(1),
  })
  console.debug(name, '+', stickers.length)
})

privateChat.callbackQuery('help', ctx =>
  ctx.reply(`
Стикеры могут появляться в наборе с задержкой, если вы не видите новых изображений, попробуйте перезапустить приложение.

Если вы хотите удалить стикеры или весь набор, для этого перейдите в бота @Stickers и выберите соответствующий пункт в меню.
`)
)
