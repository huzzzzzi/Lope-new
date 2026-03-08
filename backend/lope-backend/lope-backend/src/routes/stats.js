const router = require('express').Router()
const auth   = require('../middleware/auth')
const { stats } = require('../lib/db')
router.get('/', auth, (req, res) => res.json(stats.get(req.brand.id)))
module.exports = router
