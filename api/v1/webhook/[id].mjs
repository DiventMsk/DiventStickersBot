import { webhookCallback } from 'grammy'
import { StickersBot } from '../../../src/stickers.mjs'

export const config = { runtime: 'edge' }

export const POST = async req => {
  try {
    const bot = await StickersBot.fromRequest(req)
    const { secretToken } = bot
    return webhookCallback(bot, 'std/http', {
      timeoutMilliseconds: 24_000,
      secretToken,
    })(req)
  } catch (e) {
    console.error(e)
    return Response.json({ ok: false })
  }
}
