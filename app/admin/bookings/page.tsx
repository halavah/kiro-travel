import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken } from "@/lib/auth"
import { BookingsManagement } from "@/components/admin/bookings-management"

export default async function AdminBookingsPage() {
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
        <h1 className="text-3xl font-bold mb-2">酒店预订管理</h1>
        <p className="text-muted-foreground">查看和管理所有用户的酒店预订</p>
      </div>
      <BookingsManagement />
    </div>
  )
}
