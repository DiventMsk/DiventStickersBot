import { bot } from '../src/bot.mjs'

export const POST = async req => {
  await bot.init()
  const url = new URL(bot.botInfo.username, 'https://t.me')
  url.searchParams.set('start', '12345')
  return Response.json({ url })
}
