import mime from 'mime/lite'
import { getBot } from '../../src/participant/index.mjs'
import { getHeaders } from '../../src/utils/telegram-bot.mjs'

const api = 'api.telegram.org'

export const config = { runtime: 'edge' }

export default async req => {
  const { searchParams } = new URL(req.url)
  const query = Object.fromEntries(searchParams.entries())
  const {
    bot_id,
    file_id,
    mime_sub_type = 'webp',
    mime_base_type = 'image',
  } = query
  const bot = await getBot({ id: parseInt(bot_id) })
  const { file_path } = await bot.api.getFile(file_id)
  const mime_type = `${mime_base_type}/${mime_sub_type}`
  const extension = mime.getExtension(mime_type)
  const file_name = `${file_id}.${extension}`
  const headers = getHeaders(file_name, mime_type, 'inline')
  const fileURL = `https://${api}/file/bot${bot.token}/${file_path}`
  const { body, status, statusText } = await fetch(fileURL)
  return new Response(body, { headers, status, statusText })
}
