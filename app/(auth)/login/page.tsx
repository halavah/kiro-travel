'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Info } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTestAccounts, setShowTestAccounts] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const testAccounts = [
    { email: 'admin@example.com', password: 'admin123', name: '管理员账号', role: 'admin' },
    { email: 'guide1@example.com', password: 'guide123', name: '导游账号1', role: 'guide' },
    { email: 'guide2@example.com', password: 'guide123', name: '导游账号2', role: 'guide' },
    { email: 'user1@example.com', password: 'user123', name: '用户账号1', role: 'user' },
    { email: 'user2@example.com', password: 'user123', name: '用户账号2', role: 'user' },
    { email: 'user3@example.com', password: 'user123', name: '用户账号3', role: 'user' },
  ]

  const fillTestAccount = (email: string, password: string) => {
    setEmail(email)
    setPassword(password)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(email, password)

    if (result.success) {
      // 使用完整页面刷新来确保所有状态更新
      window.location.href = '/'
    } else {
      setError(result.error || '登录失败')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">登录</CardTitle>
          <CardDescription className="text-center">
            输入您的邮箱和密码登录账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          {/* 测试账号提示 */}
          <Collapsible
            open={showTestAccounts}
            onOpenChange={setShowTestAccounts}
            className="mt-4"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-sm text-gray-600"
                type="button"
              >
                <Info className="mr-2 h-4 w-4" />
                {showTestAccounts ? '隐藏测试账号' : '显示测试账号'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-2">
              <div className="text-xs text-gray-500 mb-2 px-2">
                点击任意账号快速填充登录信息
              </div>
              {testAccounts.map((account, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => fillTestAccount(account.email, account.password)}
                  className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md transition-colors border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{account.name}</div>
                      <div className="text-xs text-gray-500">{account.email}</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      account.role === 'admin'
                        ? 'bg-red-100 text-red-700'
                        : account.role === 'guide'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {account.role === 'admin' ? '管理员' : account.role === 'guide' ? '导游' : '用户'}
                    </div>
                  </div>
                </button>
              ))}
              <div className="text-xs text-gray-400 italic px-2 pt-2">
                所有测试账号密码格式：角色名+123（如admin123、user123）
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="mt-4 text-center text-sm">
            还没有账户？{' '}
            <Link href="/auth/register" className="text-blue-600 hover:underline">
              立即注册
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}