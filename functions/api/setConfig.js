const admin = require('firebase-admin')

/**
 * @api {post} /:fed/:cat Set Category config
 * @apiName setConfig
 * @apiGroup Categories
 * @apiPermission federation
 * @apiVersion 1.0.0
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
module.exports = (req, res, next) => {
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
}
