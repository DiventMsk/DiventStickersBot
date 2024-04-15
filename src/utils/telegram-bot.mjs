import { getURL } from 'vercel-grammy'
import { InlineKeyboard } from 'grammy'

export const secretTokenFromToken = token => String(token).split(':').pop()

export class InlineKeyboardWithJSON extends InlineKeyboard {
  json(text, data = {}) {
    return this.text(text, JSON.stringify(data))
  }
}

export const getHeaders = (
  name,
  mime = 'application/octet-stream',
  context = 'attachment'
) => ({
  'Content-Type': mime,
  'Content-Disposition': [context, name ? `filename="${name}"` : undefined]
    .filter(Boolean)
    .join('; '),
})

export function getFileURL({ bot_id, file_id, mime_type, file_name } = {}) {
  let href = getURL({ path: `/api/download/${bot_id}/${file_id}` })
  if (mime_type) ({ href } = new URL(mime_type, href + '/'))
  if (file_name) ({ href } = new URL(file_name, href + '/'))
  return href
}
