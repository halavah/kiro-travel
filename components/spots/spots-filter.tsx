"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { useState, useCallback } from "react"
import type { SpotCategory } from "@/lib/types"

interface SpotsFilterProps {
  categories: SpotCategory[]
}

export function SpotsFilter({ categories }: SpotsFilterProps) {
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
    router.push(`/spots?${createQueryString({ search: searchValue })}`)
  }

  const handleCategoryChange = (value: string) => {
    router.push(`/spots?${createQueryString({ category: value === "all" ? null : value })}`)
  }

  const handleSortChange = (value: string) => {
    router.push(`/spots?${createQueryString({ sort: value === "default" ? null : value })}`)
  }

  const handleClearFilters = () => {
    setSearchValue("")
    router.push("/spots")
  }

  const hasFilters = searchParams.get("search") || searchParams.get("category") || searchParams.get("sort")

  return (
    <div className="bg-card rounded-lg border p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索景点名称或地点..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch}>搜索</Button>
        </div>

        <div className="flex gap-2">
          <Select defaultValue={searchParams.get("category") || "all"} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="景点分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue={searchParams.get("sort") || "default"} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">默认排序</SelectItem>
              <SelectItem value="popular">最受欢迎</SelectItem>
              <SelectItem value="rating">评分最高</SelectItem>
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
