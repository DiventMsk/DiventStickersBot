import 'grammy-debug-edge'
import { Bot } from 'grammy'
import { commands } from './commands.mjs'
import { stickerQuestion, tokenQuestion } from './questions.mjs'
import { callbackQueryMiddleware } from './queries.mjs'
import { secretTokenFromToken } from '../utils/telegram-bot.mjs'

export { commands }

export const {
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_SECRET_TOKEN: secretToken = secretTokenFromToken(token),
} = process.env

export const bot = new Bot(token)

const privateChats = bot.errorBoundary(console.error).chatType('private')

privateChats.on('callback_query:data', callbackQueryMiddleware)

privateChats.use(stickerQuestion.middleware())

privateChats.use(tokenQuestion.middleware())

privateChats.use(commands)

privateChats.command('start', ctx =>
  ctx.reply(`
Добро пожаловать в конфигурационного бота!
Для продолжения, выберите необходимый пункт в меню
`)
)
