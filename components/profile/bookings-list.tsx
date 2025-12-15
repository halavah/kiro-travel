"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, MapPin, Users, Hotel, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface Booking {
  id: number
  hotel_name: string
  room_name: string
  check_in: string
  check_out: string
  guests: number
  total_price: number
  status: string
  created_at: string
  room_images: string[]
}

interface BookingsListProps {
  bookings: Booking[]
}

const statusConfig = {
  pending: { label: '待确认', variant: 'default' as const, color: 'bg-yellow-500' },
  confirmed: { label: '已确认', variant: 'secondary' as const, color: 'bg-green-500' },
  cancelled: { label: '已取消', variant: 'destructive' as const, color: 'bg-gray-500' },
  completed: { label: '已完成', variant: 'outline' as const, color: 'bg-blue-500' },
}

export function BookingsList({ bookings }: BookingsListProps) {
  const router = useRouter()
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('确定要取消这个预订吗？')) {
      return
    }

    setCancellingId(bookingId)

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('取消预订失败')
      }

      toast.success('预订已取消')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '取消预订失败')
    } finally {
      setCancellingId(null)
    }
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Hotel className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">暂无预订记录</h3>
          <p className="text-muted-foreground mb-4">您还没有预订任何酒店</p>
          <Button onClick={() => router.push('/hotels')}>
            浏览酒店
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending
        const checkInDate = new Date(booking.check_in)
        const checkOutDate = new Date(booking.check_out)
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))

        return (
          <Card key={booking.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{booking.hotel_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    预订时间: {format(new Date(booking.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 房间图片 */}
                <div className="md:col-span-1">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                    <img
                      src={booking.room_images[0] || '/placeholder.svg?height=200&width=300'}
                      alt={booking.room_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* 预订详情 */}
                <div className="md:col-span-3 space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">{booking.room_name}</h4>
                    <Separator />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">入住</p>
                        <p className="font-medium">
                          {format(checkInDate, 'yyyy年MM月dd日', { locale: zhCN })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">退房</p>
                        <p className="font-medium">
                          {format(checkOutDate, 'yyyy年MM月dd日', { locale: zhCN })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">客人数量</p>
                        <p className="font-medium">{booking.guests} 人</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{nights} 晚</p>
                      <p className="text-2xl font-bold text-primary">¥{booking.total_price}</p>
                    </div>

                    {booking.status === 'pending' && (
                      <Button
                        variant="outline"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={cancellingId === booking.id}
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            取消中...
                          </>
                        ) : (
                          '取消预订'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
