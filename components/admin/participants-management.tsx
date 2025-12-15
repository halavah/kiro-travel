"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Users, Compass, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import Link from "next/link"

interface Participant {
  id: number
  activity_id: number
  user_id: number
  user_email: string
  user_name: string
  activity_name: string
  location: string
  start_time: string
  end_time: string
  price: number
  max_participants: number
  status: string
  created_at: string
  activity_images: string[]
}

interface ActivityStats {
  id: number
  title: string
  max_participants: number
  registered_count: number
  cancelled_count: number
}

const statusConfig = {
  registered: { label: '已报名', variant: 'default' as const },
  cancelled: { label: '已取消', variant: 'destructive' as const },
}

export function ParticipantsManagement() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [stats, setStats] = useState<ActivityStats[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchParticipants = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '10'
      })
      const response = await fetch(`/api/admin/participants?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('获取报名列表失败')
      }

      const data = await response.json()
      setParticipants(data.data.participants)
      setStats(data.data.stats)
      setTotalPages(data.data.pagination.totalPages)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '获取报名列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParticipants()
  }, [statusFilter, page])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Tabs defaultValue="participants" className="space-y-4">
      <TabsList>
        <TabsTrigger value="participants">
          <Users className="h-4 w-4 mr-2" />
          报名列表
        </TabsTrigger>
        <TabsTrigger value="stats">
          <Compass className="h-4 w-4 mr-2" />
          活动统计
        </TabsTrigger>
      </TabsList>

      <TabsContent value="participants" className="space-y-4">
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
                    <SelectItem value="registered">已报名</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 报名列表 */}
        {participants.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Compass className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">暂无报名记录</h3>
              <p className="text-muted-foreground">没有符合条件的活动报名记录</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {participants.map((participant) => {
              const status = statusConfig[participant.status as keyof typeof statusConfig]

              return (
                <Card key={participant.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* 活动图片 */}
                      <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={participant.activity_images[0] || '/placeholder.svg?height=128&width=192'}
                          alt={participant.activity_name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* 报名信息 */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link href={`/activities/${participant.activity_id}`} className="hover:text-primary">
                              <h3 className="text-xl font-semibold">{participant.activity_name}</h3>
                            </Link>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {participant.location}
                            </p>
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">报名用户</p>
                            <p className="font-medium">{participant.user_name || participant.user_email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">活动时间</p>
                            <p className="font-medium">
                              {format(new Date(participant.start_time), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              至 {format(new Date(participant.end_time), 'MM-dd HH:mm', { locale: zhCN })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">活动费用</p>
                            <p className="text-lg font-bold text-primary">
                              {participant.price ? `¥${participant.price}` : '免费'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t">
                          <p className="text-xs text-muted-foreground">
                            报名时间: {format(new Date(participant.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {participant.max_participants && `限${participant.max_participants}人`}
                          </p>
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
      </TabsContent>

      <TabsContent value="stats" className="space-y-4">
        {/* 活动统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((activity) => (
            <Card key={activity.id}>
              <CardHeader>
                <CardTitle className="text-base">{activity.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">已报名</span>
                    <Badge variant="default">{activity.registered_count}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">已取消</span>
                    <Badge variant="outline">{activity.cancelled_count}</Badge>
                  </div>
                  {activity.max_participants && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">人数限制</span>
                      <Badge variant="secondary">{activity.max_participants}</Badge>
                    </div>
                  )}
                </div>
                {activity.max_participants && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>报名进度</span>
                      <span>{Math.round((activity.registered_count / activity.max_participants) * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${Math.min((activity.registered_count / activity.max_participants) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
