#!/usr/bin/env node
/**
 * 数据库诊断脚本
 * 用于检查数据库状态和配置
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

console.log('🔍 开始数据库诊断...\n');

// 1. 检查环境变量
console.log('📋 环境配置:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || '未设置'}`);
console.log(`  DATABASE_PATH: ${process.env.DATABASE_PATH || '未设置'}`);
console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? '已设置' : '未设置'}`);
console.log('');

// 2. 确定数据库路径
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');
console.log(`📁 数据库路径: ${dbPath}`);

// 3. 检查数据库文件
if (!fs.existsSync(dbPath)) {
  console.error('❌ 数据库文件不存在!');
  console.log('\n解决方案:');
  console.log('  1. 运行: npm run db:init');
  console.log('  2. 或访问: /api/init-db');
  process.exit(1);
}

const stats = fs.statSync(dbPath);
console.log(`✅ 数据库文件存在 (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
console.log('');

// 4. 连接数据库
let db;
try {
  db = new Database(dbPath, { readonly: true });
  console.log('✅ 数据库连接成功');
} catch (error) {
  console.error('❌ 数据库连接失败:', error.message);
  process.exit(1);
}

// 5. 检查表
console.log('\n📊 数据库表状态:');
const requiredTables = [
  'profiles', 'spot_categories', 'spots', 'tickets', 'activities',
  'hotels', 'hotel_rooms', 'orders', 'news', 'news_categories',
  'cart_items', 'hotel_bookings', 'activity_participants',
  'spot_comments', 'spot_likes', 'spot_favorites'
];

let missingTables = [];
requiredTables.forEach(tableName => {
  try {
    const result = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    ).get(tableName);

    if (result) {
      // 获取记录数
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`  ✅ ${tableName.padEnd(25)} (${count.count} 条记录)`);
    } else {
      console.log(`  ❌ ${tableName} - 不存在`);
      missingTables.push(tableName);
    }
  } catch (error) {
    console.log(`  ❌ ${tableName} - 错误: ${error.message}`);
    missingTables.push(tableName);
  }
});

// 6. 检查关键数据
console.log('\n📈 关键数据统计:');
try {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM profiles').get();
  const spotCount = db.prepare('SELECT COUNT(*) as count FROM spots').get();
  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get();
  const newsCount = db.prepare('SELECT COUNT(*) as count FROM news').get();

  console.log(`  用户: ${userCount.count}`);
  console.log(`  景点: ${spotCount.count}`);
  console.log(`  订单: ${orderCount.count}`);
  console.log(`  新闻: ${newsCount.count}`);
} catch (error) {
  console.error('  ❌ 无法获取统计数据:', error.message);
}

// 7. 检查管理员账号
console.log('\n👤 管理员账号:');
try {
  const admins = db.prepare("SELECT email, full_name, role FROM profiles WHERE role='admin'").all();
  if (admins.length > 0) {
    admins.forEach(admin => {
      console.log(`  ✅ ${admin.email} (${admin.full_name})`);
    });
  } else {
    console.log('  ⚠️  未找到管理员账号');
  }
} catch (error) {
  console.error('  ❌ 无法查询管理员:', error.message);
}

// 8. 总结
console.log('\n' + '='.repeat(60));
if (missingTables.length === 0) {
  console.log('✅ 数据库状态正常!');
  console.log('\n测试账号:');
  console.log('  管理员: admin@example.com / admin123');
  console.log('  导游: guide1@example.com / guide123');
  console.log('  用户: user1@example.com / user123');
} else {
  console.log(`❌ 数据库不完整，缺少 ${missingTables.length} 个表`);
  console.log('\n解决方案:');
  console.log('  1. 运行: npm run db:init');
  console.log('  2. 或访问: /api/init-db');
}
console.log('='.repeat(60));

// 关闭数据库
db.close();
