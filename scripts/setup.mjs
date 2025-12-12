#!/usr/bin/env node

import { existsSync } from 'fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

console.log('🚀 开始初始化旅游服务系统...\n')

// 检查 node_modules 是否存在
if (!existsSync('node_modules')) {
  console.log('📦 正在安装依赖...')
  try {
    await execAsync('npm install')
    console.log('✅ 依赖安装完成\n')
  } catch (error) {
    console.error('❌ 依赖安装失败:', error)
    process.exit(1)
  }
}

// 初始化数据库
console.log('🗄️ 正在初始化数据库...')
try {
  await execAsync('npm run db:init')
  console.log('✅ 数据库初始化完成\n')
} catch (error) {
  console.error('❌ 数据库初始化失败:', error)
  process.exit(1)
}

console.log('🎉 初始化完成！')
console.log('\n📝 下一步:')
console.log('1. 运行 `npm run dev` 启动开发服务器')
console.log('2. 访问 http://localhost:3000 查看应用')
console.log('3. 注册账户开始使用系统')