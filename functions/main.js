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
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200')
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

router.get('/:fed', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=1800, s-maxage=3600')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categoriesLookup').get().then(doc => {
    let data = doc.data()
    let categories = []
    if (doc.exists) {
      let keys = Object.keys(data)
      categories = keys.map(id => { return {id, name: data[id]} })
    }

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

router.get('/:fed/:cat', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=1800, s-maxage=3600')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories').collection(req.params.cat).doc('config').get().then(doc => {
    let data = doc.data()
    let events = []
    if (doc.exists) {
      events = Object.keys(data.events).map(abbr => {
        return {
          abbr,
          name: data.events[abbr].name
        }
      })
      events.push({abbr: 'overall'})
    }

    nav[nav.findIndex(obj => obj.id === 'dash')].link = `/${req.params.fed}`

    res.render('app', { // eslint-disable-line
      locals: {
        scripts: [],
        id: 'dash',
        title: '',
        nav,
        brand: true,
        admin: false,

        events,
        cat: req.params.cat,
        fed: req.params.fed
      },
      partials: {
        template: 'partials/main/events'
      }
    })
  })
})

router.get('/:fed/:cat/overall', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200')
  nav[nav.findIndex(obj => obj.id === 'dash')].link = `/${req.params.fed}`
  if (nav.findIndex(obj => obj.id === 'cat') < 0) nav.splice(nav.length - 1, 0, {'title': 'Category', 'link': `/${req.params.fed}/${req.params.cat}`, id: 'cat'})

  let renderPage = (err, content) => res.render('app', { // eslint-disable-line
    locals: {
      scripts: ['/main/overall.js'],
      id: 'dash',
      title: '',
      nav,
      brand: true,
      admin: false,

      content
    },
    partials: {
      template: 'partials/vue'
    }
  })
  es6renderer('es6templates/partials/main/overall.html', {locals: {
    cat: req.params.cat,
    fed: req.params.fed
  }}, renderPage)
})

router.get('/:fed/:cat/:event', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200')
  nav[nav.findIndex(obj => obj.id === 'dash')].link = `/${req.params.fed}`
  if (nav.findIndex(obj => obj.id === 'cat') < 0) nav.splice(nav.length - 1, 0, {'title': 'Category', 'link': `/${req.params.fed}/${req.params.cat}`, id: 'cat'})

  let renderPage = (err, content) => res.render('app', { // eslint-disable-line
    locals: {
      scripts: ['/main/event.js'],
      id: 'dash',
      title: '',
      nav,
      brand: true,
      admin: false,

      content
    },
    partials: {
      template: 'partials/vue'
    }
  })
  es6renderer('es6templates/partials/main/event.html', {locals: {
    event: req.params.event,
    cat: req.params.cat,
    fed: req.params.fed
  }}, renderPage)
})

router.get('/login', (req, res) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200')
  var renderPage = (err, content) => res.render('app', { // eslint-disable-line
    locals: {
      scripts: ['/auth.js'],
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
