"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar } from "lucide-react"
import type { Profile } from "@/lib/types"

interface TouristsListProps {
  tourists: Profile[]
}

export function TouristsList({ tourists }: TouristsListProps) {
  if (tourists.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">暂无导游信息</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-4">共 {tourists.length} 位导游</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tourists.map((tourist) => (
          <Card key={tourist.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={tourist.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {tourist.full_name?.[0] || "G"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{tourist.full_name || "未设置姓名"}</h3>
                    <Badge variant="secondary" className="text-xs">
                      导游
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Calendar className="h-3 w-3" />
                    注册于 {new Date(tourist.created_at).toLocaleDateString("zh-CN")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
