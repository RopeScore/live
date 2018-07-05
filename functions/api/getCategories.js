const admin = require('firebase-admin')

/**
 * @api {get} /:fed List Categories for a Federation
 * @apiName getCategories
 * @apiGroup Categories
 * @apiPermission read
 * @apiVersion 1.4.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
 *
 * @apiParam {String} fed federation
 *
 * @apiSuccess {String[]} categories Array of category ids
 *
 * @apiError {String} message error message
 */
module.exports = (req, res, next) => {
  res.set('Cache-Control', 'private')
  if (!req.authentication.permissions.read) return next({statusCode: 401, error: `You do not have read permissions for ${req.params.fed}`})

  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories').getCollections().then(collections => {
    let categories = []
    collections.forEach(collection => { categories.push(collection.id) })
    res.json({categories})
  })
}

/**
 * @api {get} /:fed List Categories for a Federation
 * @apiName getCategories
 * @apiGroup Categories
 * @apiPermission federation
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
 *
 * @apiParam {String} fed federation
 *
 * @apiSuccess {String[]} categories Array of category ids
 *
 * @apiError {String} message error message
 */
