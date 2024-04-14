import { bots } from '../db.mjs'
import { InlineKeyboardWithJSON } from '../utils/telegram-bot.mjs'

export async function callbackQueryMiddleware(ctx) {
  const { action, id, ...data } = JSON.parse(ctx.callbackQuery.data)
  const bot = await bots.findOne({ id })
  switch (action) {
    case 'edit':
      if (!bot) return ctx.reply('Указанный бот не найден')
      return ctx.reply(id, {
        reply_markup: new InlineKeyboardWithJSON()
          .json('Скачать список участников', { id, action: 'export' })
          .json('Выбрать стикер по умолчанию', { id, action: 'sticker' })
          .json('Удалить бота', { id, action: 'delete' })
          .toFlowed(1),
      })
    case 'delete':
      if (!bot) return ctx.reply('Указанный бот не найден')
      const { deletedCount: ok } = await bots.deleteOne({ id })
      return ctx.reply(ok ? 'Бот успешно удален' : 'Не удалось удалить бота')
  }
  return ctx.answerCallbackQuery('Действие не поддерживается', {
    show_alert: true,
  })
}
