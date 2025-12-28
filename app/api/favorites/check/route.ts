import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { dbGet } from '@/lib/db-utils'

// GET - 检查景点是否已收藏
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const spot_id = searchParams.get('spot_id')

    if (!spot_id) {
      return NextResponse.json({ error: 'spot_id is required' }, { status: 400 })
    }

    const favorite = dbGet(`
      SELECT id
      FROM spot_favorites
      WHERE spot_id = ? AND user_id = ?
    `, [spot_id, decoded.userId])

    return NextResponse.json({
      is_favorited: !!favorite,
      favorite_id: favorite?.id || null
    })

  } catch (error) {
    console.error('Error checking favorite status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
