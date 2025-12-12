"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Hotel, Calendar, Users, Loader2, X } from "lucide-react"
import type { HotelBooking } from "@/lib/types"
import { toast } from "sonner"

interface BookingsListProps {
  bookings: HotelBooking[]
}

const statusMap = {
  pending: { label: "待确认", variant: "secondary" as const },
  confirmed: { label: "已确认", variant: "default" as const },
  cancelled: { label: "已取消", variant: "destructive" as const },
  completed: { label: "已完成", variant: "outline" as const },
}

export function BookingsList({ bookings: initialBookings }: BookingsListProps) {
  const [bookings, setBookings] = useState(initialBookings)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleCancel = async (bookingId: string) => {
    setLoadingId(bookingId)

    try {
      await supabase.from("hotel_bookings").update({ status: "cancelled" }).eq("id", bookingId)

      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" as const } : b)))
      toast.success("预订已取消")
    } catch (error) {
      toast.error("取消失败")
    } finally {
      setLoadingId(null)
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground">
          <Hotel className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">暂无酒店预订记录</p>
          <p className="text-sm mt-2">去预订一间心仪的酒店吧</p>
          <Link href="/hotels">
            <Button className="mt-6">浏览酒店</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <Hotel className="h-5 w-5 text-primary" />
                <span className="font-semibold">{booking.hotel_name}</span>
                <Badge variant={statusMap[booking.status].variant}>{statusMap[booking.status].label}</Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                预订于 {new Date(booking.created_at).toLocaleDateString("zh-CN")}
              </span>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">房型</span>
                <p className="font-medium">{booking.room_name}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  入住日期
                </div>
                <p className="font-medium">{new Date(booking.check_in).toLocaleDateString("zh-CN")}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  退房日期
                </div>
                <p className="font-medium">{new Date(booking.check_out).toLocaleDateString("zh-CN")}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  入住人数
                </div>
                <p className="font-medium">{booking.guests} 位</p>
              </div>
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="justify-between py-4">
            <div>
              <span className="text-muted-foreground">订单总额：</span>
              <span className="text-xl font-bold text-primary">¥{booking.total_price.toFixed(2)}</span>
            </div>
            {booking.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancel(booking.id)}
                disabled={loadingId === booking.id}
              >
                {loadingId === booking.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-1" />
                )}
                取消预订
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
