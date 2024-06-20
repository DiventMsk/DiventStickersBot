import { getBotFromClient } from '../../../src/participant/index.mjs'
import { bots } from '../../../src/db.mjs'
import { InputFile } from 'grammy'

export const config = { runtime: 'edge' }

const filename = 'sticker.webp'

export const POST = async req => {
  const bot = await getBotFromClient(req)
  const file = new InputFile(req.body, filename)
  const { chat_id } = await bots.findOne({ token: bot.token })
  const { sticker } = await bot.api.sendSticker(chat_id, file)
  console.debug(JSON.stringify(sticker))
  return Response.json(sticker)
}
