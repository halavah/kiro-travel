# Kiro Travel API 文档

生成日期：2025-12-15

## 目录
1. [数据库表结构](#数据库表结构)
2. [API 端点](#api-端点)
   - [认证模块](#认证模块)
   - [用户与个人资料](#用户与个人资料)
   - [景点与门票](#景点与门票)
   - [购物车与订单](#购物车与订单)
   - [酒店与预订](#酒店与预订)
   - [活动](#活动)
   - [新闻](#新闻)
   - [收藏](#收藏)
   - [管理后台](#管理后台)
3. [已知问题](#已知问题)
4. [修复建议](#修复建议)

---

## 数据库表结构

### 用户表 (profiles)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
email TEXT UNIQUE NOT NULL
password_hash TEXT NOT NULL
full_name TEXT NOT NULL
role TEXT DEFAULT 'user' CHECK (role IN ('user', 'guide', 'admin'))
avatar_url TEXT
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### 景点表 (spots)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
name TEXT NOT NULL
description TEXT
location TEXT NOT NULL
latitude REAL
longitude REAL
images TEXT -- JSON array
category_id INTEGER
price DECIMAL(10, 2) DEFAULT 0
rating DECIMAL(2, 1) DEFAULT 5.0
is_recommended BOOLEAN DEFAULT 0
view_count INTEGER DEFAULT 0
status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (category_id) REFERENCES spot_categories(id)
```

### 景点分类表 (spot_categories)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
name TEXT NOT NULL UNIQUE
description TEXT
icon TEXT
color TEXT DEFAULT '#3B82F6'
sort_order INTEGER DEFAULT 0
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### 门票表 (tickets)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
spot_id INTEGER NOT NULL
name TEXT NOT NULL
description TEXT
price DECIMAL(10, 2) NOT NULL
stock INTEGER DEFAULT 0
valid_from DATE
valid_to DATE
status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE
```

### 活动表 (activities)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
title TEXT NOT NULL
description TEXT
location TEXT NOT NULL
start_time DATETIME NOT NULL
end_time DATETIME NOT NULL
max_participants INTEGER
price DECIMAL(10, 2) DEFAULT 0
images TEXT -- JSON array
status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### 活动参与者表 (activity_participants)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
activity_id INTEGER NOT NULL
user_id INTEGER NOT NULL
status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled'))
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
UNIQUE(activity_id, user_id)
```

### 酒店表 (hotels)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
name TEXT NOT NULL
description TEXT
location TEXT NOT NULL
address TEXT
phone TEXT
images TEXT -- JSON array
amenities TEXT -- JSON array
rating DECIMAL(2, 1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5)
status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'))
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### 酒店房间表 (hotel_rooms)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
hotel_id INTEGER NOT NULL
name TEXT NOT NULL
type TEXT NOT NULL
max_occupancy INTEGER NOT NULL
price_per_night DECIMAL(10, 2) NOT NULL
amenities TEXT -- JSON array
images TEXT -- JSON array
status TEXT DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'maintenance'))
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
```

### 订单表 (orders)
```sql
id TEXT PRIMARY KEY
user_id INTEGER NOT NULL
order_no TEXT UNIQUE NOT NULL
total_amount DECIMAL(10, 2) NOT NULL
status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'completed'))
note TEXT
paid_at DATETIME
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (user_id) REFERENCES profiles(id)
```
**注意：订单ID是TEXT类型（UUID），但user_id是INTEGER类型**

### 订单项表 (order_items)
```sql
id TEXT PRIMARY KEY
order_id TEXT NOT NULL
ticket_id INTEGER
ticket_name TEXT
spot_name TEXT
price DECIMAL(10, 2) NOT NULL
quantity INTEGER NOT NULL DEFAULT 1
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
FOREIGN KEY (ticket_id) REFERENCES tickets(id)
```
**注意：订单项ID是TEXT类型（UUID）**

### 购物车表 (cart_items)
```sql
id TEXT PRIMARY KEY
user_id INTEGER NOT NULL
ticket_id INTEGER NOT NULL
quantity INTEGER NOT NULL DEFAULT 1
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
UNIQUE(user_id, ticket_id)
```
**注意：购物车ID是TEXT类型（UUID）**

### 酒店预订表 (hotel_bookings)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
user_id INTEGER NOT NULL
room_id INTEGER NOT NULL
hotel_name TEXT NOT NULL
room_name TEXT NOT NULL
check_in DATE NOT NULL
check_out DATE NOT NULL
guests INTEGER NOT NULL
total_price DECIMAL(10, 2) NOT NULL
status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
FOREIGN KEY (room_id) REFERENCES hotel_rooms(id) ON DELETE CASCADE
```

### 新闻分类表 (news_categories)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
name TEXT NOT NULL UNIQUE
description TEXT
sort_order INTEGER DEFAULT 0
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

### 新闻表 (news)
```sql
id TEXT PRIMARY KEY
title TEXT NOT NULL
content TEXT NOT NULL
summary TEXT
cover_image TEXT
category_id INTEGER
author_id INTEGER
view_count INTEGER DEFAULT 0
is_published INTEGER DEFAULT 0
published_at DATETIME
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE SET NULL
FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL
```
**注意：新闻ID是TEXT类型**

### 景点评论表 (spot_comments)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
spot_id INTEGER NOT NULL
user_id INTEGER NOT NULL
content TEXT NOT NULL
rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5)
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
```

### 景点点赞表 (spot_likes)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
spot_id INTEGER NOT NULL
user_id INTEGER NOT NULL
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
UNIQUE(spot_id, user_id)
```

### 景点收藏表 (spot_favorites)
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
spot_id INTEGER NOT NULL
user_id INTEGER NOT NULL
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
FOREIGN KEY (spot_id) REFERENCES spots(id) ON DELETE CASCADE
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
UNIQUE(spot_id, user_id)
```

---

## API 端点

### 认证模块

#### POST /api/auth/login
- **描述**：用户登录
- **权限**：public
- **请求体**：
  ```json
  {
    "email": "string (required)",
    "password": "string (required)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "number",
        "email": "string",
        "full_name": "string",
        "role": "string"
      },
      "token": "string"
    }
  }
  ```
- **Cookie**：设置 httpOnly cookie (token)，有效期7天
- **错误代码**：
  - 400: 邮箱和密码不能为空
  - 401: 邮箱或密码错误
  - 500: 登录失败

#### POST /api/auth/register
- **描述**：用户注册
- **权限**：public
- **请求体**：
  ```json
  {
    "email": "string (required)",
    "password": "string (required, min 6)",
    "full_name": "string (required)",
    "role": "string (optional)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "number",
        "email": "string",
        "full_name": "string",
        "role": "string"
      },
      "token": "string"
    },
    "message": "注册成功"
  }
  ```
- **Cookie**：设置 httpOnly cookie (token)，有效期7天
- **错误代码**：
  - 400: 邮箱、密码和姓名不能为空 / 密码长度至少为6位
  - 500: 注册失败

#### POST /api/auth/logout
- **描述**：用户登出
- **权限**：public
- **响应**：
  ```json
  {
    "success": true,
    "message": "登出成功"
  }
  ```
- **Cookie**：清除 token cookie

#### GET /api/auth/me
- **描述**：获取当前登录用户信息
- **权限**：user (需要登录)
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "number",
        "email": "string",
        "full_name": "string",
        "role": "string"
      }
    }
  }
  ```
- **错误代码**：
  - 401: 未认证

---

### 用户与个人资料

#### GET /api/users
- **描述**：获取用户列表
- **权限**：public（无权限检查）
- **查询参数**：
  - `role`: string (optional) - 用户角色过滤
- **响应**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "email": "string",
        "full_name": "string",
        "role": "string",
        "avatar_url": "string",
        "created_at": "string"
      }
    ]
  }
  ```

#### POST /api/users
- **描述**：创建新用户
- **权限**：public（无权限检查）
- **请求体**：
  ```json
  {
    "email": "string (required)",
    "password": "string (required)",
    "full_name": "string (required)",
    "role": "string (optional, default: user)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "email": "string",
      "full_name": "string",
      "role": "string"
    }
  }
  ```
- **错误代码**：
  - 400: Missing required fields / User already exists
  - 500: Failed to create user

#### GET /api/profile
- **描述**：获取用户个人资料
- **权限**：user
- **响应**：
  ```json
  {
    "data": {
      "id": "number",
      "email": "string",
      "nickname": "string",
      "avatar": "string",
      "role": "string",
      "created_at": "string"
    }
  }
  ```
- **注意**：返回字段使用 full_name as nickname, avatar_url as avatar

#### PATCH /api/profile
- **描述**：更新用户资料
- **权限**：user
- **请求体**：
  ```json
  {
    "nickname": "string (optional)",
    "avatar": "string (optional)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "email": "string",
      "nickname": "string",
      "avatar": "string"
    },
    "message": "Profile updated successfully"
  }
  ```

#### POST /api/profile/password
- **描述**：修改密码
- **权限**：user
- **请求体**：
  ```json
  {
    "newPassword": "string (required, min 6)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "message": "Password updated successfully"
  }
  ```
- **错误代码**：
  - 400: Password must be at least 6 characters

#### GET /api/profile/stats
- **描述**：获取用户统计数据
- **权限**：user
- **响应**：
  ```json
  {
    "data": {
      "orders": "number",
      "bookings": "number",
      "activities": "number",
      "favorites": "number",
      "comments": "number"
    }
  }
  ```
- **注意**：所有统计数据均从数据库实时查询

---

### 景点与门票

#### GET /api/spots
- **描述**：获取景点列表
- **权限**：public
- **查询参数**：
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `search`: string (optional) - 全文搜索（使用FTS5）
  - `category`: string (optional) - 分类过滤
  - `is_recommended`: boolean (optional) - 只显示推荐景点
- **响应**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "name": "string",
        "description": "string",
        "location": "string",
        "images": ["string"],
        "category_name": "string",
        "price": "number",
        "rating": "number",
        "like_count": "number",
        "favorite_count": "number",
        "average_rating": "number"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "pages": "number"
    }
  }
  ```
- **注意**：
  - like_count, favorite_count, average_rating 当前返回 0
  - 使用 FTS5 进行全文搜索

#### POST /api/spots
- **描述**：创建新景点
- **权限**：guide（导游或管理员）
- **请求体**：
  ```json
  {
    "name": "string (required)",
    "description": "string (required)",
    "category_id": "number (required)",
    "location": "string (required)",
    "price": "number (optional)",
    "images": ["string"] (optional)
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "name": "string",
      "category_name": "string",
      ...
    },
    "message": "景点创建成功"
  }
  ```
- **错误代码**：
  - 401: 请先登录
  - 403: 权限不足
  - 400: 缺少必填字段

#### GET /api/spots/[id]
- **描述**：获取景点详情
- **权限**：public
- **路径参数**：
  - `id`: number - 景点ID
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "name": "string",
      "description": "string",
      "images": ["string"],
      "like_count": "number",
      "favorite_count": "number",
      "average_rating": "number",
      "comment_count": "number",
      "comments": [
        {
          "id": "number",
          "content": "string",
          "rating": "number",
          "full_name": "string",
          "avatar_url": "string"
        }
      ]
    }
  }
  ```
- **错误代码**：
  - 404: 景点不存在

#### PUT /api/spots/[id]
- **描述**：更新景点
- **权限**：admin（仅管理员）
- **路径参数**：
  - `id`: number - 景点ID
- **请求体**：
  ```json
  {
    "name": "string (optional)",
    "description": "string (optional)",
    "category_id": "number (optional)",
    "location": "string (optional)",
    "price": "number (optional)",
    "images": ["string"] (optional),
    "status": "string (optional)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "name": "string",
      ...
    },
    "message": "景点更新成功"
  }
  ```
- **错误代码**：
  - 401: 请先登录
  - 403: 权限不足
  - 404: 景点不存在
  - 400: 没有要更新的字段

#### DELETE /api/spots/[id]
- **描述**：删除景点（软删除）
- **权限**：admin
- **路径参数**：
  - `id`: number - 景点ID
- **响应**：
  ```json
  {
    "success": true,
    "message": "景点删除成功"
  }
  ```
- **注意**：执行软删除，将 status 设置为 'inactive'

#### GET /api/spots/[id]/tickets
- **描述**：获取景点的门票列表
- **权限**：public
- **路径参���**：
  - `id`: string - 景点ID
- **响应**：
  ```json
  {
    "tickets": [
      {
        "id": "number",
        "name": "string",
        "description": "string",
        "price": "number",
        "stock": "number",
        "valid_from": "date",
        "valid_to": "date",
        "status": "string",
        "spot_name": "string",
        "location": "string"
      }
    ]
  }
  ```
- **注意**：过滤有效期内的门票

#### POST /api/spots/[id]/favorite
- **描述**：收藏/取消收藏景点
- **权限**：user
- **路径参数**：
  - `id`: number - 景点ID
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "favorited": "boolean",
      "favoriteCount": "number"
    },
    "message": "收藏成功/取消收藏成功"
  }
  ```
- **错误代码**：
  - 401: 请先登录
  - 404: 景点不存在

#### POST /api/spots/[id]/like
- **描述**：点赞/取消点赞景点
- **权限**：user
- **路径参数**：
  - `id`: number - 景点ID
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "liked": "boolean",
      "likeCount": "number"
    },
    "message": "点赞成功/取消点赞成功"
  }
  ```

#### GET /api/spots/[id]/comments
- **描述**：获取景点评论列表
- **权限**：public
- **路径参数**：
  - `id`: number - 景点ID
- **查询参数**：
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
- **响应**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "content": "string",
        "rating": "number",
        "nickname": "string",
        "avatar": "string",
        "created_at": "string"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number",
      "pages": "number"
    }
  }
  ```

#### POST /api/spots/[id]/comments
- **描述**：添加评论
- **权限**：user
- **路径参数**：
  - `id`: number - 景点ID
- **请求体**：
  ```json
  {
    "content": "string (required)",
    "rating": "number (required, 1-5)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "content": "string",
      "rating": "number",
      "nickname": "string",
      "avatar": "string"
    },
    "message": "评论添加成功"
  }
  ```
- **错误代码**：
  - 400: 评论内容和评分不能为空 / 评分必须在1-5之间
  - 404: 景点不存在

#### GET /api/tickets
- **描述**：获取门票列表
- **权限**：public
- **查询参数**：
  - `spot_id`: number (optional) - 景点ID过滤
  - `page`: number (default: 1)
  - `limit`: number (default: 100)
  - `search`: string (optional) - 搜索关键词
- **响应**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "name": "string",
        "description": "string",
        "price": "number",
        "stock": "number",
        "spot_name": "string",
        "spot_location": "string"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number"
    }
  }
  ```

#### POST /api/tickets
- **描述**：创建新门票
- **权限**：guide
- **请求体**：
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)",
    "spot_id": "number (required)",
    "price": "number (required)",
    "stock": "number (optional)",
    "valid_from": "date (optional)",
    "valid_to": "date (optional)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "name": "string",
      "spot_name": "string",
      ...
    },
    "message": "门票创建成功"
  }
  ```

---

### 购物车与订单

#### GET /api/cart
- **描述**：获取购物车列表
- **权限**：user
- **响应**：
  ```json
  {
    "success": true,
    "items": [
      {
        "id": "string (UUID)",
        "quantity": "number",
        "ticket_id": "string",
        "ticket_name": "string",
        "ticket_price": "number",
        "ticket_stock": "number",
        "spot_id": "string",
        "spot_name": "string",
        "spot_images": ["string"]
      }
    ],
    "totalAmount": "number"
  }
  ```

#### POST /api/cart
- **描述**：添加商品到购物车
- **权限**：user
- **请求体**：
  ```json
  {
    "ticket_id": "number (required)",
    "quantity": "number (optional, default: 1)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "message": "Item added to cart",
    "item_id": "string (UUID)"
  }
  ```
- **错误代码**：
  - 400: ticket_id is required / Quantity must be at least 1 / Insufficient stock
  - 404: Ticket not found

#### DELETE /api/cart
- **描述**：清空购物车
- **权限**：user
- **响应**：
  ```json
  {
    "success": true,
    "message": "Cart cleared"
  }
  ```

#### PATCH /api/cart/[id]
- **描述**：更新购物车商品数量
- **权限**：user
- **路径参数**：
  - `id`: string (UUID) - 购物车项ID
- **请求体**：
  ```json
  {
    "quantity": "number (required, >= 0)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "message": "Cart item updated",
    "quantity": "number"
  }
  ```
- **注意**：quantity 为 0 时删除商品

#### DELETE /api/cart/[id]
- **描述**：删除购物车商品
- **权限**：user
- **路径参数**：
  - `id`: string (UUID) - 购物车项ID
- **响应**：
  ```json
  {
    "success": true,
    "message": "Item removed from cart"
  }
  ```

#### GET /api/orders
- **描述**：获取订单列表
- **权限**：user
- **查询参数**：
  - `status`: string (optional) - 订单状态过滤
- **响应**：
  ```json
  {
    "orders": [
      {
        "id": "string (UUID)",
        "order_no": "string",
        "total_amount": "number",
        "status": "string",
        "paid_at": "string",
        "created_at": "string",
        "item_count": "number"
      }
    ]
  }
  ```

#### POST /api/orders
- **描述**：创建订单（从购物车或直接预订）
- **权限**：user
- **请求体（购物车模式）**：
  ```json
  {
    "cart_item_ids": ["string (UUID)"] (optional)
  }
  ```
- **请求体（直接预订模式）**：
  ```json
  {
    "spot_id": "number (required)",
    "ticket_id": "number (required)",
    "visitDate": "date (required)",
    "visitTime": "string (required)",
    "visitors": "number (required)",
    "contactName": "string (required)",
    "contactPhone": "string (required)",
    "contactEmail": "string (optional)",
    "remarks": "string (optional)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "order": {
        "id": "string (UUID)",
        "order_no": "string",
        "total_amount": "number",
        "status": "string"
      }
    },
    "message": "Order created successfully"
  }
  ```
- **功能**：
  - 自动生成订单号（格式：ORD + 日期时间 + 随机数）
  - 扣减库存
  - 清空购物车（购物车模式）
  - 保存预订信息（直接预订模式）

#### GET /api/orders/[id]
- **描述**：获取订单详情
- **权限**：user（仅查看自己的订单）
- **路径参数**：
  - `id`: string (UUID) - 订单ID
- **响应**：
  ```json
  {
    "order": {
      "id": "string (UUID)",
      "order_no": "string",
      "total_amount": "number",
      "status": "string",
      "paid_at": "string",
      "created_at": "string",
      "note": "string",
      "items": [
        {
          "id": "string (UUID)",
          "ticket_name": "string",
          "spot_name": "string",
          "price": "number",
          "quantity": "number"
        }
      ]
    }
  }
  ```

#### POST /api/orders/[id]/pay
- **描述**：支付订单
- **权限**：user（仅支付自己的订单）
- **路径参数**：
  - `id`: string (UUID) - 订单ID
- **响应**：
  ```json
  {
    "success": true,
    "message": "Payment successful"
  }
  ```
- **功能**：更新订单状态为 'paid'，记录支付时间
- **错误代码**：
  - 404: Order not found
  - 400: Order cannot be paid

#### POST /api/orders/[id]/cancel
- **描述**：取消订单
- **权限**：user（仅取消自己的订单）
- **路径参数**：
  - `id`: string (UUID) - 订单ID
- **响应**：
  ```json
  {
    "success": true,
    "message": "Order cancelled successfully"
  }
  ```
- **功能**：恢复库存，更新订单状态为 'cancelled'
- **错误代码**：
  - 404: Order not found
  - 400: Order cannot be cancelled

---

### 酒店与预订

#### GET /api/hotels
- **描述**：获取酒店列表
- **权限**：public
- **查询参数**：
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `search`: string (optional)
  - `location`: string (optional)
  - `min_price`: number (optional) - 暂不可用，需数据库添加字段
  - `max_price`: number (optional) - 暂不可用，需数据库添加字段
  - `star_rating`: number (optional)
- **响应**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "name": "string",
        "description": "string",
        "location": "string",
        "images": ["string"],
        "amenities": ["string"],
        "rating": "number",
        "room_count": "number"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number"
    }
  }
  ```
- **注意**：价格过滤功能已注释，需数据库添加 price_min 和 price_max 字段后启用

#### POST /api/hotels
- **描述**：创建新酒店
- **权限**：admin
- **请求体**：
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)",
    "address": "string (optional)",
    "location": "string (required)",
    "images": ["string"] (optional),
    "star_rating": "number (optional)",
    "price_min": "number (optional)",
    "price_max": "number (optional)",
    "amenities": ["string"] (optional),
    "contact_phone": "string (optional)"
  }
  ```
- **注意**：使用 AUTOINCREMENT 自动生成 ID

#### GET /api/hotels/[id]
- **描述**：获取酒店详情
- **权限**：public
- **路径参数**：
  - `id`: string - 酒店ID
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "name": "string",
      "images": ["string"],
      "amenities": ["string"],
      "room_count": "number"
    }
  }
  ```

#### PUT /api/hotels/[id]
- **描述**：更新酒店信息
- **权限**：admin
- **路径参数**：
  - `id`: string - 酒店ID
- **请求体**：所有字段可选
- **响应**：同 GET

#### DELETE /api/hotels/[id]
- **描述**：删除酒店（软删除）
- **权限**：admin
- **路径参数**：
  - `id`: string - 酒店ID
- **响应**：
  ```json
  {
    "success": true,
    "message": "酒店已删除"
  }
  ```

#### GET /api/hotels/[id]/rooms
- **描述**：获取酒店房间列表
- **权限**：public
- **路径参数**：
  - `id`: string - 酒店ID
- **查询参数**：
  - `available`: boolean (optional)
- **响应**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "number",
        "name": "string",
        "description": "string",
        "price": "number",
        "capacity": "number",
        "images": ["string"],
        "amenities": ["string"],
        "stock": "number"
      }
    ]
  }
  ```
- **注意**：使用 status = 'available' 过滤可用房间

#### POST /api/hotels/[id]/rooms
- **描述**：添加房间
- **权限**：admin
- **路径参数**：
  - `id`: string - 酒店ID
- **请求体**：
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)",
    "price": "number (required)",
    "capacity": "number (optional, default: 2)",
    "images": ["string"] (optional),
    "amenities": ["string"] (optional),
    "stock": "number (optional, default: 1)"
  }
  ```
- **问题**：API 使用 room_${Date.now()} 作为ID，但数据库表使用 AUTOINCREMENT

#### GET /api/bookings
- **描述**：获取用户的预订列表
- **权限**：user
- **响应**：
  ```json
  {
    "data": [
      {
        "id": "number",
        "room_id": "number",
        "hotel_name": "string",
        "room_name": "string",
        "check_in": "date",
        "check_out": "date",
        "guests": "number",
        "total_price": "number",
        "status": "string",
        "created_at": "string"
      }
    ]
  }
  ```

#### POST /api/bookings
- **描述**：创建新预订
- **权限**：user
- **请求体**：
  ```json
  {
    "room_id": "number (required)",
    "hotel_name": "string (required)",
    "room_name": "string (required)",
    "check_in": "date (required)",
    "check_out": "date (required)",
    "guests": "number (required)",
    "total_price": "number (required)",
    "status": "string (optional, default: pending)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "message": "Booking created successfully"
    }
  }
  ```

#### DELETE /api/bookings/[id]
- **描述**：取消预订
- **权限**：user（仅取消自己的预订）
- **路径参数**：
  - `id`: number - 预订ID
- **响应**：
  ```json
  {
    "success": true,
    "message": "预订已取消"
  }
  ```
- **注意**：@deprecated 推荐使用 POST /api/bookings/[id]/cancel，保留此端点仅为向后兼容

#### POST /api/bookings/[id]/cancel
- **描述**：取消预订（推荐端点，符合REST规范）
- **权限**：user
- **路径参数**：
  - `id`: number - 预订ID
- **响应**：同 DELETE
- **注意**：仅 pending 和 confirmed 状态的预订可以取消

---

### 活动

#### GET /api/activities
- **描述**：获取活动列表
- **权限**：public
- **查询参数**：
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `search`: string (optional)
  - `location`: string (optional)
  - `activity_type`: string (optional) - 暂不可用，需数据库添加字段
  - `is_active`: boolean (optional)
- **响应**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "location": "string",
        "start_time": "datetime",
        "end_time": "datetime",
        "price": "number",
        "max_participants": "number",
        "participant_count": "number",
        "available_slots": "number",
        "is_full": "boolean",
        "images": ["string"]
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number"
    }
  }
  ```
- **注意**：活动类型过滤功能已注释，需数据库添加 activity_type 字段后启用

#### POST /api/activities
- **描述**：创建新活动
- **权限**：guide
- **请求体**：
  ```json
  {
    "title": "string (required)",
    "description": "string (optional)",
    "location": "string (required)",
    "images": ["string"] (optional),
    "activity_type": "string (optional)",
    "start_time": "datetime (required)",
    "end_time": "datetime (required)",
    "price": "number (optional)",
    "max_participants": "number (optional)"
  }
  ```
- **注意**：使用 AUTOINCREMENT 自动生成 ID，activity_type 字段暂不支持

#### GET /api/activities/[id]
- **描述**：获取活动详情
- **权限**：public
- **路径参数**：
  - `id`: string - 活动ID
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "title": "string",
      "images": ["string"],
      ...
    }
  }
  ```

#### PUT /api/activities/[id]
- **描述**：更新活动
- **权限**：guide
- **路径参数**：
  - `id`: string - 活动ID
- **请求体**：所有字段可选
- **响应**：同 GET

#### DELETE /api/activities/[id]
- **描述**：删除活动
- **权限**：admin（硬删除，仅管理员）
- **路径参数**：
  - `id`: string - 活动ID
- **响应**：
  ```json
  {
    "success": true,
    "message": "活动删除成功"
  }
  ```
- **功能**：同时删除所有参与者记录

#### POST /api/activities/[id]/join
- **描述**：报名参加活动
- **权限**：user
- **路径参数**：
  - `id`: string - 活动ID
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "number",
      "message": "报名成功"
    }
  }
  ```
- **错误代码**：
  - 404: 活动不存在或已关闭
  - 400: 您已经报名过该活动 / 活动报名人数已满

#### DELETE /api/activities/[id]/join
- **描述**：取消报名
- **权限**：user
- **路径参数**：
  - `id`: string - 活动ID
- **响应**：
  ```json
  {
    "success": true,
    "message": "取消报名成功"
  }
  ```
- **功能**：将状态更新为 'cancelled'，不删除记录

---

### 新闻

#### GET /api/news
- **描述**：获取新闻列表
- **权限**：public
- **查询参数**：
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `search`: string (optional)
  - `category_id`: number (optional)
  - `is_published`: boolean (optional, default: true)
- **响应**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "title": "string",
        "content": "string",
        "summary": "string",
        "cover_image": "string",
        "category_name": "string",
        "author_name": "string",
        "view_count": "number",
        "is_published": "number",
        "published_at": "datetime"
      }
    ],
    "pagination": {
      "page": "number",
      "limit": "number",
      "total": "number"
    }
  }
  ```

#### POST /api/news
- **描述**：创建新闻
- **权限**：admin
- **请求体**：
  ```json
  {
    "title": "string (required)",
    "content": "string (required)",
    "summary": "string (optional)",
    "cover_image": "string (optional)",
    "category_id": "number (optional)",
    "is_published": "boolean (optional)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "id": "string",
      "title": "string",
      ...
    }
  }
  ```
- **问题**：API 使用 news_${Date.now()} 作为ID，但数据库表ID列为TEXT类型（应该使用UUID）

#### GET /api/news/[id]
- **描述**：获取新闻详情
- **权限**：public
- **路径参数**：
  - `id`: string - 新闻ID
- **响应**：同 POST
- **功能**：自动增加浏览量

#### PUT /api/news/[id]
- **描述**：更新新闻
- **权限**：admin
- **路径参数**：
  - `id`: string - 新闻ID
- **请求体**：
  ```json
  {
    "title": "string (required)",
    "content": "string (required)",
    "summary": "string (optional)",
    "cover_image": "string (optional)",
    "category_id": "number (optional)",
    "is_published": "boolean (optional)"
  }
  ```
- **功能**：如果从未发布变为发布，更新发布时间

#### DELETE /api/news/[id]
- **描述**：删除新闻
- **权限**：admin
- **路径参数**：
  - `id`: string - 新闻ID
- **响应**：
  ```json
  {
    "success": true,
    "message": "新闻删除成功"
  }
  ```

---

### 收藏

#### GET /api/favorites
- **描述**：获取用户收藏列表
- **权限**：user
- **响应**：
  ```json
  {
    "favorites": [
      {
        "favorite_id": "number",
        "spot_id": "number",
        "spot_name": "string",
        "location": "string",
        "description": "string",
        "images": ["string"],
        "rating": "number",
        "price": "number",
        "category_name": "string",
        "created_at": "string"
      }
    ],
    "count": "number"
  }
  ```

#### POST /api/favorites
- **描述**：添加收藏
- **权限**：user
- **请求体**：
  ```json
  {
    "spot_id": "number (required)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "message": "Added to favorites",
    "favorite_id": "number"
  }
  ```
- **错误代码**：
  - 400: spot_id is required / Already favorited
  - 404: Spot not found

#### DELETE /api/favorites
- **描述**：取消收藏（通过 spot_id）
- **权限**：user
- **查询参数**：
  - `spot_id`: number (required)
- **响应**：
  ```json
  {
    "success": true,
    "message": "Removed from favorites"
  }
  ```

#### GET /api/favorites/check
- **描述**：检查景点是否已收藏
- **权限**：user
- **查询参数**：
  - `spot_id`: number (required)
- **响应**：
  ```json
  {
    "is_favorited": "boolean",
    "favorite_id": "number | null"
  }
  ```

---

### 管理后台

#### GET /api/admin/users
- **描述**：获取所有用户列表
- **权限**：admin
- **查询参数**：
  - `role`: string (optional) - 角色过滤
- **响应**：
  ```json
  {
    "users": [
      {
        "id": "number",
        "email": "string",
        "full_name": "string",
        "avatar_url": "string",
        "role": "string",
        "created_at": "string",
        "order_count": "number",
        "total_spent": "number"
      }
    ]
  }
  ```

#### PATCH /api/admin/users/[id]
- **描述**：更新用户信息
- **权限**：admin
- **路径参数**：
  - `id`: number - 用户ID
- **请求体**：
  ```json
  {
    "role": "string (optional)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "message": "User updated successfully"
  }
  ```
- **注意**：
  - 不能修改自己的管理员角色
  - status 字段暂不支持，需数据库添加字段

#### GET /api/admin/spots
- **描述**：获取所有景点列表
- **权限**：admin/guide
- **查询参数**：
  - `category`: string (optional)
  - `status`: string (optional)
- **响应**：
  ```json
  {
    "spots": [
      {
        "id": "number",
        "name": "string",
        "description": "string",
        "location": "string",
        "price": "number",
        "rating": "number",
        "is_recommended": "boolean",
        "view_count": "number",
        "status": "string",
        "images": ["string"],
        "category_name": "string"
      }
    ]
  }
  ```

#### POST /api/admin/spots
- **描述**：创建景点
- **权限**：admin/guide
- **请求体**：
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)",
    "location": "string (required)",
    "price": "number (required)",
    "category_id": "number (required)",
    "is_recommended": "boolean (optional)",
    "images": ["string"] (optional)
  }
  ```
- **问题**：
  - 使用 UUID 作为ID，但数据库表使用 AUTOINCREMENT
  - 插入 created_by 字段，但数据库表中没有此字段

#### PATCH /api/admin/spots/[id]
- **描述**：更新景点
- **权限**：admin/guide
- **路径参数**：
  - `id`: string - 景点ID
- **请求体**：所有字段可选
- **响应**：同 POST

#### DELETE /api/admin/spots/[id]
- **描述**：删除景点
- **权限**：admin
- **路径参数**：
  - `id`: string - 景点ID
- **响应**：
  ```json
  {
    "success": true,
    "message": "Spot deleted successfully"
  }
  ```
- **注意**：如果有关联门票则无法删除

#### GET /api/admin/tickets
- **描述**：获取所有门票列表
- **权限**：admin/guide
- **查询参数**：
  - `status`: string (optional)
- **响应**：
  ```json
  {
    "tickets": [
      {
        "id": "number",
        "name": "string",
        "description": "string",
        "price": "number",
        "stock": "number",
        "status": "string",
        "spot_name": "string",
        "spot_location": "string",
        "sold_count": "number"
      }
    ]
  }
  ```

#### POST /api/admin/tickets
- **描述**：创建门票
- **权限**：admin/guide
- **请求体**：
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)",
    "price": "number (required)",
    "stock": "number (required)",
    "spot_id": "number (required)",
    "valid_from": "date (optional)",
    "valid_to": "date (optional)",
    "status": "string (optional, default: active)"
  }
  ```

#### PATCH /api/admin/tickets/[id]
- **描述**：更新门票
- **权限**：admin/guide
- **路径参数**：
  - `id`: number - 门票ID
- **请求体**：所有字段可选

#### DELETE /api/admin/tickets/[id]
- **描述**：删除门票
- **权限**：admin
- **路径参数**：
  - `id`: number - 门票ID
- **注意**：如果有已售出的订单则无法删除

#### GET /api/admin/hotels
- **描述**：获取所有酒店列表
- **权限**：admin/guide
- **查询参数**：
  - `status`: string (optional)
- **响应**：
  ```json
  {
    "hotels": [
      {
        "id": "number",
        "name": "string",
        "description": "string",
        "location": "string",
        "address": "string",
        "rating": "number",
        "amenities": ["string"],
        "images": ["string"],
        "phone": "string",
        "status": "string"
      }
    ]
  }
  ```

#### POST /api/admin/hotels
- **描述**：创建酒店
- **权限**：admin/guide
- **请求体**：
  ```json
  {
    "name": "string (required)",
    "description": "string (optional)",
    "location": "string (required)",
    "address": "string (optional)",
    "rating": "number (required)",
    "amenities": ["string"] (optional),
    "images": ["string"] (optional),
    "contact_phone": "string (optional)",
    "status": "string (optional)"
  }
  ```
- **注意**：
  - 使用 AUTOINCREMENT 自动生成 ID
  - created_by 和 price_range 字段暂不支持，需数据库添加

#### PATCH /api/admin/hotels/[id]
- **描述**：更新酒店
- **权限**：admin/guide
- **路径参数**：
  - `id`: string - 酒店ID
- **请求体**：所有字段可选
- **注意**：使用 amenities 字段（不是 facilities），contact_email 和 price_range 暂不支持

#### DELETE /api/admin/hotels/[id]
- **描述**：删除酒店
- **权限**：admin
- **路径参数**：
  - `id`: string - 酒店ID

#### GET /api/admin/bookings
- **描述**：获取所有预订列表
- **权限**：admin
- **查询参数**：
  - `status`: string (optional)
  - `page`: number (default: 1)
  - `limit`: number (default: 20)
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "bookings": [
        {
          "id": "number",
          "user_email": "string",
          "user_name": "string",
          "hotel_name": "string",
          "room_name": "string",
          "check_in": "date",
          "check_out": "date",
          "guests": "number",
          "total_price": "number",
          "status": "string",
          "room_images": ["string"]
        }
      ],
      "pagination": {
        "total": "number",
        "page": "number",
        "limit": "number",
        "totalPages": "number"
      }
    }
  }
  ```

#### PATCH /api/admin/bookings/[id]
- **描述**：更新预订状态
- **权限**：admin
- **路径参数**：
  - `id`: number - 预订ID
- **请求体**：
  ```json
  {
    "status": "string (required)"
  }
  ```
- **错误代码**：
  - 400: 无效的状态值
  - 404: 预订不存在

#### GET /api/admin/orders
- **描述**：获取所有订单列表
- **权限**：admin/guide
- **查询参数**：
  - `status`: string (optional)
- **响应**：
  ```json
  {
    "orders": [
      {
        "id": "string (UUID)",
        "order_no": "string",
        "total_amount": "number",
        "status": "string",
        "paid_at": "string",
        "created_at": "string",
        "full_name": "string",
        "email": "string",
        "item_count": "number"
      }
    ]
  }
  ```

#### GET /api/admin/orders/[id]
- **描述**：获取订单详情
- **权限**：admin/guide
- **路径参数**：
  - `id`: string (UUID) - 订单ID
- **响应**：
  ```json
  {
    "order": {
      "id": "string (UUID)",
      "order_no": "string",
      "total_amount": "number",
      "status": "string",
      "paid_at": "string",
      "created_at": "string",
      "username": "string",
      "email": "string",
      "items": [
        {
          "id": "string (UUID)",
          "ticket_name": "string",
          "spot_name": "string",
          "price": "number",
          "quantity": "number"
        }
      ]
    }
  }
  ```

#### PATCH /api/admin/orders/[id]
- **描述**：更新订单状态
- **权限**：admin
- **路径参数**：
  - `id`: string (UUID) - 订单ID
- **请求体**：
  ```json
  {
    "status": "string (required)"
  }
  ```
- **响应**：
  ```json
  {
    "success": true,
    "message": "Order updated successfully"
  }
  ```

#### DELETE /api/admin/orders/[id]
- **描述**：删除订单
- **权限**：admin
- **路径参数**：
  - `id`: string (UUID) - 订单ID
- **功能**：同时删除所有订单项

#### GET /api/admin/activities
- **描述**：获取所有活动列表
- **权限**：guide
- **查询参数**：
  - `status`: string (optional)
- **响应**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "title": "string",
        "images": ["string"],
        "participant_count": "number",
        ...
      }
    ]
  }
  ```

#### GET /api/admin/participants
- **描述**：获取所有活动报名列表
- **权限**：admin
- **查询参数**：
  - `status`: string (optional)
  - `activity_id`: string (optional)
  - `page`: number (default: 1)
  - `limit`: number (default: 20)
- **响应**：
  ```json
  {
    "success": true,
    "data": {
      "participants": [
        {
          "id": "number",
          "activity_id": "string",
          "user_id": "number",
          "status": "string",
          "activity_name": "string",
          "user_email": "string",
          "user_name": "string",
          "activity_images": ["string"]
        }
      ],
      "stats": [
        {
          "id": "string",
          "title": "string",
          "max_participants": "number",
          "registered_count": "number",
          "cancelled_count": "number"
        }
      ],
      "pagination": {
        "total": "number",
        "page": "number",
        "limit": "number",
        "totalPages": "number"
      }
    }
  }
  ```

#### GET /api/admin/news
- **描述**：获取所有新闻列表
- **权限**：admin
- **查询参数**：
  - `category`: string (optional)
  - `status`: string (optional) - 'published' | 'draft'
- **响应**：
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "string",
        "title": "string",
        "content": "string",
        "category_name": "string",
        "author_name": "string",
        "is_published": "number",
        "view_count": "number"
      }
    ]
  }
  ```

#### GET /api/admin/analytics
- **描述**：获取数据分析
- **权限**：admin
- **查询参数**：
  - `timeRange`: string (optional, default: '7d') - '7d' | '30d' | '90d' | '1y'
- **响应**：
  ```json
  {
    "overview": {
      "totalUsers": "number",
      "totalOrders": "number",
      "totalRevenue": "number",
      "totalSpots": "number",
      "totalHotels": "number",
      "growthRates": {
        "users": "number",
        "orders": "number",
        "revenue": "number"
      }
    },
    "salesData": [
      {
        "date": "date",
        "users": "number",
        "orders": "number",
        "revenue": "number"
      }
    ],
    "topSpots": [
      {
        "name": "string",
        "orders": "number",
        "revenue": "number",
        "rating": "number"
      }
    ],
    "topTickets": [
      {
        "name": "string",
        "spot_name": "string",
        "sold": "number",
        "revenue": "number"
      }
    ],
    "userStats": [
      {
        "role": "string",
        "count": "number",
        "percentage": "string"
      }
    ],
    "orderStatus": [
      {
        "status": "string",
        "count": "number",
        "percentage": "string"
      }
    ]
  }
  ```

#### GET /api/admin/settings
- **描述**：获取系统设置
- **权限**：admin
- **响应**：
  ```json
  {
    "settings": {
      "site": {
        "name": "string",
        "description": "string",
        "logoUrl": "string",
        "contactEmail": "string",
        "contactPhone": "string",
        "address": "string"
      },
      "features": {
        "enableRegistration": "boolean",
        "enableComments": "boolean",
        "enableFavorites": "boolean",
        "requireEmailVerification": "boolean"
      },
      "notifications": {
        "newOrderEmail": "boolean",
        "newRegistrationEmail": "boolean",
        "lowStockAlert": "boolean",
        "adminEmail": "string"
      },
      "backup": {
        "autoBackup": "boolean",
        "backupFrequency": "string",
        "lastBackup": "string",
        "backupPath": "string"
      }
    }
  }
  ```
- **注意**：设置存储在 data/settings.json 文件中

#### POST /api/admin/settings
- **描述**：保存系统设置
- **权限**：admin
- **请求体**：同 GET 响应
- **响应**：
  ```json
  {
    "success": true,
    "message": "Settings saved successfully"
  }
  ```
- **注意**：设置保存到 data/settings.json 文件

---

## 已知问题

### 1. 数据库字段缺失（需要数据库迁移）

#### 酒店模块
- **问题**：数据库表缺少 `price_min` 和 `price_max` 字段
- **影响**：价格过滤功能已禁用（代码已注释）
- **解决方案**：添加字段后启用相关代码

#### 酒店房间模块
- **问题**：数据库表缺少 `stock` 字段
- **影响**：无法按库存过滤房间，当前使用 status 字段判断可用性
- **解决方案**：添加字段后支持库存管理

#### 活动模块
- **问题**：`/api/activities` GET 请求查询条件使用 `activity_type`，但数据库表中没有此字段
- **位置**：`/app/api/activities/route.ts:37-40`
- **影响**：活动类型过滤功能无法正常工作

#### 用户模块
- **问题**：`/api/admin/users/[id]` PATCH 请求更新 `status` 字段，但数据库表中没有此字段
- **位置**：`/app/api/admin/users/[id]/route.ts:61-64`
- **影响**：用户状态管理功能无法正常工作

#### 景点模块
- **问题**：`/api/admin/spots` POST 请求插�� `created_by` 字段，但数据库表中没有此字段
- **位置**：`/app/api/admin/spots/route.ts:138`
- **影响**：会导致数据库插入失败

#### 酒店管理模块
- **问题**：
  1. `/api/admin/hotels` POST 请求插入 `created_by`、`price_range` 字段，但数据库表中没有这些字段
  2. 代码中引用了未定义的 `contact_email` 变量
  3. `/api/admin/hotels/[id]` PATCH 请求更新 `facilities` 字段，但数据库表中是 `amenities`
- **位置**：`/app/api/admin/hotels/route.ts:120-135`
- **影响**：会导致数据库操作失败或数据不一致

### 2. ID 类型不匹配

#### 订单模块
- **问题**：数据库表 `orders.id` 是 TEXT 类型（UUID），但相关查询和关联使用了 INTEGER 类型
- **影响范围**：
  - `/app/api/orders/*` - 所有订单相关 API
  - `/app/api/admin/orders/*` - 管理后台订单相关 API
- **影响**：可能导致查询失败或数据不一致

#### 购物车模块
- **问题**：数据库表 `cart_items.id` 是 TEXT 类型（UUID），API 正确使用 UUID
- **影响**：正常，但需确保前端也使用字符串类型

#### 新闻模块
- **问题**：数据库��� `news.id` 是 TEXT 类型，但 API 使用 `news_${Date.now()}` 格式而非 UUID
- **位置**：`/app/api/news/route.ts:98`
- **影响**：ID 格式不统一，可能导致维护困难

#### 酒店/活动模块
- **问题**：
  - 数据库表使用 AUTOINCREMENT（INTEGER），但 API 使用 UUID 或时间戳字符串
  - `/api/hotels` POST 使用 `hotel_${Date.now()}`
  - `/api/hotels/[id]/rooms` POST 使用 `room_${Date.now()}`
  - `/api/activities` POST 使用 `activity_${Date.now()}`
- **影响**：数据库插入会失败，因为 AUTOINCREMENT 字段不接受手动指定的字符串值

### 3. 权限检查问题

#### 用户列表 API
- **问题**：`/api/users` GET 和 POST 没有权限检查
- **位置**：`/app/api/users/route.ts`
- **安全风险**：任何人都可以查看用户列表和创建新用户

### 4. 数据验证问题

#### 订单创建
- **状态**：✅ 已修复
- **修复内容**：添加了直接预订模式的必填字段验证

---

## 已完成的修复

### Phase 1（紧急修复） - ✅ 已完成
- ✅ ID 类型不匹配：统一使用 AUTOINCREMENT（酒店、活动、房间等模块）
- ✅ 未定义变量：修复了 contact_email 等未定义变量
- ✅ 权限检查：添加了用户 API 权限检查
- ✅ 字段名修正：修复了 facilities→amenities，status 值等

### Phase 2（重要修复） - ✅ 已完成
- ✅ 酒店价格过滤：注释了不可用功能，添加 TODO
- ✅ 酒店房间状态：修复为正确的 'available' 状态
- ✅ 活动类型过滤：注释了不可用功能，添加 TODO
- ✅ 用户状态管理：注释了不可用功能，添加 TODO
- ✅ 酒店字段名：修复 amenities、phone 字段名
- ✅ 订单验证：添加直接预订模式必填字段验证

### Phase 3（优化完善） - ✅ 已完成
- ✅ 统计功能：实现了 favorites 和 comments 的实时查询
- ✅ 系统设置：实现了基于 JSON 文件的持久化存储
- ✅ API 设计：统一预订取消端点，标记 DELETE 为 deprecated

## 待完成的修复

### 数据库迁移建议

#### 优先级：中

**酒店表添加价格字段：**
```sql
ALTER TABLE hotels ADD COLUMN price_min DECIMAL(10, 2);
ALTER TABLE hotels ADD COLUMN price_max DECIMAL(10, 2);
```

**酒店房间表添加库存字段：**
```sql
ALTER TABLE hotel_rooms ADD COLUMN stock INTEGER DEFAULT 1;
```

**活动表添加类型字段：**
```sql
ALTER TABLE activities ADD COLUMN activity_type TEXT;
```

**用户表添加状态字段：**
```sql
ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));
```

**景点表添加创建者字段：**
```sql
ALTER TABLE spots ADD COLUMN created_by INTEGER;
ALTER TABLE spots ADD FOREIGN KEY (created_by) REFERENCES profiles(id);
```

**酒店表添加扩展字段：**
```sql
ALTER TABLE hotels ADD COLUMN created_by INTEGER;
ALTER TABLE hotels ADD COLUMN price_range TEXT;
ALTER TABLE hotels ADD COLUMN contact_email TEXT;
ALTER TABLE hotels ADD FOREIGN KEY (created_by) REFERENCES profiles(id);
```

### API 优化建议

#### 优先级：低

**新闻 ID 格式统一：**
- 建议将 `news_${Date.now()}` 改为使用 UUID
- 位置：`/app/api/news/route.ts:98`

**错误响应格式统一：**
```json
{
  "success": false,
  "error": "错误消息",
  "code": "ERROR_CODE"
}
```

### 8. 测试建议

**每次修复后需要测试：**
1. 相关 API 的基本功能
2. 数据库查询是否正常
3. 错误处理是否正确
4. 权限检查是否生效

**建议创建测试脚本：**
- 使用 Postman 或类似工具创建 API 测试集合
- 编写自动化测试脚本
- 定期运行回归测试

---

## 附录

### A. 数据库完整 Schema

参见本文档开头的"数据库表结构"部分。

### B. API 命名规范

**推荐的 REST API 命名规范：**
- 使用复数名词：`/api/users`
- 使用小写字母和连字符：`/api/user-profiles`
- 子资源使用嵌套路径：`/api/users/[id]/orders`
- 操作使用动词：`/api/orders/[id]/cancel`

### C. 错误代码标准

**建议的错误代码：**
- 400: Bad Request - 请求参数错误
- 401: Unauthorized - 未认证
- 403: Forbidden - 权限不足
- 404: Not Found - 资源不存在
- 409: Conflict - 资源冲突
- 422: Unprocessable Entity - 验证失败
- 500: Internal Server Error - 服务器错误

### D. 安全建议

1. **身份验证**：
   - 所有非公开 API 都应验证 token
   - token 应使用 httpOnly cookie
   - 定期刷新 token

2. **权限控制**：
   - 实现基于角色的访问控制（RBAC）
   - 检查用户是否有权访问特定资源
   - 记录敏感操作日志

3. **输入验证**：
   - 验证所有用户输入
   - 使用参数化查询防止 SQL 注入
   - 限制上传文件的大小和类型

4. **速率限制**：
   - 实现 API 速率限制
   - 防止暴力破解攻击
   - 限制单个用户的并发请求

---

## 文档变更历史

- **2025-12-15**: 初始版本，完成系统分析和文档生成
- **2025-12-15**: 更新文档反映Phase 1-3修复完成状态
  - Phase 1: 修复ID类型不匹配、未定义变量、权限检查问题
  - Phase 2: 修复字段名不匹配、添加数据验证
  - Phase 3: 实现统计功能、系统设置持久化、统一API设计
  - 更新所有相关API端点的注释说明
  - 重新组织"已知问题"部分，标记已完成的修复
