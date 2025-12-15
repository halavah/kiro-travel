import { notFound } from "next/navigation"
import { HotelDetail } from "@/components/hotels/hotel-detail"
import type { Hotel, HotelRoom } from "@/lib/types"
import { dbGet, dbQuery } from "@/lib/db-utils"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic'

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 获取酒店信息
  const hotelRaw = dbGet(
    `
    SELECT * FROM hotels
    WHERE id = ? AND status = 'active'
  `,
    [id],
  )

  if (!hotelRaw) {
    notFound()
  }

  // 获取房间列表
  const roomsRaw = dbQuery(
    `
    SELECT * FROM hotel_rooms
    WHERE hotel_id = ? AND status = 'available'
    ORDER BY price_per_night ASC
  `,
    [id],
  )

  // 解析 JSON 字段
  const hotel: Hotel & { rooms: HotelRoom[] } = {
    ...hotelRaw,
    images: hotelRaw.images ? JSON.parse(hotelRaw.images) : [],
    amenities: hotelRaw.amenities ? JSON.parse(hotelRaw.amenities) : [],
    is_active: hotelRaw.status === "active",
    rooms: roomsRaw.map((room: any) => ({
      ...room,
      price: room.price_per_night, // 映射字段名
      capacity: room.max_occupancy, // 映射字段名
      stock: 10, // 临时设置库存，后续可以从数据库获取
      images: room.images ? JSON.parse(room.images) : [],
      amenities: room.amenities ? JSON.parse(room.amenities) : [],
      is_active: room.status === "available",
    })),
  }

  // 获取用户登录状态
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  let isLoggedIn = false
  if (token) {
    const decoded = verifyToken(token)
    isLoggedIn = !!decoded
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <HotelDetail hotel={hotel} isLoggedIn={isLoggedIn} />
    </div>
  )
}
