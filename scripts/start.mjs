import { bots } from '../src/db.mjs'
import { bot } from '../src/organizer/index.mjs'
import { getBot } from '../src/participant/index.mjs'

const participantBots = await bots.find().toArray()

const allBots = [bot, ...participantBots.map(data => getBot(data))]

allBots.forEach(bot => bot.catch(console.error))

await Promise.all(allBots.map(bot => bot.start()))
