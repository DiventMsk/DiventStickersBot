import { sessions } from '../../../src/db.mjs'
import { getBotFromClient } from '../../../src/participant/index.mjs'

export const config = { runtime: 'edge' }

export const POST = async req => {
  const bot = await getBotFromClient(req)
  const { sex, stickers = [] } = await req.json()
  console.debug(sex, stickers)
  if (!stickers.length) throw new Error('Empty images')
  const id = /** @type string */ req.headers.get('x-vercel-id').split(':').pop()
  const url = new URL(bot.botInfo.username, 'https://t.me')
  url.searchParams.set('start', id)
  await sessions.insertOne({ id, sex, stickers })
  console.debug(url.href)
  return Response.json({ url })
}
