import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken } from "@/lib/auth"
import { ParticipantsManagement } from "@/components/admin/participants-management"

export default async function AdminParticipantsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    redirect("/auth/sign-in")
  }

  const decoded = verifyToken(token)
  if (!decoded || decoded.role !== 'admin') {
    redirect("/")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">活动报名管理</h1>
        <p className="text-muted-foreground">查看和管理所有活动的报名情况</p>
      </div>
      <ParticipantsManagement />
    </div>
  )
}
