import { bot } from '../src/bot.mjs'
import { InputFile } from 'grammy'

const { DEFAULT_USER_ID } = process.env
export const POST = async req => {
  const { file_id } = await bot.api.uploadStickerFile(
    parseInt(DEFAULT_USER_ID),
    'static',
    new InputFile(req.body)
  )
  const url = new URL(bot.botInfo.username, 'https://t.me')
  url.searchParams.set('start', file_id)
  return Response.json({ url })
}
