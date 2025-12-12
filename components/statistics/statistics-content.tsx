"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { MapPin, TrendingUp, Eye, Star } from "lucide-react"

interface CategoryStats {
  category: string
  count: number
  total_views: number
  avg_rating: number
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

export function StatisticsContent() {
  const [stats, setStats] = useState<CategoryStats[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSpots, setTotalSpots] = useState(0)
  const [totalViews, setTotalViews] = useState(0)

  useEffect(() => {
    fetchStatistics()
  }, [])

  async function fetchStatistics() {
    try {
      const { data: spots } = await supabase.from("spots").select("category, views, rating")

      if (spots) {
        // 按类别分组统计
        const categoryMap = new Map<string, { count: number; views: number; ratings: number[] }>()

        spots.forEach((spot) => {
          const cat = spot.category || "未分类"
          if (!categoryMap.has(cat)) {
            categoryMap.set(cat, { count: 0, views: 0, ratings: [] })
          }
          const data = categoryMap.get(cat)!
          data.count++
          data.views += spot.views || 0
          if (spot.rating) data.ratings.push(spot.rating)
        })

        const statsData: CategoryStats[] = []
        categoryMap.forEach((value, key) => {
          statsData.push({
            category: key,
            count: value.count,
            total_views: value.views,
            avg_rating:
              value.ratings.length > 0
                ? Number((value.ratings.reduce((a, b) => a + b, 0) / value.ratings.length).toFixed(1))
                : 0,
          })
        })

        // 按数量排序
        statsData.sort((a, b) => b.count - a.count)
        setStats(statsData)
        setTotalSpots(spots.length)
        setTotalViews(spots.reduce((sum, s) => sum + (s.views || 0), 0))
      }
    } catch (error) {
      console.error("Error fetching statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const pieData = stats.map((s) => ({ name: s.category, value: s.count }))

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">景点总数</p>
                <p className="text-2xl font-bold">{totalSpots}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">分类数量</p>
                <p className="text-2xl font-bold">{stats.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100">
                <Eye className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总浏览量</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">平均评分</p>
                <p className="text-2xl font-bold">
                  {stats.length > 0 ? (stats.reduce((sum, s) => sum + s.avg_rating, 0) / stats.length).toFixed(1) : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <Tabs defaultValue="bar" className="w-full">
        <TabsList>
          <TabsTrigger value="bar">柱状图</TabsTrigger>
          <TabsTrigger value="line">折线图</TabsTrigger>
          <TabsTrigger value="pie">饼图</TabsTrigger>
        </TabsList>

        <TabsContent value="bar">
          <Card>
            <CardHeader>
              <CardTitle>景点分类数量统计</CardTitle>
              <CardDescription>展示各类景点的数量分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => [value, "景点数量"]}
                      labelFormatter={(label) => `分类: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="count" name="景点数量" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="line">
          <Card>
            <CardHeader>
              <CardTitle>景点浏览量与评分趋势</CardTitle>
              <CardDescription>展示各类景点的浏览量和平均评分</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="total_views"
                      name="总浏览量"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6" }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avg_rating"
                      name="平均评分"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pie">
          <Card>
            <CardHeader>
              <CardTitle>景点分类占比</CardTitle>
              <CardDescription>展示各类景点的比例分布</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [value, "景点数量"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 详细数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>分类详细数据</CardTitle>
          <CardDescription>各分类的详细统计信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">分类名称</th>
                  <th className="text-center py-3 px-4 font-medium">景点数量</th>
                  <th className="text-center py-3 px-4 font-medium">总浏览量</th>
                  <th className="text-center py-3 px-4 font-medium">平均评分</th>
                  <th className="text-center py-3 px-4 font-medium">占比</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, index) => (
                  <tr key={stat.category} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {stat.category}
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">{stat.count}</td>
                    <td className="text-center py-3 px-4">{stat.total_views.toLocaleString()}</td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {stat.avg_rating}
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      {totalSpots > 0 ? ((stat.count / totalSpots) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
