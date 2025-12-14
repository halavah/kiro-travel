"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MapPin,
  Star,
  Phone,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Users,
  Loader2,
  Bed,
  CheckCircle,
} from "lucide-react"
import type { Hotel, HotelRoom } from "@/lib/types"
import { toast } from "sonner"
import { format, differenceInDays, addDays } from "date-fns"
import { zhCN } from "date-fns/locale"

interface HotelDetailProps {
  hotel: Hotel & { rooms: HotelRoom[] }
  isLoggedIn: boolean
}

export function HotelDetail({ hotel, isLoggedIn }: HotelDetailProps) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState<HotelRoom | null>(null)
  const [checkIn, setCheckIn] = useState<Date | undefined>(addDays(new Date(), 1))
  const [checkOut, setCheckOut] = useState<Date | undefined>(addDays(new Date(), 2))
  const [guests, setGuests] = useState("1")
  const [isBooking, setIsBooking] = useState(false)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)

  const images = hotel.images?.length ? hotel.images : ["/luxury-hotel-room.png"]

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 1
  const totalPrice = selectedRoom ? selectedRoom.price * nights : 0

  const handleBookRoom = (room: HotelRoom) => {
    if (!isLoggedIn) {
      router.push("/auth/sign-in")
      return
    }
    setSelectedRoom(room)
    setBookingDialogOpen(true)
  }

  const handleConfirmBooking = async () => {
    if (!selectedRoom || !checkIn || !checkOut) return

    setIsBooking(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // 使用 cookie 认证
        body: JSON.stringify({
          room_id: selectedRoom.id,
          hotel_name: hotel.name,
          room_name: selectedRoom.name,
          check_in: format(checkIn, "yyyy-MM-dd"),
          check_out: format(checkOut, "yyyy-MM-dd"),
          guests: Number.parseInt(guests),
          total_price: totalPrice,
          status: "pending"
        })
      })

      if (response.status === 401) {
        router.push("/auth/sign-in")
        return
      }

      if (!response.ok) throw new Error('预订失败')

      toast.success("预订成功！")
      setBookingDialogOpen(false)
      router.push("/profile/bookings")
    } catch (error) {
      toast.error("预订失败，请重试")
    } finally {
      setIsBooking(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/hotels"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回酒店列表
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 图片和详情 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted">
            <img
              src={images[currentImageIndex] || "/placeholder.svg"}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground">{hotel.name}</h1>
                    {hotel.star_rating && <Badge className="bg-yellow-500">{hotel.star_rating}星级</Badge>}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {hotel.address || hotel.location}
                  </div>
                  {hotel.contact_phone && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {hotel.contact_phone}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: hotel.star_rating || 0 }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">酒店介绍</h3>
                <p className="text-muted-foreground leading-relaxed">{hotel.description}</p>
              </div>

              {hotel.amenities && hotel.amenities.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">酒店设施</h3>
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.map((amenity) => (
                        <Badge key={amenity} variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 预订面板 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                选择入住日期
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">入住日期</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkIn ? format(checkIn, "MM/dd", { locale: zhCN }) : "选择"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkIn}
                        onSelect={setCheckIn}
                        disabled={(date) => date < new Date()}
                        locale={zhCN}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">退房日期</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {checkOut ? format(checkOut, "MM/dd", { locale: zhCN }) : "选择"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkOut}
                        onSelect={setCheckOut}
                        disabled={(date) => date <= (checkIn || new Date())}
                        locale={zhCN}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">入住人数</label>
                <Select value={guests} onValueChange={setGuests}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 位成人</SelectItem>
                    <SelectItem value="2">2 位成人</SelectItem>
                    <SelectItem value="3">3 位成人</SelectItem>
                    <SelectItem value="4">4 位成人</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground text-center">共 {nights} 晚</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-primary" />
                可选房型
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hotel.rooms && hotel.rooms.length > 0 ? (
                hotel.rooms
                  .filter((room) => room.is_active)
                  .map((room) => (
                    <div key={room.id} className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium">{room.name}</div>
                          <p className="text-xs text-muted-foreground mt-1">{room.description}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>可住{room.capacity}人</span>
                            <span>|</span>
                            <span>剩余{room.stock}间</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">¥{room.price}</div>
                          <div className="text-xs text-muted-foreground">/晚</div>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-3"
                        size="sm"
                        onClick={() => handleBookRoom(room)}
                        disabled={room.stock === 0}
                      >
                        {room.stock === 0 ? "已满房" : "预订"}
                      </Button>
                    </div>
                  ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Bed className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>暂无可预订的房型</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 预订确认对话框 */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认预订</DialogTitle>
            <DialogDescription>请确认您的预订信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">酒店</span>
                <p className="font-medium">{hotel.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">房型</span>
                <p className="font-medium">{selectedRoom?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">入住日期</span>
                <p className="font-medium">{checkIn && format(checkIn, "yyyy年MM月dd日", { locale: zhCN })}</p>
              </div>
              <div>
                <span className="text-muted-foreground">退房日期</span>
                <p className="font-medium">{checkOut && format(checkOut, "yyyy年MM月dd日", { locale: zhCN })}</p>
              </div>
              <div>
                <span className="text-muted-foreground">入住人数</span>
                <p className="font-medium">{guests} 位成人</p>
              </div>
              <div>
                <span className="text-muted-foreground">入住晚数</span>
                <p className="font-medium">{nights} 晚</p>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">订单总额</span>
              <span className="text-2xl font-bold text-primary">¥{totalPrice.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmBooking} disabled={isBooking}>
              {isBooking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  预订中...
                </>
              ) : (
                "确认预订"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
