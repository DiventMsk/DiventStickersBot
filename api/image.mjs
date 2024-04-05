import { bot } from '../src/bot.mjs'
import { InputFile } from 'grammy'

export const config = { runtime: 'edge' }

const { DEFAULT_CHAT_ID } = process.env,
  chat = parseInt(DEFAULT_CHAT_ID),
  filename = 'sticker.webp'

export const POST = async req => {
  const file = new InputFile(req.body, filename)
  const { sticker } = await bot.api.sendSticker(chat, file)
  console.debug(JSON.stringify(sticker))
  return Response.json(sticker)
}
