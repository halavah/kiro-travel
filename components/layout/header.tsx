"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Ticket,
  Hotel,
  Compass,
  Newspaper,
  User,
  ShoppingCart,
  Heart,
  LogOut,
  Menu,
  X,
  BarChart3,
  Settings,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useCart } from "@/contexts/cart-context"

interface UserProfile {
  id: number
  email: string
  full_name?: string
  avatar_url?: string
  role: string
}

interface UserStats {
  orders: number
  bookings: number
  activities: number
  favorites: number
  comments: number
}

const navItems = [
  { href: "/spots", label: "景点", icon: MapPin },
  { href: "/tickets", label: "门票", icon: Ticket },
  { href: "/hotels", label: "酒店", icon: Hotel },
  { href: "/activities", label: "旅游活动", icon: Compass },
  { href: "/news", label: "新闻中心", icon: Newspaper },
  { href: "/statistics", label: "数据统计", icon: BarChart3 },
]

const guideNavItems = [
  { href: "/spots", label: "景点", icon: MapPin },
  { href: "/news", label: "新闻中心", icon: Newspaper },
  { href: "/tourists", label: "游客信息", icon: User },
  { href: "/profile", label: "个人中心", icon: User },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const { cartCount, refreshCart } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [stats, setStats] = useState<UserStats>({
    orders: 0,
    bookings: 0,
    activities: 0,
    favorites: 0,
    comments: 0
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // 获取用户信息 - 使用 cookie 认证
        const userRes = await fetch('/api/auth/me', {
          credentials: 'include' // 自动发送 cookie
        })

        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData.data?.user || userData.user)

          // 获取购物车数量（仅对非���游用户）
          const userRole = userData.data?.user?.role || userData.user?.role
          if (userRole !== 'guide') {
            refreshCart()

            // 获取用户统计数据
            try {
              const statsRes = await fetch('/api/profile/stats', {
                credentials: 'include'
              })
              if (statsRes.ok) {
                const statsData = await statsRes.json()
                setStats(statsData.data || {
                  orders: 0,
                  bookings: 0,
                  activities: 0,
                  favorites: 0,
                  comments: 0
                })
              }
            } catch (error) {
              console.error('获取统计数据失败:', error)
            }
          }
        } else {
          // 未认证
          setUser(null)
        }
      } catch (error) {
        console.error('获取用户数据失败:', error)
        setUser(null)
      }
    }

    fetchUserData()
  }, [refreshCart])

  const handleLogout = async () => {
    try {
      // 调用登出 API 清除 cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('登出失败:', error)
    }

    // 清除客户端状态
    setUser(null)
    router.push("/")
    router.refresh()
  }

  const currentNavItems = user?.role === "guide" ? guideNavItems : navItems

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Compass className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">畅游天下</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {currentNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}

            {/* 后台管理下拉菜单 - 仅管理员可见 */}
            {user?.role === "admin" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Settings className="h-4 w-4" />
                    后台管理
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Compass className="mr-2 h-4 w-4" />
                      仪表板
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      用户管理
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/orders" className="cursor-pointer">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      订单管理
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/spots" className="cursor-pointer">
                      <MapPin className="mr-2 h-4 w-4" />
                      景点管理
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/tickets" className="cursor-pointer">
                      <Ticket className="mr-2 h-4 w-4" />
                      门票管理
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/hotels" className="cursor-pointer">
                      <Hotel className="mr-2 h-4 w-4" />
                      酒店管理
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/bookings" className="cursor-pointer">
                      <Hotel className="mr-2 h-4 w-4" />
                      预订管理
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/activities" className="cursor-pointer">
                      <Compass className="mr-2 h-4 w-4" />
                      旅游活动
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/participants" className="cursor-pointer">
                      <Compass className="mr-2 h-4 w-4" />
                      报名管理
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/news" className="cursor-pointer">
                      <Newspaper className="mr-2 h-4 w-4" />
                      新闻资讯
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/admin/analytics" className="cursor-pointer">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      数据分析
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      系统设置
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role !== "guide" && (
                <>
                  <Link href="/orders" className="hidden md:inline-flex">
                    <Button variant="ghost" size="icon" className="relative" title="门票订单">
                      <Ticket className="h-5 w-5 text-orange-600" />
                      {stats.orders > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {stats.orders}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Link href="/profile/bookings" className="hidden md:inline-flex">
                    <Button variant="ghost" size="icon" className="relative" title="酒店预订">
                      <Hotel className="h-5 w-5 text-blue-600" />
                      {stats.bookings > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {stats.bookings}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Link href="/profile/activities" className="hidden md:inline-flex">
                    <Button variant="ghost" size="icon" className="relative" title="活动报名">
                      <Compass className="h-5 w-5 text-purple-600" />
                      {stats.activities > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {stats.activities}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                  <Link href="/favorites">
                    <Button variant="ghost" size="icon" className="relative">
                      <Heart className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/cart">
                    <Button variant="ghost" size="icon" className="relative">
                      <ShoppingCart className="h-5 w-5" />
                      {cartCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {cartCount}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.full_name || "用户"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {user.role === "guide" ? "导游" : user.role === "admin" ? "管理员" : "用户"}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      个人中心
                    </Link>
                  </DropdownMenuItem>
                  {user.role !== "guide" && (
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="cursor-pointer">
                        <Ticket className="mr-2 h-4 w-4" />
                        我的订单
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  登录
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">注册</Button>
              </Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {currentNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}


            {/* 快捷入口 - 非导游用户可见 */}
            {user && user.role !== "guide" && (
              <>
                <div className="border-t pt-2 mt-2">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    快捷入口
                  </p>
                </div>
                <Link
                  href="/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Ticket className="h-4 w-4 text-orange-600" />
                  <span>门票订单</span>
                  {stats.orders > 0 && (
                    <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {stats.orders}
                    </Badge>
                  )}
                </Link>
                <Link
                  href="/profile/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Hotel className="h-4 w-4 text-blue-600" />
                  <span>酒店预订</span>
                  {stats.bookings > 0 && (
                    <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {stats.bookings}
                    </Badge>
                  )}
                </Link>
                <Link
                  href="/profile/activities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Compass className="h-4 w-4 text-purple-600" />
                  <span>活动报名</span>
                  {stats.activities > 0 && (
                    <Badge className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs">
                      {stats.activities}
                    </Badge>
                  )}
                </Link>
              </>
            )}
            {/* 后台管理 - 仅管理员可见 */}
            {user?.role === "admin" && (
              <>
                <div className="border-t pt-2 mt-2">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    后台管理
                  </p>
                </div>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Compass className="h-4 w-4" />
                  仪表板
                </Link>
                <Link
                  href="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <User className="h-4 w-4" />
                  用户管理
                </Link>
                <Link
                  href="/admin/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <ShoppingCart className="h-4 w-4" />
                  订单管理
                </Link>
                <Link
                  href="/admin/spots"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <MapPin className="h-4 w-4" />
                  景点管理
                </Link>
                <Link
                  href="/admin/tickets"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Ticket className="h-4 w-4" />
                  门票管理
                </Link>
                <Link
                  href="/admin/hotels"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Hotel className="h-4 w-4" />
                  酒店管理
                </Link>
                <Link
                  href="/admin/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Hotel className="h-4 w-4" />
                  预订管理
                </Link>
                <Link
                  href="/admin/activities"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Compass className="h-4 w-4" />
                  旅游活动
                </Link>
                <Link
                  href="/admin/participants"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Compass className="h-4 w-4" />
                  报名管理
                </Link>
                <Link
                  href="/admin/news"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Newspaper className="h-4 w-4" />
                  新闻资讯
                </Link>
                <Link
                  href="/admin/analytics"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <BarChart3 className="h-4 w-4" />
                  数据分析
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Settings className="h-4 w-4" />
                  系统设置
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
