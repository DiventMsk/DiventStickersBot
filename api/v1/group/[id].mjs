import { sessions } from '../../../src/db.mjs'
import { getBotFromClient } from '../../../src/participant/index.mjs'

export const config = { runtime: 'edge' }

export const POST = async req => {
  const { sex, stickers = [] } = await req.json()
  console.debug(sex, stickers)
  if (!stickers.length) throw new Error('Empty images')
  const bot = await getBotFromClient(req)
  await bot.init()
  const url = new URL(bot.botInfo.username, 'https://t.me')
  const { insertedId } = await sessions.insertOne({
    bot: bot.botInfo.id,
    date: new Date(),
    stickers,
    sex,
  })
  url.searchParams.set('start', insertedId)
  console.debug(url.href)
  return Response.json({ url })
}
