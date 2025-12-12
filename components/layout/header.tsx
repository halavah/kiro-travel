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
} from "lucide-react"
import { useEffect, useState } from "react"

interface UserProfile {
  id: number
  email: string
  full_name?: string
  avatar_url?: string
  role: string
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
  const [cartCount, setCartCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setUser(null)
        setCartCount(0)
        return
      }

      try {
        // 获取用户信息
        const userRes = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData.data?.user || userData.user)

          // 获取购物车数量（仅对非导游用户）
          const userRole = userData.data?.user?.role || userData.user?.role
          if (userRole !== 'guide') {
            const cartRes = await fetch('/api/cart', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })

            if (cartRes.ok) {
              const cartData = await cartRes.json()
              setCartCount(cartData.data?.length || 0)
            }
          }
        } else {
          // Token 无效，清除
          localStorage.removeItem('token')
          setUser(null)
          setCartCount(0)
        }
      } catch (error) {
        console.error('获取用户数据失败:', error)
      }
    }

    fetchUserData()

    // 监听存储变化（用于跨标签页同步）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        fetchUserData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setCartCount(0)
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
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {user.role !== "guide" && (
                <>
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
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  登录
                </Button>
              </Link>
              <Link href="/auth/sign-up">
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
          </nav>
        </div>
      )}
    </header>
  )
}
