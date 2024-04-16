import { Queue } from 'docmq'
import { serve } from 'micro'
import { Server } from 'node:http'
import { MongoDriver } from 'docmq/driver/mongo'

const queue = new Queue(new MongoDriver(process.env.MONGODB_URI), 'docmq')

queue.process(async (job, api) => {
  console.debug(job)
  await api.ack()
})

const server = new Server(
  serve(async (req, res) => {
    const time = Date.now()
    await queue.enqueue({ payload: { time } })
    return String(time)
  })
)

server.listen(3000)
