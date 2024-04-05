import { Bot } from 'grammy'

export const {
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_SECRET_TOKEN: secretToken = String(token).split(':').pop(),
} = process.env

export const bot = new Bot(token)

const safe = bot.errorBoundary(async ({ error, ctx }) => {
  await ctx.reply('Произошла ошибка')
  console.error(error)
})

const privateChat = safe.chatType('private')

privateChat.command('start', ctx =>
  ctx.reply(
    'Добро пожаловать в конфигурационного бота, для продолжения, выберите необходимый пункт в меню'
  )
)
