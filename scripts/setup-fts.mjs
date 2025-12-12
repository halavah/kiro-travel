import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const dbPath = join(__dirname, '../data/travel.db')

console.log('🔍 Setting up Full-Text Search...')
console.log('Database path:', dbPath)

try {
  const db = new Database(dbPath)

  // Read the FTS migration SQL
  const ftsSQL = fs.readFileSync(join(__dirname, '003_add_fts_search.sql'), 'utf-8')

  // Execute the FTS migration
  console.log('\n📝 Creating FTS5 virtual table and triggers...')
  db.exec(ftsSQL)

  // Verify FTS table was created
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name='spots_fts'
  `).all()

  if (tables.length > 0) {
    console.log('✅ FTS5 table created successfully!')

    // Count indexed spots
    const count = db.prepare('SELECT COUNT(*) as count FROM spots_fts').get()
    console.log(`✅ Indexed ${count.count} spots for full-text search`)
  } else {
    console.log('❌ Failed to create FTS5 table')
  }

  db.close()
  console.log('\n✅ Full-Text Search setup completed!')
  console.log('\n💡 Benefits:')
  console.log('   - Much faster text search')
  console.log('   - Support for complex queries')
  console.log('   - Automatic ranking of results')
  console.log('   - Chinese and multilingual support')

} catch (error) {
  console.error('❌ Error setting up FTS:', error)
  process.exit(1)
}
