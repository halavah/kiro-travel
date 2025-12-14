'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Eye, FileText, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import Image from 'next/image'

interface News {
  id: string
  title: string
  content: string
  summary: string | null
  cover_image: string | null
  category_id: number | null
  category_name: string | null
  author_name: string | null
  view_count: number
  is_published: number
  published_at: string | null
  created_at: string
}

interface NewsCategory {
  id: number
  name: string
}

export default function AdminNewsPage() {
  const [news, setNews] = useState<News[]>([])
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    cover_image: '',
    category_id: '',
    is_published: false
  })

  const fetchNews = async () => {
    try {
      const params = new URLSearchParams()
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (statusFilter === 'published') params.append('status', 'published')
      else if (statusFilter === 'draft') params.append('status', 'draft')

      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/news?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to fetch news')

      const data = await res.json()
      setNews(data.data || [])
    } catch (error) {
      console.error('Error fetching news:', error)
      toast.error('获取新闻列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?type=news')
      if (!res.ok) throw new Error('Failed to fetch categories')

      const data = await res.json()
      setCategories(data.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchNews()
    fetchCategories()
  }, [categoryFilter, statusFilter])

  const handleAdd = async () => {
    try {
      if (!formData.title || !formData.content) {
        toast.error('请填写标题和内容')
        return
      }

      const token = localStorage.getItem('token')
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id ? parseInt(formData.category_id) : null
        })
      })

      if (!res.ok) throw new Error('Failed to create news')

      toast.success('新闻创建成功')
      setIsAddDialogOpen(false)
      resetForm()
      fetchNews()
    } catch (error) {
      console.error('Error creating news:', error)
      toast.error('创建新闻失败')
    }
  }

  const handleEdit = async () => {
    if (!editingNews) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/news/${editingNews.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id ? parseInt(formData.category_id) : null
        })
      })

      if (!res.ok) throw new Error('Failed to update news')

      toast.success('新闻更新成功')
      setEditingNews(null)
      resetForm()
      fetchNews()
    } catch (error) {
      console.error('Error updating news:', error)
      toast.error('更新新闻失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇新闻吗？')) return

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error('Failed to delete news')

      toast.success('新闻删除成功')
      fetchNews()
    } catch (error) {
      console.error('Error deleting news:', error)
      toast.error('删除新闻失败')
    }
  }

  const handleTogglePublish = async (id: string, currentPublished: number) => {
    try {
      const newsItem = news.find(n => n.id === id)
      if (!newsItem) return

      const token = localStorage.getItem('token')
      const res = await fetch(`/api/news/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newsItem.title,
          content: newsItem.content,
          summary: newsItem.summary,
          cover_image: newsItem.cover_image,
          category_id: newsItem.category_id,
          is_published: currentPublished ? 0 : 1
        })
      })

      if (!res.ok) throw new Error('Failed to toggle publish status')

      toast.success(`新闻已${currentPublished ? '取消发布' : '发布'}`)
      fetchNews()
    } catch (error) {
      console.error('Error toggling publish status:', error)
      toast.error('状态切换失败')
    }
  }

  const handleBatchPublish = async (publish: boolean) => {
    if (selectedNewsIds.length === 0) {
      toast.error('请先选择新闻')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await Promise.all(selectedNewsIds.map(async (id) => {
        const newsItem = news.find(n => n.id === id)
        if (!newsItem) return

        await fetch(`/api/news/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: newsItem.title,
            content: newsItem.content,
            summary: newsItem.summary,
            cover_image: newsItem.cover_image,
            category_id: newsItem.category_id,
            is_published: publish ? 1 : 0
          })
        })
      }))

      toast.success(`已批量${publish ? '发布' : '取消发布'}`)
      setSelectedNewsIds([])
      fetchNews()
    } catch (error) {
      console.error('Error batch updating:', error)
      toast.error('批量操作失败')
    }
  }

  const openEditDialog = (newsItem: News) => {
    setEditingNews(newsItem)
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      summary: newsItem.summary || '',
      cover_image: newsItem.cover_image || '',
      category_id: newsItem.category_id?.toString() || '',
      is_published: newsItem.is_published === 1
    })
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      cover_image: '',
      category_id: '',
      is_published: false
    })
  }

  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.content && item.content.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">新闻资讯管理</h1>
        <p className="text-muted-foreground">管理平台上的所有新闻资讯</p>
      </div>

      {/* 过滤和操作栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索新闻标题或内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              添加新闻
            </Button>
          </div>

          {/* 批量操作 */}
          {selectedNewsIds.length > 0 && (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleBatchPublish(true)}>
                批量发布 ({selectedNewsIds.length})
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBatchPublish(false)}>
                批量取消发布 ({selectedNewsIds.length})
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新闻列表 */}
      <Card>
        <CardHeader>
          <CardTitle>新闻列表 ({filteredNews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : filteredNews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无新闻</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedNewsIds.length === filteredNews.length}
                      onCheckedChange={(checked) => {
                        setSelectedNewsIds(checked ? filteredNews.map(n => n.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>浏览量</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>发布时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNews.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedNewsIds.includes(item.id)}
                        onCheckedChange={(checked) => {
                          setSelectedNewsIds(
                            checked
                              ? [...selectedNewsIds, item.id]
                              : selectedNewsIds.filter(id => id !== item.id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium max-w-md truncate">{item.title}</div>
                      {item.summary && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {item.summary}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.category_name || '未分类'}</Badge>
                    </TableCell>
                    <TableCell>{item.author_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {item.view_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_published ? 'default' : 'secondary'}>
                        {item.is_published ? '已发布' : '草稿'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(item.published_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePublish(item.id, item.is_published)}
                          title={item.is_published ? '取消发布' : '发布'}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 添加/编辑对话框 */}
      <Dialog open={isAddDialogOpen || editingNews !== null} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setEditingNews(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingNews ? '编辑新闻' : '添加新闻'}</DialogTitle>
            <DialogDescription>
              {editingNews ? '修改新闻内容' : '创建新的新闻资讯'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">新闻标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入新闻标题"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="summary">摘要</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="输入新闻摘要"
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">新闻内容 *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="输入新闻内容"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cover_image">封面图片 URL</Label>
                <Input
                  id="cover_image"
                  value={formData.cover_image}
                  onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                  placeholder="输入图片 URL"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category_id">分类</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">未分类</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked as boolean })}
              />
              <Label htmlFor="is_published">立即发布</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              setEditingNews(null)
              resetForm()
            }}>
              取消
            </Button>
            <Button onClick={editingNews ? handleEdit : handleAdd}>
              {editingNews ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
