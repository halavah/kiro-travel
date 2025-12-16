const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// 数据库文件路径
// 支持 Render 部署：优先使用环境变量 DATABASE_PATH
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'database.sqlite');
console.log('📁 数据库路径:', dbPath);

// 安全检查：生产环境不自动删除数据库
const isProduction = process.env.NODE_ENV === 'production';
const forceReset = process.env.FORCE_DB_RESET === 'true';

// 删除旧数据库文件（仅在开发环境或明确要求时）
if (fs.existsSync(dbPath)) {
  if (isProduction && !forceReset) {
    console.log('⚠️  生产环境已存在数据库，跳过删除（如需重置请设置 FORCE_DB_RESET=true）');
    console.log('⚠️  数据库初始化中止，请确认是否需要重置数据库');
    process.exit(0);
  } else {
    fs.unlinkSync(dbPath);
    console.log('✓ 删除旧数据库文件');
  }
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
      category_id INTEGER,
      price DECIMAL(10, 2) DEFAULT 0,
      rating DECIMAL(2, 1) DEFAULT 5.0,
      is_recommended BOOLEAN DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES spot_categories(id)
    )
  `);

  // 景点分类表
  db.exec(`
    CREATE TABLE spot_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      color TEXT DEFAULT '#3B82F6',
      sort_order INTEGER DEFAULT 0,
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
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
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

  // 酒店预订表
  db.exec(`
    CREATE TABLE hotel_bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      hotel_name TEXT NOT NULL,
      room_name TEXT NOT NULL,
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      guests INTEGER NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES hotel_rooms(id) ON DELETE CASCADE
    )
  `);

  // 新闻分类表
  db.exec(`
    CREATE TABLE news_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 新闻表
  db.exec(`
    CREATE TABLE news (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT,
      cover_image TEXT,
      category_id INTEGER,
      author_id INTEGER,
      view_count INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 0,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE SET NULL,
      FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL
    )
  `);

  // 景点评论表
  db.exec(`
    CREATE TABLE spot_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spot_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `);

  // 景点点赞表
  db.exec(`
    CREATE TABLE spot_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spot_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      UNIQUE(spot_id, user_id)
    )
  `);

  // 景点收藏表
  db.exec(`
    CREATE TABLE spot_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spot_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
      UNIQUE(spot_id, user_id)
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

  // 2. 生成分类数据
  const categories = [
    { name: '历史文化', description: '历史古迹、文化景点', icon: '🏛️', color: '#DC2626', sort_order: 1 },
    { name: '自然风光', description: '自然景观、风景名胜', icon: '🏔️', color: '#059669', sort_order: 2 },
    { name: '主题公园', description: '游乐园、主题园区', icon: '🎢', color: '#7C3AED', sort_order: 3 },
    { name: '现代建筑', description: '现代都市景观、建筑', icon: '🏙️', color: '#2563EB', sort_order: 4 },
    { name: '休闲度假', description: '度假村、温泉、海滩', icon: '🏖️', color: '#EA580C', sort_order: 5 }
  ];

  const categoryStmt = db.prepare(`
    INSERT INTO spot_categories (name, description, icon, color, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const category of categories) {
    categoryStmt.run(category.name, category.description, category.icon, category.color, category.sort_order);
  }
  console.log('✓ 生成分类数据');

  // 3. 生成景点数据
  spots = [
    {
      name: '故宫博物院',
      description: '中国明清两代的皇家宫殿，是世界上现存规模最大、保存最为完整的木质结构古建筑之一。',
      location: '北京市东城区景山前街4号',
      latitude: 39.9163,
      longitude: 116.3972,
      images: [
        '/assets/images/spots/gugong.jpg'
      ]
    },
    {
      name: '长城',
      description: '中国古代的军事防御工程，是一道高大、坚固而连绵不断的长垣，用以限隔敌骑的行动。',
      location: '北京市延庆区八达岭',
      latitude: 40.3598,
      longitude: 116.0200,
      images: [
        '/assets/images/spots/changcheng.jpg'
      ]
    },
    {
      name: '西湖',
      description: '杭州西湖，是中国大陆首批国家重点风景名胜区和中国十大风景名胜之一。',
      location: '浙江省杭州市西湖区',
      latitude: 30.2420,
      longitude: 120.1467,
      images: [
        '/assets/images/spots/xihu.jpg'
      ]
    },
    {
      name: '黄山',
      description: '世界文化与自然双重遗产，世界地质公园，国家AAAAA级旅游景区，国家级风景名胜区。',
      location: '安徽省黄山市黄山区',
      latitude: 30.1371,
      longitude: 118.1719,
      images: [
        '/assets/images/spots/huangshan.jpg'
      ]
    },
    {
      name: '九寨沟',
      description: '世界自然遗产，国家AAAAA级旅游景区，以多彩的湖泊、瀑布和雪山闻名。',
      location: '四川省阿坝州九寨沟县',
      latitude: 33.2600,
      longitude: 103.9170,
      images: [
        '/assets/images/spots/jiuzhaigou.jpg'
      ]
    },
    {
      name: '桂林山水',
      description: '桂林山水甲天下，以喀斯特地貌和漓江风光著称。',
      location: '广西壮族自治区桂林市',
      latitude: 25.2740,
      longitude: 110.2900,
      images: [
        '/assets/images/spots/guilin.jpg'
      ]
    },
    {
      name: '丽江古城',
      description: '世界文化遗产，纳西族古城，保存完好的少数民族古城。',
      location: '云南省丽江市古城区',
      latitude: 26.8550,
      longitude: 100.2270,
      images: [
        '/assets/images/spots/lijiang.jpg'
      ]
    },
    {
      name: '上海外滩',
      description: '上海的标志性景点，黄浦江畔的万国建筑博览群。',
      location: '上海市黄浦区中山东一路',
      latitude: 31.2400,
      longitude: 121.4900,
      images: [
        '/assets/images/spots/shanghai.jpg'
      ]
    }
  ];

  const spotStmt = db.prepare(`
    INSERT INTO spots (name, description, location, latitude, longitude, images, category_id, price, rating, is_recommended, view_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (let i = 0; i < spots.length; i++) {
    const result = spotStmt.run(
      spots[i].name,
      spots[i].description,
      spots[i].location,
      spots[i].latitude,
      spots[i].longitude,
      JSON.stringify(spots[i].images),
      spots[i].category_id || (i % 5) + 1, // 循环分配分类
      spots[i].price || Math.floor(Math.random() * 200) + 20, // 随机价格
      spots[i].rating || (Math.random() * 1 + 4).toFixed(1), // 4.0-5.0的随机评分
      spots[i].is_recommended !== undefined ? spots[i].is_recommended : (i < 6 ? 1 : 0), // 前6个设为推荐
      spots[i].view_count || Math.floor(Math.random() * 100000) + 10000 // 随机浏览量
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
    { spot_id: 2, name: '缆车往返票', description: '包含缆车上���', price: 140, stock: 800 },

    // 西湖门票
    { spot_id: 3, name: '游��票', description: '西湖游船船票', price: 55, stock: 600 },
    { spot_id: 3, name: '三潭印月岛门票', description: '包含上岛船票', price: 55, stock: 800 },

    // 黄山门票
    { spot_id: 4, name: '旺季门票', description: '3月1日至11月30日', price: 190, stock: 1500 },
    { spot_id: 4, name: '淡季门票', description: '12月1日至次年2月底', price: 150, stock: 1000 },
    { spot_id: 4, name: '索道票', description: '云谷索道单程', price: 80, stock: 2000 },

    // 九寨沟门票
    { spot_id: 5, name: '旺季门票', description: '4月1日至11月15日', price: 169, stock: 2000 },
    { spot_id: 5, name: '淡季门票', description: '11月16日至次年3月31日', price: 80, stock: 1500 },

    // 桂林山水门票
    { spot_id: 6, name: '漓江竹筏票', description: '漓江精华段竹筏游', price: 118, stock: 800 },
    { spot_id: 6, name: '两江四湖夜游', description: '桂林市区水上游览', price: 220, stock: 500 },

    // 丽江古城门票
    { spot_id: 7, name: '古城维护费', description: '丽江古城维护费', price: 50, stock: 10000 },

    // 上海外滩门票
    { spot_id: 8, name: '东方明珠观光票', description: '含观光层+全透明观光廊', price: 180, stock: 3000 },
    { spot_id: 8, name: '黄浦江游船票', description: '游船观赏外滩夜景', price: 100, stock: 1000 }
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
        '/assets/images/activities/photography.jpg'
      ]
    },
    {
      title: '登山挑战赛',
      description: '挑战自我，征服高峰',
      location: '��山风景区',
      start_time: '2025-05-01 06:00:00',
      end_time: '2025-05-01 18:00:00',
      max_participants: 100,
      price: 99,
      images: [
        '/assets/images/activities/mountain.jpg'
      ]
    },
    {
      title: '户外野营体验',
      description: '亲近自然，体验野外露营的乐趣',
      location: '九寨沟景区',
      start_time: '2025-06-10 14:00:00',
      end_time: '2025-06-11 10:00:00',
      max_participants: 30,
      price: 388,
      images: [
        '/assets/images/activities/camping.jpg'
      ]
    },
    {
      title: '徒步探险之旅',
      description: '专业向导带队，探索自然秘境',
      location: '桂林山水',
      start_time: '2025-07-20 08:00:00',
      end_time: '2025-07-20 17:00:00',
      max_participants: 25,
      price: 199,
      images: [
        '/assets/images/activities/hiking.jpg'
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
        '/assets/images/hotels/hotel1.jpg'
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
        '/assets/images/hotels/hotel2.jpg'
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
        '/assets/images/hotels/hotel3.jpg'
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
      note: '访问日期: 2025-12-20, 访问时间: 09:00, 联系人: 张三, 电话: 13800138001',
      paid_at: '2025-12-12 10:20:00',
      created_at: '2025-12-11 15:30:00'
    },
    {
      user_id: 5, // 李四
      items: [
        { ticket_id: 10, quantity: 1 }, // 黄山旺季门票 x1
        { ticket_id: 12, quantity: 1 }, // 黄山索道票 x1
      ],
      status: 'completed',
      paid_at: '2025-12-10 14:30:00',
      created_at: '2025-12-09 11:20:00'
    },
    {
      user_id: 6, // 王五
      items: [
        { ticket_id: 13, quantity: 3 }, // 九寨沟旺季门票 x3
      ],
      status: 'completed',
      paid_at: '2025-12-08 14:30:00',
      created_at: '2025-12-08 09:15:00'
    },
    {
      user_id: 7, // 赵六
      items: [
        { ticket_id: 2, quantity: 1 }, // 故宫学生票 x1
        { ticket_id: 7, quantity: 2 }, // 长城缆车往返票 x2
      ],
      status: 'paid',
      paid_at: '2025-12-13 16:45:00',
      created_at: '2025-12-13 10:30:00'
    },
    {
      user_id: 8, // 钱七
      items: [
        { ticket_id: 3, quantity: 1 }, // 故宫老人票 x1
        { ticket_id: 4, quantity: 1 }, // 故宫儿童票 x1
      ],
      status: 'completed',
      note: '访问日期: 2025-12-25, 访问时间: 10:00, 联系人: 钱七, 电话: 13800138007, 备注: 带老人和小孩',
      paid_at: '2025-12-06 13:25:00',
      created_at: '2025-12-06 10:00:00'
    },
    // 添加更多订单以填充analytics数据
    {
      user_id: 4,
      items: [
        { ticket_id: 13, quantity: 2 }, // 九寨沟旺季门票 x2
        { ticket_id: 14, quantity: 2 }, // 九寨沟观光车票 x2
      ],
      status: 'paid',
      paid_at: '2025-12-05 09:30:00',
      created_at: '2025-12-04 14:20:00'
    },
    {
      user_id: 5,
      items: [
        { ticket_id: 1, quantity: 3 }, // 故宫成人票 x3
      ],
      status: 'completed',
      paid_at: '2025-12-03 11:15:00',
      created_at: '2025-12-02 16:40:00'
    },
    {
      user_id: 6,
      items: [
        { ticket_id: 5, quantity: 2 }, // 长城成人票 x2
        { ticket_id: 6, quantity: 2 }, // 长城学生票 x2
      ],
      status: 'paid',
      paid_at: '2025-12-07 10:05:00',
      created_at: '2025-12-07 13:25:00'
    },
    {
      user_id: 7,
      items: [
        { ticket_id: 10, quantity: 1 }, // 黄山旺季门票 x1
      ],
      status: 'completed',
      paid_at: '2025-11-30 14:30:00',
      created_at: '2025-11-29 09:10:00'
    },
    {
      user_id: 8,
      items: [
        { ticket_id: 1, quantity: 1 }, // 故宫成人票 x1
        { ticket_id: 2, quantity: 2 }, // 故宫学生票 x2
      ],
      status: 'paid',
      paid_at: '2025-12-01 15:45:00',
      created_at: '2025-11-30 11:30:00'
    },
    {
      user_id: 4,
      items: [
        { ticket_id: 13, quantity: 1 }, // 九寨沟旺季门票 x1
      ],
      status: 'completed',
      paid_at: '2025-12-10 10:20:00',
      created_at: '2025-12-09 08:15:00'
    },
    {
      user_id: 5,
      items: [
        { ticket_id: 5, quantity: 4 }, // 长城成人票 x4
      ],
      status: 'paid',
      paid_at: '2025-12-12 13:55:00',
      created_at: '2025-12-11 17:20:00'
    },
    {
      user_id: 6,
      items: [
        { ticket_id: 10, quantity: 2 }, // 黄山旺季门票 x2
        { ticket_id: 12, quantity: 2 }, // 黄山索道票 x2
      ],
      status: 'completed',
      paid_at: '2025-12-08 09:40:00',
      created_at: '2025-12-07 14:50:00'
    },
    {
      user_id: 7,
      items: [
        { ticket_id: 1, quantity: 2 }, // 故宫成人票 x2
      ],
      status: 'pending',
      created_at: '2025-12-14 10:30:00'
    },
    {
      user_id: 8,
      items: [
        { ticket_id: 13, quantity: 3 }, // 九寨沟旺季门票 x3
      ],
      status: 'cancelled',
      created_at: '2025-12-13 16:20:00'
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
      order.created_at || new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // 使用自定义时间或随机过去30天内的时间
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

  // 10. 生成酒店预订测试数据
  const hotelBookingStmt = db.prepare(`
    INSERT INTO hotel_bookings (user_id, room_id, hotel_name, room_name, check_in, check_out, guests, total_price, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const hotelBookings = [
    {
      user_id: 4, // 张三
      room_id: 1, // 北京王府井希尔顿 - 豪华大床房
      hotel_name: '北京王府井希尔顿酒店',
      room_name: '豪华大床房',
      check_in: '2025-12-25',
      check_out: '2025-12-27',
      guests: 2,
      total_price: 2576, // 1288 * 2晚
      status: 'confirmed',
      created_at: '2025-12-10 14:30:00'
    },
    {
      user_id: 5, // 李四
      room_id: 4, // 杭州西湖国宾馆 - 湖景豪华房
      hotel_name: '杭州西湖国宾馆',
      room_name: '湖景豪华房',
      check_in: '2025-12-28',
      check_out: '2025-12-30',
      guests: 2,
      total_price: 3376, // 1688 * 2晚
      status: 'confirmed',
      created_at: '2025-12-11 09:15:00'
    },
    {
      user_id: 6, // 王五
      room_id: 8, // 黄山温泉度假酒店 - 家庭套房
      hotel_name: '黄山温泉度假酒店',
      room_name: '家庭套房',
      check_in: '2025-12-20',
      check_out: '2025-12-23',
      guests: 4,
      total_price: 5064, // 1688 * 3晚
      status: 'completed',
      created_at: '2025-12-05 16:20:00'
    },
    {
      user_id: 7, // 赵六
      room_id: 2, // 北京王府井希尔顿 - 行政套房
      hotel_name: '北京王府井希尔顿酒店',
      room_name: '行政套房',
      check_in: '2025-12-22',
      check_out: '2025-12-24',
      guests: 3,
      total_price: 5176, // 2588 * 2晚
      status: 'pending',
      created_at: '2025-12-14 11:45:00'
    },
    {
      user_id: 8, // 钱七
      room_id: 6, // 杭州西湖国宾馆 - 标准大床房
      hotel_name: '杭州西湖国宾馆',
      room_name: '标准大床房',
      check_in: '2025-12-18',
      check_out: '2025-12-19',
      guests: 2,
      total_price: 1088, // 1088 * 1晚
      status: 'cancelled',
      created_at: '2025-12-12 10:30:00'
    },
    {
      user_id: 4, // 张三
      room_id: 7, // 黄山温泉度假酒店 - 温泉大床房
      hotel_name: '黄山温泉度假酒店',
      room_name: '温泉大床房',
      check_in: '2026-01-05',
      check_out: '2026-01-08',
      guests: 2,
      total_price: 2664, // 888 * 3晚
      status: 'confirmed',
      created_at: '2025-12-13 15:20:00'
    }
  ];

  hotelBookings.forEach(booking => {
    hotelBookingStmt.run(
      booking.user_id,
      booking.room_id,
      booking.hotel_name,
      booking.room_name,
      booking.check_in,
      booking.check_out,
      booking.guests,
      booking.total_price,
      booking.status,
      booking.created_at
    );
  });
  console.log('✓ 生成酒店预订数据');

  // 11. 生成活动报名测试数据
  const activityParticipantStmt = db.prepare(`
    INSERT INTO activity_participants (activity_id, user_id, status, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const activityParticipants = [
    // 春季摄影之旅 (activity_id: 1)
    { activity_id: 1, user_id: 4, status: 'registered', created_at: '2025-12-08 10:30:00' },
    { activity_id: 1, user_id: 5, status: 'registered', created_at: '2025-12-09 14:20:00' },
    { activity_id: 1, user_id: 6, status: 'registered', created_at: '2025-12-10 09:15:00' },
    { activity_id: 1, user_id: 7, status: 'registered', created_at: '2025-12-11 16:45:00' },
    { activity_id: 1, user_id: 8, status: 'cancelled', created_at: '2025-12-07 11:20:00' },

    // 登山挑战赛 (activity_id: 2)
    { activity_id: 2, user_id: 4, status: 'registered', created_at: '2025-12-05 13:30:00' },
    { activity_id: 2, user_id: 6, status: 'registered', created_at: '2025-12-06 10:40:00' },
    { activity_id: 2, user_id: 8, status: 'registered', created_at: '2025-12-07 15:55:00' },

    // 户外野营体验 (activity_id: 3)
    { activity_id: 3, user_id: 5, status: 'registered', created_at: '2025-12-09 11:10:00' },
    { activity_id: 3, user_id: 7, status: 'registered', created_at: '2025-12-10 14:25:00' },
    { activity_id: 3, user_id: 4, status: 'registered', created_at: '2025-12-11 09:30:00' },
    { activity_id: 3, user_id: 6, status: 'cancelled', created_at: '2025-12-08 16:40:00' },

    // 徒步探险之旅 (activity_id: 4)
    { activity_id: 4, user_id: 8, status: 'registered', created_at: '2025-12-12 10:15:00' },
    { activity_id: 4, user_id: 5, status: 'registered', created_at: '2025-12-13 13:45:00' },
    { activity_id: 4, user_id: 7, status: 'registered', created_at: '2025-12-14 11:20:00' }
  ];

  activityParticipants.forEach(participant => {
    activityParticipantStmt.run(
      participant.activity_id,
      participant.user_id,
      participant.status,
      participant.created_at
    );
  });
  console.log('✓ 生成活动报名数据');

  // 12. 生成新闻分类数据
  const newsCategories = [
    { name: '旅游资讯', description: '最新旅游行业动态和资讯', sort_order: 1 },
    { name: '景点推荐', description: '精选景点推荐和游记分享', sort_order: 2 },
    { name: '旅游攻略', description: '实用旅游攻略和出行指南', sort_order: 3 },
    { name: '特色美食', description: '各地特色美食推荐', sort_order: 4 },
    { name: '酒店住宿', description: '酒店住宿体验和推荐', sort_order: 5 }
  ];

  const newsCategoryStmt = db.prepare(`
    INSERT INTO news_categories (name, description, sort_order)
    VALUES (?, ?, ?)
  `);

  newsCategories.forEach(category => {
    newsCategoryStmt.run(category.name, category.description, category.sort_order);
  });
  console.log('✓ 生成新闻分类数据');

  // 11. 生成新闻数据
  const baseTimestamp = Date.now();
  const newsData = [
    {
      id: `news_${baseTimestamp}_1`,
      title: '2024春节旅游高峰即将到来，热门景点提前预订',
      summary: '春节假期临近，全国各大旅游景点迎来预订高峰。建议游客提前规划行程，预订门票和住宿。',
      content: `<p>随着2024年春节假期的临近，全国各大旅游景点即将迎来客流高峰。据统计，今年春节期间，预计有超过3亿人次选择出游。</p>
<p>故宫博物院、长城、西湖等热门景点的门票预订量已超过往年同期。为确保游览体验，建议游客提前做好行程规划，通过官方渠道预订门票。</p>
<p>此外，各大酒店和民宿的预订也进入旺季。热门旅游城市如北京、杭州、西安的住宿价格有所上涨，建议游客尽早预订。</p>`,
      cover_image: '/assets/images/spots/gugong.jpg',
      category_id: 1,
      author_id: 1,
      view_count: 1250,
      is_published: 1,
      published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `news_${baseTimestamp}_2`,
      title: '九寨沟春季限时开放，错过再等一年',
      summary: '九寨沟景区宣布春季限时开放政策，每日限流8000人。游客需提前在线预约购票。',
      content: `<p>四川九寨沟景区管理局宣布，今年春季将实施限时开放政策，以更好地保护生态环境。</p>
<p>开放时间为3月1日至5月31日，每日限流8000人。游客必须提前通过官方网站或小程序预约购票，现场不售票。</p>
<p>九寨沟以其独特的高原湖泊和彩林景观闻名，春季时节，冰雪消融，瀑布水量充沛，是最佳游览季节之一。</p>`,
      cover_image: '/assets/images/spots/jiuzhaigou.jpg',
      category_id: 2,
      author_id: 1,
      view_count: 2100,
      is_published: 1,
      published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `news_${baseTimestamp}_3`,
      title: '西湖游船推出夜游项目，体验不一样的江南水乡',
      summary: '杭州西湖风景区推出全新夜游项目，游客可乘坐画舫欣赏西湖夜景，感受江南水乡的独特魅力。',
      content: `<p>为了丰富游客的游览体验，杭州西湖风景区近日推出了全新的夜游项目。</p>
<p>游客可以乘坐传统画舫，在夜幕下游览西湖，欣赏灯光映衬下的断桥、雷峰塔等景点。项目每晚7点至9点运营，票价55元/人。</p>
<p>据景区负责人介绍，夜游项目采用了环保灯光设计，既能展现西湖夜景之美，又不会对生态环境造成影响。</p>`,
      cover_image: '/assets/images/spots/xihu.jpg',
      category_id: 2,
      author_id: 1,
      view_count: 1580,
      is_published: 1,
      published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `news_${baseTimestamp}_4`,
      title: '黄山云海奇观再现，摄影爱好者纷纷前往',
      summary: '近日黄山出现壮观云海景象，吸引众多摄影爱好者和游客前往观赏。气象部门预测未来一周仍有机会看到云海。',
      content: `<p>受冷空气影响，黄山风景区近日出现了壮观的云海景象。云雾在山峰间翻涌，如梦如幻，美不胜收。</p>
<p>据黄山气象站工作人员介绍，这次云海形成条件极佳，能见度高，是近年来难得一见的奇观。许多摄影爱好者早早上山占据有利位置，记录下这一美景。</p>
<p>气象部门预测，未来一周黄山仍有机会出现云海景观，建议有兴趣的游客密切关注天气预报，选择合适的时间前往。</p>`,
      cover_image: '/assets/images/spots/huangshan.jpg',
      category_id: 1,
      author_id: 1,
      view_count: 1890,
      is_published: 1,
      published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `news_${baseTimestamp}_5`,
      title: '桂林漓江竹筏游全新升级，增设讲解服务',
      summary: '桂林漓江景区对竹筏游项目进行升级改造，增加了专业讲解服务和安全设施，提升游客体验。',
      content: `<p>桂林漓江风景区近期完成了竹筏游项目的升级改造，为游客提供更优质的服务体验。</p>
<p>新的竹筏配备了舒适的座椅和遮阳设施，并增设了专业讲解员，为游客详细介绍沿途的自然景观和人文历史。</p>
<p>此外，景区还加强了安全管理，所有竹筏都配备了救生设备，确保游客的安全。升级后的竹筏游票价保持不变，仍为118元/人。</p>`,
      cover_image: '/assets/images/spots/guilin.jpg',
      category_id: 2,
      author_id: 1,
      view_count: 1320,
      is_published: 1,
      published_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `news_${baseTimestamp}_6`,
      title: '丽江古城推出"慢游"路线，深度体验纳西文化',
      summary: '丽江古��推出全新的"慢游"主题路线，让游客放慢脚步，深度体验纳西族的传统文化和生活方式。',
      content: `<p>为了让游客更好地感受丽江古城的文化底蕴，景区推出了"慢游丽江"主题路线。</p>
<p>该路线避开了热门的商业街区，带领游客走进古城的深巷小院，参观纳西族传统民居，学习东巴文字，体验手工艺制作。</p>
<p>路线全程约3小时，配有专业导游讲解。游客还可以在当地居民家中品尝正宗的纳西美食，感受最地道的丽江生活。</p>`,
      cover_image: '/assets/images/spots/lijiang.jpg',
      category_id: 3,
      author_id: 1,
      view_count: 980,
      is_published: 1,
      published_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `news_${baseTimestamp}_7`,
      title: '户外露营成新趋势，这些装备你准备好了吗？',
      summary: '随着露营旅游的兴起，越来越多的人选择走进大自然。本文为您推荐户外露营必备装备清单。',
      content: `<p>近年来，户外露营成为了新兴的旅游方式，受到年轻人的热烈追捧。</p>
<p>选择露营地点时，建议优先考虑有完善设施的正规营地。必备装备包括：帐篷、睡袋、防潮垫、照明设备、炊具等。</p>
<p>此外，还要准备急救包、防虫喷雾等应急物品。建议新手先从设施完善的营地开始体验，积累经验后再尝试更具挑战性的野外露营。</p>`,
      cover_image: '/assets/images/activities/camping.jpg',
      category_id: 3,
      author_id: 1,
      view_count: 2340,
      is_published: 1,
      published_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: `news_${baseTimestamp}_8`,
      title: '登山爱好者必看：春季登山注意事项',
      summary: '春季是登山的好时节，但也要注意安全。本文为您总结春季登山的注意事项和安全提示。',
      content: `<p>春季气候宜人，是登山的绝佳时节。但春季天气变化较大，登山时需要特别注意以下几点：</p>
<p>1. 做好充分准备，携带足够的水和食物；2. 穿着合适的登山鞋和速干衣物；3. 注意天气变化，避免在雨雾天气登山；4. 结伴而行，不要单独行动。</p>
<p>对于初学者，建议选择难度较低、设施完善的登山路线，积累经验后再挑战更高难度的山峰。</p>`,
      cover_image: '/assets/images/activities/mountain.jpg',
      category_id: 3,
      author_id: 1,
      view_count: 1650,
      is_published: 1,
      published_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const newsStmt = db.prepare(`
    INSERT INTO news (id, title, content, summary, cover_image, category_id, author_id, view_count, is_published, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  newsData.forEach(news => {
    newsStmt.run(
      news.id,
      news.title,
      news.content,
      news.summary,
      news.cover_image,
      news.category_id,
      news.author_id,
      news.view_count,
      news.is_published,
      news.published_at
    );
  });
  console.log('✓ 生成新闻数据');
};

// 10. 添加更多景点和酒店数据（供管理）
const addMoreData = () => {
  // 添加更多景点（使用本地图片）
  const moreSpots = [
    {
      name: '西安古城',
      description: '十三朝古都，拥有兵马俑、大雁塔、古城墙等众多历史遗迹。',
      location: '陕西省西安市',
      latitude: 34.3416,
      longitude: 108.9398,
      images: [
        '/assets/images/spots/xian.jpg'
      ]
    },
    {
      name: '上海迪士尼乐园',
      description: '中国大陆首座迪士尼度假区，拥有多个主题园区和娱乐设施。',
      location: '上海市浦东新区',
      latitude: 31.1434,
      longitude: 121.6661,
      images: [
        '/assets/images/spots/disney.jpg'
      ]
    },
    {
      name: '泰山',
      description: '五岳之首，世界文化与自然双重遗产，中国著名的道教圣地。',
      location: '山东省泰安市',
      latitude: 36.2544,
      longitude: 117.1014,
      images: [
        '/assets/images/spots/backup1.jpg'
      ]
    }
  ];

  const moreSpotStmt = db.prepare(`
    INSERT INTO spots (name, description, location, latitude, longitude, images, status, is_recommended, category_id, price, rating, view_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  moreSpots.forEach((spot, index) => {
    moreSpotStmt.run(
      spot.name,
      spot.description,
      spot.location,
      spot.latitude,
      spot.longitude,
      JSON.stringify(spot.images),
      'active', // 都设置为活跃状态
      1, // 都设置为推荐景点
      (index % 5) + 1, // 循环分配分类
      Math.floor(Math.random() * 200) + 20, // 随机价格
      (Math.random() * 1 + 4).toFixed(1), // 4.0-5.0的随机评分
      Math.floor(Math.random() * 100000) + 10000 // 随机浏览量
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
    console.log('- 酒店预订：6个（包含pending/confirmed/completed/cancelled状态）');
    console.log('- 活动报名：15个（包含registered/cancelled状态）');
  } catch (error) {
    console.error('初始化数据库失败：', error);
    process.exit(1);
  } finally {
    db.close();
  }
};

// 运行初始化
init();