"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { useState, useCallback } from "react"

export function ActivitiesFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })
      return params.toString()
    },
    [searchParams],
  )

  const handleSearch = () => {
    router.push(`/activities?${createQueryString({ search: searchValue })}`)
  }

  const handleTypeChange = (value: string) => {
    router.push(`/activities?${createQueryString({ activity_type: value === "all" ? null : value })}`)
  }

  const handleSortChange = (value: string) => {
    router.push(`/activities?${createQueryString({ sort: value === "default" ? null : value })}`)
  }

  const handleClearFilters = () => {
    setSearchValue("")
    router.push("/activities")
  }

  const hasFilters = searchParams.get("search") || searchParams.get("activity_type") || searchParams.get("sort")

  return (
    <div className="bg-card rounded-lg border p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索活动名称或地点..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch}>搜索</Button>
        </div>

        <div className="flex gap-2">
          <Select defaultValue={searchParams.get("activity_type") || "all"} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="活动类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="徒步">徒步</SelectItem>
              <SelectItem value="登山">登山</SelectItem>
              <SelectItem value="露营">露营</SelectItem>
              <SelectItem value="摄影">摄影</SelectItem>
              <SelectItem value="文化体验">文化体验</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue={searchParams.get("sort") || "default"} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">默认排序</SelectItem>
              <SelectItem value="date">开始时间</SelectItem>
              <SelectItem value="price-asc">价格从低到高</SelectItem>
              <SelectItem value="price-desc">价格从高到低</SelectItem>
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="icon" onClick={handleClearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
