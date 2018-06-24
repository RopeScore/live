const admin = require('firebase-admin')

/**
 * @api {get} /:fed/:cat/scores/:event Get all stored scores for an event
 * @apiName getScores
 * @apiGroup Scores
 * @apiPermission federation
 * @apiVersion 1.2.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 * @apiParam {String} event event to get scores for
 *
 * @apiSuccess {Object[]} scores Array of objects with scores
 * @apiSuccess {String} scores.uid id of the participant
 * @apiSuccess {Boolean} [scores.display] If the score is publicly displayed
 * @apiSuccess {Boolean} [scores.dns] "<b>D</b>id <b>N</b>ot <b>S</b>kip", only true if the skipper explicitly didn't participate in the event, not true if the participant just hasn't skipped <em>yet</em>
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
 *
 * @apiError {String} message error message
 */
module.exports = (req, res, next) => {
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
}

/**
 * @api {get} /:fed/:cat/scores/:event Get all stored scores for an event
 * @apiName getScores
 * @apiGroup Scores
 * @apiPermission federation
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
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
 *
 * @apiError {String} message error message
 */
