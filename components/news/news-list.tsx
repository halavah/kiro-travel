"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Newspaper, Eye, Calendar } from "lucide-react"
import type { News } from "@/lib/types"

interface NewsListProps {
  news: News[]
  totalCount: number
}

export function NewsList({ news }: NewsListProps) {
  if (news.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground">
          <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">暂无新闻资讯</p>
        </div>
      </div>
    )
  }

  // 第一条新闻作为头条
  const headline = news[0]
  const restNews = news.slice(1)

  return (
    <div className="space-y-8">
      {/* 头条新闻 */}
      {headline && (
        <Link href={`/news/${headline.id}`}>
          <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-80 overflow-hidden">
                <img
                  src={headline.cover_image || "/placeholder.svg?height=320&width=600&query=travel news headline"}
                  alt={headline.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardContent className="p-6 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  {new Date(headline.published_at).toLocaleDateString("zh-CN")}
                  <span className="mx-2">|</span>
                  <Eye className="h-4 w-4" />
                  {headline.view_count} 阅读
                </div>
                <h2 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-4">
                  {headline.title}
                </h2>
                <p className="text-muted-foreground line-clamp-3">{headline.summary || headline.content}</p>
              </CardContent>
            </div>
          </Card>
        </Link>
      )}

      {/* 其他新闻 */}
      {restNews.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restNews.map((item) => (
            <Link key={item.id} href={`/news/${item.id}`}>
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={item.cover_image || "/placeholder.svg?height=200&width=400&query=travel news"}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(item.published_at).toLocaleDateString("zh-CN")}
                    <span className="mx-1">|</span>
                    <Eye className="h-3.5 w-3.5" />
                    {item.view_count}
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.summary}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
