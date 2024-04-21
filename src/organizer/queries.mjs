import Papa from 'papaparse'
import { InputFile } from 'grammy'
import { bots, participants } from '../db.mjs'
import { InlineKeyboardWithJSON } from '../utils/telegram-bot.mjs'

const columns = {
  id: 'ID',
  first_name: 'Имя',
  last_name: 'Фамилия',
  gift: 'Подарок',
}

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
    case 'export':
      const field = `value.bots.${bot.username}`
      const participantsData = await participants
        .find({ [field]: { $exists: true } })
        .toArray()
      const data = participantsData.map(
        ({
          quiz: { gift } = {},
          user: { id, first_name, last_name } = {},
        } = {}) => ({ id, first_name, last_name, gift })
      )
      const csv = Papa.unparse([columns, ...data], {
        columns: Object.keys(columns),
        delimiter: ';',
        header: false,
      })
      const stream = new Blob([csv]).stream()
      const file = new InputFile(stream, `${bot.username}.csv`)
      return ctx.replyWithDocument(file)
  }
  return ctx.answerCallbackQuery({
    text: 'Действие не поддерживается',
    show_alert: true,
  })
}
