"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, MapPin, Users, Activity, Loader2, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import Link from "next/link"

interface ActivityParticipation {
  id: number
  activity_id: number
  participation_status: string
  joined_at: string
  activity_name: string
  description: string
  location: string
  start_time: string
  end_time: string
  price: number
  max_participants: number
  images: string[]
}

interface ActivitiesParticipationListProps {
  participations: ActivityParticipation[]
}

const statusConfig = {
  registered: { label: '已报名', variant: 'default' as const, color: 'bg-green-500' },
  cancelled: { label: '已取消', variant: 'destructive' as const, color: 'bg-gray-500' },
}

export function ActivitiesParticipationList({ participations }: ActivitiesParticipationListProps) {
  const router = useRouter()
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const handleCancelParticipation = async (activityId: number) => {
    if (!confirm('确定要取消报名吗？')) {
      return
    }

    setCancellingId(activityId)

    try {
      const response = await fetch(`/api/activities/${activityId}/join`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '取消报名失败')
      }

      toast.success('取消报名成功')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '取消报名失败')
    } finally {
      setCancellingId(null)
    }
  }

  if (participations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">暂无活动报名</h3>
          <p className="text-muted-foreground mb-4">您还没有报名任何活动</p>
          <Button onClick={() => router.push('/activities')}>
            浏览活动
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {participations.map((item) => {
        const status = statusConfig[item.participation_status as keyof typeof statusConfig] || statusConfig.registered
        const startDate = new Date(item.start_time)
        const endDate = new Date(item.end_time)

        return (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Link href={`/activities/${item.activity_id}`}>
                    <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer">
                      {item.activity_name}
                    </CardTitle>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    报名时间: {format(new Date(item.joined_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 活动图片 */}
                <div className="md:col-span-1">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                    <img
                      src={item.images[0] || '/placeholder.svg?height=200&width=300'}
                      alt={item.activity_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* 活动详情 */}
                <div className="md:col-span-3 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    <Separator className="mt-2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">活动地点</p>
                        <p className="font-medium">{item.location}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">活动时间</p>
                        <p className="font-medium">
                          {format(startDate, 'MM月dd日', { locale: zhCN })} - {format(endDate, 'MM月dd日', { locale: zhCN })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">人数限制</p>
                        <p className="font-medium">
                          {item.max_participants ? `${item.max_participants} 人` : '不限'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">活动费用</p>
                      <p className="text-2xl font-bold text-primary">
                        {item.price ? `¥${item.price}` : '免费'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        asChild
                      >
                        <Link href={`/activities/${item.activity_id}`}>
                          查看详情
                        </Link>
                      </Button>

                      {item.participation_status === 'registered' && (
                        <Button
                          variant="outline"
                          onClick={() => handleCancelParticipation(item.activity_id)}
                          disabled={cancellingId === item.activity_id}
                        >
                          {cancellingId === item.activity_id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              取消中...
                            </>
                          ) : (
                            '取消报名'
                          )}
                        </Button>
                      )}
                    </div>
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
