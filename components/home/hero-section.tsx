"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Calendar, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/spots?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* 背景图片 */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/beautiful-mountain-landscape-with-lake-travel-dest.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
      </div>

      {/* 内容区域 */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-balance">
          探索世界 <span className="text-primary">畅游天下</span>
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto text-pretty">
          发现令人惊叹的旅游目的地，预订精选酒店，体验独特的旅游活动
        </p>

        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/70" />
              <Input
                type="text"
                placeholder="搜索目的地、景点名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8">
              <Search className="h-5 w-5 mr-2" />
              搜索
            </Button>
          </div>
        </form>

        {/* 统计数据 */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold">500+</p>
            <p className="text-white/80 text-sm">精选景点</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold">200+</p>
            <p className="text-white/80 text-sm">合作酒店</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold">50+</p>
            <p className="text-white/80 text-sm">特色活动</p>
          </div>
          <div className="text-center">
            <p className="text-3xl md:text-4xl font-bold">10万+</p>
            <p className="text-white/80 text-sm">满意用户</p>
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="flex flex-wrap justify-center gap-4 mt-12">
          <Link href="/spots">
            <Button variant="secondary" size="lg" className="gap-2">
              <MapPin className="h-5 w-5" />
              浏览景点
            </Button>
          </Link>
          <Link href="/hotels">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              <Calendar className="h-5 w-5" />
              预订酒店
            </Button>
          </Link>
          <Link href="/activities">
            <Button
              variant="outline"
              size="lg"
              className="gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              <Users className="h-5 w-5" />
              旅游活动
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
