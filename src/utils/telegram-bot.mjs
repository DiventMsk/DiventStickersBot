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
