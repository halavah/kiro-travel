"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
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
import { MapPin, TrendingUp, Eye, Star, Loader2, Download } from "lucide-react"
import * as XLSX from 'xlsx'
import { toast } from "sonner"

interface CategoryStats {
  category: string
  count: number
  total_views: number
  avg_rating: number
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

const fetcher = (url: string) => {
  return fetch(url).then(r => {
    if (!r.ok) throw new Error('获取统计数据失败')
    return r.json()
  })
}

export function StatisticsContent() {
  const { data, error, isLoading } = useSWR('/api/statistics', fetcher)

  const stats: CategoryStats[] = data?.data?.categoryStats || []
  const totalSpots = data?.data?.totalSpots || 0
  const totalViews = data?.data?.totalViews || 0

  const handleExportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = stats.map((stat, index) => ({
        '分类名称': stat.category,
        '景点数量': stat.count,
        '总浏览量': stat.total_views,
        '平均评分': stat.avg_rating,
        '占比': totalSpots > 0 ? ((stat.count / totalSpots) * 100).toFixed(1) + '%' : '0%'
      }))

      // Add summary row
      const avgRating = stats.length > 0 ? (stats.reduce((sum, s) => sum + s.avg_rating, 0) / stats.length).toFixed(1) : '0'
      excelData.push({
        '分类名称': '总计',
        '景点数量': totalSpots,
        '总浏览量': totalViews,
        '平均评分': Number(avgRating),
        '占比': '100%'
      })

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, '景点统计')

      // Set column widths
      worksheet['!cols'] = [
        { wch: 15 },  // 分类名称
        { wch: 12 },  // 景点数量
        { wch: 12 },  // 总浏览量
        { wch: 12 },  // 平均评分
        { wch: 10 }   // 占比
      ]

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0]
      const filename = `景点统计数据_${date}.xlsx`

      // Download file
      XLSX.writeFile(workbook, filename)

      toast.success('数据导出成功！')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('导出失败，请重试')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-muted-foreground">
          <p className="text-lg">加载统计数据失败</p>
        </div>
      </div>
    )
  }

  const pieData = stats.map((s) => ({ name: s.category, value: s.count }))

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExportToExcel} className="gap-2">
          <Download className="h-4 w-4" />
          导出 Excel
        </Button>
      </div>

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
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
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
                  <th className="text-center py-3 px-4 font-medium">总���览量</th>
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
