"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Star, Eye, TrendingUp, Download } from "lucide-react"
import { toast } from "sonner"
import type { Spot } from "@/lib/types"

interface SpotsListProps {
  spots: Spot[]
  totalCount: number
}

export function SpotsList({ spots, totalCount }: SpotsListProps) {
  const handleExportExcel = () => {
    if (spots.length === 0) {
      toast.error("暂无数据可导出")
      return
    }

    // 定义CSV头部
    const headers = ["景点名称", "分类", "所在地", "门票价格", "评分", "浏览量", "是否推荐", "描述"]

    // 生成CSV内容
    const csvContent = [
      headers.join(","),
      ...spots.map((spot) =>
        [
          `"${spot.name || ""}"`,
          `"${spot.category?.name || "未分类"}"`,
          `"${spot.location || ""}"`,
          spot.price || 0,
          spot.rating || 0,
          spot.view_count || 0,
          spot.is_recommended ? "是" : "否",
          `"${(spot.description || "").replace(/"/g, '""').replace(/\n/g, " ")}"`,
        ].join(","),
      ),
    ].join("\n")

    // 添加BOM以支持中文
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `景点信息_${new Date().toLocaleDateString("zh-CN").replace(/\//g, "-")}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("导出成功")
  }

  if (spots.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">暂无景点信息</p>
          <p className="text-sm mt-2">请尝试其他搜索条件</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">共找到 {totalCount} 个景点</div>
        <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          导出Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {spots.map((spot) => (
          <Link key={spot.id} href={`/spots/${spot.id}`}>
            <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={spot.images?.[0] || "/placeholder.svg?height=200&width=300&query=scenic landscape"}
                  alt={spot.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  {spot.is_recommended && (
                    <Badge className="bg-primary">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      推荐
                    </Badge>
                  )}
                  {spot.category && <Badge variant="secondary">{spot.category.name}</Badge>}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {spot.name}
                </h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{spot.location}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{spot.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{spot.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="text-xs">{spot.view_count}</span>
                    </div>
                  </div>
                  <div className="text-primary font-semibold">{spot.price > 0 ? `¥${spot.price}` : "免费"}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
