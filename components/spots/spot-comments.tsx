"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, MessageSquare, Loader2 } from "lucide-react"
import type { SpotComment } from "@/lib/types"
import { toast } from "sonner"

interface SpotCommentsProps {
  spotId: string
  comments: SpotComment[]
  isLoggedIn: boolean
}

export function SpotComments({ spotId, comments, isLoggedIn }: SpotCommentsProps) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [rating, setRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      router.push("/auth/login")
      return
    }

    if (!content.trim()) {
      toast.error("请输入评论内容")
      return
    }

    setIsSubmitting(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      const { error } = await supabase.from("spot_comments").insert({
        spot_id: spotId,
        user_id: user.id,
        content: content.trim(),
        rating,
      })

      if (error) throw error

      setContent("")
      setRating(5)
      toast.success("评论发表成功")
      router.refresh()
    } catch (error) {
      toast.error("评论发表失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          游客评价 ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 评论表单 */}
        <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">评分：</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} className="focus:outline-none">
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder={isLoggedIn ? "分享您的旅行体验..." : "请登录后发表评论"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            disabled={!isLoggedIn}
          />
          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={!isLoggedIn || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                "发表评论"
              )}
            </Button>
          </div>
        </div>

        {/* 评论列表 */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-4 rounded-lg bg-muted/20">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.user?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {comment.user?.full_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{comment.user?.full_name || "匿名用户"}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= (comment.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.created_at).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>暂无评价，成为第一个评价的人吧！</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
