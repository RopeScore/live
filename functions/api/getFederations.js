const admin = require('firebase-admin')
const info = require('../package.json')

/**
 * @api {get} / List Federations
 * @apiName getFederations
 * @apiGroup Federations
 * @apiPermission none
 * @apiVersion 1.0.0
 *
 * @apiSuccess {String} version Current API version
 * @apiSuccess {String[]} federations Array of federations
 *
 * @apiError {String} message error message
 */
module.exports = (req, res) => {
  res.set('Cache-Control', 'private')
  admin.firestore().collection('live').doc('federations').getCollections().then(collections => {
    let federations = []
    collections.forEach(collection => { federations.push(collection.id) })
    res.json({
      version: info.apidoc.version,
      federations
    })
  })
}
