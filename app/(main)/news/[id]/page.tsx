import { notFound } from "next/navigation"
import { NewsDetail } from "@/components/news/news-detail"
import type { News } from "@/lib/types"
import { dbGet, dbQuery, dbRun } from "@/lib/db-utils"

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic'

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 获取新闻信息
  const newsRaw = dbGet(
    `
    SELECT
      n.*,
      nc.name as category_name,
      p.full_name as author_name
    FROM news n
    LEFT JOIN news_categories nc ON n.category_id = nc.id
    LEFT JOIN profiles p ON n.author_id = p.id
    WHERE n.id = ? AND n.is_published = 1
  `,
    [id],
  )

  if (!newsRaw) {
    notFound()
  }

  // 类型转换
  const news: News = {
    ...newsRaw,
    is_published: Boolean(newsRaw.is_published),
  }

  // 更新浏览量
  dbRun(
    `
    UPDATE news
    SET view_count = view_count + 1
    WHERE id = ?
  `,
    [id],
  )

  // 获取相关新闻（同分类）
  const relatedNewsRaw = dbQuery(
    `
    SELECT id, title, cover_image, published_at
    FROM news
    WHERE category_id = ? AND id != ? AND is_published = 1
    ORDER BY published_at DESC
    LIMIT 5
  `,
    [news.category_id, id],
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <NewsDetail news={news} relatedNews={relatedNewsRaw} />
    </div>
  )
}
