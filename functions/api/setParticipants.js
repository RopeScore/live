const admin = require('firebase-admin')

/**
 * @api {post} /:fed/:cat/participants Bulk add Category Participants
 * @apiName setParticipants
 * @apiGroup Participants
 * @apiPermission federation
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer lt;apikeygt;</code>)
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 *
 * @apiParam {Object[]} participants An array of participants
 * @apiParam {String} participants.uid UID of the participant
 * @apiParam {String} participants.name Name of the participant
 * @apiParam {String} participants.club The Club of the participant
 * @apiParam {String} participants.members If the participant is a team this can be used to specify team members
 *
 * @apiSuccess {String} message success message
 * @apiError   {String} message error message
 */
module.exports = (req, res, next) => {
  res.set('Cache-Control', 'private')
  console.log(req.body)
  let participants = {}

  req.body.participants.forEach(obj => {
    if (typeof obj.uid === 'number' || typeof obj.uid === 'string') {
      participants[obj.uid] = {
        name: obj.name || '',
        club: obj.club || '',
        members: obj.members || ''
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
}
