-- SQLite 版本的数据库 schema

-- 用户表 (包含认证和资料)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'guide', 'admin')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 景点分类表
CREATE TABLE IF NOT EXISTS spot_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 景点表
CREATE TABLE IF NOT EXISTS spots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  address TEXT,
  category_id INTEGER REFERENCES spot_categories(id),
  images TEXT, -- JSON array as text
  price REAL DEFAULT 0,
  average_rating REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_recommended INTEGER DEFAULT 0, -- 0=false, 1=true
  status INTEGER DEFAULT 1, -- 0=inactive, 1=active
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 景点评论表
CREATE TABLE IF NOT EXISTS spot_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 景点收藏表
CREATE TABLE IF NOT EXISTS spot_favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(spot_id, user_id)
);

-- 景点点赞表
CREATE TABLE IF NOT EXISTS spot_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(spot_id, user_id)
);

-- 门票表
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id INTEGER NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  valid_from TEXT, -- DATE as TEXT (YYYY-MM-DD)
  valid_to TEXT,   -- DATE as TEXT (YYYY-MM-DD)
  is_active INTEGER DEFAULT 1, -- 0=false, 1=true
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 购物车表
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, ticket_id)
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_no TEXT UNIQUE NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'completed')),
  paid_at TEXT, -- TIMESTAMP as TEXT
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 订单详情表
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id),
  ticket_name TEXT NOT NULL,
  spot_name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 酒店表
CREATE TABLE IF NOT EXISTS hotels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  location TEXT,
  images TEXT, -- JSON array as text
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  price_min REAL,
  price_max REAL,
  amenities TEXT, -- JSON array as text
  contact_phone TEXT,
  is_active INTEGER DEFAULT 1, -- 0=false, 1=true
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 酒店房间表
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  capacity INTEGER DEFAULT 2,
  images TEXT, -- JSON array as text
  amenities TEXT, -- JSON array as text
  stock INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1, -- 0=false, 1=true
  created_at TEXT DEFAULT (datetime('now'))
);

-- 酒店预订表
CREATE TABLE IF NOT EXISTS hotel_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id INTEGER NOT NULL REFERENCES hotel_rooms(id),
  hotel_name TEXT NOT NULL,
  room_name TEXT NOT NULL,
  check_in TEXT NOT NULL, -- DATE as TEXT
  check_out TEXT NOT NULL, -- DATE as TEXT
  guests INTEGER DEFAULT 1,
  total_price REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 旅游活动表
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  images TEXT, -- JSON array as text
  activity_type TEXT,
  start_date TEXT, -- DATE as TEXT
  end_date TEXT,   -- DATE as TEXT
  price REAL,
  max_participants INTEGER,
  is_active INTEGER DEFAULT 1, -- 0=false, 1=true
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 新闻表
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  cover_image TEXT,
  author_id INTEGER REFERENCES users(id),
  view_count INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1, -- 0=false, 1=true
  published_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_spots_category ON spots(category_id);
CREATE INDEX IF NOT EXISTS idx_spots_recommended ON spots(is_recommended);
CREATE INDEX IF NOT EXISTS idx_spots_status ON spots(status);
CREATE INDEX IF NOT EXISTS idx_tickets_spot ON tickets(spot_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel ON hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON hotel_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at);
CREATE INDEX IF NOT EXISTS idx_activities_active ON activities(is_active);
