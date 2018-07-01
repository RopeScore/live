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
  if (typeof req.cookies.__session === 'undefined') {
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
        if (data.admins[req.cookies.__session]) {
          federations.push(collection.id)
        }
      }))
    })
    Promise.all(promises).then(() => {
      federations.sort((a, b) => a.localeCompare(b))
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
  res.set('Cache-Control', 'private')
  nav[nav.findIndex(obj => obj.id === 'admindash')].link = `/admin/${req.params.fed}`
  nav[nav.findIndex(obj => obj.id === 'dash')].link = `/${req.params.fed}`
  if (nav.findIndex(obj => obj.id === 'proj') < 0) nav.splice(nav.length - 1, 0, {'title': 'Projector', 'link': `/admin/${req.params.fed}/projector`, id: 'proj'})

  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categoriesLookupAdmin').get().then(doc => {
    let data = doc.data()
    let groups = []
    let categories = 0
    let sorter = (a, b) => a.name.localeCompare(b.name)
    if (doc.exists) {
      let gkeys = Object.keys(data)
      groups = gkeys.map(name => {
        let ckeys = Object.keys(data[name])
        let cats = ckeys.map(id => { return {id, name: data[name][id]} })
        cats.sort(sorter)
        return {name, categories: cats}
      })
      groups.sort(sorter)
      groups = groups.filter(curr => {
        console.log(curr, Array.isArray(curr.categories), curr.categories.length)
        return Array.isArray(curr.categories) && curr.categories.length > 0
      })
      console.log(categories)
      categories = groups.reduce((curr, sum) => sum + (Array.isArray(curr.categories) ? curr.categories.length : 0), 0)
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
      groups,
      categories
    }}, renderPage)
  })
})

router.get('/:fed/projector', (req, res, next) => {
  res.set('Cache-Control', 'private')
  nav[nav.findIndex(obj => obj.id === 'admindash')].link = `/admin/${req.params.fed}`
  nav[nav.findIndex(obj => obj.id === 'dash')].link = `/${req.params.fed}`
  if (nav.findIndex(obj => obj.id === 'proj') < 0) nav.splice(nav.length - 1, 0, {'title': 'Projector', 'link': `/admin/${req.params.fed}/projector`, id: 'proj'})

  let displays = [
    {
      path: 'scores',
      name: 'Scores'
    },
    {
      path: 'results',
      name: 'Results'
    }
    // {
    //   path: 'floor',
    //   name: 'Floor status'
    // }
  ]

  res.render('app', { // eslint-disable-line
    locals: {
      scripts: [],
      id: 'proj',
      title: '',
      nav,
      brand: true,
      admin: true,

      displays,
      fed: req.params.fed
    },
    partials: {
      template: 'partials/admin/projector'
    }
  })
})

router.get('/:fed/projector/scores', (req, res, next) => {
  res.set('Cache-Control', 'private')

  let renderPage = (err, content) => res.render('app', { // eslint-disable-line
    locals: {
      scripts: ['/admin/projector-scores.js'],
      id: 'disp',
      title: '',
      nav: false,
      brand: false,
      admin: true,

      content
    },
    partials: {
      template: 'partials/vue'
    }
  })
  es6renderer('es6templates/partials/admin/projector-scores.html', {locals: {
    fed: req.params.fed
  }}, renderPage)
})

router.get('/:fed/projector/results', (req, res, next) => {
  res.set('Cache-Control', 'private')

  let renderPage = (err, content) => res.render('app', { // eslint-disable-line
    locals: {
      scripts: ['/admin/projector-results.js'],
      id: 'disp',
      title: '',
      nav: false,
      brand: false,
      admin: true,

      content
    },
    partials: {
      template: 'partials/vue'
    }
  })
  es6renderer('es6templates/partials/admin/projector-results.html', {locals: {
    fed: req.params.fed
  }}, renderPage)
})

router.get('/:fed/projector/floor', (req, res, next) => {
  res.set('Cache-Control', 'private')

  let renderPage = (err, content) => res.render('app', { // eslint-disable-line
    locals: {
      scripts: ['/admin/projector-floor.js'],
      id: 'disp',
      title: '',
      nav: false,
      brand: false,
      admin: true,

      content
    },
    partials: {
      template: 'partials/vue'
    }
  })
  es6renderer('es6templates/partials/admin/projector-floor.html', {locals: {
    fed: req.params.fed
  }}, renderPage)
})

router.get('/:fed/:cat', authMiddleware, (req, res, next) => {
  res.set('Cache-Control', 'private')
  nav[nav.findIndex(obj => obj.id === 'admindash')].link = `/admin/${req.params.fed}`
  nav[nav.findIndex(obj => obj.id === 'dash')].link = `/${req.params.fed}`
  if (nav.findIndex(obj => obj.id === 'proj') < 0) nav.splice(nav.length - 1, 0, {'title': 'Projector', 'link': `/admin/${req.params.fed}/projector`, id: 'proj'})

  let renderPage = (err, content) => res.render('app', { // eslint-disable-line
    locals: {
      scripts: ['/admin/category.js'],
      id: 'admincat',
      title: '',
      nav,
      brand: false,
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

router.use(Raven.errorHandler())

router.use(function (req, res, next) {
  res.status(404).render('app', {
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
