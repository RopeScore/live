const admin = require('firebase-admin')

const del = admin.firestore.FieldValue.delete

/**
 * @api {post} /:fed/:cat/scores/:event Update multiple scores for an event
 * @apiName setScores
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
 * @apiParam {Object[]} scores Array of objects with scores
 * @apiParam {String} scores.uid id of the participant
 * @apiParam {Boolean} [scores.display] If the score is publicly displayed
 * @apiParam {Boolean} [scores.dns] "<b>D</b>id <b>N</b>ot <b>S</b>kip", only true if the skipper explicitly didn't participate in the event, not true if the participant just hasn't skipped <em>yet</em>
 * @apiParam {Boolean} [scores.delete] Removes the score, overrides all other parms
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
 * @apiError   {String} message error message
 */
module.exports = (req, res, next) => {
  res.set('Cache-Control', 'private')
  console.log(req.body)
  let batch = admin.firestore().batch()
  let colRef = admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('scores').collection(req.params.event)
  batch.set(colRef.parent, {})
  for (let part of req.body.scores) {
    if (typeof part.uid === 'undefined') continue
    let score = {}

    if (typeof part.delete !== 'undefined' && part.delete === true) {
      batch.delete(colRef.doc('' + part.uid))
      continue
    }

    if (typeof part.display !== 'undefined') score.display = part.display
    score.dns = Boolean(part.dns) || del()

    score.T1 = (isNaN(Number(part.T1)) ? del() : Number(part.T1))
    score.T2 = (isNaN(Number(part.T2)) ? del() : Number(part.T2))
    score.T3 = (isNaN(Number(part.T3)) ? del() : Number(part.T3))
    score.T4 = (isNaN(Number(part.T4)) ? del() : Number(part.T4))
    score.T5 = (isNaN(Number(part.T5)) ? del() : Number(part.T5))

    score.cScore = (isNaN(Number(part.cScore)) ? del() : Number(part.cScore))
    score.dScore = (isNaN(Number(part.dScore)) ? del() : Number(part.dScore))

    score.PreA = (isNaN(Number(part.PreA)) ? del() : Number(part.PreA))
    score.PreY = (isNaN(Number(part.PreY)) ? del() : Number(part.PreY))

    score.A = (isNaN(Number(part.A)) ? del() : Number(part.A))
    score.Y = (isNaN(Number(part.Y)) ? del() : Number(part.Y))

    score.cRank = (isNaN(Number(part.cRank)) ? del() : Number(part.cRank))
    score.dRank = (isNaN(Number(part.dRank)) ? del() : Number(part.dRank))
    score.rsum = (isNaN(Number(part.rsum)) ? del() : Number(part.rsum))
    score.rank = (isNaN(Number(part.rank)) ? del() : Number(part.rank))

    console.log(score)

    batch.set(colRef.doc('' + part.uid), score, {merge: true})
  }
  batch.commit()
    .then(ref => {
      res.json({message: `${req.params.event} Scores Updated successfully`})
    })
    .catch(err => {
      console.log(err)
      next({statusCode: 500, error: `Could not update ${req.params.event} scores`})
    })
}

/**
 * @api {post} /:fed/:cat/scores/:event Update multiple scores for an event
 * @apiName setScores
 * @apiGroup Scores
 * @apiPermission federation
 * @apiVersion 1.1.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 * @apiParam {String} event event to get scores for
 *
 * @apiParam {Object[]} scores Array of objects with scores
 * @apiParam {String} scores.uid id of the participant
 * @apiParam {Boolean} [scores.display] If the score is publicly displayed
 * @apiParam {Boolean} [scores.delete] Removes the score, overrides all other parms
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
 * @apiError   {String} message error message
 */

/**
 * @api {post} /:fed/:cat/scores/:event Update multiple scores for an event
 * @apiName setScores
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
 * @apiError   {String} message error message
 */
