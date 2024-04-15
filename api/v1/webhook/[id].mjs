import { secretTokenFromToken } from '../../../src/utils/telegram-bot.mjs'
import { getBotFromID } from '../../../src/participant/index.mjs'
import { webhookStream } from 'vercel-grammy'

export const config = { runtime: 'edge' }

export const POST = async req => {
  try {
    const bot = await getBotFromID(req)
    return webhookStream(bot, {
      secretToken: secretTokenFromToken(bot.token),
      timeoutMilliseconds: 59_000,
    })(req)
  } catch (e) {
    console.error(e)
    return Response.json({ ok: false })
  }
}
