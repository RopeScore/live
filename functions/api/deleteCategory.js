const admin = require('firebase-admin')

/**
 * @api {delete} /:fed/:cat Delete a category
 * @apiName deleteCategory
 * @apiGroup Categories
 * @apiPermission write
 * @apiVersion 1.4.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
 *
 * @apiParam {String} fed {String} federation
 * @apiParam {String} cat id of the category
 *
 * @apiSuccess {String} message success message
 * @apiError   {String} message error message
 */
module.exports = (req, res, next) => {
  res.set('Cache-Control', 'private')
  if (!req.authentication.permissions.write) return next({statusCode: 401, error: `You do not have write permissions for ${req.params.fed}`})

  return admin.firestore().collection('live').doc('federations').collection(req.params.fed).doc('categories').collection(req.params.cat).doc('config')
    .set({delete: true, name: admin.firestore.FieldValue.delete()}, {merge: true})
    .then(() => {
      res.json({message: 'Category queued for deletion'})
    }).catch(err => {
      console.log(err)
      next({statusCode: 500, error: 'Could not queue category for deletion'})
    })
}

/**
 * @api {delete} /:fed/:cat Delete a category
 * @apiName deleteCategory
 * @apiGroup Categories
 * @apiPermission federation
 * @apiVersion 1.1.0
 *
 * @apiHeader {String} Authorization Bearer with api key (<code>Bearer &lt;apikey&gt;</code>)
 *
 * @apiParam {String} fed {String} federation
 * @apiParam {String} cat id of the category
 *
 * @apiSuccess {String} message success message
 * @apiError   {String} message error message
 */
