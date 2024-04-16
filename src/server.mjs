import { Queue } from 'docmq'
import { Server } from 'node:http'
import { json, serve } from 'micro'
import { MongoDriver } from 'docmq/driver/mongo'

const { GOAPI_KEY, API_URL = 'https://divent-stickers-bot.vercel.app/' } =
  process.env

const goapi = {
  async: 'https://api.goapi.xyz/api/face_swap/v1/async',
  fetch: 'https://api.goapi.xyz/api/face_swap/v1/fetch',
}

const init = {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-API-Key': GOAPI_KEY },
}

const processing = ['pending', 'starting', 'processing']

const jobDefaults = {
  retries: (60 * 60) / 10,
  retryStrategy: { type: 'fixed', amount: 10 },
}

const queue = new Queue(new MongoDriver(process.env.MONGODB_URI), 'docmq')

queue.events.on('halt', () => {
  console.error('Received HALT from DocMQ')
  process.exit(1)
})

queue.process(async (job, api) => {
  console.debug(job)
  const { name, bot_id, user_id, task_id } = job
  const fetchResult = await fetch(goapi.fetch, {
    body: JSON.stringify({ task_id }),
    ...init,
  })
    .then(res => res.json())
    .then(result => {
      if (processing.includes(result.data.status)) throw new Error('processing')
      return result
    })
  console.debug('fetchResult', fetchResult)
  const {
    data: { image: sticker },
  } = fetchResult
  await fetch(new URL(`api/v1/upload/${bot_id}`, API_URL), {
    body: JSON.stringify({ user_id, name, sticker }),
    ...init,
  }).then(res => res.json())
  await api.ack()
})

async function handler(req, res) {
  const payload = await json(req)
  await queue.enqueue({ ...jobDefaults, payload })
  return payload
}

new Server(serve(handler)).listen(3000)
