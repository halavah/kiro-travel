import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken } from "@/lib/auth"
import { dbQuery } from "@/lib/db-utils"
import { BookingsList } from "@/components/profile/bookings-list"

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic'

export default async function BookingsPage() {
  // 验证用户登录
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    redirect("/auth/sign-in")
  }

  const decoded = verifyToken(token)
  if (!decoded) {
    redirect("/auth/sign-in")
  }

  // 获取用户的酒店预订列表
  const bookings = dbQuery(`
    SELECT
      b.id,
      b.hotel_name,
      b.room_name,
      b.check_in,
      b.check_out,
      b.guests,
      b.total_price,
      b.status,
      b.created_at,
      r.images as room_images
    FROM hotel_bookings b
    LEFT JOIN hotel_rooms r ON b.room_id = r.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `, [decoded.userId])

  // 解析 JSON 字段
  const bookingsWithImages = bookings.map((booking: any) => ({
    ...booking,
    room_images: booking.room_images ? JSON.parse(booking.room_images) : []
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">我的预订</h1>
        <p className="text-muted-foreground">查看和管理您的酒店预订</p>
      </div>

      <BookingsList bookings={bookingsWithImages} />
    </div>
  )
}
