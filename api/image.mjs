import { bot } from '../src/bot.mjs'
import { InputFile } from 'grammy'

export const config = { runtime: 'edge' }

const { DEFAULT_USER_ID } = process.env,
  user = parseInt(DEFAULT_USER_ID)

export const POST = async req => {
  const sticker = new InputFile(req.body, 'sticker.webp')
  return Response.json(await bot.api.uploadStickerFile(user, 'static', sticker))
}
