"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  MapPin,
  Ticket,
  Hotel,
  Settings,
  BarChart,
  Compass,
  Newspaper,
  CalendarCheck,
  UserCheck,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { LucideIcon } from "lucide-react"

interface SubMenuItem {
  href: string
  label: string
  icon: LucideIcon
}

interface MenuItem {
  href?: string
  label: string
  icon: LucideIcon
  children?: SubMenuItem[]
}

const menuItems: MenuItem[] = [
  { href: "/admin", label: "仪表板", icon: LayoutDashboard },
  { href: "/admin/users", label: "用户管理", icon: Users },
  {
    label: "景点门票",
    icon: MapPin,
    children: [
      { href: "/admin/spots", label: "景点管理", icon: MapPin },
      { href: "/admin/tickets", label: "门票管理", icon: Ticket },
      { href: "/admin/orders", label: "订单管理", icon: ShoppingCart },
    ]
  },
  {
    label: "酒店服务",
    icon: Hotel,
    children: [
      { href: "/admin/hotels", label: "酒店管理", icon: Hotel },
      { href: "/admin/bookings", label: "预订管理", icon: CalendarCheck },
    ]
  },
  {
    label: "旅游活动",
    icon: Compass,
    children: [
      { href: "/admin/activities", label: "活动管理", icon: Compass },
      { href: "/admin/participants", label: "报名管理", icon: UserCheck },
    ]
  },
  { href: "/admin/news", label: "新闻资讯", icon: Newspaper },
  { href: "/admin/analytics", label: "数据分析", icon: BarChart },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({})

  // 默认展开所有父菜单
  useEffect(() => {
    const newExpandedMenus: Record<string, boolean> = {}
    menuItems.forEach((item) => {
      if (item.children) {
        newExpandedMenus[item.label] = true
      }
    })
    setExpandedMenus(newExpandedMenus)
  }, [])

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  return (
    <aside className="w-64 min-h-screen bg-card border-r">
      <div className="p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isExpanded = expandedMenus[item.label]

            // 如果有子菜单
            if (item.children) {
              const hasActiveChild = item.children.some(child => pathname === child.href)

              return (
                <div key={item.label}>
                  {/* 父菜单按钮 */}
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      hasActiveChild && "bg-secondary/50"
                    )}
                    onClick={() => toggleMenu(item.label)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>

                  {/* 子菜单 */}
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-border pl-2">
                      {item.children.map((child) => {
                        const isActive = pathname === child.href
                        const ChildIcon = child.icon

                        return (
                          <Link key={child.href} href={child.href}>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              className={cn(
                                "w-full justify-start text-sm",
                                isActive && "bg-secondary"
                              )}
                            >
                              <ChildIcon className="mr-2 h-4 w-4" />
                              {child.label}
                            </Button>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            // 普通菜单项（无子菜单）
            const isActive = pathname === item.href

            return (
              <Link key={item.href} href={item.href!}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-secondary"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}