import { Queue } from 'docmq'
import { MongoDriver } from 'docmq/driver/mongo'

const queue = new Queue(new MongoDriver(process.env.MONGODB_URI), 'docmq')

queue.process(async (job, api) => {
  console.debug(job)
  await api.ack()
})

export default async (req, res) => {
  const time = Date.now()
  await queue.enqueue({ payload: { time } })
  return res.end(String(time))
}
