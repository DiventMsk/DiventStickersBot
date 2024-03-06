import { bot } from '../src/bot.mjs'
import { InputFile } from 'grammy'
import { kv } from '@vercel/kv'

const { DEFAULT_USER_ID } = process.env
export const POST = async req => {
  await bot.init()
  const id = /** @type string */ req.headers.get('x-vercel-id').split(':').pop()
  const { file_id } = await bot.api.uploadStickerFile(
    parseInt(DEFAULT_USER_ID),
    'static',
    new InputFile(req.body)
  )
  await kv.set(id, file_id)
  const url = new URL(bot.botInfo.username, 'https://t.me')
  url.searchParams.set('start', id)
  return Response.json({ url })
}
