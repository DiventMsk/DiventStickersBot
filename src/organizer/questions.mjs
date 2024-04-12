import { Bot } from 'grammy'
import { bots } from '../db.mjs'
import { getURL } from 'vercel-grammy'
import { StatelessQuestion } from '@grammyjs/stateless-question'
import {
  InlineKeyboardWithJSON,
  secretTokenFromToken,
} from '../utils/telegram-bot.mjs'

export const tokenQuestion = new StatelessQuestion('token', async ctx => {
  const token = ctx.msg.text.trim()
  const bot = new Bot(token)
  await bot.init()
  const { id, username } = bot.botInfo
  const $set = { ...bot.botInfo, token }
  const url = getURL({ path: `api/v1/webhook/${id}` })
  await bots.updateOne({ id }, { $set }, { upsert: true })
  await bot.api.setWebhook(url, { secret_token: secretTokenFromToken(token) })
  await ctx.reply(`Бот @${username} подключен и готов к работе`, {
    reply_markup: new InlineKeyboardWithJSON().json('Настроить бота', {
      action: 'edit',
      id,
    }),
  })
})
