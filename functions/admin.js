const express = require('express')
const admin = require('firebase-admin')
const es6renderer = require('express-es6-template-engine')
const Raven = require('raven')
const cookieParser = require('cookie-parser')

const router = express.Router()
router.use(Raven.requestHandler())
router.use(cookieParser())

const nav = [
  {
    'title': 'Dashboard',
    'link': '/',
    'id': 'dash'
  },
  {
    'title': 'Admin',
    'link': '/admin',
    'id': 'admindash'
  },
  {
    'title': 'Log In',
    'link': '/login',
    'id': 'login'
  }
]

function authMiddleware (req, res, next) {
  if (typeof req.cookies.ropescore_uid === 'undefined') {
    res.render('app', {
      locals: {
        scripts: [],
        id: 'dash',
        title: '',
        nav,
        brand: true,
        admin: false
      },
      partials: {
        template: 'partials/401'
      }
    })
  } else {
    next()
  }
}

router.get('/', authMiddleware, (req, res) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').getCollections().then(collections => {
    let federations = []
    let promises = []
    collections.forEach(collection => {
      promises.push(collection.doc('config').get().then(snapshot => {
        let data = snapshot.data()
        if (data.admins[req.cookies.ropescore_uid] === true) {
          federations.push(collection.id)
        }
      }))
    })
    Promise.all(promises).then(() => {
      res.render('app', {
        locals: {
          scripts: [],
          id: 'admindash',
          title: '',
          nav,
          brand: true,
          admin: true,

          federations
        },
        partials: {
          template: 'partials/admin/federations'
        }
      })
    })
  })
})

router.get('/:fed', authMiddleware, (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=1800, s-maxage=3600')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categoriesLookup').get().then(doc => {
    let data = doc.data()
    let categories = []
    if (doc.exists) {
      let keys = Object.keys(data)
      categories = keys.map(id => { return {id, name: data[id]} })
    }

    let renderPage = (err, content) => res.render('app', { // eslint-disable-line
      locals: {
        scripts: ['/admin/categories.js'],
        id: 'admindash',
        title: '',
        nav,
        brand: true,
        admin: true,
        content
      },
      partials: {
        template: 'partials/vue'
      }
    })
    es6renderer('es6templates/partials/admin/categories.html', {locals: {
      fed: req.params.fed,
      categories
    }}, renderPage)
  })
})

router.get('/:fed/:cat', authMiddleware, (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=1800, s-maxage=3600')
  // admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categoriesLookup').get().then(doc => {
  //   let data = doc.data()
  //   let categories = []
  //   if (doc.exists) {
  //     let keys = Object.keys(data)
  //     categories = keys.map(id => { return {id, name: data[id]} })
  //   }

  let renderPage = (err, content) => res.render('app', { // eslint-disable-line
    locals: {
      scripts: ['/admin/category.js'],
      id: 'admincat',
      title: '',
      nav,
      brand: true,
      admin: true,
      content
    },
    partials: {
      template: 'partials/vue'
    }
  })
  es6renderer('es6templates/partials/admin/category.html', {locals: {
    fed: req.params.fed,
    cat: req.params.cat
  }}, renderPage)
  // })
})

router.get('/:fed/display', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=3600, s-maxage=7200')
  nav[nav.findIndex(obj => obj.id === 'dash')].link = `/${req.params.fed}`

  let renderPage = (err, content) => res.render('app', { // eslint-disable-line
    locals: {
      scripts: ['/admin/display.js'],
      id: 'disp',
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
  es6renderer('es6templates/partials/admin/display.html', {locals: {
    fed: req.params.fed
  }}, renderPage)
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
