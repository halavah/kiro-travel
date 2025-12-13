'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Save, Globe, Shield } from "lucide-react"

interface SystemSettings {
  site: {
    name: string
    description: string
    logoUrl: string
    contactEmail: string
    contactPhone: string
    address: string
  }
  features: {
    enableRegistration: boolean
    enableComments: boolean
    enableFavorites: boolean
    requireEmailVerification: boolean
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    site: {
      name: '畅游天下',
      description: '您的旅行好帮手',
      logoUrl: '',
      contactEmail: 'support@changyou.com',
      contactPhone: '400-123-4567',
      address: '北京市朝阳区xxx大厦'
    },
    features: {
      enableRegistration: true,
      enableComments: true,
      enableFavorites: true,
      requireEmailVerification: false
    }
  })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('site')

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error('Failed to fetch settings')

      const data = await res.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })

      if (!res.ok) throw new Error('Failed to save settings')

      toast.success('设置保存成功')
    } catch (error) {
      toast.error('保存设置失败')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">系统设置</h1>
          <p className="text-muted-foreground">管理平台各项系统配置</p>
        </div>
        <Button onClick={handleSave} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? '保存中...' : '保存设置'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="site">
            <Globe className="h-4 w-4 mr-2" />
            网站设置
          </TabsTrigger>
          <TabsTrigger value="features">
            <Shield className="h-4 w-4 mr-2" />
            功能设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="site">
          <Card>
            <CardHeader>
              <CardTitle>网站基本信息</CardTitle>
              <CardDescription>配置网站的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">网站名称</Label>
                  <Input
                    id="siteName"
                    value={settings.site.name}
                    onChange={(e) => setSettings({
                      ...settings,
                      site: { ...settings.site, name: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">联系邮箱</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={settings.site.contactEmail}
                    onChange={(e) => setSettings({
                      ...settings,
                      site: { ...settings.site, contactEmail: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">网站描述</Label>
                <Textarea
                  id="siteDescription"
                  value={settings.site.description}
                  onChange={(e) => setSettings({
                    ...settings,
                    site: { ...settings.site, description: e.target.value }
                  })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">联系电话</Label>
                  <Input
                    id="contactPhone"
                    value={settings.site.contactPhone}
                    onChange={(e) => setSettings({
                      ...settings,
                      site: { ...settings.site, contactPhone: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={settings.site.logoUrl}
                    onChange={(e) => setSettings({
                      ...settings,
                      site: { ...settings.site, logoUrl: e.target.value }
                    })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">公司地址</Label>
                <Input
                  id="address"
                  value={settings.site.address}
                  onChange={(e) => setSettings({
                    ...settings,
                    site: { ...settings.site, address: e.target.value }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>功能开关</CardTitle>
              <CardDescription>控制平台各项功能的启用状态</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>允许用户注册</Label>
                  <p className="text-sm text-muted-foreground">
                    新用户可以注册账号
                  </p>
                </div>
                <Switch
                  checked={settings.features.enableRegistration}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    features: { ...settings.features, enableRegistration: checked }
                  })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用评论功能</Label>
                  <p className="text-sm text-muted-foreground">
                    用户可以对景点进行评论
                  </p>
                </div>
                <Switch
                  checked={settings.features.enableComments}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    features: { ...settings.features, enableComments: checked }
                  })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>启用收藏功能</Label>
                  <p className="text-sm text-muted-foreground">
                    用户可以收藏喜欢的景点
                  </p>
                </div>
                <Switch
                  checked={settings.features.enableFavorites}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    features: { ...settings.features, enableFavorites: checked }
                  })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>邮箱验证</Label>
                  <p className="text-sm text-muted-foreground">
                    新用户注册需要验证邮箱
                  </p>
                </div>
                <Switch
                  checked={settings.features.requireEmailVerification}
                  onCheckedChange={(checked) => setSettings({
                    ...settings,
                    features: { ...settings.features, requireEmailVerification: checked }
                  })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        </Tabs>
    </div>
  )
}