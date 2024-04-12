import { bots } from '../../../src/db.mjs'
import { composer } from '../../../src/participant/index.mjs'
import { secretTokenFromToken } from '../../../src/utils/telegram-bot.mjs'
import { Bot, webhookCallback } from 'grammy'

export const config = { runtime: 'edge' }

export const POST = async req => {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id'))
    const { token } = await bots.findOne({ id })
    const bot = new Bot(token)
    bot.use(composer)
    return webhookCallback(bot, 'std/http', {
      secretToken: secretTokenFromToken(token),
      timeoutMilliseconds: 24_000,
    })(req)
  } catch (e) {
    console.error(e)
    return Response.json({ ok: false })
  }
}
