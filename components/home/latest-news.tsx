"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Eye, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { News } from "@/lib/types"

export function LatestNews() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news?is_published=true&limit=3')

        if (!res.ok) {
          throw new Error('Failed to fetch news')
        }

        const data = await res.json()
        if (data.success && data.data) {
          setNews(data.data)
        }
      } catch (error) {
        console.error("Error fetching news:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">最新资讯</h2>
            <p className="text-muted-foreground">了解旅游行业最新动态</p>
          </div>
          <Link href="/news">
            <Button variant="outline" className="gap-2 bg-transparent">
              查看全部 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {news.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {news.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`}>
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow group">
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src={
                        item.cover_image ||
                        `/placeholder.svg?height=200&width=350&query=${encodeURIComponent(item.title + " travel news")}`
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {item.summary || item.content?.substring(0, 100)}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(item.published_at).toLocaleDateString("zh-CN")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {item.view_count || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">暂无新闻</div>
        )}
      </div>
    </section>
  )
}
