const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');

// 删除旧数据库文件
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✓ 删除旧数据库文件');
}

// 确保数据目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✓ 创建数据目录');
}

// 创建数据库连接
const db = new Database(dbPath);

console.log('开始初始化数据库...');

// 创建表
const createTables = () => {
  // 用户表
  db.exec(`
    CREATE TABLE profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'guide', 'admin')),
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 景点表
  db.exec(`
    CREATE TABLE spots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      images TEXT, -- JSON array
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 门票表
  db.exec(`
    CREATE TABLE tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spot_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10, 2) NOT NULL,
      stock INTEGER DEFAULT 0,
      valid_from DATE,
      valid_to DATE,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE
    )
  `);

  // 活动表
  db.exec(`
    CREATE TABLE activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      max_participants INTEGER,
      price DECIMAL(10, 2) DEFAULT 0,
      images TEXT, -- JSON array
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 活动参与者表
  db.exec(`
    CREATE TABLE activity_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      UNIQUE(activity_id, user_id)
    )
  `);

  // 酒店表
  db.exec(`
    CREATE TABLE hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      images TEXT, -- JSON array
      amenities TEXT, -- JSON array
      rating DECIMAL(2, 1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 酒店房间表
  db.exec(`
    CREATE TABLE hotel_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'single', 'double', 'suite', etc.
      max_occupancy INTEGER NOT NULL,
      price_per_night DECIMAL(10, 2) NOT NULL,
      amenities TEXT, -- JSON array
      images TEXT, -- JSON array
      status TEXT DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'maintenance')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
    )
  `);

  // 订单表
  db.exec(`
    CREATE TABLE orders (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      order_no TEXT UNIQUE NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'completed')),
      note TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES profiles(id)
    )
  `);

  // 订单项表
  db.exec(`
    CREATE TABLE order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      ticket_id INTEGER,
      ticket_name TEXT,
      spot_name TEXT,
      price DECIMAL(10, 2) NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    )
  `);

  // 购物车表
  db.exec(`
    CREATE TABLE cart_items (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      ticket_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      UNIQUE(user_id, ticket_id)
    )
  `);

  console.log('✓ 创建表结构');
};

// 生成测试数据
const generateTestData = async () => {
  // 1. 生成用户数据
  const users = [
    { email: 'admin@example.com', password: 'admin123', full_name: '管理员', role: 'admin' },
    { email: 'guide1@example.com', password: 'guide123', full_name: '导游小王', role: 'guide' },
    { email: 'guide2@example.com', password: 'guide123', full_name: '导游小李', role: 'guide' },
    { email: 'user1@example.com', password: 'user123', full_name: '张三', role: 'user' },
    { email: 'user2@example.com', password: 'user123', full_name: '李四', role: 'user' },
    { email: 'user3@example.com', password: 'user123', full_name: '王五', role: 'user' },
    { email: 'user4@example.com', password: 'user123', full_name: '赵六', role: 'user' },
    { email: 'user5@example.com', password: 'user123', full_name: '钱七', role: 'user' },
  ];

  const userStmt = db.prepare(`
    INSERT INTO profiles (email, password_hash, full_name, role, avatar_url)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    userStmt.run(
      user.email,
      hashedPassword,
      user.full_name,
      user.role,
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
    );
  }
  console.log('✓ 生成用户数据');

  // 2. 生成景点数据
  const spots = [
    {
      name: '故宫博物院',
      description: '中国明清两代的皇家宫殿，是世界上现存规模最大、保存最为完整的木质结构古建筑之一。',
      location: '北京市东城区景山前街4号',
      latitude: 39.9163,
      longitude: 116.3972,
      images: [
        'https://images.unsplash.com/photo-1608037521244-f1c6c7635194?w=800',
        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800'
      ]
    },
    {
      name: '长城',
      description: '中国古代的军事防御工程，是一道高大、坚固而连绵不断的长垣，用以限隔敌骑的行动。',
      location: '北京市延庆区八达岭',
      latitude: 40.3598,
      longitude: 116.0200,
      images: [
        'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'
      ]
    },
    {
      name: '西湖',
      description: '杭州西湖，是中国大陆首批国家重点风景名胜区和中国十大风景名胜之一。',
      location: '浙江省杭州市西湖区',
      latitude: 30.2420,
      longitude: 120.1467,
      images: [
        'https://images.unsplash.com/photo-1563462064290-7c2ab4eb39ab?w=800',
        'https://images.unsplash.com/photo-1560453107-9cc2503d0a63?w=800'
      ]
    },
    {
      name: '黄山',
      description: '世界文化与自然双重遗产，世界地质公园，国家AAAAA级旅游景区，国家级风景名胜区。',
      location: '安徽省黄山市黄山区',
      latitude: 30.1371,
      longitude: 118.1719,
      images: [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800'
      ]
    },
    {
      name: '泰山',
      description: '世界文化与自然双重遗产，世界地质公园，全国重点文物保护单位，国家AAAAA级旅游景区。',
      location: '山东省泰安市泰山区',
      latitude: 36.2551,
      longitude: 117.1017,
      images: [
        'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800',
        'https://images.unsplash.com/photo-1596426085963-1a1a6b206793?w=800'
      ]
    }
  ];

  const spotStmt = db.prepare(`
    INSERT INTO spots (name, description, location, latitude, longitude, images)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const spot of spots) {
    spotStmt.run(
      spot.name,
      spot.description,
      spot.location,
      spot.latitude,
      spot.longitude,
      JSON.stringify(spot.images)
    );
  }
  console.log('✓ 生成景点数据');

  // 3. 生成门票数据
  const tickets = [
    // 故宫门票
    { spot_id: 1, name: '成人票', description: '18周岁以上成年人', price: 60, stock: 1000 },
    { spot_id: 1, name: '学生票', description: '全日制大学本科及以下学历学生', price: 20, stock: 500 },
    { spot_id: 1, name: '老人票', description: '60周岁及以上老年人', price: 30, stock: 300 },
    { spot_id: 1, name: '儿童票', description: '6周岁至18周岁未成年人', price: 20, stock: 400 },

    // 长城门票
    { spot_id: 2, name: '成人票', description: '18周岁以上成年人', price: 40, stock: 2000 },
    { spot_id: 2, name: '学生票', description: '全日制大学本科及以下学历学生', price: 20, stock: 1000 },
    { spot_id: 2, name: '缆车往返票', description: '包含缆车上下', price: 140, stock: 800 },

    // 西湖门票
    { spot_id: 3, name: '游船票', description: '西湖游船船票', price: 55, stock: 600 },
    { spot_id: 3, name: '三潭印月岛门票', description: '包含上岛船票', price: 55, stock: 800 },

    // 黄山门票
    { spot_id: 4, name: '旺季门票', description: '3月1日至11月30日', price: 190, stock: 1500 },
    { spot_id: 4, name: '淡季门票', description: '12月1日至次年2月底', price: 150, stock: 1000 },
    { spot_id: 4, name: '索道票', description: '云谷索道单程', price: 80, stock: 2000 },

    // 泰山门票
    { spot_id: 5, name: '旺季门票', description: '3月1日至11月30日', price: 125, stock: 3000 },
    { spot_id: 5, name: '淡季门票', description: '12月1日至次年2月底', price: 100, stock: 2000 },
    { spot_id: 5, name: '旅游专线车票', description: '天外村旅游专线往返', price: 30, stock: 5000 }
  ];

  const ticketStmt = db.prepare(`
    INSERT INTO tickets (spot_id, name, description, price, stock, valid_from, valid_to)
    VALUES (?, ?, ?, ?, ?, date('now'), date('now', '+1 year'))
  `);

  for (const ticket of tickets) {
    ticketStmt.run(
      ticket.spot_id,
      ticket.name,
      ticket.description,
      ticket.price,
      ticket.stock
    );
  }
  console.log('✓ 生成门票数据');

  // 4. 生成活动数据
  const activities = [
    {
      title: '春季摄影之旅',
      description: '专业摄影师带队，捕捉春天最美的瞬间',
      location: '西湖风景区',
      start_time: '2025-04-15 09:00:00',
      end_time: '2025-04-15 17:00:00',
      max_participants: 20,
      price: 299,
      images: [
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'
      ]
    },
    {
      title: '历史文化讲座',
      description: '深入了解故宫600年的历史',
      location: '故宫博物院',
      start_time: '2025-04-20 14:00:00',
      end_time: '2025-04-20 16:00:00',
      max_participants: 50,
      price: 0,
      images: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
      ]
    },
    {
      title: '登山挑战赛',
      description: '挑战自我，征服泰山',
      location: '泰山风景区',
      start_time: '2025-05-01 06:00:00',
      end_time: '2025-05-01 18:00:00',
      max_participants: 100,
      price: 99,
      images: [
        'https://images.unsplash.com/photo-1464822759844-d150baec0494?w=800'
      ]
    },
    {
      title: '美食文化节',
      description: '品尝各地特色美食',
      location: '北京奥林匹克公园',
      start_time: '2025-05-10 10:00:00',
      end_time: '2025-05-12 20:00:00',
      max_participants: 500,
      price: 50,
      images: [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'
      ]
    }
  ];

  const activityStmt = db.prepare(`
    INSERT INTO activities (title, description, location, start_time, end_time, max_participants, price, images)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const activity of activities) {
    activityStmt.run(
      activity.title,
      activity.description,
      activity.location,
      activity.start_time,
      activity.end_time,
      activity.max_participants,
      activity.price,
      JSON.stringify(activity.images)
    );
  }
  console.log('✓ 生成活动数据');

  // 5. 生成酒店数据
  const hotels = [
    {
      name: '北京王府井希尔顿酒店',
      description: '位于北京市中心，王府井商业街附近，交通便利。',
      location: '北京市东城区王府井东街8号',
      address: '北京市东城区王府井东街8号',
      phone: '010-58128888',
      rating: 4.8,
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
      ],
      amenities: ['免费WiFi', '健身房', '游泳池', '商务中心', '停车场']
    },
    {
      name: '杭州西湖国宾馆',
      description: '坐拥西子湖畔，环境优美，设施齐全。',
      location: '浙江省杭州市西湖区杨公堤18号',
      address: '浙江省杭州市西湖区杨公堤18号',
      phone: '0571-87977988',
      rating: 4.9,
      images: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
      ],
      amenities: ['免费WiFi', '湖景房', '餐厅', '会议室', 'SPA']
    },
    {
      name: '黄山温泉度假酒店',
      description: '集温泉、住宿、餐饮于一体的度假酒店。',
      location: '安徽省黄山市黄山区汤口镇',
      address: '安徽省黄山市黄山区汤口镇寨西村',
      phone: '0559-5588888',
      rating: 4.5,
      images: [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
      ],
      amenities: ['温泉', '免费WiFi', '健身房', '餐厅', '接送服务']
    }
  ];

  const hotelStmt = db.prepare(`
    INSERT INTO hotels (name, description, location, address, phone, rating, images, amenities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const hotel of hotels) {
    hotelStmt.run(
      hotel.name,
      hotel.description,
      hotel.location,
      hotel.address,
      hotel.phone,
      hotel.rating,
      JSON.stringify(hotel.images),
      JSON.stringify(hotel.amenities)
    );
  }
  console.log('✓ 生成酒店数据');

  // 6. 生成酒店房间数据
  const rooms = [
    // 北京王府井希尔顿酒店
    { hotel_id: 1, name: '豪华大床房', type: 'double', max_occupancy: 2, price: 1288 },
    { hotel_id: 1, name: '行政套房', type: 'suite', max_occupancy: 3, price: 2588 },
    { hotel_id: 1, name: '标准双床房', type: 'double', max_occupancy: 2, price: 988 },

    // 杭州西湖国宾馆
    { hotel_id: 2, name: '湖景豪华房', type: 'double', max_occupancy: 2, price: 1688 },
    { hotel_id: 2, name: '园景套房', type: 'suite', max_occupancy: 4, price: 3288 },
    { hotel_id: 2, name: '标准大床房', type: 'single', max_occupancy: 2, price: 1088 },

    // 黄山温泉度假酒店
    { hotel_id: 3, name: '温泉大床房', type: 'double', max_occupancy: 2, price: 888 },
    { hotel_id: 3, name: '家庭套房', type: 'suite', max_occupancy: 4, price: 1688 },
    { hotel_id: 3, name: '标准双床房', type: 'double', max_occupancy: 2, price: 688 }
  ];

  const roomStmt = db.prepare(`
    INSERT INTO hotel_rooms (hotel_id, name, type, max_occupancy, price_per_night)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const room of rooms) {
    roomStmt.run(
      room.hotel_id,
      room.name,
      room.type,
      room.max_occupancy,
      room.price
    );
  }
  console.log('✓ 生成酒店房间数据');

  // 7. 生成活动参与者数据 - 跳过，可以在应用运行时动态添加
  console.log('✓ 跳过生成活动参与者数据（可在运行时动态添加）');

  console.log('\n✅ 数据库初始化完成！');
  console.log('\n测试账号信息：');
  console.log('管理员账号：admin@example.com / admin123');
  console.log('导游账号1：guide1@example.com / guide123');
  console.log('导游账号2：guide2@example.com / guide123');
  console.log('用户账号1：user1@example.com / user123');
  console.log('用户账号2：user2@example.com / user123');
  console.log('用户账号3：user3@example.com / user123');
};

// 执行初始化
const init = async () => {
  try {
    createTables();
    await generateTestData();
  } catch (error) {
    console.error('初始化数据库失败：', error);
    process.exit(1);
  } finally {
    db.close();
  }
};

// 运行初始化
init();
