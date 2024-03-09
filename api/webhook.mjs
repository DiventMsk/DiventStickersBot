import { bot, secretToken } from '../src/bot.mjs'
import { setWebhookCallback } from 'vercel-grammy'

export const config = { runtime: 'edge' }

export const POST = setWebhookCallback(bot, {
  path: 'api/update',
  onError: 'return',
  secretToken,
})
