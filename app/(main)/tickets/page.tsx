import { TicketsList } from "@/components/tickets/tickets-list"
import { TicketsFilter } from "@/components/tickets/tickets-filter"
import type { Ticket } from "@/lib/types"
import { dbQuery } from "@/lib/db-utils"

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

  // #region agent log
  // 记录原始数据结构
  fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tickets/page.tsx:50',message:'原始门票数据结构',data:{rawTickets: rawTickets.slice(0, 2), count: rawTickets.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  // 转换数据结构以匹配组件期望
  const tickets = rawTickets.map((ticket: any) => {
    // #region agent log
    // 记录每个门票的转换过程
    fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tickets/page.tsx:58',message:'门票数据转换',data:{ticketId: ticket.id, hasSpotId: !!ticket.spot_id, spotId: ticket.spot_id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion

    return {
      ...ticket,
      spot: ticket.spot_id ? {
        id: ticket.spot_id,
        name: ticket.spot_name,
        location: ticket.spot_location,
        images: ticket.spot_images,
        category: ticket.category_name ? { name: ticket.category_name } : undefined
      } : undefined
    }
  })

  // #region agent log
  // 记录转换后的数据结构
  fetch('http://127.0.0.1:7244/ingest/3d36902f-c49a-4d79-9c89-7a13eac53de2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tickets/page.tsx:72',message:'转换后的门票数据结构',data:{tickets: tickets.slice(0, 2), count: tickets.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B'})}).catch(()=>{});
  // #endregion

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
