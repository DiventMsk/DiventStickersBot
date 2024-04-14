import { MongoClient } from 'mongo-realm-web-wrapper'

const {
  DB_NAME: name,
  DATA_API_URL: url,
  DATA_API_KEY: key,
  DATA_SOURCE_NAME: serviceName,
} = process.env

export const mongo = new MongoClient({ url, key, serviceName })
export const db = mongo.db(name)
export const bots = db.collection('bots')
export const clients = db.collection('clients')
export const sessions = db.collection('sessions')
export const participants = db.collection('participants')
