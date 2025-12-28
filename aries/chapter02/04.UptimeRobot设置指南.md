# UptimeRobot 设置指南 - 避免 Render 自动休眠

> **目的**：通过定期 ping 你的 Render 服务，避免 15 分钟无访问自动休眠
>
> **成本**：完全免费
>
> **效果**：保持服务 24/7 在线

---

## 为什么需要 UptimeRobot？

Render 免费实例会在 **15 分钟无请求后自动休眠**，休眠后的首次访问需要等待 30-60 秒唤醒。

使用 UptimeRobot 每 5 分钟自动访问一次你的网站，就能让服务保持一直运行，用户无需等待。

---

## 📋 设置步骤

### 第一步：注册 UptimeRobot 账号

1. 访问 [uptimerobot.com](https://uptimerobot.com/)
2. 点击右上角 "Sign Up" 注册
3. 填写邮箱和密码
4. 验证邮箱（检查收件箱和垃圾邮件）

**注意**：完全免费，无需信用卡

---

### 第二步：获取你的 Render 服务 URL

部署到 Render 后，你会得到一个 URL，格式类似：

```
https://kiro-travel.onrender.com
```

复制这个 URL，下一步要用。

---

### 第三步：创建监控

1. 登录 UptimeRobot Dashboard
2. 点击 "+ Add New Monitor" 按钮
3. 填写以下信息：

| 字段 | 值 | 说明 |
|------|-----|------|
| **Monitor Type** | `HTTP(s)` | 监控网站 |
| **Friendly Name** | `Kiro Travel` | 监控器名称（随便填） |
| **URL (or IP)** | `https://kiro-travel.onrender.com` | 你的 Render URL |
| **Monitoring Interval** | `5 minutes` | 每 5 分钟检查一次 |

4. 点击 "Create Monitor" 保存

---

### 第四步：验证监控

创建后，UptimeRobot 会立即开始监控：

1. 在 Dashboard 中查看监控状态
2. 应该显示为 "Up" 🟢（绿色）
3. "Response Time" 显示响应时间

**注意**：
- 如果显示 "Down" 🔴，检查 URL 是否正确
- 如果显示 "Paused"，点击监控器，选择 "Resume monitoring"

---

## 📊 查看监控数据

### Dashboard 功能

UptimeRobot Dashboard 提供：

1. **实时状态**
   - 服务是否在线
   - 响应时间
   - 最近一次检查时间

2. **历史统计**
   - 过去 30 天的在线率
   - 宕机时间记录
   - 响应时间趋势图

3. **告警通知**
   - 服务宕机时发送邮件
   - 可配置短信、Slack、Webhook 等

---

## 🔔 配置告警通知（可选）

如果你想在服务宕机时收到通知：

### 邮件通知（默认开启）

1. 进入 "My Settings"
2. 在 "Alert Contacts" 中添加邮箱
3. 验证邮箱
4. 选择通知频率（推荐：每次宕机都通知）

### Slack 通知

1. 在 Slack 中创建 Incoming Webhook
2. 在 UptimeRobot 中添加 Webhook URL
3. 选择监控器绑定 Slack 通知

### 其他通知方式

UptimeRobot 还支持：
- Telegram
- Discord
- PagerDuty
- Pushover
- Webhook（自定义）

---

## 🧪 测试监控

### 方法一：查看日志

1. 在 UptimeRobot Dashboard 点击你的监控器
2. 切换到 "Logs" 标签
3. 查看最近的检查记录

每条记录显示：
- 检查时间
- 响应时间
- HTTP 状态码
- 响应内容（部分）

### 方法二：故意触发宕机

1. 在 Render Dashboard 中手动停止服务
2. 等待 5 分钟
3. 查��� UptimeRobot 是否发送了宕机通知
4. 重新启动 Render 服务
5. 查看 UptimeRobot 是否发送了恢复通知

---

## 📈 监控效果

### 预期效果

✅ **有 UptimeRobot 监控**：
- 服务保持 24/7 在线
- 用户访问响应时间：< 1 秒
- 在线率：99.9%+

❌ **无监控**：
- 15 分钟无访问后休眠
- 用户首次访问等待：30-60 秒
- 用户体验差

### 实际数据对比

| 指标 | 无监控 | 有 UptimeRobot |
|------|--------|---------------|
| **响应时间** | 30-60 秒（冷启动） | < 1 秒 |
| **在线率** | 不稳定 | 99.9%+ |
| **用户体验** | 差（需等待） | 好（即时响应） |

---

## 🛠️ 高级配置

### 配置健康检查端点（可选）

为了更精确的监控，可以创建一个健康检查 API：

1. 在项目中创建 `app/api/health/route.ts`：

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // 测试数据库连接
    const result = db.prepare('SELECT 1 as ok').get()

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: result ? 'connected' : 'disconnected'
    })
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Database connection failed' },
      { status: 500 }
    )
  }
}
```

2. 在 UptimeRobot 中将 URL 改为：
   ```
   https://kiro-travel.onrender.com/api/health
   ```

3. 配置关键字监控：
   - Keyword Type: `Keyword Exists`
   - Keyword: `"status":"ok"`

这样可以确保不仅服务在线，数据库也正常工作。

---

## 🔍 故障排查

### 问题 1：监控显示 "Down"

**可能原因**：
- URL 输入错误
- Render 服务��启动
- 部署失败

**解决方案**：
1. 检查 URL 是否正确（复制 Render Dashboard 中的 URL）
2. 访问 Render Dashboard 确认服务状态为 "Live"
3. 查看 Render 部署日志是否有错误

### 问题 2：响应时间过长（> 5 秒）

**可能原因**：
- 服务刚从休眠中唤醒
- 数据库查询慢
- 网络延迟

**解决方案**：
1. 等待几分钟，让服务完全启动
2. 优化数据库查询（添加索引）
3. 选择离你更近的 Render 区域

### 问题 3：收不到告警邮件

**可能原因**：
- 邮箱验证未完成
- 邮件被标记为垃圾邮件
- 通知设置错误

**解决方案**：
1. 检查 UptimeRobot 中的邮箱是否已验证
2. 查看垃圾邮件箱
3. 将 uptimerobot.com 添加到白名��

---

## 💡 最佳实践

### 1. 监控间隔选择

| 间隔 | 优点 | 缺点 | 推荐场景 |
|------|------|------|---------|
| **1 分钟** | 最快发现问题 | 可能触发速率限制 | 生产环境 |
| **5 分钟** | 平衡监控和资源 | ✅ 推荐 | 演示项目 |
| **30 分��** | 节省资源 | 无法防止休眠 | 不推荐 |

**推荐**：演示项目使用 **5 分钟**间隔

### 2. 告警通知设置

建议配置：
- ✅ 宕机时立即通知
- ✅ 恢复时通知
- ❌ 不要每次检查都通知（会收到大量邮件）

### 3. 多个监控器

如果你有多个 Render 服务，可以创建多个监控器：

```
Monitor 1: 主网站 (https://kiro-travel.onrender.com)
Monitor 2: API 健康检查 (https://kiro-travel.onrender.com/api/health)
Monitor 3: 数据库连接 (自定义检查)
```

---

## 📊 监控数据解读

### 在线率（Uptime）

- **99.9%+** - 优秀 ✅
- **99.0-99.8%** - 良好 ⚠️
- **< 99%** - 需要改进 ❌

### 响应时间（Response Time）

- **< 1 秒** - 优秀 ✅
- **1-3 秒** - 可接受 ⚠️
- **> 3 秒** - 需要优化 ❌

### 宕机时长（Downtime）

- **< 5 分钟/月** - 优秀 ✅
- **5-30 分钟/月** - 可接受 ⚠️
- **> 30 分钟/月** - 需要调查 ❌

---

## 🆓 免费套餐限制

UptimeRobot 免费版限制：

| 项目 | 限制 | 说明 |
|------|------|------|
| **监控器数量** | 50 个 | 足够个人项目使用 |
| **检查间隔** | 最短 5 分钟 | 符合我们的需求 |
| **告警通知** | 无限制 | 邮件、Slack 等都免费 |
| **监控历史** | 2 个月 | 足够查看趋势 |
| **日志保留** | 永久 | 宕机日志永久保存 |

**结论**：免费版对演示项目完全够用！

---

## 🔗 相关资源

### 官方文档
- [UptimeRobot 官网](https://uptimerobot.com/)
- [UptimeRobot API 文档](https://uptimerobot.com/api/)
- [UptimeRobot 博客](https://blog.uptimerobot.com/)

### 替代方案

如果你想尝试其他监控服务：

1. **Cron-job.org**
   - 网址：https://cron-job.org/
   - 特点：定时任务，可自定义间隔

2. **Pingdom**（Datadog）
   - 网址：https://www.pingdom.com/
   - 特点：功能更强大，但免费额度较少

3. **Freshping**（Freshworks）
   - 网址：https://www.freshworks.com/website-monitoring/
   - 特点：界面漂亮，功能丰富

4. **StatusCake**
   - 网址：https://www.statuscake.com/
   - 特点：免费版可监控 10 个网站

---

## ✅ 设置完成检查清单

设置完成后，确认以下项目：

- [ ] UptimeRobot 账号已注册并验证邮箱
- [ ] 已创建监控器，URL 正确
- [ ] 监控间隔设置为 5 分钟
- [ ] 监控状态显示为 "Up" 🟢
- [ ] 已配置邮件告警通知
- [ ] 等待 30 分钟，确认服务未休眠
- [ ] 访问网站，响应时间 < 1 秒

---

## 🎉 总结

通过 UptimeRobot 监控，你可以：

✅ **避免 Render 自动休眠** - 服务保持 24/7 在线
✅ **提升用户体验** - 无需等待冷启动
✅ **监控服务健康** - 及时发现并解决问题
✅ **完全免费** - 无任何费用

**下一步**：
1. 按照本指南设置 UptimeRobot
2. 等待 30 分钟验证效果
3. 访问你的网站，应该即时响应

如果有任何问题，参考"故障排查"章节或查看 UptimeRobot 官方文档。
