import { bot, secretToken } from '../../../src/organizer/index.mjs'
import { webhookCallback } from 'grammy'

export const config = { runtime: 'edge' }

export const POST = webhookCallback(bot, 'std/http', {
  timeoutMilliseconds: 24_000,
  secretToken,
})
