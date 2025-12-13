"use client"

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
  BarChart
} from "lucide-react"

const menuItems = [
  { href: "/admin", label: "仪表板", icon: LayoutDashboard },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/orders", label: "订单管理", icon: ShoppingCart },
  { href: "/admin/spots", label: "景点管理", icon: MapPin },
  { href: "/admin/tickets", label: "门票管理", icon: Ticket },
  { href: "/admin/hotels", label: "酒店管理", icon: Hotel },
  { href: "/admin/analytics", label: "数据分析", icon: BarChart },
  { href: "/admin/settings", label: "系统设置", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-card border-r">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link key={item.href} href={item.href}>
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