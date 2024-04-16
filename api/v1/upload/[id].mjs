import { getBotFromClient } from '../../../src/participant/index.mjs'

export const config = { runtime: 'edge' }

const defaults = { format: 'static', emoji_list: ['✨'] }

export const POST = async req => {
  const { user_id, name, sticker } = await req.json()
  console.debug({ user_id, name, sticker })
  const bot = await getBotFromClient(req)
  await bot.api.addStickerToSet(user_id, name, {
    ...defaults,
    sticker,
  })
  console.debug(JSON.stringify(sticker))
  return Response.json(sticker)
}
