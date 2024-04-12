import { Bot } from 'grammy'
import { bots } from '../src/db.mjs'
import { getURL } from 'vercel-grammy'
import { secretTokenFromToken } from '../src/utils/telegram-bot.mjs'
import { bot, secretToken as secret_token } from '../src/organizer/index.mjs'

const allowedEnvs = [
  'production',
  // "preview"
]

if (!allowedEnvs.includes(process.env.VERCEL_ENV)) process.exit()

await bot.init()

const allBots = await bots.find().toArray()

const url = getURL({ path: 'api/v1/webhook/organizer' })

if (await bot.api.setWebhook(url, { secret_token })) {
  const { url } = await bot.api.getWebhookInfo()
  console.info('Webhook set to URL:', url)
  console.info('Secret token:', secret_token)
  console.info('Info:', bot.botInfo)
}

await Promise.allSettled(
  allBots.map(({ id, token }) =>
    new Bot(token).api.setWebhook(getURL({ path: `api/v1/webhook/${id}` }), {
      secret_token: secretTokenFromToken(token),
    })
  )
)
