const express = require('express')
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const authentication = require('express-authentication')

const router = express.Router()

router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())

function authMiddleware (req, res, next) {
  // provide the data that was used to authenticate the request; if this is
  // not set then no attempt to authenticate is registered.
  req.authentication = req.get('Authorization')

  console.log(req.params.fed)

  if (typeof req.params.fed === 'undefined') {
    next({statusCode: 400, error: 'Only Avilable'})
  }

  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('config').get()
    .then(doc => {
      if (doc.exists) {
        let data = doc.data()

        req.authenticated = req.authentication === data.apikey

        // provide the result of the authentication; generally some kind of user
        // object on success and some kind of error as to why authentication failed
        // otherwise.
        if (req.authenticated) {
          req.authentication = { user: 'bob' }
        } else {
          req.authentication = { error: 'INVALID_API_KEY' }
        }
      } else {
        next({statusCode: 404, error: 'No such federation'})
      }

      // That's it! You're done!
      next()
    })
}

/**
 * @api {get} / List Federations
 * @apiName getFederations
 * @apiGroup Categories
 * @apiPermission none
 *
 * @apiSuccess {String} version Current API version
 * @apiSuccess {String[]} federations Array of federations
 */
router.get('/', (req, res) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').getCollections().then(collections => {
    let federations = []
    collections.forEach(collection => { federations.push(collection.id) })
    res.json({
      version: require('./package.json').version,
      federations
    })
  })
})

/**
 * @api {get} /:fed List Categories for a Federation
 * @apiName getCategories
 * @apiGroup Categories
 * @apiPermission federation
 *
 * @apiHeader {String} Authorization api key
 *
 * @apiParam {String} fed federation
 *
 * @apiSuccess {String[]} categories
 */
router.get('/:fed', authMiddleware, authentication.required(), (req, res) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories').getCollections().then(collections => {
    let categories = []
    collections.forEach(collection => { categories.push(collection.id) })
    res.json({categories})
  })
})

/**
 * @api {get} /:fed/:cat View Category config
 * @apiName getConfig
 * @apiGroup Categories
 * @apiPermission federation
 *
 * @apiHeader {String} Authorization api key
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 *
 * @apiSuccess {String} name The name of the Category
 * @apiSuccess {Object[]} events new Array of enabled events
 * @apiSuccess {String} events.abbr The "standard" abbreviation of the event
 * @apiSuccess {String} events.name The preferred name of the event
 * @apiSuccess {Boolean} events.speed if the event is a speed event or not
 * @apiSuccess {Object} events.cols columns to show
 * @apiSuccess {String[]} events.cols.overall columns to show in the overall table, in the order they should be shown
 * @apiSuccess {String[]} events.cols.event columns to show in the event's table, in the order they should be shown
 */
router.get('/:fed/:cat', authMiddleware, authentication.required(), (req, res, next) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('config').get()
    .then(doc => {
      if (doc.exists) {
        let data = doc.data()
        let config = {
          name: data.name || '',
          events: []
        }
        console.log(data)

        if (typeof data.events !== 'undefined') {
          let abbrs = Object.keys(data.events)
          config.events = abbrs.map(abbr => {
            return {
              abbr,
              name: data.events[abbr].name || '',
              cols: {
                event: data.events[abbr].cols.event || [],
                overall: data.events[abbr].cols.overall || []
              },
              speed: data.events[abbr].speed || false
            }
          })
        }

        res.json(config)
      } else {
        next({statusCode: 404, error: 'Cateory not configured'})
      }
    })
})

/**
 * @api {post} /:fed/:cat Set Category config
 * @apiName setConfig
 * @apiGroup Categories
 * @apiPermission federation
 *
 * @apiHeader {String} Authorization api key
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 *
 * @apiParam {String} name The new name of the Category
 * @apiParam {Object[]} events new Array of enabled events
 * @apiParam {String} events.abbr The "standard" abbreviation of the event
 * @apiParam {String} events.name The preferred name of the event, if not avilable the abbr will be used
 * @apiParam {Boolean} events.speed if the event is a speed event or not
 * @apiParam {Object} events.cols columns to show
 * @apiParam {String[]} events.cols.overall columns to show in the overall table
 * @apiParam {String[]} events.cols.event columns to show in the event's table
 *
 * @apiSuccess {String} message success message
 */
router.post('/:fed/:cat', authMiddleware, authentication.required(), (req, res, next) => {
  res.set('Cache-Control', 'private')
  console.log(req.body)
  let events = {}
  req.body.events.forEach(obj => {
    if (typeof obj.abbr !== 'undefined') {
      events[obj.abbr] = {
        name: obj.name || '',
        speed: obj.speed || false,
        cols: obj.cols || {
          speed: [],
          overall: []
        }
      }
    }
  })
  let config = {
    name: req.body.name,
    events: events
  }
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('config').set(config)
    .then(ref => {
      res.json({message: 'Category Config Updated successfully'})
    })
    .catch(err => {
      console.log(err)
      next({statusCode: 500, error: 'Could not update category config'})
    })
})

/* TODO: Implement and document */
router.delete('/:fed/:cat', authMiddleware, authentication.required(), (req, res, next) => {
  res.set('Cache-Control', 'private')
  next({statusCode: 501, error: 'Not Implemented'})
})

/**
 * @api {get} /:fed/:cat/participants View Category Participants
 * @apiName getParticipants
 * @apiGroup Categories
 * @apiPermission federation
 *
 * @apiHeader {String} Authorization api key
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 *
 * @apiSuccess {Object[]} participants An array of participants
 * @apiSuccess {String} participants.uid UID of the participant
 * @apiSuccess {String} participants.name Name of the participant
 * @apiSuccess {String} participants.club The Club of the participant
 */
router.get('/:fed/:cat/participants', authMiddleware, authentication.required(), (req, res, next) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('participants').get()
    .then(doc => {
      if (doc.exists) {
        let data = doc.data()
        let uids = []
        if (typeof data !== 'undefined') uids = Object.keys(data)
        let participants = uids.map(uid => {
          return {
            uid,
            name: data[uid].name || '',
            club: data[uid].club || ''
          }
        })

        res.json({participants})
      } else {
        next({statusCode: 404, error: 'Cateory not configured'})
      }
    })
})

/**
 * @api {post} /:fed/:cat/participants Bulk add Category Participants
 * @apiName setParticipants
 * @apiGroup Categories
 * @apiPermission federation
 *
 * @apiHeader {String} Authorization api key
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 *
 * @apiParam {Object[]} participants An array of participants
 * @apiParam {String} participants.uid UID of the participant
 * @apiParam {String} participants.name Name of the participant
 * @apiParam {String} participants.club The Club of the participant
 *
 * @apiSuccess {String} message success message
 */
router.post('/:fed/:cat/participants', authMiddleware, authentication.required(), (req, res, next) => {
  res.set('Cache-Control', 'private')
  console.log(req.body)
  let participants = {}

  req.body.participants.forEach(obj => {
    if (typeof obj.uid === 'number' || typeof obj.uid === 'string') {
      participants[obj.uid] = {
        name: obj.name || '',
        club: obj.club || ''
      }
    }
  })

  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('participants').set(participants)
    .then(ref => {
      res.json({message: 'Category Participants Added successfully'})
    })
    .catch(err => {
      console.log(err)
      next({statusCode: 500, error: 'Could not update category config'})
    })
})

/* TODO: Implement and document, not neccesary atm... (update single participant) */
router.patch('/:fed/:cat/participants', authMiddleware, authentication.required(), (req, res, next) => {
  res.set('Cache-Control', 'private')
  next({statusCode: 501, error: 'Not Implemented'})
})

/* TODO: Implement and document, not neccesary atm... (delete single participant) */
router.delete('/:fed/:cat/participants', authMiddleware, authentication.required(), (req, res, next) => {
  res.set('Cache-Control', 'private')
  next({statusCode: 501, error: 'Not Implemented'})
})

router.use(authentication.failed(), (req, res) => {
  res.status(401).json(req.authentication)
})

router.use((msg, req, res, next) => {
  console.log(msg)
  res.status(msg.statusCode || 500).json({message: msg.message || msg.error})
})

module.exports.router = router
