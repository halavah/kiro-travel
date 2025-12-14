"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import type { Activity } from "@/lib/types"

export function FeaturedActivities() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch('/api/activities?is_active=true&limit=4')

        if (!res.ok) {
          throw new Error('Failed to fetch activities')
        }

        const data = await res.json()
        if (data.success && data.data) {
          setActivities(data.data)
        }
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const getActivityTypeColor = (type: string | null) => {
    switch (type) {
      case "观光":
        return "bg-blue-100 text-blue-800"
      case "冒险":
        return "bg-red-100 text-red-800"
      case "文化":
        return "bg-purple-100 text-purple-800"
      case "休闲":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">精彩活动</h2>
            <p className="text-muted-foreground">体验独特的旅游活动</p>
          </div>
          <Link href="/activities">
            <Button variant="outline" className="gap-2 bg-transparent">
              查看全部 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {activities.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {activities.map((activity) => (
              <Link key={activity.id} href={`/activities/${activity.id}`}>
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow group">
                  <div className="aspect-[3/2] relative overflow-hidden">
                    <img
                      src={
                        activity.images?.[0] ||
                        `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(activity.title + " travel activity")}`
                      }
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {activity.activity_type && (
                      <Badge className={`absolute top-3 left-3 ${getActivityTypeColor(activity.activity_type)}`}>
                        {activity.activity_type}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {activity.title}
                    </h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {activity.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{activity.location}</span>
                        </div>
                      )}
                      {activity.start_time && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(activity.start_time).toLocaleDateString("zh-CN")}</span>
                        </div>
                      )}
                      {activity.max_participants && (
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>限{activity.max_participants}人</span>
                        </div>
                      )}
                    </div>
                    {activity.price && (
                      <div className="mt-3 pt-3 border-t">
                        <span className="text-primary font-bold">¥{activity.price}</span>
                        <span className="text-sm text-muted-foreground">/人</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">暂无活动</div>
        )}
      </div>
    </section>
  )
}
