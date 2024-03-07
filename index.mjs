#!/usr/bin/env node

import meow from 'meow'
import { createReadStream } from 'node:fs'

const {
  input: [path],
} = meow({ importMeta: import.meta })
const stream = createReadStream(path)
const body = ReadableStream.from(stream.iterator())
const apiURL = 'https://divent-stickers-bot.vercel.app/api/image'
const response = await fetch(apiURL, { method: 'POST', body, duplex: 'half' })
const { url } = await response.json()

console.log(url)
