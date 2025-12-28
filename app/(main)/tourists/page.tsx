import { TouristsList } from "@/components/tourists/tourists-list"
import type { Profile } from "@/lib/types"
import { dbQuery } from "@/lib/db-utils"

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic'

export default async function TouristsPage() {
  // 获取导游列表（role = 'guide'）
  let guides: Profile[] = []

  try {
    guides = dbQuery<Profile>(`
      SELECT id, email, full_name, avatar_url, role, created_at, updated_at
      FROM profiles
      WHERE role = 'guide'
      ORDER BY created_at DESC
    `)
  } catch (error) {
    console.error('Failed to fetch guides:', error)
    // 如果数据库查询失败，返回空数组
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">导游列表</h1>
        <p className="text-muted-foreground">浏览我们的专业导游团队</p>
      </div>
      <TouristsList tourists={guides} />
    </div>
  )
}
