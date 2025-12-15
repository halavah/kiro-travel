import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken } from "@/lib/auth"
import { dbQuery } from "@/lib/db-utils"
import { ActivitiesParticipationList } from "@/components/profile/activities-participation-list"

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic'

export default async function MyActivitiesPage() {
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

  // 获取用户的活动报名列表
  const participations = dbQuery(`
    SELECT
      p.id,
      p.activity_id,
      p.status as participation_status,
      p.created_at as joined_at,
      a.title as activity_name,
      a.description,
      a.location,
      a.start_time,
      a.end_time,
      a.price,
      a.max_participants,
      a.images
    FROM activity_participants p
    INNER JOIN activities a ON p.activity_id = a.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `, [decoded.userId])

  // 解析 JSON 字段
  const participationsWithImages = participations.map((item: any) => ({
    ...item,
    images: item.images ? JSON.parse(item.images) : []
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">我的活动</h1>
        <p className="text-muted-foreground">查看和管理您的活动报名</p>
      </div>

      <ActivitiesParticipationList participations={participationsWithImages} />
    </div>
  )
}
