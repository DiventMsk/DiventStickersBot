import 'grammy-debug-edge'
import {
  Bot,
  Composer,
  Context,
  InlineKeyboard,
  Keyboard,
  session,
} from 'grammy'
import { getURL } from 'vercel-grammy'
import { BSON } from 'mongo-realm-web-wrapper'
import { MongoDBAdapter } from '@grammyjs/storage-mongodb'
import { bots, participants as collection, sessions } from '../db.mjs'
import { conversations, createConversation } from '@grammyjs/conversations'
import { getFileURL, getRandomIntInclusive } from '../utils/telegram-bot.mjs'

const { GOAPI_KEY, QUEUE_URL, DEFAULT_CHAT_ID } = process.env,
  chat_id = parseInt(DEFAULT_CHAT_ID)

const api = {
  async: 'https://api.goapi.xyz/api/face_swap/v1/async',
  fetch: 'https://api.goapi.xyz/api/face_swap/v1/fetch',
}

const init = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-API-Key': GOAPI_KEY },
}

const getDefaultImages = (offset = 1, length = 10) => {
  const array = new Array(length).fill(0)
  return array.map((_, index) => `/images/faces/${index + offset}.png`)
}

const defaultImages = {
  get male() {
    return getDefaultImages(1, 10)
  },
  get female() {
    return getDefaultImages(11, 10)
  },
}

const toSticker = sticker => ({ emoji_list: ['✨'], format: 'static', sticker })

export const composer = new Composer()

const privateChats = composer.errorBoundary(console.error).chatType('private')

privateChats.command('start', (ctx, next) => {
  if (ctx.match !== 'setup' || ctx.chat.id !== ctx.data.creator) return next()
  return ctx.reply(
    'Для завершения настройки бота, нужно выбрать чат, в который будут загружаться изображения перед созданием наборов',
    {
      reply_markup: new Keyboard()
        .requestChat('Продолжить', 0, {
          bot_administrator_rights: { can_manage_chat: true },
          user_administrator_rights: { can_manage_chat: true },
        })
        .requestChat('Продолжить', 1, {
          bot_administrator_rights: { can_post_messages: true },
          user_administrator_rights: { can_post_messages: true },
        })
        .requestChat('Продолжить', 2, {
          bot_administrator_rights: { can_post_messages: true },
        })
        .requestChat('Продолжить', 3, {
          bot_is_member: true,
        })
        .oneTime()
        .resized(),
    }
  )
})

privateChats.on('msg:chat_shared', async (ctx, next) => {
  if (ctx.data.chat_id || ctx.chat.id !== ctx.data.creator) return next()
  const { id } = ctx.me
  const { chat_id } = ctx.msg.chat_shared
  await bots.updateOne({ id }, { $set: { chat_id } })
  return ctx.reply('Настройка завершена, бот готов к работе')
})

privateChats.use(
  session({
    storage: new MongoDBAdapter({ collection }),
    initial: () => ({ registered: new Date(), bots: {} }),
  })
)

privateChats.use((ctx, next) => {
  ctx.session.bots[ctx.me.username] = new Date()
  ctx.session.user = ctx.chat
  return next()
})

privateChats.use(conversations())

privateChats.use(
  createConversation(async (conversation, ctx) => {
    if (conversation.session.quiz)
      return ctx.reply('Вы уже получили свой бонус.')
    conversation.session.quiz = {}
    const variants = ['Да', 'Нет']
    const reply_markup = Keyboard.from([variants])
    await ctx.reply('Можно ли внедрить фирменный стиль компании в фотозону?', {
      reply_markup,
    })
    conversation.session.quiz.style = await conversation.form.select(variants)
    await ctx.reply(
      'Конечно можно. Начиная от интерфейса тач панели и шрифтов, заканчивая брендовыми стикерами в каждом наборе.'
    )
    await ctx.reply(
      'Можно ли еще раз сфотографироваться и добавить новые спикеры в набор?',
      { reply_markup }
    )
    conversation.session.quiz.repeat = await conversation.form.select(variants)
    await ctx.reply('Попробуйте еще раз сфотографироваться и увидите все сами.')
    await ctx.reply(
      'Можно ли редактировать визуал и информация бота, с которого приходит набор?',
      { reply_markup }
    )
    conversation.session.quiz.custom = await conversation.form.select(variants)
    await ctx.reply(
      'Приветственный текст, адрес, аватарка и и описание настраивается под каждое событие.'
    )
    await ctx.reply(
      'Можно ли внедрять дополнительные механики: квизы, рассылки, регистрацию, дарить подарки и т.д.',
      { reply_markup }
    )
    conversation.session.quiz.extra = await conversation.form.select(variants)
    await ctx.reply('Сейчас как раз в этом Вы и принимаете участие.')
    const gift = (conversation.session.quiz.gift = getRandomIntInclusive(1, 5))
    await ctx.replyWithPhoto(getURL({ path: `images/gifts/${gift}.jpg` }), {
      caption: `
Подробнее о вашем подарке вы можете узнать у менеджера компании.
@divent_msk
WhatsApp
84993987442
Divent.ru
`,
    })
  }, 'quiz')
)

privateChats.command('test', ctx =>
  ctx.reply(
    'Предлагаем Вам сыграть в короткую викторину, чтобы получить приятный бонус.',
    {
      reply_markup: new InlineKeyboard()
        .text('Нет', 'skip_quiz')
        .text('Да', 'quiz'),
    }
  )
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
  const session = await sessions.findOneAndUpdate(
    {
      _id: new BSON.ObjectId(id),
      used: { $exists: false },
    },
    { $set: { used: ctx.chat.id } }
  )
  if (!session) return ctx.reply('Стикеры не найдены или уже были добавлены')
  const userStickers = session.stickers.map(toSticker)
  await ctx.api.sendMessage(chat_id, href)
  try {
    console.debug(await ctx.api.getStickerSet(name))
    for (const sticker of userStickers)
      await ctx.api
        .addStickerToSet(ctx.chat.id, name, sticker)
        .catch(console.error)
  } catch {
    const {
      sticker,
      images = defaultImages,
      stickers: defaultStickers = [sticker],
    } = ctx.data
    const targetImages = images[session.sex] || []
    const botStickers = defaultStickers.filter(Boolean).map(toSticker)
    const initialStickers = [...botStickers, ...userStickers].filter(Boolean)
    await ctx.api.createNewStickerSet(ctx.chat.id, name, title, initialStickers)
    if (ctx.data.generative && userStickers.length && targetImages.length) {
      const swap_image = getFileURL({
        bot_id: ctx.me.id,
        mime_type: 'image/webp',
        file_name: 'sticker.webp',
        file_id: session.stickers.at(0),
      })
      taskPromise = Promise.allSettled(
        targetImages
          .map(path => getURL({ path }))
          .map(async target_image => {
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
            await fetch(QUEUE_URL, {
              body: JSON.stringify({
                user_id: ctx.chat.id,
                bot_id: ctx.me.id,
                task_id,
                name,
              }),
              ...init,
            })
          })
      )
    }
  }
  await ctx.reply(`Стикеров загружено в ваш набор: ${userStickers.length}`, {
    reply_markup: new InlineKeyboard()
      .url('Добавить набор', href)
      .text('Инструкция', 'help')
      .toFlowed(1),
  })
  if (taskPromise) {
    const results = await taskPromise
    console.debug(results)
    await ctx.reply(`Добавлено генеративных стикеров: ${results.length}`)
  }
})

privateChats.callbackQuery('quiz', ctx => ctx.conversation.enter('quiz'))

privateChats.callbackQuery('skip_quiz', ctx =>
  ctx.reply(
    'Согласны, нужно успеть все посмотреть, Вы сможете продолжить в любое время, нажав “да” в предыдущем сообщении.'
  )
)

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
  const data = await bots.findOne(filter)
  const bot = new Bot(data.token, {
    ContextConstructor: class extends Context {
      constructor(update, api, me) {
        super(update, api, me)
        this.data = data
      }
    },
  })
  bot.use(composer)
  return bot
}
