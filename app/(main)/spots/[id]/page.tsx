import { notFound } from "next/navigation"
import { SpotDetail } from "@/components/spots/spot-detail"
import { SpotComments } from "@/components/spots/spot-comments"
import type { Spot, SpotComment, Ticket } from "@/lib/types"
import { dbGet, dbQuery, dbRun } from "@/lib/db-utils"
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export default async function SpotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // 获取景点信息
  const spot = dbGet<Spot>(`
    SELECT s.*, c.name as category_name
    FROM spots s
    LEFT JOIN spot_categories c ON s.category_id = c.id
    WHERE s.id = ?
  `, [id])

  if (!spot) {
    notFound()
  }

  // 更新浏览量
  dbRun(`
    UPDATE spots
    SET view_count = view_count + 1
    WHERE id = ?
  `, [id])

  // 获取评论（spot_comments表不存在，暂时返回空数组）
  const comments: SpotComment[] = []

  // 获取门票
  const tickets = dbQuery<Ticket>(`
    SELECT * FROM tickets
    WHERE spot_id = ? AND status = 'active'
  `, [id])

  // 获取点赞数（spot_likes表不存在，暂时返回0）
  const likesCount = 0

  // 获取当前用户
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  let user = null
  if (token) {
    const decoded = verifyToken(token)
    if (decoded) {
      user = dbGet(`SELECT id, email, full_name, role FROM profiles WHERE id = ?`, [decoded.userId])
    }
  }

  let isLiked = false
  let isFavorited = false

  // spot_likes 和 spot_favorites 表不存在，暂时设为 false
  // if (user) {
  //   const like = dbGet(`
  //     SELECT id FROM spot_likes
  //     WHERE spot_id = ? AND user_id = ?
  //   `, [id, user.id])

  //   const favorite = dbGet(`
  //     SELECT id FROM spot_favorites
  //     WHERE spot_id = ? AND user_id = ?
  //   `, [id, user.id])

  //   isLiked = !!like
  //   isFavorited = !!favorite
  // }

  const spotWithMeta = {
    ...spot,
    images: spot.images ? JSON.parse(spot.images) : [],
    category: spot.category_name ? { name: spot.category_name } : null,
    likes_count: likesCount,
    comments_count: comments.length,
    is_liked: isLiked,
    is_favorited: isFavorited,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SpotDetail spot={spotWithMeta as Spot} tickets={tickets || []} isLoggedIn={!!user} />
      <SpotComments spotId={id} comments={comments || []} isLoggedIn={!!user} />
    </div>
  )
}
