import 'grammy-debug-edge'
import { Bot } from 'grammy'
import { bots } from '../db.mjs'
import { commands } from './commands.mjs'
import {
  generativeStickersQuestion,
  stickerQuestion,
  stickersQuestion,
  tokenQuestion,
} from './questions.mjs'
import { callbackQueryMiddleware, edit } from './queries.mjs'
import { secretTokenFromToken } from '../utils/telegram-bot.mjs'

export { commands }

export const {
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_SECRET_TOKEN: secretToken = secretTokenFromToken(token),
} = process.env

export const bot = new Bot(token)

const privateChats = bot.errorBoundary(console.error).chatType('private')

privateChats.on('callback_query:data', callbackQueryMiddleware)

privateChats.use(generativeStickersQuestion.middleware())

privateChats.use(stickersQuestion.middleware())

privateChats.use(stickerQuestion.middleware())

privateChats.use(tokenQuestion.middleware())

privateChats.use(commands)

privateChats.command('start', async ctx => {
  if (!ctx.match)
    return ctx.reply(`
Добро пожаловать в конфигурационного бота!
Для продолжения, выберите необходимый пункт в меню
`)
  const bot = await bots.findOne({ id: parseInt(ctx.match) })
  return edit(ctx, bot)
})
