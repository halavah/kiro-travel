import { ActivitiesList } from "@/components/activities/activities-list"
import { ActivitiesFilter } from "@/components/activities/activities-filter"
import type { Activity } from "@/lib/types"
import { dbQuery } from "@/lib/db-utils"

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic'

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; search?: string; activity_type?: string }>
}) {
  const params = await searchParams

  // 构建查询
  let whereClauses: string[] = ["a.status = 'active'"]
  let queryParams: any[] = []

  if (params.search) {
    whereClauses.push("(a.title LIKE ? OR a.description LIKE ?)")
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  if (params.location) {
    whereClauses.push("a.location LIKE ?")
    queryParams.push(`%${params.location}%`)
  }

  if (params.activity_type) {
    whereClauses.push("a.activity_type = ?")
    queryParams.push(params.activity_type)
  }

  const whereClause = whereClauses.join(" AND ")

  // 查询活动列表
  const activitiesRaw = dbQuery(
    `
    SELECT
      a.*,
      COUNT(DISTINCT ap.id) as participant_count
    FROM activities a
    LEFT JOIN activity_participants ap ON a.id = ap.activity_id AND ap.status = 'confirmed'
    WHERE ${whereClause}
    GROUP BY a.id
    ORDER BY a.start_time DESC
  `,
    queryParams,
  )

  // 解析 JSON 字段
  const activities: Activity[] = activitiesRaw.map((activity: any) => ({
    ...activity,
    images: activity.images ? JSON.parse(activity.images) : [],
    is_active: activity.status === "active",
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">旅游活动</h1>
        <p className="text-muted-foreground">探索精彩旅游活动,体验独特旅行乐趣</p>
      </div>
      <ActivitiesFilter />
      <ActivitiesList activities={activities} totalCount={activities.length} />
    </div>
  )
}