const jwt = require('jsonwebtoken')

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function handleOptions(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') { res.status(200).end(); return true }
  return false
}

function requireAuth(req, res) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) { res.status(401).json({ error:'Unauthorized' }); return null }
  try { return jwt.verify(h.slice(7), process.env.JWT_SECRET || 'lope-secret') }
  catch { res.status(401).json({ error:'Token expired or invalid' }); return null }
}

module.exports = { setCors, handleOptions, requireAuth }
