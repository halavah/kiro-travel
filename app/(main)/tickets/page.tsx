import { TicketsList } from "@/components/tickets/tickets-list"
import { TicketsFilter } from "@/components/tickets/tickets-filter"
import type { Ticket } from "@/lib/types"
import { dbQuery } from "@/lib/db-utils"

// 强制动态渲染，避免构建时查询数据库
export const dynamic = 'force-dynamic'

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sort?: string }>
}) {
  const params = await searchParams

  // 构建查询
  let whereClauses: string[] = ['t.status = \'active\'']
  let queryParams: any[] = []

  if (params.search) {
    whereClauses.push('(t.name LIKE ? OR s.name LIKE ?)')
    queryParams.push(`%${params.search}%`, `%${params.search}%`)
  }

  const whereClause = whereClauses.join(' AND ')

  // 排序
  let orderBy = 't.created_at DESC'
  switch (params.sort) {
    case "price-asc":
      orderBy = 't.price ASC'
      break
    case "price-desc":
      orderBy = 't.price DESC'
      break
  }

  // 获取门票
  const rawTickets = dbQuery<Ticket>(`
    SELECT
      t.*,
      s.id as spot_id,
      s.name as spot_name,
      s.location as spot_location,
      s.images as spot_images,
      c.name as category_name
    FROM tickets t
    LEFT JOIN spots s ON t.spot_id = s.id
    LEFT JOIN spot_categories c ON s.category_id = c.id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
  `, queryParams)

  // 转换数据结构以匹配组件期望
  const tickets = rawTickets.map((ticket: any) => {
    return {
      ...ticket,
      spot: ticket.spot_id ? {
        id: ticket.spot_id,
        name: ticket.spot_name,
        location: ticket.spot_location,
        images: ticket.spot_images ? JSON.parse(ticket.spot_images) : [],
        category: ticket.category_name ? { name: ticket.category_name } : undefined
      } : undefined
    }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">门票预订</h1>
        <p className="text-muted-foreground mt-2">快速预订各大景点门票,即买即用</p>
      </div>

      <TicketsFilter />

      <TicketsList tickets={tickets || []} totalCount={tickets.length} />
    </div>
  )
}
