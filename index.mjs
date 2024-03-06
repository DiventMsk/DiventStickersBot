import meow from 'meow'
import { readFileSync } from 'node:fs'

const {
  input: [path],
} = meow({ importMeta: import.meta })
const body = readFileSync(path)
const response = await fetch(
  'https://divent-stickers-bot.vercel.app/api/image',
  { method: 'POST', body }
)
const { url } = await response.json()

console.log(url)
