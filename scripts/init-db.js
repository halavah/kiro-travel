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

// 将数据定义移到这里，以便后续函数可以访问
let tickets = [];
let spots = [];

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
  spots = [
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

  for (let i = 0; i < spots.length; i++) {
    const result = spotStmt.run(
      spots[i].name,
      spots[i].description,
      spots[i].location,
      spots[i].latitude,
      spots[i].longitude,
      JSON.stringify(spots[i].images)
    );
    // 添加数据库生成的ID到spot对象
    spots[i].id = result.lastInsertRowid;
  }
  console.log('✓ 生成景点数据');

  // 3. 生成门票数据
  tickets = [
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

  for (let i = 0; i < tickets.length; i++) {
    const result = ticketStmt.run(
      tickets[i].spot_id,
      tickets[i].name,
      tickets[i].description,
      tickets[i].price,
      tickets[i].stock
    );
    // 添加数据库生成的ID到ticket对象
    tickets[i].id = result.lastInsertRowid;
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
};

// 8. 生成测试订单数据
const generateOrderData = () => {
  const orderStmt = db.prepare(`
    INSERT INTO orders (id, user_id, order_no, total_amount, status, note, paid_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const orderItemStmt = db.prepare(`
    INSERT INTO order_items (id, order_id, ticket_id, ticket_name, spot_name, price, quantity)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // 生成一些测试订单
  const orders = [
    {
      user_id: 4, // 张三
      items: [
        { ticket_id: 1, quantity: 2 }, // 故宫成人票 x2
        { ticket_id: 5, quantity: 1 }, // 长城成人票 x1
      ],
      status: 'paid',
      note: '访问日期: 2025-01-15, 访问时间: 09:00, 联系人: 张三, 电话: 13800138001'
    },
    {
      user_id: 5, // 李四
      items: [
        { ticket_id: 7, quantity: 1 }, // 黄山旺季门票 x1
        { ticket_id: 9, quantity: 1 }, // 黄山索道票 x1
      ],
      status: 'pending'
    },
    {
      user_id: 6, // 王五
      items: [
        { ticket_id: 10, quantity: 3 }, // 泰山旺季门票 x3
      ],
      status: 'completed',
      paid_at: '2025-01-10 14:30:00'
    },
    {
      user_id: 7, // 赵六
      items: [
        { ticket_id: 2, quantity: 1 }, // 故宫学生票 x1
        { ticket_id: 6, quantity: 2 }, // 长城缆车往返票 x2
      ],
      status: 'cancelled'
    },
    {
      user_id: 8, // 钱七
      items: [
        { ticket_id: 3, quantity: 1 }, // 故宫老人票 x1
        { ticket_id: 4, quantity: 1 }, // 故宫儿童票 x1
      ],
      status: 'pending',
      note: '访问日期: 2025-02-01, 访问时间: 10:00, 联系人: 钱七, 电话: 13800138007, 备注: 带老人和小孩'
    }
  ];

  // 生成订单号函数
  const generateOrderNo = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `ORD${dateStr}${timeStr}${random}`;
  };

  orders.forEach((order, index) => {
    const orderId = `order_${index + 1}`;
    const orderNo = generateOrderNo();

    // 计算总金额
    let totalAmount = 0;
    order.items.forEach(item => {
      const ticket = tickets.find(t => t.id === item.ticket_id);
      if (ticket) {
        totalAmount += ticket.price * item.quantity;
      }
    });

    // 创建订单
    orderStmt.run(
      orderId,
      order.user_id,
      orderNo,
      totalAmount,
      order.status,
      order.note || null,
      order.paid_at || null,
      new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // 随机过去30天内的时间
    );

    // 创建订单项
    order.items.forEach((item, itemIndex) => {
      const ticket = tickets.find(t => t.id === item.ticket_id);

      if (!ticket) {
        console.log(`Warning: Skip order item - ticket_id: ${item.ticket_id} not found`);
        return;
      }

      const spot = spots.find(s => s.id === ticket.spot_id);
      if (!spot) {
        console.log(`Warning: Skip order item - spot_id: ${ticket.spot_id} not found`);
        return;
      }

      orderItemStmt.run(
        `order_item_${index + 1}_${itemIndex + 1}`,
        orderId,
        item.ticket_id,
        ticket.name,
        spot.name,
        ticket.price,
        item.quantity
      );
    });
  });
  console.log('✓ 生成测试订单数据');
};

// 9. 生成购物车数据
const generateCartData = () => {
  const cartStmt = db.prepare(`
    INSERT INTO cart_items (id, user_id, ticket_id, quantity)
    VALUES (?, ?, ?, ?)
  `);

  // 为一些用户添加购物车商品
  const cartItems = [
    { user_id: 4, ticket_id: 8, quantity: 1 }, // 张三 - 西湖游船票
    { user_id: 5, ticket_id: 11, quantity: 2 }, // 李四 - 泰山淡季门票 x2
    { user_id: 6, ticket_id: 13, quantity: 1 }, // 王五 - 泰山旅游专线车票
    { user_id: 7, ticket_id: 3, quantity: 1 }, // 赵六 - 故宫老人票
  ];

  cartItems.forEach((item, index) => {
    cartStmt.run(
      `cart_item_${index + 1}`,
      item.user_id,
      item.ticket_id,
      item.quantity
    );
  });
  console.log('✓ 生成购物车数据');
};

// 10. 添加更多景点和酒店数据（供管理）
const addMoreData = () => {
  // 添加更多景点
  const moreSpots = [
    {
      name: '张家界国家森林公园',
      description: '中国第一个国家森林公园，以峰称奇、以谷显幽、以林见秀。',
      location: '湖南省张家界市武陵源区',
      latitude: 29.3170,
      longitude: 110.4793,
      images: [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800'
      ]
    },
    {
      name: '九寨沟',
      description: '世界自然遗产、国家重点风景名胜区、国家AAAAA级旅游景区。',
      location: '四川省阿坝藏族羌族自治州九寨沟县',
      latitude: 33.2599,
      longitude: 103.9240,
      images: [
        'https://images.unsplash.com/photo-1594989844338-e8a5446286f2?w=800'
      ]
    },
    {
      name: '桂林山水',
      description: '桂林山水甲天下，典型的喀斯特地形造就了甲天下的桂林山水。',
      location: '广西壮族自治区桂林市',
      latitude: 25.2744,
      longitude: 110.2992,
      images: [
        'https://images.unsplash.com/photo-1505219910884-28e2d00546b1?w=800'
      ]
    }
  ];

  const moreSpotStmt = db.prepare(`
    INSERT INTO spots (name, description, location, latitude, longitude, images, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  moreSpots.forEach((spot, index) => {
    moreSpotStmt.run(
      spot.name,
      spot.description,
      spot.location,
      spot.latitude,
      spot.longitude,
      JSON.stringify(spot.images),
      Math.random() > 0.2 ? 'active' : 'inactive' // 随机设置状态
    );
  });

  // 添加更多酒店
  const moreHotels = [
    {
      name: '张家界武陵源宾馆',
      description: '位于武陵源核心景区内，环境优美。',
      location: '湖南省张家界市武陵源区',
      address: '湖南省张家界市武陵源区军地路',
      phone: '0744-5618888',
      rating: 4.2,
      status: 'active'
    },
    {
      name: '九寨沟喜来登大酒店',
      description: '国际五星级酒店，设施完善。',
      location: '四川省阿坝州九寨沟县',
      address: '四川省阿坝州九寨沟县漳扎镇',
      phone: '0837-7739988',
      rating: 4.6,
      status: 'inactive' // 设置为非活跃，供管理测试
    },
    {
      name: '桂林香格里拉大酒店',
      description: '豪华五星级酒店，服务一流。',
      location: '广西壮族自治区桂林市',
      address: '广西壮族自治区桂林市环城南二路111号',
      phone: '0773-2699999',
      rating: 4.7,
      status: 'active'
    }
  ];

  const moreHotelStmt = db.prepare(`
    INSERT INTO hotels (name, description, location, address, phone, rating, status, images, amenities)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  moreHotels.forEach(hotel => {
    moreHotelStmt.run(
      hotel.name,
      hotel.description,
      hotel.location,
      hotel.address,
      hotel.phone,
      hotel.rating,
      hotel.status,
      JSON.stringify(['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800']),
      JSON.stringify(['免费WiFi', '空调', '电视', '热水'])
    );
  });

  console.log('✓ 添加更多景点和酒店数据');
};

// 执行初始化
const init = async () => {
  try {
    createTables();
    await generateTestData();

    // 在生成基础数据后，生成额外的测试数据
    generateOrderData();
    generateCartData();
    addMoreData();

    console.log('\n✅ 数据库初始化完成！');
    console.log('\n测试账号信息：');
    console.log('管理员账号：admin@example.com / admin123');
    console.log('导游账号1：guide1@example.com / guide123');
    console.log('导游账号2：guide2@example.com / guide123');
    console.log('用户账号1：user1@example.com / user123');
    console.log('用户账号2：user2@example.com / user123');
    console.log('用户账号3：user3@example.com / user123');
    console.log('\n生成的测试数据：');
    console.log('- 景点：8个（包含不同状态的景点）');
    console.log('- 门票：17种');
    console.log('- 酒店：6家（包含活跃/非活跃状态）');
    console.log('- 房间：9种');
    console.log('- 订单：5个（包含不同状态）');
    console.log('- 购物车：4个商品');
    console.log('- 活动：4个');
  } catch (error) {
    console.error('初始化数据库失败：', error);
    process.exit(1);
  } finally {
    db.close();
  }
};

// 运行初始化
init();