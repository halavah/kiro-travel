-- ╔═══════════════════════════════════════════════════════╗
-- ║   SQLite 数据库结构定义                               ║
-- ╚═══════════════════════════════════════════════════════╝

-- 用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
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
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 景点表
CREATE TABLE IF NOT EXISTS spots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  address TEXT,
  category_id TEXT REFERENCES spot_categories(id),
  images TEXT,  -- JSON array stored as TEXT
  price REAL DEFAULT 0,
  rating REAL DEFAULT 0,
  is_recommended INTEGER DEFAULT 0,  -- SQLite uses 0/1 for boolean
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 景点评论表
CREATE TABLE IF NOT EXISTS spot_comments (
  id TEXT PRIMARY KEY,
  spot_id TEXT NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 景点收藏表
CREATE TABLE IF NOT EXISTS spot_favorites (
  id TEXT PRIMARY KEY,
  spot_id TEXT NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(spot_id, user_id)
);

-- 景点点赞表
CREATE TABLE IF NOT EXISTS spot_likes (
  id TEXT PRIMARY KEY,
  spot_id TEXT NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(spot_id, user_id)
);

-- 门票表
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  spot_id TEXT NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  valid_from TEXT,  -- DATE stored as TEXT in ISO format
  valid_to TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 购物车表
CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, ticket_id)
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_no TEXT UNIQUE NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'completed')),
  paid_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 订单详情表
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_id TEXT NOT NULL REFERENCES tickets(id),
  ticket_name TEXT NOT NULL,
  spot_name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 酒店表
CREATE TABLE IF NOT EXISTS hotels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  location TEXT,
  images TEXT,  -- JSON array
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  price_min REAL,
  price_max REAL,
  amenities TEXT,  -- JSON array
  contact_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 酒店房间表
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id TEXT PRIMARY KEY,
  hotel_id TEXT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  capacity INTEGER DEFAULT 2,
  images TEXT,  -- JSON array
  amenities TEXT,  -- JSON array
  stock INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 酒店预订表
CREATE TABLE IF NOT EXISTS hotel_bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES hotel_rooms(id),
  hotel_name TEXT NOT NULL,
  room_name TEXT NOT NULL,
  check_in TEXT NOT NULL,  -- DATE as TEXT
  check_out TEXT NOT NULL,
  guests INTEGER DEFAULT 1,
  total_price REAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- 旅游活动表
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  images TEXT,  -- JSON array
  activity_type TEXT,
  start_date TEXT,  -- DATE as TEXT
  end_date TEXT,
  price REAL,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 活动参与者表
CREATE TABLE IF NOT EXISTS activity_participants (
  id TEXT PRIMARY KEY,
  activity_id TEXT NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled')),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(activity_id, user_id)
);

-- 新闻分类表
CREATE TABLE IF NOT EXISTS news_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 新闻表
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  cover_image TEXT,
  category_id TEXT REFERENCES news_categories(id),
  author_id TEXT REFERENCES profiles(id),
  view_count INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,  -- 0/1 for boolean
  published_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ═════════════════════════════════════════════════════════
-- 创建索引以提升查询性能
-- ═════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_spots_category ON spots(category_id);
CREATE INDEX IF NOT EXISTS idx_spots_recommended ON spots(is_recommended);
CREATE INDEX IF NOT EXISTS idx_spots_location ON spots(location);
CREATE INDEX IF NOT EXISTS idx_spots_status ON spots(status);

CREATE INDEX IF NOT EXISTS idx_spot_comments_spot ON spot_comments(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_comments_user ON spot_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_spot_favorites_user ON spot_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_spot_favorites_spot ON spot_favorites(spot_id);

CREATE INDEX IF NOT EXISTS idx_spot_likes_user ON spot_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_spot_likes_spot ON spot_likes(spot_id);

CREATE INDEX IF NOT EXISTS idx_tickets_spot ON tickets(spot_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_ticket ON cart_items(ticket_id);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_no ON orders(order_no);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_ticket ON order_items(ticket_id);

CREATE INDEX IF NOT EXISTS idx_hotels_location ON hotels(location);
CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status);

CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel ON hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_status ON hotel_rooms(status);

CREATE INDEX IF NOT EXISTS idx_hotel_bookings_user ON hotel_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_room ON hotel_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_hotel_bookings_status ON hotel_bookings(status);

CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_dates ON activities(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_activity_participants_activity ON activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_user ON activity_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_news_category ON news(category_id);
CREATE INDEX IF NOT EXISTS idx_news_author ON news(author_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at);
