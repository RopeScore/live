const express = require('express')
const admin = require('firebase-admin')
const es6renderer = require('express-es6-template-engine')

const router = express.Router()

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
  admin.firestore().getCollections().then(collections => {
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

router.get('/:fed', (req, res, next) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection(req.params.fed).doc('categories').getCollections().then(collections => {
    let categories = []
    collections.forEach(collection => { categories.push(collection.id) })
    res.render('app', { // eslint-disable-line
      locals: {
        scripts: [],
        id: 'dash',
        title: '',
        nav,
        brand: true,
        admin: false,

        categories,
        fed: req.params.fed
      },
      partials: {
        template: 'partials/main/categories'
      }
    })
  })
})

router.get('/login', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200')
  var renderPage = (err, content) => res.render('app', { // eslint-disable-line
    locals: {
      scripts: ['/static/js/vue.js', '/auth.js'],
      id: 'login',
      title: 'Log In',
      nav,
      brand: false,
      admin: false,
      content: content
    },
    partials: {
      template: 'partials/vue'
    }
  })
  es6renderer('es6templates/partials/auth.html', {}, renderPage)
})

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
