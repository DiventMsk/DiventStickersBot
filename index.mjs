import meow from 'meow'
import { readFileSync } from 'node:fs'

const { IMAGE_API_URL } = process.env

const {
  input: [path],
} = meow({ importMeta: import.meta })
const body = readFileSync(path)
const response = await fetch(IMAGE_API_URL, { method: 'POST', body })
const { url } = await response.json()

console.log(url)
