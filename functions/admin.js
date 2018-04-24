const express = require('express')
const admin = require('firebase-admin')
const es6renderer = require('express-es6-template-engine')
const Raven = require('raven')

const router = express.Router()
router.use(Raven.requestHandler())

const nav = [
  {
    'title': 'Dashboard',
    'link': '/',
    'id': 'dash'
  },
  {
    'title': 'Log In',
    'link': '/login',
    'id': 'login'
  }
]

router.get('/', (req, res) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').getCollections().then(collections => {
    let federations = []
    collections.forEach(collection => { federations.push(collection.id) })
    res.render('app', { // eslint-disable-line
      locals: {
        scripts: [],
        id: 'dash',
        title: '',
        nav,
        brand: true,
        admin: false,

        federations
      },
      partials: {
        template: 'partials/main/dash'
      }
    })
  })
})

router.use(Raven.errorHandler())

router.use(function (req, res, next) {
  res.status(404)
    .render('app', {
      locals: {
        scripts: [],
        id: 404,
        title: '404',
        nav,
        brand: true,
        admin: false
      },
      partials: {
        template: 'partials/404'
      }
    })
})

module.exports.router = router
