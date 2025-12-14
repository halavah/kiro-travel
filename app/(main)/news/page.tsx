import { NewsList } from "@/components/news/news-list"
import { NewsFilter } from "@/components/news/news-filter"
import type { News } from "@/lib/types"

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category_id?: string }>
}) {
  const params = await searchParams

  // news 和 news_categories 表不存在，暂时返回空数据
  const categories: any[] = []
  const news: News[] = []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">新闻中心</h1>
        <p className="text-muted-foreground">获取最新旅游资讯和行业动态</p>
      </div>
      <NewsFilter categories={categories} />
      <NewsList news={news} totalCount={news.length} />
    </div>
  )
}