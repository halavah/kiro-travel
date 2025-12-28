import { StatisticsContent } from "@/components/statistics/statistics-content"

export default function StatisticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">景点分类统计</h1>
      <p className="text-muted-foreground mb-8">直观展示不同景点类别的数据分布</p>
      <StatisticsContent />
    </div>
  )
}
