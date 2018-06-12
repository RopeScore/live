const express = require('express')
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const authentication = require('express-authentication')
const Raven = require('raven')
const cors = require('cors')

const router = express.Router()

router.use(Raven.requestHandler())

router.use(cors({
  origin: true
}))
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

router.get('/', require('./api/getFederations'))
router.get('/:fed', authMiddleware, authentication.required(), require('./api/getCategories'))
router.get('/:fed/:cat', authMiddleware, authentication.required(), require('./api/getConfig'))
router.post('/:fed/:cat', authMiddleware, authentication.required(), require('./api/setConfig'))
/* TODO: Implement and document */
router.delete('/:fed/:cat', authMiddleware, authentication.required(), require('./api/notImplemented'))
router.get('/:fed/:cat/participants', authMiddleware, authentication.required(), require('./api/getParticipants'))
router.post('/:fed/:cat/participants', authMiddleware, authentication.required(), require('./api/setParticipants'))
/* TODO: Implement and document, not neccesary atm... (update single participant) */
router.patch('/:fed/:cat/participants', authMiddleware, authentication.required(), require('./api/notImplemented'))
/* TODO: Implement and document, not neccesary atm... (delete single participant) */
router.delete('/:fed/:cat/participants', authMiddleware, authentication.required(), require('./api/notImplemented'))
router.get('/:fed/:cat/scores/overall', authMiddleware, authentication.required(), require('./api/getOverallScores'))
router.post('/:fed/:cat/scores/overall', authMiddleware, authentication.required(), require('./api/setOverallScores'))
router.get('/:fed/:cat/scores/:event', authMiddleware, authentication.required(), require('./api/getScores'))
router.post('/:fed/:cat/scores/:event', authMiddleware, authentication.required(), require('./api/setScores'))

router.use(Raven.errorHandler())

router.use(authentication.failed(), (req, res) => {
  res.status(401).json(req.authentication)
})

router.use((msg, req, res, next) => {
  console.log(msg)
  res.status(msg.statusCode || 500).json({message: msg.message || msg.error})
})

module.exports.router = router
