import { get } from '@vercel/edge-config'
import { StickersBot } from '../src/stickers.mjs'
import { bot, secretToken } from '../src/configurator.mjs'
import { getURL } from 'vercel-grammy'

const { VERCEL_ENV } = process.env

// List of allowed environments
const allowedEnvs = [
  'production',
  // "preview"
]

async function initBot(
  bot,
  secret_token,
  path = 'api/v1/webhook/configurator'
) {
  // Check bot
  await bot.init()

  // Exit in case of unsuitable environments
  if (!allowedEnvs.includes(VERCEL_ENV)) process.exit()

  // Webhook URL generation
  const url = getURL({ path })

  // Webhook setup options
  const options = { secret_token }

  // Installing a webhook
  if (await bot.api.setWebhook(url, options)) {
    // Checking the webhook installation
    const { url } = await bot.api.getWebhookInfo()

    console.info('Webhook set to URL:', url)
    console.info('Secret token:', secretToken)
    console.info('Info:', bot.botInfo)
  }
}

await initBot(bot, secretToken)

const bots = await get('bots')

await Promise.allSettled(
  Object.entries(bots).map(([theme, { token, ...config } = {}]) => {
    const bot = new StickersBot(token, config)
    return initBot(bot, bot.secretToken, `api/v1/webhook/${theme}`)
  })
)
