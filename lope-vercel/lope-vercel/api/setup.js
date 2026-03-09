const { setupAndSeed } = require('./lib/db')
const { setCors } = require('./lib/middleware')

module.exports = async function(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error:'POST only' })
  try {
    const result = await setupAndSeed()
    if (result.alreadySeeded) return res.json({ message:'Database already set up. No changes made.' })
    res.json({ message:'Database tables created and demo data seeded!', demo:'demo@lope.com / password123' })
  } catch(e) {
    console.error(e)
    res.status(500).json({ error: e.message })
  }
}
