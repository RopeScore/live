const admin = require('firebase-admin')

/**
 * @api {post} /:fed/:cat/scores/:event Update multiple scores for an event
 * @apiName setScores
 * @apiGroup Scores
 * @apiPermission federation
 * @apiVersion 1.0.0
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
 * @apiParam {Number} [scores.T1] Diff score (freestyle)
 * @apiParam {Number} [scores.T2] Pres Score (freestyle)
 * @apiParam {Number} [scores.T2] Pres Score (freestyle)
 * @apiParam {Number} [scores.T3] RQ score (freestyle)
 * @apiParam {Number} [scores.T4] T2 + T3 (freestyle)
 * @apiParam {Number} [scores.T5] Deduc score (freestyle)
 *
 * @apiParam {Number} [scores.cScore] T4 - (T5 * .5) (freestyle)
 * @apiParam {Number} [scores.dScore] T5 - (T5 * .5) (freestyle)
 *
 * @apiParam {Number} [scores.PreA] T1 + T4 - T5 (freestyle)
 * @apiParam {Number} [scores.PreY] T - W (speed)
 *
 * @apiParam {Number} [scores.A] (T1 + T4 - T5) * fac (freestyle)
 * @apiParam {Number} [scores.Y] (T - W) * fac (speed)
 *
 * @apiParam {Number} [scores.cRank] rank for cScore (freestyle)
 * @apiParam {Number} [scores.dRank] rank for dScore (freestyle)
 * @apiParam {Number} [scores.rsum] cRank + dRank (freestyle)
 * @apiParam {Number} [scores.rank] total rank (of Y for speed, of rsum for freestyle)
 *
 * @apiSuccess {String} message success message
 */
module.exports = (req, res, next) => {
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

      if (typeof obj.PreA !== 'undefined') score.PreA = Number(obj.PreA)
      if (typeof obj.PreY !== 'undefined') score.PreY = Number(obj.PreY)

      if (typeof obj.A !== 'undefined') score.A = Number(obj.A)
      if (typeof obj.Y !== 'undefined') score.Y = Number(obj.Y)

      if (typeof obj.cRank !== 'undefined') score.cRank = Number(obj.cRank)
      if (typeof obj.dRank !== 'undefined') score.dRank = Number(obj.dRank)
      if (typeof obj.rsum !== 'undefined') score.rsum = Number(obj.rsum)
      if (typeof obj.rank !== 'undefined') score.rank = Number(obj.rank)

      console.log(score)

      batch.set(colRef.doc(obj.uid), score, {merge: true})
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
}
