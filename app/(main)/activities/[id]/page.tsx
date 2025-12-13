import { notFound } from "next/navigation"
import { ActivityDetail } from "@/components/activities/activity-detail"
import type { Activity } from "@/lib/types"
import { dbGet, dbRun } from "@/lib/db-utils"

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

  return (
    <div className="container mx-auto px-4 py-8">
      <ActivityDetail activity={activity} />
    </div>
  )
}
