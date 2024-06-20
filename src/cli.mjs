#!/usr/bin/env node

import meow from 'meow'
import { userInfo } from 'node:os'
import { createReadStream } from 'node:fs'

const {
  API_URL = 'https://divent-stickers-bot.vercel.app/',
  CLIENT_ID = userInfo().username.trim().replaceAll(' ', '-'),
} = process.env

const { input = [], flags: { sex } = {} } = meow({
  importMeta: import.meta,
  flags: {
    sex: {
      type: 'string',
      shortFlag: 's',
      default: 'male',
      isRequired: true,
      choices: ['male', 'female'],
    },
  },
})

const api = {
  client: new URL(`api/v1/client/${CLIENT_ID}`, API_URL),
  image: new URL(`api/v1/image/${CLIENT_ID}`, API_URL),
  group: new URL(`api/v1/group/${CLIENT_ID}`, API_URL),
}

void fetch(api.client)

if (!input.length) {
  console.log(api.client)
  process.exit()
}

const images = await Promise.all(
  input.map(async path => {
    try {
      const stream = createReadStream(path)
      const body = ReadableStream.from(stream.iterator())
      const response = await fetch(api.image, {
        method: 'POST',
        duplex: 'half',
        body,
      })
      const { file_id } = await response.json()
      return file_id
    } catch {}
  })
)

const response = await fetch(api.group, {
  body: JSON.stringify({ sex, stickers: images.filter(Boolean) }),
  method: 'POST',
})

const { url } = await response.json()

console.log(url)
