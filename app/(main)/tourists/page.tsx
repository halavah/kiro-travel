import { TouristsList } from "@/components/tourists/tourists-list"
import type { Profile } from "@/lib/types"
import { dbQuery } from "@/lib/db-utils"

export default async function TouristsPage() {
  // 获取导游列表（role = 'guide'）
  const guides = dbQuery<Profile>(`
    SELECT id, email, full_name, avatar_url, role, created_at, updated_at
    FROM profiles
    WHERE role = 'guide'
    ORDER BY created_at DESC
  `)

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
