const express = require('express')
const cors    = require('cors')
const path    = require('path')
require('dotenv').config()

const app = express()

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth',        require('./routes/auth'))
app.use('/api/campaigns',   require('./routes/campaigns'))
app.use('/api/submissions', require('./routes/submissions'))
app.use('/api/stories',     require('./routes/stories'))
app.use('/api/stats',       require('./routes/stats'))

app.use((req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ error: 'Server error' }) })

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`\n  LOPE v2 backend → http://localhost:${PORT}`)
  console.log('  Demo login      → demo@lope.com / password123\n')
})
