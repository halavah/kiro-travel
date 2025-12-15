"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, Hotel, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

interface Booking {
  id: number
  user_id: number
  user_email: string
  user_name: string
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

const statusConfig = {
  pending: { label: '待确认', variant: 'default' as const },
  confirmed: { label: '已确认', variant: 'secondary' as const },
  cancelled: { label: '已取消', variant: 'destructive' as const },
  completed: { label: '已完成', variant: 'outline' as const },
}

export function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '10'
      })
      const response = await fetch(`/api/admin/bookings?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取预订列表失败')
      }

      const data = await response.json()
      setBookings(data.data.bookings)
      setTotalPages(data.data.pagination.totalPages)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '获取预订列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [statusFilter, page])

  const handleStatusChange = async (bookingId: number, newStatus: string) => {
    setUpdatingId(bookingId)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('更新状态失败')
      }

      toast.success('预订状态已更新')
      fetchBookings()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新状态失败')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 筛选器 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">状态筛选:</label>
              <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1) }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="pending">待确认</SelectItem>
                  <SelectItem value="confirmed">已确认</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 预订列表 */}
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Hotel className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">暂无预订记录</h3>
            <p className="text-muted-foreground">没有符合条件的预订记录</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const status = statusConfig[booking.status as keyof typeof statusConfig]
            const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24))

            return (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* 房间图片 */}
                    <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={booking.room_images[0] || '/placeholder.svg?height=128&width=192'}
                        alt={booking.room_name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 预订信息 */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">{booking.hotel_name}</h3>
                          <p className="text-muted-foreground">{booking.room_name}</p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">预订用户</p>
                          <p className="font-medium">{booking.user_name || booking.user_email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">入住/退房日期</p>
                          <p className="font-medium">
                            {format(new Date(booking.check_in), 'yyyy-MM-dd', { locale: zhCN })}
                          </p>
                          <p className="font-medium">
                            {format(new Date(booking.check_out), 'yyyy-MM-dd', { locale: zhCN })}
                          </p>
                          <p className="text-xs text-muted-foreground">{nights} 晚</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">客人数量</p>
                          <p className="font-medium flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {booking.guests} 人
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">订单金额</p>
                          <p className="text-2xl font-bold text-primary">¥{booking.total_price}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">
                            预订时间: {format(new Date(booking.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </p>
                          <Select
                            value={booking.status}
                            onValueChange={(value) => handleStatusChange(booking.id, value)}
                            disabled={updatingId === booking.id}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">待确认</SelectItem>
                              <SelectItem value="confirmed">已确���</SelectItem>
                              <SelectItem value="cancelled">已取消</SelectItem>
                              <SelectItem value="completed">已完成</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                第 {page} 页，共 {totalPages} 页
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
