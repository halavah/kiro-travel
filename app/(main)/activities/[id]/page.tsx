import { notFound } from "next/navigation"
import { ActivityDetail } from "@/components/activities/activity-detail"
import type { Activity } from "@/lib/types"
import { dbGet, dbRun } from "@/lib/db-utils"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 获取活动信息
  const activityRaw = dbGet(`
    SELECT *
    FROM activities
    WHERE id = ? AND status = 'active'
  `, [id])

  if (!activityRaw) {
    notFound()
  }

  // 解析 JSON 字段
  const activity: Activity = {
    ...activityRaw,
    images: activityRaw.images ? JSON.parse(activityRaw.images) : [],
    is_active: activityRaw.status === 'active',
  } as Activity

  // 获取用户登录状态和报名状态
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  let isLoggedIn = false
  let hasJoined = false

  if (token) {
    const decoded = verifyToken(token)
    isLoggedIn = !!decoded

    if (decoded) {
      // 检查用户是否已经报名
      const participant = dbGet(`
        SELECT id FROM activity_participants
        WHERE activity_id = ? AND user_id = ? AND status = 'registered'
      `, [id, decoded.userId])

      hasJoined = !!participant
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ActivityDetail activity={activity} isLoggedIn={isLoggedIn} hasJoined={hasJoined} />
    </div>
  )
}
