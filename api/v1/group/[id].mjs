import { sessions } from '../../../src/db.mjs'
import { getBotFromRequest } from '../../../src/participant/index.mjs'

export const config = { runtime: 'edge' }

export const POST = async req => {
  const bot = await getBotFromRequest(req)
  const stickers = req.json()
  console.debug(stickers)
  if (!stickers.length) throw new Error('Empty images')
  const id = /** @type string */ req.headers.get('x-vercel-id').split(':').pop()
  const url = new URL(bot.botInfo.username, 'https://t.me')
  url.searchParams.set('start', id)
  await sessions.insertOne({ id, stickers })
  console.debug(url.href)
  return Response.json({ url })
}
