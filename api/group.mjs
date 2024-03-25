import { bot } from '../src/bot.mjs'
import { kv } from '@vercel/kv'

export const config = { runtime: 'edge' }

export const POST = async req => {
  const [images = []] = await Promise.all([req.json(), bot.init()])
  console.debug(images)
  if (!images.length) throw new Error('Empty images')
  const id = /** @type string */ req.headers.get('x-vercel-id').split(':').pop()
  const url = new URL(bot.botInfo.username, 'https://t.me')
  url.searchParams.set('start', id)
  await kv.lpush(id, ...images)
  console.debug(url.href)
  return Response.json({ url })
}
