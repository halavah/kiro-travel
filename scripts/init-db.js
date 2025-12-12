#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 运行: node scripts/init-db.js
 */

const { initDatabase } = require('../lib/db')

try {
  console.log('开始初始化数据库...')
  initDatabase()
  console.log('数据库初始化完成！')
  process.exit(0)
} catch (error) {
  console.error('数据库初始化失败:', error)
  process.exit(1)
}
