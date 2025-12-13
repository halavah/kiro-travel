import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, ShoppingCart, Ticket, Hotel, TrendingUp } from "lucide-react"

export default function AdminDashboard() {
  // TODO: Fetch real statistics from API
  const stats = {
    users: 1250,
    orders: 856,
    revenue: 128500,
    spots: 45,
    hotels: 32
  }

  const recentOrders = [
    { id: "ORD001", user: "张三", amount: 299, status: "paid" },
    { id: "ORD002", user: "李四", amount: 599, status: "pending" },
    { id: "ORD003", user: "王五", amount: 399, status: "cancelled" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">管理后台</h1>
        <p className="text-muted-foreground">查看和管理平台的各项数据</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">用户总数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% 较上月
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">订单总数</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% 较上月
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +18.2% 较上月
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">景点数量</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.spots}</div>
            <p className="text-xs text-muted-foreground">
              +2 新增本月
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">酒店数量</CardTitle>
            <Hotel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hotels}</div>
            <p className="text-xs text-muted-foreground">
              +1 新增本月
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 最近订单 */}
      <Card>
        <CardHeader>
          <CardTitle>最近订单</CardTitle>
          <CardDescription>最新的用户订单列表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {order.id}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    用户：{order.user}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">¥{order.amount}</span>
                  <Badge variant={
                    order.status === 'paid' ? 'default' :
                    order.status === 'pending' ? 'secondary' : 'destructive'
                  }>
                    {order.status === 'paid' ? '已支付' :
                     order.status === 'pending' ? '待支付' : '已取消'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}