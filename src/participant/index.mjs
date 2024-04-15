import { MongoDBAdapter } from '@grammyjs/storage-mongodb'
import { Bot, Composer, InlineKeyboard, session } from 'grammy'
import { bots, participants as collection, sessions } from '../db.mjs'

const defaults = { format: 'static', emoji_list: ['✨'] }

export const composer = new Composer()

const privateChats = composer.errorBoundary(console.error).chatType('private')

privateChats.use(
  session({
    storage: new MongoDBAdapter({ collection }),
    initial: () => ({ registered: new Date(), bots: {} }),
  })
)

privateChats.use((ctx, next) =>
  next((ctx.session.bots[ctx.me.username] = new Date()))
)

privateChats.command('start', async (ctx, next) => {
  const id = ctx.match.trim()
  if (!id) return next()
  const date = new Date()
    .toLocaleString('ru', { dateStyle: 'short' })
    .replaceAll('.', '_')
  const title = 'Stickers by @DiventDigital'
  const name = `at_${date}_for_${ctx.chat.id}_by_${ctx.me.username}`
  const { href } = new URL(name, 'https://t.me/addstickers/')
  const session = await sessions.findOneAndDelete({ id })
  const stickers = session.stickers.map(sticker => ({ ...defaults, sticker }))
  try {
    await ctx.api.getStickerSet(name)
    for (const sticker of stickers)
      await ctx.api.addStickerToSet(ctx.chat.id, name, sticker)
  } catch {
    await ctx.api.createNewStickerSet(ctx.chat.id, name, title, stickers)
  }
  await ctx.reply(`Стикеров загружено в ваш набор: ${stickers.length}`, {
    reply_markup: new InlineKeyboard()
      .url('Добавить набор', href)
      .text('Инструкция', 'help')
      .toFlowed(1),
  })
})

privateChats.callbackQuery('help', async ctx => {
  await ctx.reply(`
Стикеры могут появляться в наборе с задержкой, если вы не видите новых изображений, попробуйте перезапустить приложение.
Если вы хотите удалить стикеры или весь набор, для этого перейдите в бота @Stickers и выберите соответствующий пункт в меню.
`)
  return ctx.answerCallbackQuery()
})

privateChats.on('message:text', ctx =>
  ctx.reply(`Добро пожаловать в бота @${ctx.me.username}!`)
)

export async function getBotFromClient(req) {
  const { searchParams } = new URL(req.url)
  const client = searchParams.get('id').trim()
  return getBot({ client })
}

export async function getBotFromID(req) {
  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id').trim())
  return getBot({ id })
}

export async function getBot(filter = {}) {
  const { token } = await bots.findOne(filter)
  const bot = new Bot(token)
  bot.use(composer)
  await bot.init()
  return bot
}
