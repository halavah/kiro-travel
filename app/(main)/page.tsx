import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, ArrowRight, Ticket, Hotel, Compass, TrendingUp, Users, Award } from "lucide-react"
import type { Spot, Activity, News } from "@/lib/types"
import { dbQuery } from "@/lib/db-utils"

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // 获取推荐景点
  const recommendedSpotsRaw = dbQuery(`
    SELECT s.*, c.name as category_name
    FROM spots s
    LEFT JOIN spot_categories c ON s.category_id = c.id
    WHERE s.is_recommended = 1 AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 4
  `)

  // 解析景点 JSON 字段
  const recommendedSpots: Spot[] = recommendedSpotsRaw.map((spot: any) => ({
    ...spot,
    images: spot.images ? JSON.parse(spot.images) : [],
    category: spot.category_name ? { name: spot.category_name } : null,
  }))

  // 获取活动
  const activitiesRaw = dbQuery(`
    SELECT * FROM activities
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 3
  `)

  // 解析活动 JSON 字段
  const activities: Activity[] = activitiesRaw.map((activity: any) => ({
    ...activity,
    images: activity.images ? JSON.parse(activity.images) : [],
  }))

  // 获取最新新闻
  const newsRaw = dbQuery(`
    SELECT n.*, nc.name as category_name
    FROM news n
    LEFT JOIN news_categories nc ON n.category_id = nc.id
    WHERE n.is_published = 1
    ORDER BY n.published_at DESC
    LIMIT 3
  `)

  const news: News[] = newsRaw

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/beautiful-travel-landscape-mountains-and-lake.jpg')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">探索世界的美好</h1>
          <p className="text-lg md:text-xl mb-8 text-white/90 text-pretty">
            发现令人惊叹的旅游目的地，预订完美住宿，开启您的梦想之旅
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/spots">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <MapPin className="h-5 w-5" />
                浏览景点
              </Button>
            </Link>
            <Link href="/tickets">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 w-full sm:w-auto bg-white/10 border-white/30 text-white hover:bg-white/20"
              >
                <Ticket className="h-5 w-5" />
                购买门票
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: MapPin, value: "500+", label: "精选景点" },
              { icon: Users, value: "100万+", label: "满意用户" },
              { icon: Hotel, value: "1000+", label: "合作酒店" },
              { icon: Award, value: "4.9", label: "用户评分" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Spots */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">推荐景点</h2>
              <p className="text-muted-foreground mt-1">精选热门旅游目的地</p>
            </div>
            <Link href="/spots">
              <Button variant="ghost" className="gap-1">
                查看全部 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedSpots?.map((spot) => (
              <Link key={spot.id} href={`/spots/${spot.id}`}>
                <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={spot.images?.[0] || "/placeholder.svg?height=200&width=300&query=scenic spot"}
                      alt={spot.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {spot.is_recommended && (
                      <Badge className="absolute top-3 left-3 bg-primary">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        推荐
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {spot.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {spot.location}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{spot.rating}</span>
                      </div>
                      <div className="text-primary font-semibold">{spot.price > 0 ? `¥${spot.price}` : "免费"}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">我们的服务</h2>
            <p className="text-muted-foreground mt-2">一站式旅游服务平台</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Ticket,
                title: "门票预订",
                description: "全国景点门票在线预订，快速出票，无需排队",
                href: "/tickets",
              },
              {
                icon: Hotel,
                title: "酒店住宿",
                description: "精选优质酒店，价格透明，预订无忧",
                href: "/hotels",
              },
              {
                icon: Compass,
                title: "旅游活动",
                description: "丰富的旅游活动体验，专业导游带您深度游",
                href: "/activities",
              },
            ].map((service, index) => (
              <Link key={index} href={service.href}>
                <Card className="h-full hover:shadow-lg transition-shadow group">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 group-hover:bg-primary/20 transition-colors">
                      <service.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">{service.title}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Activities Section */}
      {activities && activities.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">热门活动</h2>
                <p className="text-muted-foreground mt-1">精彩旅游体验等你来</p>
              </div>
              <Link href="/activities">
                <Button variant="ghost" className="gap-1">
                  查看全部 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activities.map((activity) => (
                <Link key={activity.id} href={`/activities/${activity.id}`}>
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={activity.images?.[0] || "/placeholder.svg?height=200&width=400&query=travel activity"}
                        alt={activity.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {activity.activity_type && (
                        <Badge variant="secondary" className="absolute top-3 left-3">
                          {activity.activity_type}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {activity.title}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {activity.location}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {activity.max_participants && `限${activity.max_participants}人`}
                        </span>
                        <div className="text-primary font-semibold">
                          {activity.price ? `¥${activity.price}起` : "免费"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* News Section */}
      {news && news.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">旅游资讯</h2>
                <p className="text-muted-foreground mt-1">最新旅游新闻动态</p>
              </div>
              <Link href="/news">
                <Button variant="ghost" className="gap-1">
                  查看全部 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.map((item) => (
                <Link key={item.id} href={`/news/${item.id}`}>
                  <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={item.cover_image || "/placeholder.svg?height=200&width=400&query=travel news"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.summary}</p>
                      <div className="text-xs text-muted-foreground mt-3">
                        {new Date(item.published_at).toLocaleDateString("zh-CN")}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">准备好开始您的旅程了吗？</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            立即注册成为会员，享受专属优惠和个性化推荐服务
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" variant="secondary" className="gap-2">
              免费注册 <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
