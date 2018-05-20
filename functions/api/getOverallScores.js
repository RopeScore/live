const admin = require('firebase-admin')

/**
 * @api {get} /:fed/:cat/scores/overall Get all stored overall scores
 * @apiName getOverallScores
 * @apiGroup Scores
 * @apiPermission federation
 * @apiVersion 1.0.0
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
module.exports = (req, res, next) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('scores').collection('overall').get()
    .then(docs => {
      let scores = []
      docs.forEach(doc => {
        let score = doc.data()
        let events = Object.keys(score.events).map(abbr => {
          let obj = score.events[abbr]
          obj.abbr = abbr
          return obj
        })
        score.events = events
        score.uid = doc.id
        if (doc.exists) scores.push(score)
      })
      res.json({scores})
    })
}
