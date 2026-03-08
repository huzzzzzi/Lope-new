const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const auth   = require('../middleware/auth')
const { brands } = require('../lib/db')

const SECRET = process.env.JWT_SECRET || 'lope-secret'
const sign   = p => jwt.sign(p, SECRET, { expiresIn: '7d' })
const safe   = b => ({ id:b.id, name:b.name, email:b.email, createdAt:b.created_at })

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    const errs = []
    if (!name?.trim() || name.trim().length < 2) errs.push('Brand name must be 2+ characters')
    if (!email || !/\S+@\S+\.\S+/.test(email))   errs.push('Valid email required')
    if (!password || password.length < 8)          errs.push('Password must be 8+ characters')
    if (errs.length) return res.status(400).json({ error: errs.join('. ') })
    if (brands.byEmail(email)) return res.status(409).json({ error: 'Email already registered' })
    const passwordHash = await bcrypt.hash(password, 12)
    const brand = brands.create({ name: name.trim(), email, passwordHash })
    res.status(201).json({ token:sign({id:brand.id,email:brand.email,name:brand.name}), brand:safe(brand) })
  } catch(e) { console.error(e); res.status(500).json({ error: 'Registration failed' }) }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const brand = brands.byEmail(email)
    if (!brand || !(await bcrypt.compare(password, brand.password_hash)))
      return res.status(401).json({ error: 'Invalid email or password' })
    res.json({ token:sign({id:brand.id,email:brand.email,name:brand.name}), brand:safe(brand) })
  } catch(e) { res.status(500).json({ error: 'Login failed' }) }
})

router.get('/me', auth, (req, res) => {
  const brand = brands.byId(req.brand.id)
  if (!brand) return res.status(404).json({ error: 'Not found' })
  res.json({ brand: safe(brand) })
})

router.patch('/profile', auth, async (req, res) => {
  try {
    const { name, email } = req.body
    if (!name?.trim() || name.trim().length < 2) return res.status(400).json({ error: 'Name too short' })
    if (!email || !/\S+@\S+\.\S+/.test(email))   return res.status(400).json({ error: 'Valid email required' })
    const ex = brands.byEmail(email)
    if (ex && ex.id !== req.brand.id) return res.status(409).json({ error: 'Email already in use' })
    const updated = brands.update(req.brand.id, { name: name.trim(), email })
    res.json({ brand: safe(updated) })
  } catch(e) { res.status(500).json({ error: 'Update failed' }) }
})

router.patch('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword)                return res.status(400).json({ error: 'Current password required' })
    if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'New password must be 8+ characters' })
    const brand = brands.byId(req.brand.id)
    if (!(await bcrypt.compare(currentPassword, brand.password_hash)))
      return res.status(401).json({ error: 'Current password incorrect' })
    brands.update(req.brand.id, { passwordHash: await bcrypt.hash(newPassword, 12) })
    res.json({ message: 'Password updated' })
  } catch(e) { res.status(500).json({ error: 'Update failed' }) }
})

module.exports = router
