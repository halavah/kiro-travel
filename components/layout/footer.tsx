import Link from "next/link"
import { Compass, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Compass className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">畅游天下</span>
            </div>
            <p className="text-sm text-muted-foreground">
              您的旅行好帮手，探索精彩目的地，预订酒店，购买门票，开启完美旅程。
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/spots" className="hover:text-foreground transition-colors">
                  热门景点
                </Link>
              </li>
              <li>
                <Link href="/tickets" className="hover:text-foreground transition-colors">
                  门票预订
                </Link>
              </li>
              <li>
                <Link href="/hotels" className="hover:text-foreground transition-colors">
                  酒店住宿
                </Link>
              </li>
              <li>
                <Link href="/activities" className="hover:text-foreground transition-colors">
                  旅游活动
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">帮助中心</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  常见问题
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  退订政策
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  用户协议
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  隐私政策
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">联系我们</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                400-123-4567
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                support@changyou.com
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                北京市朝阳区xxx大厦
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} 畅游天下. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  )
}
