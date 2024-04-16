import { Queue } from 'docmq'
import { Server } from 'node:http'
import { json, serve } from 'micro'
import { MongoDriver } from 'docmq/driver/mongo'

const jobDefaults = {
  retries: 60 * 60,
  retryStrategy: { type: 'fixed', amount: 1 },
}

const queue = new Queue(new MongoDriver(process.env.MONGODB_URI), 'docmq')

queue.events.on('halt', () => {
  console.error('Received HALT from DocMQ')
  process.exit(1)
})

queue.process(async (job, api) => {
  console.debug(job)
  await api.ack()
})

async function handler(req, res) {
  const payload = await json(req)
  await queue.enqueue({ ...jobDefaults, payload })
  return payload
}

new Server(serve(handler)).listen(3000)
