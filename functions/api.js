const express = require('express')
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const authentication = require('express-authentication')
const Raven = require('raven')

const router = express.Router()

router.use(Raven.requestHandler())

router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())

/**
 * @apiDefine federation
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
 */

function authMiddleware (req, res, next) {
  // provide the data that was used to authenticate the request; if this is
  // not set then no attempt to authenticate is registered.
  req.authentication = req.get('Authorization').replace(/^(Bearer )/, '')

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
 * @apiGroup Federations
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
 * @apiUse federation
 *
 * @apiParam {String} fed federation
 *
 * @apiSuccess {String[]} categories Array of category ids
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
 * @apiUse federation
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
 * @apiUse federation
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
 * @apiGroup Participants
 * @apiPermission federation
 *
 * @apiUse federation
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
 * @apiGroup Participants
 * @apiPermission federation
 *
 * @apiUse federation
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
      next({statusCode: 500, error: 'Could not add participants'})
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

/**
 * @api {get} /:fed/:cat/scores/overall Get all stored overall scores
 * @apiName getOverallScores
 * @apiGroup Scores
 * @apiPermission federation
 *
 * @apiUse federation
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 *
 * @apiSuccess {Object[]} scores Array of objects with scores
 * @apiSuccess {String} scores.uid id of the participant
 * @apiSuccess {Boolean} [scores.display] If the score is publicly displayed
 *
 * @apiSuccess {Number} [scores.score] sum of all events scores
 * @apiSuccess {Number} [scores.rsum] sum of all events ranks
 * @apiSuccess {Number} [scores.rank] Overall rank
 *
 * @apiSuccess {Object[]} scores.events Array of objects with scores per event
 * @apiSuccess {Number} scores.event.abbr the abbr event the score applies to
 * @apiSuccess {Number} [scores.event.T1] Diff score (freestyles)
 * @apiSuccess {Number} [scores.event.T2] Pres Score (freestyles)
 * @apiSuccess {Number} [scores.event.T2] Pres Score (freestyles)
 * @apiSuccess {Number} [scores.event.T3] RQ score (freestyles)
 * @apiSuccess {Number} [scores.event.T4] T2 + T3 (freestyles)
 * @apiSuccess {Number} [scores.event.T5] Deduc score (freestyles)
 *
 * @apiSuccess {Number} [scores.event.cScore] T4 - .5*T5 (freestyles)
 * @apiSuccess {Number} [scores.event.dScore] T5 - .5*T5 (freestyles)
 *
 * @apiSuccess {Number} [scores.event.A] (T1 + T4 - T5) * fac (freestyles)
 * @apiSuccess {Number} [scores.event.Y] (T - W) * fac (speed)
 *
 * @apiSuccess {Number} [scores.event.cRank] rank for cScore (freestyle)
 * @apiSuccess {Number} [scores.event.dRank] rank for dScore (freestyle)
 * @apiSuccess {Number} [scores.event.rsum] cRank + dRank (freestyle)
 * @apiSuccess {Number} [scores.event.rank] total rank (of Y for speed, of rsum for freestyle)
 */
router.get('/:fed/:cat/scores/:event', authMiddleware, authentication.required(), (req, res, next) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('scores').collection('overall').get()
    .then(docs => {
      let scores = []
      docs.forEach(doc => {
        let score = doc.data()
        score.uid = doc.id
        if (doc.exists) scores.push(score)
      })
      res.json({scores})
    })
})

/**
 * @api {post} /:fed/:cat/scores/overall Update multiple overall scores
 * @apiName setOverallScores
 * @apiGroup Scores
 * @apiPermission federation
 *
 * @apiUse federation
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 *
 * @apiParam {Object[]} scores Array of objects with scores
 * @apiParam {String} scores.uid id of the participant
 * @apiParam {Boolean} [scores.display] If the score is publicly displayed
 *
 * @apiParam {Number} [scores.score] sum of all events scores
 * @apiParam {Number} [scores.rsum] sum of all events ranks
 * @apiParam {Number} [scores.rank] Overall rank
 *
 * @apiParam {Object[]} scores.events Array of objects with scores per event
 * @apiParam {Number} scores.event.abbr the abbr event the score applies to
 * @apiParam {Number} [scores.event.T1] Diff score (freestyles)
 * @apiParam {Number} [scores.event.T2] Pres Score (freestyles)
 * @apiParam {Number} [scores.event.T2] Pres Score (freestyles)
 * @apiParam {Number} [scores.event.T3] RQ score (freestyles)
 * @apiParam {Number} [scores.event.T4] T2 + T3 (freestyles)
 * @apiParam {Number} [scores.event.T5] Deduc score (freestyles)
 *
 * @apiParam {Number} [scores.event.cScore] T4 - .5*T5 (freestyles)
 * @apiParam {Number} [scores.event.dScore] T5 - .5*T5 (freestyles)
 *
 * @apiParam {Number} [scores.event.A] (T1 + T4 - T5) * fac (freestyles)
 * @apiParam {Number} [scores.event.Y] (T - W) * fac (speed)
 *
 * @apiParam {Number} [scores.event.cRank] rank for cScore (freestyle)
 * @apiParam {Number} [scores.event.dRank] rank for dScore (freestyle)
 * @apiParam {Number} [scores.event.rsum] cRank + dRank (freestyle)
 * @apiParam {Number} [scores.event.rank] total rank (of Y for speed, of rsum for freestyle)
 *
 * @apiSuccess {String} message success message
 */
router.post('/:fed/:cat/scores/overall', authMiddleware, authentication.required(), (req, res, next) => {
  res.set('Cache-Control', 'private')
  console.log(req.body)
  let batch = admin.firestore().batch()
  let colRef = admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('scores').collection('overall')
  for (let part of req.body.scores) {
    if (typeof part.uid === 'undefined') continue
    let events = {}

    if (typeof part.display !== 'undefined') events.display = part.display
    if (typeof part.score !== 'undefined') events.score = Number(part.score)
    if (typeof part.rsum !== 'undefined') events.rsum = Number(part.rsum)
    if (typeof part.rank !== 'undefined') events.rank = Number(part.rank)

    for (let evt of part.events) {
      if (typeof evt.abbr === 'undefined') continue
      events[evt.abbr] = {}
      if (typeof evt.T1 !== 'undefined') events[evt.abbr].T1 = Number(evt.T1)
      if (typeof evt.T2 !== 'undefined') events[evt.abbr].T2 = Number(evt.T2)
      if (typeof evt.T3 !== 'undefined') events[evt.abbr].T3 = Number(evt.T3)
      if (typeof evt.T4 !== 'undefined') events[evt.abbr].T4 = Number(evt.T4)
      if (typeof evt.T5 !== 'undefined') events[evt.abbr].T5 = Number(evt.T5)

      if (typeof evt.cScore !== 'undefined') events[evt.abbr].cScore = Number(evt.cScore)
      if (typeof evt.dScore !== 'undefined') events[evt.abbr].dScore = Number(evt.dScore)

      if (typeof evt.A !== 'undefined') events[evt.abbr].A = Number(evt.A)
      if (typeof evt.Y !== 'undefined') events[evt.abbr].Y = Number(evt.Y)

      if (typeof evt.cRank !== 'undefined') events[evt.abbr].cRank = Number(evt.cRank)
      if (typeof evt.dRank !== 'undefined') events[evt.abbr].dRank = Number(evt.dRank)
      if (typeof evt.rsum !== 'undefined') events[evt.abbr].rsum = Number(evt.rsum)
      if (typeof evt.rank !== 'undefined') events[evt.abbr].rank = Number(evt.rank)
    }
    batch.set(colRef.doc(part.uid), events)
  }
  batch.commit()
    .then(ref => {
      res.json({message: 'Scores Updated successfully'})
    })
    .catch(err => {
      console.log(err)
      next({statusCode: 500, error: 'Could not update scores'})
    })
})

/**
 * @api {get} /:fed/:cat/scores/:event Get all stored scores for an event
 * @apiName getScores
 * @apiGroup Scores
 * @apiPermission federation
 *
 * @apiUse federation
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 * @apiParam {String} event event to get scores for
 *
 * @apiSuccess {Object[]} scores Array of objects with scores
 * @apiSuccess {String} scores.uid id of the participant
 * @apiSuccess {Boolean} [scores.display] If the score is publicly displayed
 *
 * @apiSuccess {Number} [scores.T1] Diff score (freestyles)
 * @apiSuccess {Number} [scores.T2] Pres Score (freestyles)
 * @apiSuccess {Number} [scores.T2] Pres Score (freestyles)
 * @apiSuccess {Number} [scores.T3] RQ score (freestyles)
 * @apiSuccess {Number} [scores.T4] T2 + T3 (freestyles)
 * @apiSuccess {Number} [scores.T5] Deduc score (freestyles)
 *
 * @apiSuccess {Number} [scores.cScore] T4 - .5*T5 (freestyles)
 * @apiSuccess {Number} [scores.dScore] T5 - .5*T5 (freestyles)
 *
 * @apiSuccess {Number} [scores.A] (T1 + T4 - T5) * fac (freestyles)
 * @apiSuccess {Number} [scores.Y] (T - W) * fac (speed)
 *
 * @apiSuccess {Number} [scores.cRank] rank for cScore (freestyle)
 * @apiSuccess {Number} [scores.dRank] rank for dScore (freestyle)
 * @apiSuccess {Number} [scores.rsum] cRank + dRank (freestyle)
 * @apiSuccess {Number} [scores.rank] total rank (of Y for speed, of rsum for freestyle)
 */
router.get('/:fed/:cat/scores/:event', authMiddleware, authentication.required(), (req, res, next) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('scores').collection(req.params.event).get()
    .then(docs => {
      let scores = []
      docs.forEach(doc => {
        let score = doc.data()
        score.uid = doc.id
        if (doc.exists) scores.push(score)
      })
      res.json({scores})
    })
})

/**
 * @api {post} /:fed/:cat/scores/:event Update multiple scores for an event
 * @apiName setScores
 * @apiGroup Scores
 * @apiPermission federation
 *
 * @apiUse federation
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 * @apiParam {String} event event to get scores for
 *
 *
 * @apiParam {Object[]} scores Array of objects with scores
 * @apiParam {String} scores.uid id of the participant
 * @apiParam {Boolean} [scores.display] If the score is publicly displayed
 *
 * @apiParam {Number} [scores.T1] Diff score (freestyles)
 * @apiParam {Number} [scores.T2] Pres Score (freestyles)
 * @apiParam {Number} [scores.T2] Pres Score (freestyles)
 * @apiParam {Number} [scores.T3] RQ score (freestyles)
 * @apiParam {Number} [scores.T4] T2 + T3 (freestyles)
 * @apiParam {Number} [scores.T5] Deduc score (freestyles)
 *
 * @apiParam {Number} [scores.cScore] T4 - .5*T5 (freestyles)
 * @apiParam {Number} [scores.dScore] T5 - .5*T5 (freestyles)
 *
 * @apiParam {Number} [scores.A] (T1 + T4 - T5) * fac (freestyles)
 * @apiParam {Number} [scores.Y] (T - W) * fac (speed)
 *
 * @apiParam {Number} [scores.cRank] rank for cScore (freestyle)
 * @apiParam {Number} [scores.dRank] rank for dScore (freestyle)
 * @apiParam {Number} [scores.rsum] cRank + dRank (freestyle)
 * @apiParam {Number} [scores.rank] total rank (of Y for speed, of rsum for freestyle)
 *
 * @apiSuccess {String} message success message
 */
router.post('/:fed/:cat/scores/:event', authMiddleware, authentication.required(), (req, res, next) => {
  res.set('Cache-Control', 'private')
  console.log(req.body)
  let batch = admin.firestore().batch()
  let colRef = admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('scores').collection(req.params.event)
  req.body.scores.forEach(obj => {
    if (typeof obj.uid !== 'undefined') {
      let score = {}
      if (typeof obj.display !== 'undefined') score.display = obj.display

      if (typeof obj.T1 !== 'undefined') score.T1 = Number(obj.T1)
      if (typeof obj.T2 !== 'undefined') score.T2 = Number(obj.T2)
      if (typeof obj.T3 !== 'undefined') score.T3 = Number(obj.T3)
      if (typeof obj.T4 !== 'undefined') score.T4 = Number(obj.T4)
      if (typeof obj.T5 !== 'undefined') score.T5 = Number(obj.T5)

      if (typeof obj.cScore !== 'undefined') score.cScore = Number(obj.cScore)
      if (typeof obj.dScore !== 'undefined') score.dScore = Number(obj.dScore)

      if (typeof obj.A !== 'undefined') score.A = Number(obj.A)
      if (typeof obj.Y !== 'undefined') score.Y = Number(obj.Y)

      if (typeof obj.cRank !== 'undefined') score.cRank = Number(obj.cRank)
      if (typeof obj.dRank !== 'undefined') score.dRank = Number(obj.dRank)
      if (typeof obj.rsum !== 'undefined') score.rsum = Number(obj.rsum)
      if (typeof obj.rank !== 'undefined') score.rank = Number(obj.rank)

      console.log(score)

      batch.set(colRef.doc(obj.uid), score)
    }
  })
  batch.commit()
    .then(ref => {
      res.json({message: 'Scores Updated successfully'})
    })
    .catch(err => {
      console.log(err)
      next({statusCode: 500, error: 'Could not update scores'})
    })
})

router.use(Raven.errorHandler())

router.use(authentication.failed(), (req, res) => {
  res.status(401).json(req.authentication)
})

router.use((msg, req, res, next) => {
  console.log(msg)
  res.status(msg.statusCode || 500).json({message: msg.message || msg.error})
})

module.exports.router = router
