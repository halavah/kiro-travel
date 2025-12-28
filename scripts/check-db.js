#!/usr/bin/env node
/**
 * 数据库检查脚本
 * 在启动应用前检查并自动初始化数据库
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🔍 检查数据库状态...\n');

// 确定数据库路径
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');
console.log(`📁 数据库路径: ${dbPath}`);

// 确保数据目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  console.log(`📂 创建数据目录: ${dataDir}`);
  fs.mkdirSync(dataDir, { recursive: true });
}

// 检查数据库文件是否存在
if (!fs.existsSync(dbPath)) {
  console.log('⚠️  数据库文件不存在，开始初始化...\n');
  try {
    execSync('node scripts/init-db.js', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env, DB_INITIALIZING: 'true' }
    });
    console.log('\n✅ 数据库初始化成功！');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  }
} else {
  // 数据库文件存在，检查表结构
  let db;
  try {
    db = new Database(dbPath, { readonly: true });

    const requiredTables = [
      'profiles', 'spot_categories', 'spots', 'tickets', 'activities',
      'hotels', 'hotel_rooms', 'orders', 'news', 'news_categories'
    ];

    let missingTables = [];
    for (const tableName of requiredTables) {
      const result = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
      ).get(tableName);

      if (!result) {
        missingTables.push(tableName);
      }
    }

    db.close();

    if (missingTables.length > 0) {
      console.log(`⚠️  数据库缺少 ${missingTables.length} 个表: ${missingTables.join(', ')}`);
      console.log('🔧 开始重新初始化数据库...\n');

      // 备份现有数据库
      const backupPath = `${dbPath}.backup.${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`📦 已备份现有数据库至: ${backupPath}`);

      // 删除损坏的数据库
      fs.unlinkSync(dbPath);

      // 重新初始化
      try {
        execSync('node scripts/init-db.js', {
          stdio: 'inherit',
          cwd: process.cwd(),
          env: { ...process.env, DB_INITIALIZING: 'true' }
        });
        console.log('\n✅ 数据库重新初始化成功！');
      } catch (error) {
        console.error('❌ 数据库初始化失败:', error.message);
        // 恢复备份
        fs.copyFileSync(backupPath, dbPath);
        console.log('♻️  已恢复备份数据库');
        process.exit(1);
      }
    } else {
      console.log('✅ 数据库状态正常');

      // 显示统计信息
      db = new Database(dbPath, { readonly: true });
      try {
        const userCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get();
        const spotCount = db.prepare('SELECT COUNT(*) as count FROM spots').get();
        console.log(`📊 数据统计: ${userCount.count} 用户, ${spotCount.count} 景点`);
      } catch (error) {
        console.warn('⚠️  无法获取统计信息:', error.message);
      } finally {
        db.close();
      }
    }
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);

    // 如果是数据库损坏，尝试重新初始化
    if (error.message.includes('corrupt') || error.message.includes('malformed')) {
      console.log('🔧 检测到数据库损坏，尝试重新初始化...');

      // 备份损坏的数据库
      const backupPath = `${dbPath}.corrupt.${Date.now()}`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`📦 已备份损坏的数据库至: ${backupPath}`);

      // 删除损坏的数据库
      fs.unlinkSync(dbPath);

      // 重新初始化
      try {
        execSync('node scripts/init-db.js', {
          stdio: 'inherit',
          cwd: process.cwd(),
          env: { ...process.env, DB_INITIALIZING: 'true' }
        });
        console.log('\n✅ 数据库重新初始化成功！');
      } catch (initError) {
        console.error('❌ 数据库初始化失败:', initError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

console.log('\n✅ 数据库检查完成，准备启动应用...\n');
