import { sessions } from '../../../src/db.mjs'
import { getBotFromClient } from '../../../src/participant/index.mjs'

export const config = { runtime: 'edge' }

export const POST = async req => {
  const { sex, stickers = [] } = await req.json()
  console.debug(sex, stickers)
  if (!stickers.length) throw new Error('Empty images')
  const bot = await getBotFromClient(req)
  await bot.init()
  const id = /** @type string */ req.headers.get('x-vercel-id').split(':').pop()
  const url = new URL(bot.botInfo.username, 'https://t.me')
  url.searchParams.set('start', id)
  await sessions.insertOne({
    bot: bot.botInfo.id,
    date: new Date(),
    stickers,
    sex,
    id,
  })
  console.debug(url.href)
  return Response.json({ url })
}
