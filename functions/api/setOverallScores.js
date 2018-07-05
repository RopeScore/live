const admin = require('firebase-admin')

const del = admin.firestore.FieldValue.delete

/**
 * @api {post} /:fed/:cat/scores/overall Update multiple overall scores
 * @apiName setOverallScores
 * @apiGroup Scores
 * @apiPermission write
 * @apiVersion 1.4.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
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
  if (!req.authentication.permissions.write) return next({statusCode: 401, error: `You do not have write permissions for ${req.params.fed}`})

  console.log(req.body)
  let batch = admin.firestore().batch()
  let colRef = admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('scores').collection('overall')
  batch.set(colRef.parent, {})
  for (let part of req.body.scores) {
    if (typeof part.uid === 'undefined') continue
    let score = {events: {}}

    if (typeof part.delete !== 'undefined' && part.delete === true) {
      batch.delete(colRef.doc('' + part.uid))
      continue
    }

    if (typeof part.display !== 'undefined') score.display = Boolean(part.display)
    score.score = (isNaN(Number(part.score)) ? del() : Number(part.score))
    score.rsum = (isNaN(Number(part.rsum)) ? del() : Number(part.rsum))
    score.rank = (isNaN(Number(part.rank)) ? del() : Number(part.rank))

    for (let evt of part.events) {
      if (typeof evt.abbr === 'undefined') continue
      score.events[evt.abbr] = {}
      score.events[evt.abbr].T1 = (isNaN(Number(evt.T1)) ? del() : Number(evt.T1))
      score.events[evt.abbr].T2 = (isNaN(Number(evt.T2)) ? del() : Number(evt.T2))
      score.events[evt.abbr].T3 = (isNaN(Number(evt.T3)) ? del() : Number(evt.T3))
      score.events[evt.abbr].T4 = (isNaN(Number(evt.T4)) ? del() : Number(evt.T4))
      score.events[evt.abbr].T5 = (isNaN(Number(evt.T5)) ? del() : Number(evt.T5))

      score.events[evt.abbr].cScore = (isNaN(Number(evt.cScore)) ? del() : Number(evt.cScore))
      score.events[evt.abbr].dScore = (isNaN(Number(evt.dScore)) ? del() : Number(evt.dScore))

      score.events[evt.abbr].A = (isNaN(Number(evt.A)) ? del() : Number(evt.A))
      score.events[evt.abbr].Y = (isNaN(Number(evt.Y)) ? del() : Number(evt.Y))

      score.events[evt.abbr].cRank = (isNaN(Number(evt.cRank)) ? del() : Number(evt.cRank))
      score.events[evt.abbr].dRank = (isNaN(Number(evt.dRank)) ? del() : Number(evt.dRank))
      score.events[evt.abbr].rsum = (isNaN(Number(evt.rsum)) ? del() : Number(evt.rsum))
      score.events[evt.abbr].rank = (isNaN(Number(evt.rank)) ? del() : Number(evt.rank))
    }
    batch.set(colRef.doc('' + part.uid), score, {merge: true})
  }
  batch.commit()
    .then(ref => {
      res.json({message: 'Overall Scores Updated successfully'})
    })
    .catch(err => {
      console.log(err)
      next({statusCode: 500, error: 'Could not update overall scores'})
    })
}

/**
 * @api {post} /:fed/:cat/scores/overall Update multiple overall scores
 * @apiName setOverallScores
 * @apiGroup Scores
 * @apiPermission federation
 * @apiVersion 1.2.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
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

/**
 * @api {post} /:fed/:cat/scores/overall Update multiple overall scores
 * @apiName setOverallScores
 * @apiGroup Scores
 * @apiPermission federation
 * @apiVersion 1.1.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
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

/**
 * @api {post} /:fed/:cat/scores/overall Update multiple overall scores
 * @apiName setOverallScores
 * @apiGroup Scores
 * @apiPermission federation
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
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
