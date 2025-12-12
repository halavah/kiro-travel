import { Card, CardContent } from "@/components/ui/card"

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">功能开发中</h1>
          <p className="text-muted-foreground">该页面正在使用 SQLite 重构中,敬请期待!</p>
        </CardContent>
      </Card>
    </div>
  )
}
