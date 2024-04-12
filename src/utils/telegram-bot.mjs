import { InlineKeyboard } from 'grammy'

export const secretTokenFromToken = token => String(token).split(':').pop()

export class InlineKeyboardWithJSON extends InlineKeyboard {
  json(text, data = {}) {
    return this.text(text, JSON.stringify(data))
  }
}
