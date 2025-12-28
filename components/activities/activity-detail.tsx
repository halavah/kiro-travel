"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MapPin, Calendar, Users, Clock, ArrowLeft, ChevronLeft, ChevronRight, Share2, Loader2 } from "lucide-react"
import type { Activity } from "@/lib/types"
import { toast } from "sonner"

interface ActivityDetailProps {
  activity: Activity
  isLoggedIn: boolean
  hasJoined: boolean
}

export function ActivityDetail({ activity, isLoggedIn, hasJoined: initialHasJoined }: ActivityDetailProps) {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [hasJoined, setHasJoined] = useState(initialHasJoined)

  const images = activity.images?.length ? activity.images : ["/travel-activity.jpg"]

  const handleJoinActivity = async () => {
    if (!isLoggedIn) {
      router.push("/auth/sign-in")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/activities/${activity.id}/join`, {
        method: 'POST',
        credentials: 'include', // 使用 cookie 认证
      })

      if (response.status === 401) {
        router.push("/auth/sign-in")
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '报名失败')
      }

      toast.success("报名成功！")
      setHasJoined(true)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "报名失败")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelJoin = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/activities/${activity.id}/join`, {
        method: 'DELETE',
        credentials: 'include', // 使用 cookie 认证
      })

      if (response.status === 401) {
        router.push("/auth/sign-in")
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '取消报名失败')
      }

      toast.success("取消报名成功")
      setHasJoined(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "取消报名失败")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/activities"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        返回活动列表
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 图片和详情 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-muted">
            <img
              src={images[currentImageIndex] || "/placeholder.svg"}
              alt={activity.name}
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
                    <h1 className="text-2xl font-bold text-foreground">{activity.name}</h1>
                    {activity.activity_type && <Badge variant="secondary">{activity.activity_type}</Badge>}
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {activity.location}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {activity.price ? `¥${activity.price}` : "免费"}
                  </div>
                  <div className="text-sm text-muted-foreground">/人</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {activity.start_date && activity.end_date && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(activity.start_date).toLocaleDateString("zh-CN")} -{" "}
                    {new Date(activity.end_date).toLocaleDateString("zh-CN")}
                  </div>
                )}
                {activity.max_participants && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />限{activity.max_participants}人
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">活动详情</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{activity.description}</p>
              </div>

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  分享活动
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 预订信息 */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>活动信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    活动类型
                  </span>
                  <span className="font-medium">{activity.activity_type || "体验活动"}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    活动地点
                  </span>
                  <span className="font-medium">{activity.location}</span>
                </div>
                <Separator />
                {activity.max_participants && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        人数限制
                      </span>
                      <span className="font-medium">{activity.max_participants}人</span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">费用</span>
                  <span className="text-xl font-bold text-primary">
                    {activity.price ? `¥${activity.price}` : "免费"}
                  </span>
                </div>
              </div>

              {hasJoined ? (
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={handleCancelJoin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      取消中...
                    </>
                  ) : (
                    '取消报名'
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleJoinActivity}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      报名中...
                    </>
                  ) : (
                    '立即报名'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">温馨提示</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• 请提前预约，以便安排</p>
              <p>• 活动开始前24小时可免费取消</p>
              <p>• 请穿着舒适的户外服装</p>
              <p>• 如有疑问请联系客服</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
