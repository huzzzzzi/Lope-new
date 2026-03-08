const jwt = require('jsonwebtoken')
module.exports = function(req, res, next) {
  const h = req.headers.authorization
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
  try { req.brand = jwt.verify(h.slice(7), process.env.JWT_SECRET || 'lope-secret'); next() }
  catch { res.status(401).json({ error: 'Token expired or invalid' }) }
}
