const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');

// 删除所有表的数据但保留表结构
const resetTables = () => {
  const db = new Database(dbPath);

  // 获取所有表名
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

  tables.forEach(table => {
    const tableName = table.name;
    console.log(`清空表: ${tableName}`);
    db.exec(`DELETE FROM ${tableName}`);
  });

  console.log('\n✅ 数据库重置完成！');
  db.close();
};

// 运行重置
resetTables();