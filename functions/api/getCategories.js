const admin = require('firebase-admin')

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
module.exports = (req, res) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories').getCollections().then(collections => {
    let categories = []
    collections.forEach(collection => { categories.push(collection.id) })
    res.json({categories})
  })
}
