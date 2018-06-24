const admin = require('firebase-admin')

/**
 * @api {get} /:fed/:cat View Category config
 * @apiName getConfig
 * @apiGroup Categories
 * @apiPermission federation
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer lt;apikeygt;</code>)
 *
 * @apiParam {String} fed federation
 * @apiParam {String} cat id of the category
 *
 * @apiSuccess {String} name The name of the Category
 * @apiSuccess {Object[]} events new Array of enabled events
 * @apiSuccess {String} events.abbr The "standard" abbreviation of the event
 * @apiSuccess {String} events.name The preferred name of the event
 * @apiSuccess {Boolean} events.speed if the event is a speed event or not
 * @apiSuccess {Object} events.cols columns to show
 * @apiSuccess {String[]} events.cols.overall columns to show in the overall table, in the order they should be shown
 * @apiSuccess {String[]} events.cols.event columns to show in the event's table, in the order they should be shown
 *
 * @apiError {String} message error message
 */
module.exports = (req, res, next) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories')
    .collection(req.params.cat).doc('config').get()
    .then(doc => {
      if (doc.exists) {
        let data = doc.data()
        let config = {
          name: data.name || '',
          events: []
        }
        console.log(data)

        if (typeof data.events !== 'undefined') {
          let abbrs = Object.keys(data.events)
          config.events = abbrs.map(abbr => {
            return {
              abbr,
              name: data.events[abbr].name || '',
              cols: {
                event: data.events[abbr].cols.event || [],
                overall: data.events[abbr].cols.overall || []
              },
              speed: data.events[abbr].speed || false
            }
          })
        }

        res.json(config)
      } else {
        next({statusCode: 404, error: 'Cateory not configured'})
      }
    })
}
