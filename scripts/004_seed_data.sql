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
