import { secretTokenFromToken } from '../../../src/utils/telegram-bot.mjs'
import { getBotFromRequest } from '../../../src/participant/index.mjs'
import { webhookCallback } from 'grammy'

export const config = { runtime: 'edge' }

export const POST = async req => {
  try {
    const bot = await getBotFromRequest(req)
    return webhookCallback(bot, 'std/http', {
      secretToken: secretTokenFromToken(bot.token),
      timeoutMilliseconds: 24_000,
    })(req)
  } catch (e) {
    console.error(e)
    return Response.json({ ok: false })
  }
}
