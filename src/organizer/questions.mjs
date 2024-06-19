import { Bot, InlineKeyboard } from 'grammy'
import { bots } from '../db.mjs'
import { getURL } from 'vercel-grammy'
import { StatelessQuestion } from '@grammyjs/stateless-question'
import { secretTokenFromToken } from '../utils/telegram-bot.mjs'

export const tokenQuestion = new StatelessQuestion('token', async ctx => {
  const token = ctx.msg.text.trim()
  const bot = new Bot(token)
  await bot.init()
  const { id: creator } = ctx.chat
  const { id, username } = bot.botInfo
  const $set = { ...bot.botInfo, token, creator }
  const url = getURL({ path: `api/v1/webhook/${id}` })
  await bots.updateOne({ id }, { $set }, { upsert: true })
  await bot.api.setWebhook(url, { secret_token: secretTokenFromToken(token) })
  await ctx.reply(
    `Бот @${username} подключен, для завершения настройки, нужно его запустить`,
    {
      reply_markup: new InlineKeyboard().url(
        'Запустить бота',
        `https://t.me/${username}?start=setup`
      ),
    }
  )
})

export const stickerQuestion = new StatelessQuestion(
  'sticker',
  async (ctx, additionalState) => {
    const { sticker: { file_id: sticker } = {} } = ctx.msg
    if (!sticker)
      return stickerQuestion.replyWithMarkdown(
        ctx,
        'Поддерживается изображения в формате WEBP и разрешением 512 на 512',
        additionalState
      )
    const { id } = JSON.parse(additionalState)
    await bots.updateOne({ id }, { $set: { sticker } })
    await ctx.reply('Стикер будет использоваться в наборах по умолчанию')
  }
)

export const stickersQuestion = new StatelessQuestion(
  'stickers',
  async (ctx, additionalState) => {
    try {
      const { set_name } = ctx.msg.sticker
      const { id } = JSON.parse(additionalState)
      const { title } = await ctx.api.getStickerSet(set_name)
      await bots.updateOne({ id }, { $set: { set_name } })
      return ctx.reply(
        `Готово, стикеры из набора "${title}" будут использоваться по умолчанию`
      )
    } catch (e) {
      console.error(e)
      return stickersQuestion.replyWithMarkdown(
        ctx,
        'Произошла ошибка, проверьте что вы отправляете стикер из набора и повторите еще раз',
        additionalState
      )
    }
  }
)
