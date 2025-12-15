import { NewsList } from "@/components/news/news-list"
import { NewsFilter } from "@/components/news/news-filter"
import type { News } from "@/lib/types"
import { dbQuery } from "@/lib/db-utils"

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic'

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category_id?: string }>
}) {
  const params = await searchParams

  // 获取新闻分类
  const categories = dbQuery(`
    SELECT * FROM news_categories
    ORDER BY sort_order ASC
  `)

  // 构建查询条件
  let whereClause = 'WHERE n.is_published = 1'
  const queryParams: any[] = []

  if (params.search) {
    whereClause += ' AND (n.title LIKE ? OR n.content LIKE ?)'
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  if (params.category_id) {
    whereClause += ' AND n.category_id = ?'
    queryParams.push(params.category_id)
  }

  // 获取新闻列表
  const news: News[] = dbQuery(`
    SELECT n.*, nc.name as category_name, p.full_name as author_name
    FROM news n
    LEFT JOIN news_categories nc ON n.category_id = nc.id
    LEFT JOIN profiles p ON n.author_id = p.id
    ${whereClause}
    ORDER BY n.published_at DESC
    LIMIT 20
  `, queryParams)

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