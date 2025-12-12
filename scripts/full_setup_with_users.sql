-- ╔═══════════════════════════════════════════════════════╗
-- ║   Supabase 完整数据库初始化脚本（含测试用户）        ║
-- ╚═══════════════════════════════════════════════════════╝

-- ═════════════════════════════════════════════════════════
-- 步骤 1: 创建表结构
-- ═════════════════════════════════════════════════════════

-- 用户资料表 (扩展 auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'guide', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 景点分类表
CREATE TABLE IF NOT EXISTS spot_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 景点表
CREATE TABLE IF NOT EXISTS spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  location VARCHAR(200),
  address TEXT,
  category_id UUID REFERENCES spot_categories(id),
  images TEXT[],
  price DECIMAL(10,2) DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  is_recommended BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 景点评论表
CREATE TABLE IF NOT EXISTS spot_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 景点收藏表
CREATE TABLE IF NOT EXISTS spot_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(spot_id, user_id)
);

-- 景点点赞表
CREATE TABLE IF NOT EXISTS spot_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(spot_id, user_id)
);

-- 门票表
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 购物车表
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ticket_id)
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_no VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'completed')),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单详情表
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  ticket_name VARCHAR(100) NOT NULL,
  spot_name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 酒店表
CREATE TABLE IF NOT EXISTS hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  address TEXT,
  location VARCHAR(200),
  images TEXT[],
  star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5),
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  amenities TEXT[],
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 酒店房间表
CREATE TABLE IF NOT EXISTS hotel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  capacity INTEGER DEFAULT 2,
  images TEXT[],
  amenities TEXT[],
  stock INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 酒店预订表
CREATE TABLE IF NOT EXISTS hotel_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES hotel_rooms(id),
  hotel_name VARCHAR(100) NOT NULL,
  room_name VARCHAR(100) NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 旅游活动表
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  location VARCHAR(200),
  images TEXT[],
  activity_type VARCHAR(50),
  start_date DATE,
  end_date DATE,
  price DECIMAL(10,2),
  max_participants INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 新闻表
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  cover_image TEXT,
  author_id UUID REFERENCES auth.users(id),
  view_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_spots_category ON spots(category_id);
CREATE INDEX IF NOT EXISTS idx_spots_recommended ON spots(is_recommended);
CREATE INDEX IF NOT EXISTS idx_tickets_spot ON tickets(spot_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel ON hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON hotel_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at DESC);

-- ═════════════════════════════════════════════════════════
-- 步骤 2: 启用行级安全策略 (RLS)
-- ═════════════════════════════════════════════════════════

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Profiles 策略
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 分类策略 (所有人可读)
CREATE POLICY "categories_select_all" ON spot_categories FOR SELECT USING (true);
CREATE POLICY "categories_admin_all" ON spot_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 景点策略 (所有人可读)
CREATE POLICY "spots_select_all" ON spots FOR SELECT USING (true);
CREATE POLICY "spots_admin_all" ON spots FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 评论策略
CREATE POLICY "comments_select_all" ON spot_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth" ON spot_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON spot_comments FOR DELETE USING (auth.uid() = user_id);

-- 收藏策略
CREATE POLICY "favorites_select_own" ON spot_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON spot_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON spot_favorites FOR DELETE USING (auth.uid() = user_id);

-- 点赞策略
CREATE POLICY "likes_select_all" ON spot_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON spot_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON spot_likes FOR DELETE USING (auth.uid() = user_id);

-- 门票策略 (所有人可读)
CREATE POLICY "tickets_select_all" ON tickets FOR SELECT USING (true);
CREATE POLICY "tickets_admin_all" ON tickets FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 购物车策略
CREATE POLICY "cart_select_own" ON cart_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "cart_insert_own" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cart_update_own" ON cart_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cart_delete_own" ON cart_items FOR DELETE USING (auth.uid() = user_id);

-- 订单策略
CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders_update_own" ON orders FOR UPDATE USING (auth.uid() = user_id);

-- 订单详情策略
CREATE POLICY "order_items_select_own" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "order_items_insert_own" ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- 酒店策略 (所有人可读)
CREATE POLICY "hotels_select_all" ON hotels FOR SELECT USING (true);
CREATE POLICY "hotels_admin_all" ON hotels FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 酒店房间策略 (所有人可读)
CREATE POLICY "rooms_select_all" ON hotel_rooms FOR SELECT USING (true);
CREATE POLICY "rooms_admin_all" ON hotel_rooms FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 酒店预订策略
CREATE POLICY "bookings_select_own" ON hotel_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookings_insert_own" ON hotel_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_update_own" ON hotel_bookings FOR UPDATE USING (auth.uid() = user_id);

-- 活动策略 (所有人可读)
CREATE POLICY "activities_select_all" ON activities FOR SELECT USING (true);
CREATE POLICY "activities_admin_all" ON activities FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 新闻策略 (所有人可读已发布的)
CREATE POLICY "news_select_published" ON news FOR SELECT USING (is_published = true);
CREATE POLICY "news_admin_all" ON news FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ═════════════════════════════════════════════════════════
-- 步骤 3: 创建触发器和函数
-- ═════════════════════════════════════════════════════════

-- 自动创建用户 profile 的触发器
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 更新 updated_at 时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加 updated_at 触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spots_updated_at BEFORE UPDATE ON spots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ═════════════════════════════════════════════════════════
-- 步骤 4: 插入示例数据
-- ═════════════════════════════════════════════════════════

-- 插入景点分类
INSERT INTO spot_categories (name, description, icon) VALUES
  ('自然风光', '山川湖泊、森林草原等自然景观', 'mountain'),
  ('历史古迹', '古建筑、遗址、博物馆等历史文化景点', 'landmark'),
  ('主题乐园', '游乐园、水上乐园等娱乐场所', 'ferris-wheel'),
  ('海滨度假', '海滩、海岛等滨海旅游目的地', 'umbrella-beach'),
  ('城市观光', '城市地标、商业街区等都市景点', 'building')
ON CONFLICT (name) DO NOTHING;

-- 插入示例景点
INSERT INTO spots (name, description, location, address, category_id, images, price, rating, is_recommended, view_count)
SELECT
  '黄山风景区',
  '黄山位于安徽省南部黄山市境内，是中国十大风景名胜之一，被誉为"天下第一奇山"。以奇松、怪石、云海、温泉"四绝"著称于世。',
  '安徽省黄山市',
  '安徽省黄山市黄山区汤口镇',
  id,
  ARRAY['/placeholder.svg?height=400&width=600'],
  190.00,
  4.8,
  true,
  15680
FROM spot_categories WHERE name = '自然风光';

INSERT INTO spots (name, description, location, address, category_id, images, price, rating, is_recommended, view_count)
SELECT
  '故宫博物院',
  '故宫又名紫禁城，是中国明清两代的皇家宫殿，位于北京中轴线的中心。是世界上现存规模最大、保存最为完整的木质结构古建筑之一。',
  '北京市',
  '北京市东城区景山前街4号',
  id,
  ARRAY['/placeholder.svg?height=400&width=600'],
  60.00,
  4.9,
  true,
  89560
FROM spot_categories WHERE name = '历史古迹';

INSERT INTO spots (name, description, location, address, category_id, images, price, rating, is_recommended, view_count)
SELECT
  '上海迪士尼乐园',
  '上海迪士尼乐园是中国内地首座迪士尼主题乐园，拥有七大主题园区，是家庭度假的绝佳选择。',
  '上海市',
  '上海市浦东新区川沙新镇',
  id,
  ARRAY['/placeholder.svg?height=400&width=600'],
  475.00,
  4.7,
  true,
  45230
FROM spot_categories WHERE name = '主题乐园';

INSERT INTO spots (name, description, location, address, category_id, images, price, rating, is_recommended, view_count)
SELECT
  '三亚亚龙湾',
  '亚龙湾是三亚最著名的海滨旅游度假区，拥有绵延7公里的银白色沙滩，被誉为"东方夏威夷"。',
  '海南省三亚市',
  '海南省三亚市吉阳区亚龙湾',
  id,
  ARRAY['/placeholder.svg?height=400&width=600'],
  0,
  4.6,
  true,
  32150
FROM spot_categories WHERE name = '海滨度假';

INSERT INTO spots (name, description, location, address, category_id, images, price, rating, is_recommended, view_count)
SELECT
  '外滩',
  '上海外滩是上海的标志性景点，沿黄浦江西岸绵延约1.5公里，汇集了52幢风格各异的古典复兴大楼，素有"万国建筑博览群"之称。',
  '上海市',
  '上海市黄浦区中山东一路',
  id,
  ARRAY['/placeholder.svg?height=400&width=600'],
  0,
  4.5,
  false,
  67890
FROM spot_categories WHERE name = '城市观光';

-- 为景点添加门票
INSERT INTO tickets (spot_id, name, description, price, stock, valid_from, valid_to)
SELECT id, '成人票', '成人全价门票，含景区大门票', 190.00, 1000, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year'
FROM spots WHERE name = '黄山风景区';

INSERT INTO tickets (spot_id, name, description, price, stock, valid_from, valid_to)
SELECT id, '学生票', '全日制学生凭有效学生证购买', 95.00, 500, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year'
FROM spots WHERE name = '黄山风景区';

INSERT INTO tickets (spot_id, name, description, price, stock, valid_from, valid_to)
SELECT id, '成人票', '故宫博物院全价门票', 60.00, 8000, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year'
FROM spots WHERE name = '故宫博物院';

INSERT INTO tickets (spot_id, name, description, price, stock, valid_from, valid_to)
SELECT id, '一日票', '迪士尼乐园一日通票', 475.00, 5000, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year'
FROM spots WHERE name = '上海迪士尼乐园';

INSERT INTO tickets (spot_id, name, description, price, stock, valid_from, valid_to)
SELECT id, '两日票', '迪士尼乐园两日通票', 850.00, 2000, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year'
FROM spots WHERE name = '上海迪士尼乐园';

-- 插入示例酒店
INSERT INTO hotels (name, description, address, location, images, star_rating, price_min, price_max, amenities, contact_phone) VALUES
  ('黄山温泉度假酒店', '坐落于黄山脚下的温泉度假酒店，提供天然温泉和山景客房。', '安徽省黄山市汤口镇', '安徽省黄山市',
   ARRAY['/placeholder.svg?height=300&width=400'],
   4, 580.00, 1280.00, ARRAY['温泉', '免费WiFi', '停车场', '餐厅'], '0559-5561234'),
  ('北京王府井大饭店', '位于北京核心商圈的五星级豪华酒店，步行可达故宫和王府井商业街。', '北京市东城区王府井大街', '北京市',
   ARRAY['/placeholder.svg?height=300&width=400'],
   5, 980.00, 2880.00, ARRAY['健身房', '游泳池', '免费WiFi', '商务中心', '餐厅'], '010-65228888'),
  ('三亚亚龙湾万豪度假酒店', '坐拥私人海滩的顶级海滨度假酒店，提供完美的热带度假体验。', '海南省三亚市亚龙湾国家旅游度假区', '海南省三亚市',
   ARRAY['/placeholder.svg?height=300&width=400'],
   5, 1280.00, 3880.00, ARRAY['私人海滩', '无边泳池', '水上运动', '儿童乐园', 'SPA'], '0898-88888888');

-- 为酒店添加房间
INSERT INTO hotel_rooms (hotel_id, name, description, price, capacity, amenities, stock)
SELECT id, '山景标准间', '舒适的标准间，可欣赏黄山美景', 580.00, 2, ARRAY['空调', '电视', '独立卫浴'], 20
FROM hotels WHERE name = '黄山温泉度假酒店';

INSERT INTO hotel_rooms (hotel_id, name, description, price, capacity, amenities, stock)
SELECT id, '温泉豪华套房', '带私人温泉池的豪华套房', 1280.00, 2, ARRAY['私人温泉', '空调', '电视', '独立卫浴', '迷你吧'], 10
FROM hotels WHERE name = '黄山温泉度假酒店';

INSERT INTO hotel_rooms (hotel_id, name, description, price, capacity, amenities, stock)
SELECT id, '豪华双床房', '宽敞的双床房，适合商务出行', 980.00, 2, ARRAY['空调', '电视', '独立卫浴', '办公桌', '迷你吧'], 50
FROM hotels WHERE name = '北京王府井大饭店';

INSERT INTO hotel_rooms (hotel_id, name, description, price, capacity, amenities, stock)
SELECT id, '海景豪华房', '无敌海景房，直面亚龙湾', 1680.00, 2, ARRAY['海景阳台', '空调', '电视', '独立卫浴', '迷你吧'], 30
FROM hotels WHERE name = '三亚亚龙湾万豪度假酒店';

-- 插入旅游活动
INSERT INTO activities (name, description, location, images, activity_type, start_date, end_date, price, max_participants) VALUES
  ('黄山日出摄影团', '专业摄影师带队，捕捉黄山最美日出时刻，提供摄影指导。', '安徽省黄山市',
   ARRAY['/placeholder.svg?height=300&width=400'],
   '摄影体验', CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', 299.00, 20),
  ('北京胡同文化一日游', '深入探索北京胡同文化，品尝地道小吃，体验老北京生活。', '北京市',
   ARRAY['/placeholder.svg?height=300&width=400'],
   '文化体验', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 199.00, 15),
  ('三亚潜水体验', '专业教练一对一指导，探索神秘海底世界，适合初学者。', '海南省三亚市',
   ARRAY['/placeholder.svg?height=300&width=400'],
   '水上运动', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 580.00, 10),
  ('上海夜游黄浦江', '乘坐豪华游轮，欣赏外滩和陆家嘴的璀璨夜景。', '上海市',
   ARRAY['/placeholder.svg?height=300&width=400'],
   '观光游览', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 168.00, 100);

-- 插入新闻
INSERT INTO news (title, content, summary, cover_image, view_count) VALUES
  ('2024年国内十大热门旅游目的地出炉',
   '根据最新旅游数据统计，2024年国内最受欢迎的旅游目的地包括：三亚、丽江、成都、西安、杭州、厦门、桂林、张家界、九寨沟、黄山。这些目的地以其独特的自然风光和深厚的文化底蕴吸引着众多游客。',
   '2024年国内旅游热门目的地排行榜发布，三亚、丽江、成都位列前三。',
   '/placeholder.svg?height=300&width=500',
   3256),
  ('春节假期旅游预订火爆 部分热门景区门票已售罄',
   '随着春节假期临近，各大旅游平台数据显示，今年春节旅游预订量较去年同期大幅增长。部分热门景区如故宫、黄山等门票已提前售罄，建议游客提前做好出行规划。',
   '春节旅游预订火爆，热门景区门票紧张，建议提前规划。',
   '/placeholder.svg?height=300&width=500',
   2134),
  ('全国首批智慧旅游景区名单公布',
   '文化和旅游部近日公布了全国首批智慧旅游景区名单，共有50家景区入选。这些景区在数字化服务、智能导览、在线预约等方面走在前列，为游客提供更便捷的旅游体验。',
   '50家景区入选全国首批智慧旅游景区，数字化服务提升旅游体验。',
   '/placeholder.svg?height=300&width=500',
   1876);

-- ═════════════════════════════════════════════════════════
-- 步骤 5: 创建测试用户账号
-- ═════════════════════════════════════════════════════════

-- 注意: Supabase 不支持直接在 SQL 中创建 auth.users
-- 你需要在 Supabase 控制台的 Authentication > Users 中手动添加以下用户

-- 测试账号信息:
-- 1. 普通用户账号:
--    邮箱: user@test.com
--    密码: password123
--    角色: user
--
-- 2. 导游账号:
--    邮箱: guide@test.com
--    密码: guide123
--    角色: guide
--
-- 3. 管理员账号:
--    邮箱: admin@test.com
--    密码: admin123
--    角色: admin

-- 创建管理员账号的特殊函数
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS void AS $$
BEGIN
  -- 这个函数用于创建管理员，需要在系统控制台执行
  -- 在创建用户时设置 raw_user_meta_data: {"role": "admin"}
  NULL;
END;
$$ LANGUAGE plpgsql;

-- ═════════════════════════════════════════════════════════
-- 完成提示
-- ═════════════════════════════════════════════════════════

-- 执行完成后，请访问 https://supabase.com/dashboard/project/fxkapbshupsglaowykns/auth/users
-- 添加以下测试用户（设置密码时取消邮件验证）：
--
-- 1. user@test.com (密码: password123) - 普通用户
-- 2. guide@test.com (密码: guide123) - 导游
-- 3. admin@test.com (密码: admin123) - 管理员
--
-- 添加用户后，系统会自动创建对应的 profiles 记录
--
-- 数据库初始化完成！
-- 下一步: 运行 npm run dev 启动开发服务器
-- 访问: http://localhost:3000