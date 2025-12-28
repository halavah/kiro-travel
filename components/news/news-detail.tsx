"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Eye, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { News } from "@/lib/types"

interface NewsDetailProps {
  news: News
  relatedNews: { id: string; title: string; cover_image: string | null; published_at: string }[]
}

export function NewsDetail({ news, relatedNews }: NewsDetailProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/news"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        返回新闻列表
      </Link>

      <article className="space-y-6">
        <header className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">{news.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(news.published_at).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {news.view_count} 阅读
            </div>
          </div>
        </header>

        {news.cover_image && (
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
            <img src={news.cover_image || "/placeholder.svg"} alt={news.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="prose prose-lg max-w-none">
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{news.content}</p>
        </div>

        <Separator />

        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            分享文章
          </Button>
        </div>
      </article>

      {/* 相关新闻 */}
      {relatedNews.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>相关新闻</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relatedNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="flex gap-4 group hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                >
                  <div className="w-24 h-16 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={item.cover_image || "/placeholder.svg?height=64&width=96&query=news"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(item.published_at).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
