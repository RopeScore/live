const functions = require('firebase-functions')
const admin = require('firebase-admin')
const es6renderer = require('express-es6-template-engine')
const express = require('express')
const Raven = require('raven')
const crypto = require('crypto')
const delCol = require('./deleteCollection')

const app = express()

Raven.config('https://97530d06d7f5493da6e5ebbe96779b06:3a5d43c915d549fda90721d4795b4672@sentry.io/1048286').install()
admin.initializeApp()

app.engine('html', es6renderer)
app.set('views', 'es6templates')
app.set('view engine', 'html')

const mainRouter = require('./main')
const adminRouter = require('./admin')
const apiRouter = require('./api')

app.use('/admin/', adminRouter.router)
app.use('/api/', apiRouter.router)
app.use('/', mainRouter.router)

exports.app = functions.https.onRequest(app)

exports.createLookup = functions.firestore.document('/live/federations/{fed}/categories/{cat}/config').onWrite((change, context) => {
  let data = change.after.data()
  let before = change.before.data()
  let obj = {}

  if (change.after.exists && data.visible) {
    obj[data.group || 'Ungrouped'] = {}
    obj[data.group || 'Ungrouped'][context.params.cat] = (data.delete ? admin.firestore.FieldValue.delete() : data.name || 'Unnamed')
  } else if (change.before.exists) {
    obj[before.group || 'Ungrouped'] = {}
    obj[before.group || 'Ungrouped'][context.params.cat] = admin.firestore.FieldValue.delete()
  }

  if (change.before.exists && change.after.exists && data.group !== before.group) {
    obj[before.group || 'Ungrouped'] = {}
    obj[before.group || 'Ungrouped'][context.params.cat] = admin.firestore.FieldValue.delete()
  }

  return admin.firestore().collection('live').doc('federations').collection(context.params.fed).doc('categoriesLookup').set(obj, {merge: true})
})

exports.createAdminLookup = functions.firestore.document('/live/federations/{fed}/categories/{cat}/config').onWrite((change, context) => {
  let data = change.after.data()
  let before = change.before.data()
  let obj = {}

  if (change.after.exists) {
    obj[data.group || 'Ungrouped'] = {}
    obj[data.group || 'Ungrouped'][context.params.cat] = (data.delete ? admin.firestore.FieldValue.delete() : data.name || 'Unnamed')
  } else if (change.before.exists) {
    obj[before.group || 'Ungrouped'] = {}
    obj[before.group || 'Ungrouped'][context.params.cat] = admin.firestore.FieldValue.delete()
  }

  if (change.before.exists && data.group !== before.group) {
    obj[before.group || 'Ungrouped'] = {}
    obj[before.group || 'Ungrouped'][context.params.cat] = admin.firestore.FieldValue.delete()
  }

  return admin.firestore().collection('live').doc('federations').collection(context.params.fed).doc('categoriesLookupAdmin').set(obj, {merge: true})
})

exports.genKeys = functions.firestore.document('live/federations/{fed}/config').onWrite((change, context) => {
  let data = change.after.data()

  if (data.genKey === true) {
    let obj = {
      apikey: crypto.randomBytes(20).toString('hex'),
      apireadkey: crypto.randomBytes(20).toString('hex'),
      genKey: false
    }

    return change.after.ref.update(obj)
  } else {
    return false
  }
})

exports.makeAdmins = functions.firestore.document('live/federations/{fed}/config').onWrite((change, context) => {
  let data = change.after.data()

  if (typeof data.newAdmins !== 'undefined' && Array.isArray(data.newAdmins) && data.newAdmins.length > 0) {
    let email = data.newAdmins[0]
    return admin.auth().getUserByEmail(email).then(function (userRecord) {
      console.log('Successfully fetched user data:', userRecord.toJSON())
      data.newAdmins.shift()
      let obj = {
        admins: data.admins || {},
        newAdmins: data.newAdmins
      }
      obj.admins[userRecord.uid] = email
      return change.after.ref.update(obj)
    }).catch(function (error) {
      console.log('Error fetching user data:', error)
      data.newAdmins.shift()
      return change.after.ref.update({newAdmins: data.newAdmins})
    })
  } else {
    return false
  }
})

exports.delCat = functions.firestore.document('/live/federations/{fed}/categories/{cat}/config').onWrite((change, context) => {
  let data = change.after.data()

  if (change.after.exists && data.delete === true) {
    let ref = change.after.ref.parent.parent
    return delCol.deleteCollection(ref, context.params.cat, 50)
  } else {
    return false
  }
})
