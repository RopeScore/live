module.exports = (req, res, next) => {
  res.set('Cache-Control', 'private')
  next({statusCode: 501, error: 'Not Implemented'})
}
