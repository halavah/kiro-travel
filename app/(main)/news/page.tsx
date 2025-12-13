import { NewsList } from "@/components/news/news-list"
import { NewsFilter } from "@/components/news/news-filter"
import type { News } from "@/lib/types"
import { dbQuery } from "@/lib/db-utils"

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category_id?: string }>
}) {
  const params = await searchParams

  // 构建查询
  let whereClauses: string[] = ["n.is_published = 1"]
  let queryParams: any[] = []

  if (params.search) {
    whereClauses.push("(n.title LIKE ? OR n.content LIKE ?)")
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  if (params.category_id) {
    whereClauses.push("n.category_id = ?")
    queryParams.push(params.category_id)
  }

  const whereClause = whereClauses.join(" AND ")

  // 获取新闻分类
  const categories = dbQuery(`
    SELECT * FROM news_categories
    ORDER BY name
  `)

  // 查询新闻列表
  const newsRaw = dbQuery(
    `
    SELECT
      n.*,
      nc.name as category_name,
      p.full_name as author_name
    FROM news n
    LEFT JOIN news_categories nc ON n.category_id = nc.id
    LEFT JOIN profiles p ON n.author_id = p.id
    WHERE ${whereClause}
    ORDER BY n.published_at DESC
  `,
    queryParams,
  )

  // 类型转换
  const news: News[] = newsRaw.map((item: any) => ({
    ...item,
    is_published: Boolean(item.is_published),
  }))

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