'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Ticket, Calendar, User, Loader2, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'

interface TicketType {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  valid_from: string | null
  valid_to: string | null
}

interface Spot {
  id: string
  name: string
  location: string
  images: string[]
}

export default function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { refreshCart } = useCart()
  const [spotId, setSpotId] = useState<string | null>(null)
  const [spot, setSpot] = useState<Spot | null>(null)
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [selectedTicketId, setSelectedTicketId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [visitDate, setVisitDate] = useState<string>('')
  const [visitTime, setVisitTime] = useState<string>('09:00')
  const [contactName, setContactName] = useState<string>('')
  const [contactPhone, setContactPhone] = useState<string>('')
  const [noteValue, setNoteValue] = useState<string>('')

  useEffect(() => {
    params.then(p => {
      setSpotId(p.id)
      const ticketParam = searchParams.get('ticket')
      if (ticketParam) {
        setSelectedTicketId(ticketParam)
      }
    })
  }, [params, searchParams])

  useEffect(() => {
    if (spotId) {
      fetchSpotAndTickets()
    }
  }, [spotId])

  useEffect(() => {
    if (user) {
      setContactName(user.full_name || user.nickname || '')
    }
  }, [user])

  const fetchSpotAndTickets = async () => {
    if (!spotId) return

    try {
      const spotRes = await fetch(`/api/spots/${spotId}`)
      if (spotRes.ok) {
        const spotData = await spotRes.json()
        if (spotData.success) {
          setSpot(spotData.data)
        }
      }

      const ticketsRes = await fetch(`/api/tickets?spot_id=${spotId}`)
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json()
        if (ticketsData.success) {
          setTickets(ticketsData.data)
          if (!selectedTicketId && ticketsData.data.length > 0) {
            setSelectedTicketId(ticketsData.data[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('请先登录')
      router.push('/auth/login')
      return
    }

    if (!selectedTicketId || !visitDate || !contactName || !contactPhone) {
      toast.error('请填写完整信息')
      return
    }

    if (!/^1[3-9]\d{9}$/.test(contactPhone)) {
      toast.error('请输入正确的手机号码')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ticket_id: selectedTicketId,
          quantity: quantity,
          note: `访问日期: ${visitDate}, 访问时间: ${visitTime}, 联系人: ${contactName}, 电话: ${contactPhone}${noteValue ? ', 备注: ' + noteValue : ''}`
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('请先登录')
          router.push('/auth/login')
          return
        }
        throw new Error('预订失败')
      }

      const result = await response.json()
      if (result.success) {
        await refreshCart() // 刷新购物车数量
        toast.success('已添加到购物车')
        router.push('/cart')
      } else {
        toast.error(result.error || '预订失败')
      }
    } catch (error) {
      console.error('Error submitting booking:', error)
      toast.error('预订失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedTicket = tickets.find(t => t.id === selectedTicketId)
  const totalAmount = selectedTicket ? selectedTicket.price * quantity : 0
  const today = new Date().toISOString().split('T')[0]

  if (authLoading || loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto text-primary' />
          <p className='mt-4 text-muted-foreground'>加载中...</p>
        </div>
      </div>
    )
  }

  if (!spot || tickets.length === 0) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card>
          <CardContent className='p-12 text-center'>
            <h2 className='text-2xl font-bold mb-2'>暂无可预订的门票</h2>
            <p className='text-muted-foreground mb-6'>该景点暂时没有可预订的门票</p>
            <Link href={`/spots/${spotId}`}>
              <Button>返回景点详情</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-5xl mx-auto space-y-6'>
        <Link href={`/spots/${spotId}`} className='inline-flex items-center gap-1 text-muted-foreground hover:text-foreground'>
          <ArrowLeft className='h-4 w-4' />
          返回景点详情
        </Link>

        <div className='flex items-center gap-4'>
          <h1 className='text-3xl font-bold'>门票预订</h1>
          <Badge variant='secondary'>{spot.name}</Badge>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2 space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Ticket className='h-5 w-5 text-primary' />
                    选择门票
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-3'>
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedTicketId === ticket.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedTicketId(ticket.id)}
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <h3 className='font-semibold'>{ticket.name}</h3>
                              {ticket.stock < 20 && <Badge variant='destructive' className='text-xs'>库存紧张</Badge>}
                            </div>
                            {ticket.description && <p className='text-sm text-muted-foreground mt-1'>{ticket.description}</p>}
                          </div>
                          <div className='text-right ml-4'>
                            <div className='text-2xl font-bold text-primary'>¥{ticket.price}</div>
                            <div className='text-sm text-muted-foreground'>剩余: {ticket.stock} 张</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div>
                    <Label htmlFor='quantity'>购买数量</Label>
                    <Select value={quantity.toString()} onValueChange={(value) => setQuantity(parseInt(value))}>
                      <SelectTrigger id='quantity' className='mt-1.5'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                          <SelectItem key={num} value={num.toString()}>{num} 张</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Calendar className='h-5 w-5 text-primary' />
                    游玩信息
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='visitDate'>游玩日期 *</Label>
                      <Input id='visitDate' type='date' min={today} value={visitDate} onChange={(e) => setVisitDate(e.target.value)} required className='mt-1.5' />
                    </div>
                    <div>
                      <Label htmlFor='visitTime'>游玩时间</Label>
                      <Select value={visitTime} onValueChange={setVisitTime}>
                        <SelectTrigger id='visitTime' className='mt-1.5'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'].map((time) => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <User className='h-5 w-5 text-primary' />
                    联系信息
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='contactName'>联系人 *</Label>
                      <Input id='contactName' placeholder='请输入联系人姓名' value={contactName} onChange={(e) => setContactName(e.target.value)} required className='mt-1.5' />
                    </div>
                    <div>
                      <Label htmlFor='contactPhone'>联系电话 *</Label>
                      <Input id='contactPhone' type='tel' placeholder='请输入手机号码' value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required className='mt-1.5' />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor='noteInput'>备注信息</Label>
                    <Textarea id='noteInput' placeholder='如有特殊需求，请在此填写（选填）' value={noteValue} onChange={(e) => setNoteValue(e.target.value)} rows={3} className='mt-1.5' />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='lg:col-span-1'>
              <Card className='sticky top-4'>
                <CardHeader>
                  <CardTitle>订单摘要</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {spot.images?.[0] && (
                    <div className='aspect-video rounded-lg overflow-hidden'>
                      <img src={spot.images[0]} alt={spot.name} className='w-full h-full object-cover' />
                    </div>
                  )}
                  <div>
                    <h3 className='font-semibold text-lg'>{spot.name}</h3>
                    <p className='text-sm text-muted-foreground mt-1'>{spot.location}</p>
                  </div>
                  <Separator />
                  <div className='space-y-2 text-sm'>
                    {selectedTicket && (
                      <>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>门票类型</span>
                          <span className='font-medium'>{selectedTicket.name}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>单价</span>
                          <span className='font-medium'>¥{selectedTicket.price}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground'>数量</span>
                          <span className='font-medium'>×{quantity}</span>
                        </div>
                      </>
                    )}
                    {visitDate && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>游玩日期</span>
                        <span className='font-medium'>{visitDate}</span>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className='flex justify-between text-lg font-bold'>
                    <span>总计</span>
                    <span className='text-primary'>¥{totalAmount.toFixed(2)}</span>
                  </div>
                  <Button type='submit' size='lg' className='w-full' disabled={submitting || !selectedTicketId || (selectedTicket && selectedTicket.stock === 0)}>
                    {submitting ? (
                      <>
                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                        提交中...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className='h-4 w-4 mr-2' />
                        加入购物车
                      </>
                    )}
                  </Button>
                  <p className='text-xs text-muted-foreground text-center'>
                    点击按钮后将添加到购物车，您可以继续添加其他商品或前往结算
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
