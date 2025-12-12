-- 启用 RLS
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
