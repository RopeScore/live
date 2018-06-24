const admin = require('firebase-admin')

/**
 * @api {post} /:fed/:cat/scores/overall Update multiple overall scores
 * @apiName setOverallScores
 * @apiGroup Scores
 * @apiPermission federation
 * @apiVersion 1.1.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer lt;apikeygt;</code>)
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 *
 * @apiParam {Object[]} scores Array of objects with scores
 * @apiParam {String} scores.uid id of the participant
 * @apiParam {Boolean} [scores.display] If the score is publicly displayed
 * @apiParam {Boolean} [scores.delete] Removes the score, overrides all other parms
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
 * @apiError   {String} message error message
 */
module.exports = (req, res, next) => {
  res.set('Cache-Control', 'private')
  console.log(req.body)
  let batch = admin.firestore().batch()
  let colRef = admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('scores').collection('overall')
  for (let part of req.body.scores) {
    if (typeof part.uid === 'undefined') continue
    let score = {events: {}}

    if (typeof part.delete !== 'undefined' && part.delete === true) {
      batch.delete(colRef.doc('' + part.uid))
      continue
    }

    if (typeof part.display !== 'undefined') score.display = part.display
    if (typeof part.score !== 'undefined') score.score = Number(part.score)
    if (typeof part.rsum !== 'undefined') score.rsum = Number(part.rsum)
    if (typeof part.rank !== 'undefined') score.rank = Number(part.rank)

    for (let evt of part.events) {
      if (typeof evt.abbr === 'undefined') continue
      score.events[evt.abbr] = {}
      if (typeof evt.T1 !== 'undefined') score.events[evt.abbr].T1 = Number(evt.T1)
      if (typeof evt.T2 !== 'undefined') score.events[evt.abbr].T2 = Number(evt.T2)
      if (typeof evt.T3 !== 'undefined') score.events[evt.abbr].T3 = Number(evt.T3)
      if (typeof evt.T4 !== 'undefined') score.events[evt.abbr].T4 = Number(evt.T4)
      if (typeof evt.T5 !== 'undefined') score.events[evt.abbr].T5 = Number(evt.T5)

      if (typeof evt.cScore !== 'undefined') score.events[evt.abbr].cScore = Number(evt.cScore)
      if (typeof evt.dScore !== 'undefined') score.events[evt.abbr].dScore = Number(evt.dScore)

      if (typeof evt.A !== 'undefined') score.events[evt.abbr].A = Number(evt.A)
      if (typeof evt.Y !== 'undefined') score.events[evt.abbr].Y = Number(evt.Y)

      if (typeof evt.cRank !== 'undefined') score.events[evt.abbr].cRank = Number(evt.cRank)
      if (typeof evt.dRank !== 'undefined') score.events[evt.abbr].dRank = Number(evt.dRank)
      if (typeof evt.rsum !== 'undefined') score.events[evt.abbr].rsum = Number(evt.rsum)
      if (typeof evt.rank !== 'undefined') score.events[evt.abbr].rank = Number(evt.rank)
    }
    batch.set(colRef.doc('' + part.uid), score, {merge: true})
  }
  batch.commit()
    .then(ref => {
      res.json({message: 'Overall Scores Updated successfully'})
    })
    .catch(err => {
      console.log(err)
      next({statusCode: 500, error: 'Could not update scores'})
    })
}

/**
 * @api {post} /:fed/:cat/scores/overall Update multiple overall scores
 * @apiName setOverallScores
 * @apiGroup Scores
 * @apiPermission federation
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer lt;apikeygt;</code>)
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
 * @apiError   {String} message error message
 */
