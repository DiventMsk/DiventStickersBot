import { getAll } from '@vercel/edge-config'
import { Bot, InlineKeyboard } from 'grammy'
import { updateEdgeConfig } from './utils/vercel-edge-config.mjs'

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

privateChat.command('bots', async ctx => {
  await ctx.replyWithChatAction('typing')
  const bots = Object.entries(await getAll())
  if (!bots.length)
    return ctx.reply('Добавьте первого бота используя команду /create')
  await ctx.reply('Выберите бота для управления:')
  await ctx.replyWithChatAction('typing')
  for (const [id, { token }] of bots) {
    await ctx.reply(id, {
      reply_markup: new InlineKeyboard().text(
        'Настроить бота',
        JSON.stringify({
          action: 'edit',
          id,
        })
      ),
    })
  }
})

privateChat.on('callback_query:data', async ctx => {
  const bots = await getAll()
  const { action, id, ...data } = JSON.parse(ctx.callbackQuery.data)
  switch (action) {
    case 'edit':
      if (!bots[id]) return ctx.reply('Указанный бот не найден')
      return ctx.reply(id, {
        reply_markup: new InlineKeyboard()
          .text(
            'Скачать список участников',
            JSON.stringify({ action: 'export', id })
          )
          .text(
            'Выбрать стикер по умолчанию',
            JSON.stringify({ action: 'sticker', id })
          )
          .text('Удалить бота', JSON.stringify({ action: 'delete', id })),
      })
    case 'delete':
      if (!bots[id]) return ctx.reply('Указанный бот не найден')
      const ok = await updateEdgeConfig({ operation: 'delete', key: id })
      return ctx.reply(ok ? 'Бот успешно удален' : 'Не удалось удалить бота')
  }
})
