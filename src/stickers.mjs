import { kv } from '@vercel/kv'
import { get } from '@vercel/edge-config'
import { Bot, InlineKeyboard } from 'grammy'

export class StickersBot extends Bot {
  stickerDefaults = { format: 'static', emoji_list: ['✨'] }

  constructor(token, { prefix, sticker, ...config } = {}) {
    super(token, config)
    this.prefix = prefix
    this.sticker = sticker
    const safe = this.errorBoundary(this.errorBoundaryMiddleware.bind(this))
    const privateChat = safe.chatType('private')
    privateChat.command('start', this.startCommandMiddleware.bind(this))
    privateChat.callbackQuery('help', this.helpQueryMiddleware.bind(this))
  }

  get secretToken() {
    return String(this.token).split(':').pop()
  }

  static async fromRequest(req) {
    const { searchParams } = new URL(req.url)
    const { token, ...config } = await get(searchParams.get('id'))
    return new this(token, config)
  }

  async errorBoundaryMiddleware({ error, ctx }) {
    await ctx.reply('Не удалось добавить стикер')
    console.error(error)
  }

  async startCommandMiddleware(ctx) {
    if (!ctx.match)
      return ctx.reply(`Добро пожаловать в бота @${ctx.me.username}!`)
    console.debug(ctx.match)
    const { prefix = 'for', sticker } = this
    const images = await kv.lrange(ctx.match, 0, -1)
    const name = `${prefix}_${ctx.chat.id}_by_${ctx.me.username}`
    const { href } = new URL(name, 'https://t.me/addstickers/')
    const defaultSticker = { sticker, ...this.stickerDefaults }
    const stickers = images.map(sticker => ({
      ...this.stickerDefaults,
      sticker,
    }))
    try {
      console.debug(
        await ctx.api.createNewStickerSet(
          ctx.chat.id,
          name,
          'Stickers by @DiventDigital',
          [sticker ? defaultSticker : null, ...stickers].filter(Boolean)
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
  }

  helpQueryMiddleware(ctx) {
    return ctx.reply(`
Стикеры могут появляться в наборе с задержкой, если вы не видите новых изображений, попробуйте перезапустить приложение.

Если вы хотите удалить стикеры или весь набор, для этого перейдите в бота @Stickers и выберите соответствующий пункт в меню.
`)
  }
}
