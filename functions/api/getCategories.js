const admin = require('firebase-admin')

/**
 * @api {get} /:fed List Categories for a Federation
 * @apiName getCategories
 * @apiGroup Categories
 * @apiPermission federation
 * @apiVersion 1.0.0
 *
 * @apiUse federation
 *
 * @apiParam {String} fed federation
 *
 * @apiSuccess {String[]} categories Array of category ids
 */
module.exports = (req, res) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories').getCollections().then(collections => {
    let categories = []
    collections.forEach(collection => { categories.push(collection.id) })
    res.json({categories})
  })
}
