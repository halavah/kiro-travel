import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

export default function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">功能开发中</h1>
          <p className="text-muted-foreground">该详情页正在使用 SQLite 重构中,敬请期待!</p>
        </CardContent>
      </Card>
    </div>
  )
}
