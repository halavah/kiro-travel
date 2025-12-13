'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, Users, Clock, Check, AlertCircle, MapPin, Star } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Ticket {
  id: string
  name: string
  description: string
  price: number
  stock: number
  valid_from: string
  valid_to: string
}

interface BookingInfo {
  ticketId: string
  visitDate: string
  visitTime: string
  visitors: number
  contactName: string
  contactPhone: string
  contactEmail: string
  remarks: string
}

export default function SpotBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [spot, setSpot] = useState<any>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [bookingInfo, setBookingInfo] = useState<BookingInfo>({
    ticketId: '',
    visitDate: '',
    visitTime: '',
    visitors: 1,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    remarks: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const spotId = searchParams.get('id') || ''
  const ticketId = searchParams.get('ticket') || ''

  useEffect(() => {
    fetchSpot()
    fetchTickets()

    if (ticketId) {
      setSelectedTicket(ticketId)
    }
  }, [spotId, ticketId])

  const fetchSpot = async () => {
    try {
      const res = await fetch(`/api/spots/${spotId}`)
      if (!res.ok) throw new Error('获取景点信息失败')
      const data = await res.json()
      setSpot(data.spot)
    } catch (error) {
      console.error('Error fetching spot:', error)
      toast.error('获取景点信息失败')
    }
  }

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/spots/${spotId}/tickets`)
      if (!res.ok) return
      const data = await res.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    }
  }

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicket(ticketId)
    setBookingInfo(prev => ({
      ...prev,
      ticketId
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTicket) {
      toast.error('请选择门票类型')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // 验证必填字段
    if (!bookingInfo.visitDate || !bookingInfo.visitTime || !bookingInfo.contactName || !bookingInfo.contactPhone) {
      toast.error('请填写所有必填信息')
      return
    }

    setSubmitting(true)

    try {
      // 创建订单
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart_item_ids: null, // 直接预订，不从购物车创建
          spot_id: spotId,
          ticket_id: selectedTicket,
          visitDate: bookingInfo.visitDate,
          visitTime: bookingInfo.visitTime,
          visitors: bookingInfo.visitors,
          contactName: bookingInfo.contactName,
          contactPhone: bookingInfo.contactPhone,
          contactEmail: bookingInfo.contactEmail,
          remarks: bookingInfo.remarks
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '预订失败')
      }

      const data = await res.json()
      toast.success('预订成功！')

      // 跳转到订单详情页
      if (data.data?.order) {
        router.push(`/orders/${data.data.order.id}`)
      } else {
        router.push('/orders')
      }
    } catch (error: any) {
      console.error('Error submitting booking:', error)
      toast.error(error.message || '预订失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const today = new Date()
  const minDate = today.toISOString().split('T')[0]
  const maxDate = new Date(today)
  maxDate.setDate(maxDate.getDate() + 90)
  const maxDateStr = maxDate.toISOString().split('T')[0]

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ]

  const selectedTicketData = tickets.find(t => t.id === selectedTicket)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Link
          href={`/spots/${spotId}`}
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回景点详情
        </Link>
      </div>

      {!spot ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg">加载中...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 景点信息 */}
          <Card>
            <CardHeader>
              <CardTitle>景点信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                {spot.images?.[0] && (
                  <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={spot.images[0]}
                      alt={spot.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold">{spot.name}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4" />
                    <span>{spot.address || spot.location}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{spot.rating} 评分</span>
                    <span className="ml-4">{spot.view_count} 浏览</span>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed">{spot.description}</p>
            </CardContent>
          </Card>

          {/* 门票选择 */}
          <Card>
            <CardHeader>
              <CardTitle>选择门票</CardTitle>
            </CardHeader>
            <CardContent>
              {tickets.length > 0 ? (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedTicket === ticket.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleSelectTicket(ticket.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{ticket.name}</h3>
                          <p className="text-sm text-muted-foreground">{ticket.description || "标准门票"}</p>
                          {ticket.valid_from && ticket.valid_to && (
                            <p className="text-xs text-muted-foreground mt-1">
                              有效期：{new Date(ticket.valid_from).toLocaleDateString('zh-CN')} -{' '}
                              {new Date(ticket.valid_to).toLocaleDateString('zh-CN')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">¥{ticket.price}</div>
                          <Badge
                            variant={ticket.stock < 10 ? "destructive" : "secondary"}
                            className="ml-2"
                          >
                            {ticket.stock < 10 ? "库存紧张" : `${ticket.stock}张`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>该景点暂无可售门票</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 预订信息 */}
          {selectedTicket && (
            <Card>
              <CardHeader>
                <CardTitle>预订信息</CardTitle>
                <CardDescription>请填写您的出行信息</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visitDate">
                        访问日期 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="visitDate"
                        type="date"
                        min={minDate}
                        max={maxDateStr}
                        value={bookingInfo.visitDate}
                        onChange={(e) => setBookingInfo({ ...bookingInfo, visitDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visitTime">
                        访问时间 <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="visitTime"
                        value={bookingInfo.visitTime}
                        onChange={(e) => setBookingInfo({ ...bookingInfo, visitTime: e.target.value })}
                        className="w-full p-2 border rounded-md"
                        required
                      >
                        <option value="">请选择时间</option>
                        {timeSlots.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="visitors">
                        游客人数 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="visitors"
                        type="number"
                        min="1"
                        max="50"
                        value={bookingInfo.visitors}
                        onChange={(e) => setBookingInfo({ ...bookingInfo, visitors: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactName">
                        联系人姓名 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactName"
                        value={bookingInfo.contactName}
                        onChange={(e) => setBookingInfo({ ...bookingInfo, contactName: e.target.value })}
                        placeholder="请输入您的姓名"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">
                        联系电话 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={bookingInfo.contactPhone}
                        onChange={(e) => setBookingInfo({ ...bookingInfo, contactPhone: e.target.value })}
                        placeholder="请输入您的手机号"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">
                        电子邮箱
                      </Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={bookingInfo.contactEmail}
                        onChange={(e) => setBookingInfo({ ...bookingInfo, contactEmail: e.target.value })}
                        placeholder="选填，用于接收订单确认"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">
                      备注信息
                    </Label>
                    <Textarea
                      id="remarks"
                      rows={3}
                      value={bookingInfo.remarks}
                      onChange={(e) => setBookingInfo({ ...bookingInfo, remarks: e.target.value })}
                      placeholder="如有特殊需求请在此说明"
                    />
                  </div>

                  <Separator />

                  {/* 订单摘要 */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">订单摘要</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>景点：</span>
                        <span className="font-medium">{spot.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>门票：</span>
                        <span className="font-medium">{selectedTicketData?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>单价：</span>
                        <span className="font-medium">¥{selectedTicketData?.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>人数：</span>
                        <span className="font-medium">{bookingInfo.visitors} 人</span>
                      </div>
                      <div className="flex justify-between">
                        <span>日期：</span>
                        <span className="font-medium">{bookingInfo.visitDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>时间：</span>
                        <span className="font-medium">{bookingInfo.visitTime}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>总计：</span>
                        <span className="text-primary">
                          ¥{(selectedTicketData?.price || 0) * (bookingInfo.visitors || 1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      返回修改
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !selectedTicketData || selectedTicketData.stock === 0}
                      className="flex-1"
                    >
                      {submitting ? '提交中...' : '确认预订'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* 温馨提示 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">温馨提示</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• 预订成功后，您将收到订单确认邮件</p>
              <p>• 请凭订单号和有效身份证件入园</p>
              <p>• 门票一经售出，不支持退改</p>
              <p>• 如有疑问，请联系客服：400-123-4567</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}