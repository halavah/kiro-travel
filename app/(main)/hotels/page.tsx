import { HotelsList } from "@/components/hotels/hotels-list"
import { HotelsFilter } from "@/components/hotels/hotels-filter"
import type { Hotel } from "@/lib/types"
import { dbQuery } from "@/lib/db-utils"

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic'

export default async function HotelsPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; search?: string; min_price?: string; max_price?: string; star_rating?: string }>
}) {
  const params = await searchParams

  // 构建查询
  let whereClauses: string[] = ["h.status = 'active'"]
  let queryParams: any[] = []

  if (params.search) {
    whereClauses.push("(h.name LIKE ? OR h.description LIKE ?)")
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  if (params.location) {
    whereClauses.push("h.location LIKE ?")
    queryParams.push(`%${params.location}%`)
  }

  if (params.min_price) {
    whereClauses.push("h.price_min >= ?")
    queryParams.push(parseFloat(params.min_price))
  }

  if (params.max_price) {
    whereClauses.push("h.price_max <= ?")
    queryParams.push(parseFloat(params.max_price))
  }

  if (params.star_rating) {
    whereClauses.push("h.star_rating = ?")
    queryParams.push(parseInt(params.star_rating))
  }

  const whereClause = whereClauses.join(" AND ")

  // 查询酒店列表
  const hotelsRaw = dbQuery(
    `
    SELECT
      h.*,
      COUNT(DISTINCT hr.id) as room_count,
      MIN(hr.price_per_night) as price_min,
      MAX(hr.price_per_night) as price_max
    FROM hotels h
    LEFT JOIN hotel_rooms hr ON h.id = hr.hotel_id AND hr.status = 'available'
    WHERE ${whereClause}
    GROUP BY h.id
    ORDER BY h.created_at DESC
  `,
    queryParams,
  )

  // 解析 JSON 字段
  const hotels: Hotel[] = hotelsRaw.map((hotel: any) => ({
    ...hotel,
    images: hotel.images ? JSON.parse(hotel.images) : [],
    amenities: hotel.amenities ? JSON.parse(hotel.amenities) : [],
    is_active: hotel.status === "active",
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">酒店预订</h1>
        <p className="text-muted-foreground">为您精选优质酒店,享受舒适住宿体验</p>
      </div>
      <HotelsFilter />
      <HotelsList hotels={hotels} totalCount={hotels.length} />
    </div>
  )
}
