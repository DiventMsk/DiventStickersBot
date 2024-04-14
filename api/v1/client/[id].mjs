import { clients } from '../../../src/db.mjs'

export const config = { runtime: 'edge' }

export default async req => {
  const { searchParams } = new URL(req.url)
  const client = searchParams.get('id').trim()
  await clients.updateOne(
    { client },
    {
      $set: {
        client,
        date: Date.now(),
      },
    },
    { upsert: true }
  )
  return Response.json({ ok: true })
}
