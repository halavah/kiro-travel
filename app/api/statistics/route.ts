import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db-utils'

export async function GET(req: NextRequest) {
  try {
    // Get category statistics with aggregated data
    const categoryStats = dbQuery(`
      SELECT
        c.name as category,
        COUNT(s.id) as count,
        COALESCE(SUM(s.view_count), 0) as total_views,
        COALESCE(AVG(s.rating), 0) as avg_rating
      FROM spot_categories c
      LEFT JOIN spots s ON c.id = s.category_id AND s.status = 'active'
      GROUP BY c.id, c.name
      HAVING count > 0
      ORDER BY count DESC
    `)

    // Get total statistics
    const totalStats = dbQuery(`
      SELECT
        COUNT(*) as total_spots,
        COALESCE(SUM(view_count), 0) as total_views
      FROM spots
      WHERE status = 'active'
    `)[0]

    // Format avg_rating to one decimal place
    const formattedStats = categoryStats.map((stat: any) => ({
      category: stat.category,
      count: stat.count,
      total_views: stat.total_views,
      avg_rating: Number(stat.avg_rating.toFixed(1))
    }))

    return NextResponse.json({
      success: true,
      data: {
        categoryStats: formattedStats,
        totalSpots: totalStats.total_spots,
        totalViews: totalStats.total_views
      }
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}
