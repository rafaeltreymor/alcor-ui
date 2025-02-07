require('dotenv').config()

import express from 'express'
import consola from 'consola'
import mongoose from 'mongoose'
import bodyParser from 'body-parser'
import { createClient } from 'redis'

import axios from 'axios'
import axiosRetry from 'axios-retry'
axiosRetry(axios, { retries: 3 })

import upload from './upload'

import { networkResolver } from './middleware'

import { markets } from './markets'
import { pools } from './pools'
import { account } from './account'

const app = express()

// Import and Set Nuxt.js options
async function start () {
  //db sync
  if (!process.env.DISABLE_DB) {
    try {
      const uri = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/alcor_prod_new`
      await mongoose.connect(uri, { useUnifiedTopology: true, useNewUrlParser: true })
      console.log('MongoDB connected!')
    } catch (e) {
      console.log('MongoDB connect err: ', e)
      process.exit(1)
    }

    // REDIS client shared globally
    const redis = createClient()
    await redis.connect()
    app.set('redisClient', redis)
  }

  app.use(networkResolver)

  // Before bodyParser coz use formidable
  app.use('/api/upload', upload)

  // Parsers
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  // Server routes
  app.use('/api/markets', markets)
  app.use('/api/account', account)
  app.use('/api/pools', pools)

  // Listen the server
  const PORT = process.env.PORT || 8000

  app.listen(PORT, () => {
    consola.ready({ message: `API Server listening on ${PORT}`, badge: true })
  })
}

start()
