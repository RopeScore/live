const functions = require('firebase-functions')
const admin = require('firebase-admin')
const es6renderer = require('express-es6-template-engine')
const express = require('express')
const Raven = require('raven')
const crypto = require('crypto')

const app = express()

Raven.config('https://97530d06d7f5493da6e5ebbe96779b06:3a5d43c915d549fda90721d4795b4672@sentry.io/1048286').install()
admin.initializeApp(functions.config().firebase)

app.engine('html', es6renderer)
app.set('views', 'es6templates')
app.set('view engine', 'html')

const mainRouter = require('./main')
// const adminRouter = require('./admin')
const apiRouter = require('./api')

// app.use('/admin/', adminRouter.router)
app.use('/api/', apiRouter.router)
app.use('/', mainRouter.router)

exports.app = functions.https.onRequest(app)

exports.createLookup = functions.firestore.document('/live/federations/{fed}/categories/{cat}/config').onWrite(event => {
  let data = event.data.data()
  let obj = {}

  obj[event.params.cat] = (data.display ? data.name : admin.firestore.FieldValue.delete())

  return admin.firestore().collection('live').doc('federations').collection(event.params.fed).doc('categoriesLookup').update(obj)
})

exports.genKey = functions.firestore.document('/live/federations/{fed}/config').onWrite(event => {
  let data = event.data.data()

  if (data.genKey === true) {
    let obj = {
      apikey: crypto.randomBytes(20).toString('hex'),
      genKey: false
    }

    return admin.firestore().collection('live').doc('federations').collection(event.params.fed).doc('config').update(obj)
  } else {
    return false
  }
})
