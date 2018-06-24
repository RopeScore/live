const admin = require('firebase-admin')

/**
 * @api {get} /:fed/:cat/participants View Category Participants
 * @apiName getParticipants
 * @apiGroup Participants
 * @apiPermission federation
 * @apiVersion 1.1.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 *
 * @apiSuccess {Object[]} participants An array of participants
 * @apiSuccess {String} participants.uid UID of the participant
 * @apiSuccess {String} participants.name Name of the participant
 * @apiSuccess {String} participants.club The Club of the participant
 * @apiSuccess {String} participants.members The Club of the participant
 *
 * @apiError {String} message error message
 */
module.exports = (req, res, next) => {
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
            club: data[uid].club || '',
            members: data[uid].members || ''
          }
        })

        res.json({participants})
      } else {
        next({statusCode: 404, error: 'Cateory not configured'})
      }
    })
}

/**
 * @api {get} /:fed/:cat/participants View Category Participants
 * @apiName getParticipants
 * @apiGroup Participants
 * @apiPermission federation
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 *
 * @apiSuccess {Object[]} participants An array of participants
 * @apiSuccess {String} participants.uid UID of the participant
 * @apiSuccess {String} participants.name Name of the participant
 * @apiSuccess {String} participants.club The Club of the participant
 *
 * @apiError {String} message error message
 */
