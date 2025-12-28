import { SpotsList } from "@/components/spots/spots-list"
import { SpotsFilter } from "@/components/spots/spots-filter"
import type { Spot, SpotCategory } from "@/lib/types"
import { dbQuery, dbGet } from "@/lib/db-utils"

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic'

export default async function SpotsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>
}) {
  const params = await searchParams

  // 获取分类
  const categories = dbQuery<SpotCategory>(`
    SELECT * FROM spot_categories
    ORDER BY name
  `)

  // 构建查询
  let whereClauses: string[] = ["s.status = 'active'"]
  let queryParams: any[] = []

  if (params.category) {
    whereClauses.push('s.category_id = ?')
    queryParams.push(params.category)
  }

  if (params.search) {
    whereClauses.push('(s.name LIKE ? OR s.location LIKE ?)')
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  // 排序
  let orderBy = 's.created_at DESC'
  switch (params.sort) {
    case "price-asc":
      orderBy = 's.price ASC'
      break
    case "price-desc":
      orderBy = 's.price DESC'
      break
    case "rating":
      orderBy = 's.rating DESC'
      break
    case "popular":
      orderBy = 's.view_count DESC'
      break
  }

  // 获取景点
  const spotsRaw = dbQuery(`
    SELECT s.*, c.name as category_name
    FROM spots s
    LEFT JOIN spot_categories c ON s.category_id = c.id
    ${whereClause}
    ORDER BY ${orderBy}
  `, queryParams)

  // 解��� JSON 字段
  const spots: Spot[] = spotsRaw.map((spot: any) => ({
    ...spot,
    images: spot.images ? JSON.parse(spot.images) : [],
    category: spot.category_name ? { name: spot.category_name } : null,
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">景点探索</h1>
        <p className="text-muted-foreground mt-2">发现令人心动的旅游目的地</p>
      </div>

      <SpotsFilter categories={categories || []} />

      <SpotsList spots={spots || []} totalCount={spots.length} />
    </div>
  )
}
