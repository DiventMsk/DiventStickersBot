import Papa from 'papaparse'
import { InputFile } from 'grammy'
import { bots, clients, participants } from '../db.mjs'
import { generativeStickersQuestion, stickerQuestion } from './questions.mjs'
import { InlineKeyboardWithJSON } from '../utils/telegram-bot.mjs'

const columns = {
  id: 'ID',
  first_name: 'Имя',
  last_name: 'Фамилия',
  gift: 'Подарок',
}

export function edit(ctx, bot) {
  if (!bot) return ctx.reply('Указанный бот не найден')
  const { id, username } = bot
  return ctx.reply(
    `Для настройки бота @${username} выберите необходимый пункт в меню`,
    {
      reply_markup: new InlineKeyboardWithJSON()
        .json('Скачать список участников', { id, action: 'export' })
        .json('Настройка генеративных стикеров', { id, action: 'generative' })
        .url('Изменить набор стикеров', `t.me/${username}?start=stickers`)
        .json('Сбросить участников', { id, action: 'reset' })
        .json('Изменить площадку', { id, action: 'client' })
        .json('Удалить бота', { id, action: 'delete' })
        .toFlowed(1),
    }
  )
}

export function generative(ctx, bot) {
  if (!bot) return ctx.reply('Указанный бот не найден')
  const { id, generative } = bot
  return ctx.reply(
    generative
      ? `Генеративные стикеры включены, выберите набор для настройки`
      : `Генеративные стикеры отключены, нажмите для активации и настройки`,
    {
      reply_markup: new InlineKeyboardWithJSON()
        .json(
          generative
            ? 'Выключить генеративные стикеры'
            : 'Включить генеративные стикеры',
          {
            action: 'toggle_generative',
            id,
          }
        )
        .json('Мужской пол', {
          action: 'generative_stickers',
          sex: 'male',
          id,
        })
        .json('Женский пол', {
          action: 'generative_stickers',
          sex: 'female',
          id,
        })
        .toFlowed(1),
    }
  )
}

export async function callbackQueryMiddleware(ctx) {
  const { action, id, client, ...data } = JSON.parse(ctx.callbackQuery.data)
  const bot = await bots.findOne({ id })
  switch (action) {
    case 'edit':
      return edit(ctx, bot)
    case 'delete':
      if (!bot) return ctx.reply('Указанный бот не найден')
      const { deletedCount: ok } = await bots.deleteOne({ id })
      return ctx.reply(ok ? 'Бот успешно удален' : 'Не удалось удалить бота')
    case 'reset':
      await participants.deleteMany({
        [`value.bots.${bot.username}`]: { $exists: true },
      })
      return ctx.reply('Список участников сброшен')
    case 'export': {
      const field = `value.bots.${bot.username}`
      const botParticipants = await participants
        .find({ [field]: { $exists: true } })
        .toArray()
      const data = botParticipants.map(
        ({
          key: id,
          value: {
            quiz: { gift } = {},
            user: { first_name, last_name } = {},
          } = {},
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
    case 'sticker':
      return stickerQuestion.replyWithMarkdown(
        ctx,
        'Отправьте изображение для стикера по умолчанию',
        JSON.stringify({ id })
      )
    case 'client':
      const allClients = await clients.find().toArray()
      const buttons = allClients.map(({ client, date }) =>
        InlineKeyboardWithJSON.json(`${client} (${date})`, {
          action: 'set_client',
          client,
          id,
        })
      )
      return ctx.reply(
        'Выберите площадку, которая будет связана с этим ботом',
        { reply_markup: new InlineKeyboardWithJSON([buttons]).toFlowed(1) }
      )
    case 'set_client':
      await bots.updateMany({ client }, { $set: { client: null } })
      await bots.updateOne({ id }, { $set: { client } })
      return ctx.reply(`Площадка ${client} связана с ботом`)
    case 'generative':
      return generative(ctx, bot)
    case 'toggle_generative':
      await bots.updateOne({ id }, { $set: { generative: !bot.generative } })
      await ctx.deleteMessage().catch(console.error)
      return generative(ctx, await bots.findOne({ id }))
    case 'generative_stickers':
      const { sex } = data
      return generativeStickersQuestion.replyWithMarkdown(
        ctx,
        `Отправьте любой стикер из набора, который будет использоваться для генерации ${sex}`,
        JSON.stringify({ id, sex })
      )
  }
  return ctx.answerCallbackQuery({
    text: 'Действие не поддерживается',
    show_alert: true,
  })
}
