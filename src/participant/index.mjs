import { getURL } from 'vercel-grammy'
import { getFileURL } from '../utils/telegram-bot.mjs'
import { MongoDBAdapter } from '@grammyjs/storage-mongodb'
import { Bot, Composer, InlineKeyboard, session } from 'grammy'
import { bots, participants as collection, sessions } from '../db.mjs'

const { GOAPI_KEY: key } = process.env

const api = {
  async: 'https://api.goapi.xyz/api/face_swap/v1/async',
  fetch: 'https://api.goapi.xyz/api/face_swap/v1/fetch',
}

const init = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-API-Key': key },
}

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
  let taskPromise
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
  /* try {
    await ctx.api.getStickerSet(name)
    for (const sticker of stickers)
      await ctx.api
        .addStickerToSet(ctx.chat.id, name, sticker)
        .catch(console.error)
  } catch {
    await ctx.api.createNewStickerSet(ctx.chat.id, name, title, stickers) */
  const swap_image = getFileURL({
    bot_id: ctx.me.id,
    file_id: stickers.at(0),
    mime_type: 'image/webp',
    file_name: 'sticker.webp',
  })
  const array = new Array(1).fill(0)
  const offset = session.sex === 'male' ? 1 : 11
  const images = array.map((_, index) =>
    getURL({ path: `/images/${index + offset}.png` })
  )
  taskPromise = Promise.allSettled(
    images.map(async target_image => {
      console.debug('body', {
        target_image,
        swap_image,
      })
      const asyncResult = await fetch(api.async, {
        body: JSON.stringify({
          result_type: 'url',
          target_image,
          swap_image,
        }),
        ...init,
      }).then(res => res.json())
      console.debug('asyncResult', asyncResult)
      const {
        data: { task_id },
      } = asyncResult
      const fetchResult = await fetch(api.fetch, {
        body: JSON.stringify({ task_id }),
        ...init,
      }).then(res => res.json())
      console.debug('fetchResult', fetchResult)
      const {
        data: { image: sticker },
      } = fetchResult
      await ctx.api.addStickerToSet(ctx.chat.id, name, {
        ...defaults,
        sticker,
      })
    })
  )
  /* } */
  await ctx.reply(`Стикеров загружено в ваш набор: ${stickers.length}`, {
    reply_markup: new InlineKeyboard()
      .url('Добавить набор', href)
      .text('Инструкция', 'help')
      .toFlowed(1),
  })
  if (taskPromise) {
    const results = await taskPromise
    await ctx.reply(`Добавлено генеративных стикеров: ${results.length}`)
    console.debug(results)
  }
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
