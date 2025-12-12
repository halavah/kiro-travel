import sqlite3 from 'sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'data', 'database.db')

// Create database connection
export const db = new sqlite3.Database(DB_PATH)

// Initialize database tables
export async function initDatabase() {
  return new Promise((resolve, reject) => {
    // Read the SQL schema file
    const schema = readFileSync(join(process.cwd(), 'scripts', '001_create_tables.sql'), 'utf8')

    db.exec(schema, (err) => {
      if (err) {
        console.error('Error creating tables:', err)
        reject(err)
      } else {
        console.log('Database tables created successfully')
        resolve(true)
      }
    })
  })
}

// Close database connection
export function closeDatabase() {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err)
    } else {
      console.log('Database connection closed')
    }
  })
}

// Helper function for running queries
export function query(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

// Helper function for running single row queries
export function get(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err)
      } else {
        resolve(row)
      }
    })
  })
}

// Helper function for running insert/update/delete queries
export function run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err)
      } else {
        resolve({ lastID: this.lastID, changes: this.changes })
      }
    })
  })
}