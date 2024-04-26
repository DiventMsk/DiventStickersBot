import { bots } from '../db.mjs'
import { Commands } from '@grammyjs/commands'
import { tokenQuestion } from './questions.mjs'
import { InlineKeyboardWithJSON } from '../utils/telegram-bot.mjs'

const scope = { type: 'all_private_chats' }

export const commands = new Commands()

commands
  .command('create', 'Создание бота')
  .addToScope(scope, async ctx =>
    tokenQuestion.replyWithMarkdown(
      ctx,
      'Отправьте токен бота в ответ, на это сообщение'
    )
  )

commands.command('bots', 'Управление ботами').addToScope(scope, async ctx => {
  await ctx.replyWithChatAction('typing')
  const botsData = await bots.find().toArray()
  if (!botsData.length)
    return ctx.reply('Добавьте первого бота используя команду /create')
  await ctx.reply('Выберите бота для управления:')
  for (const { username } of botsData)
    await ctx.reply(`@${username}`, {
      reply_markup: new InlineKeyboardWithJSON().json('Настроить бота', {
        action: 'edit',
        id,
      }),
    })
})
