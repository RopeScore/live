const functions = require('firebase-functions')
const admin = require('firebase-admin')
const es6renderer = require('express-es6-template-engine')
const express = require('express')

const app = express()
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

  obj[event.params.cat] = data.name

  return admin.firestore().collection('live').doc('federations').collection(event.params.fed).doc('categoriesLookup').set(obj, {merge: true})
})
