'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Eye, FileText, CheckCircle, Power } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import Image from 'next/image'
import ImageUpload from '@/components/admin/ImageUpload'
import Pagination from '@/components/admin/Pagination'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    cover_image: '',
    category_id: 'none',
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
      setCurrentPage(1) // 重置到第一页
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!formData.title || !formData.content) {
        toast.error('请填写标题和内容')
        return
      }

      const token = localStorage.getItem('token')
      const url = editingNews ? `/api/news/${editingNews.id}` : '/api/news'
      const method = editingNews ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          category_id: formData.category_id && formData.category_id !== 'none' ? parseInt(formData.category_id) : null
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || error.details || '操作失败')
      }

      toast.success(editingNews ? '新闻更新成功' : '新闻创建成功')
      setIsAddDialogOpen(false)
      setEditingNews(null)
      setFormData({
        title: '',
        content: '',
        summary: '',
        cover_image: '',
        category_id: 'none',
        is_published: false
      })
      await fetchNews()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    }
  }

  const handleEdit = (newsItem: News) => {
    setEditingNews(newsItem)
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      summary: newsItem.summary || '',
      cover_image: newsItem.cover_image || '',
      category_id: newsItem.category_id ? newsItem.category_id.toString() : 'none',
      is_published: newsItem.is_published === 1
    })
    setIsAddDialogOpen(true)
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

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '删除失败')
      }

      toast.success('新闻删除成功')
      fetchNews()
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    }
  }

  const handleTogglePublish = async (id: string, currentPublished: number) => {
    const newPublished = currentPublished ? 0 : 1
    const statusText = newPublished ? '发布' : '取消发布'

    try {
      const newsItem = news.find(n => n.id === id)
      if (!newsItem) {
        toast.error('新闻不存在，请刷新页面')
        await fetchNews()
        return
      }

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
          is_published: newPublished
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.details || error.error || '状态更新失败')
      }

      toast.success(`新闻已${statusText}`)
      await fetchNews()
    } catch (error: any) {
      toast.error(error.message || '状态更新失败')
    }
  }

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedNewsIds([])
      setSelectAll(false)
    } else {
      setSelectedNewsIds(paginatedNews.map(n => n.id))
      setSelectAll(true)
    }
  }

  // 单个选择
  const handleSelectNews = (newsId: string) => {
    setSelectedNewsIds(prev => {
      if (prev.includes(newsId)) {
        const newSelected = prev.filter(id => id !== newsId)
        if (newSelected.length === 0) setSelectAll(false)
        return newSelected
      } else {
        const newSelected = [...prev, newsId]
        if (newSelected.length === paginatedNews.length) setSelectAll(true)
        return newSelected
      }
    })
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedNewsIds.length === 0) {
      toast.error('请至少选择一篇新闻')
      return
    }

    if (!confirm(`确定要删除选中的 ${selectedNewsIds.length} 篇新闻吗？此操作不可恢复。`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const deletePromises = selectedNewsIds.map(newsId =>
        fetch(`/api/news/${newsId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      )

      const results = await Promise.all(deletePromises)
      const failedCount = results.filter(r => !r.ok).length

      if (failedCount === 0) {
        toast.success(`成功删除 ${selectedNewsIds.length} 篇新闻`)
      } else {
        toast.warning(`删除完成，但有 ${failedCount} 篇新闻删除失败`)
      }

      setSelectedNewsIds([])
      setSelectAll(false)
      fetchNews()
    } catch (error) {
      console.error('Error deleting news:', error)
      toast.error('批量删除失败')
    }
  }

  // 批量修改发布状态
  const handleBatchPublish = async (publish: boolean) => {
    if (selectedNewsIds.length === 0) {
      toast.error('请先选择新闻')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const results = await Promise.allSettled(selectedNewsIds.map(async (id) => {
        const newsItem = news.find(n => n.id === id)
        if (!newsItem) {
          console.warn('[Frontend] News not found for batch operation:', id)
          return
        }

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
            is_published: publish ? 1 : 0
          })
        })

        if (!res.ok) {
          const data = await res.json()
          console.error('[Frontend] Batch operation failed for ID:', id, data)
          throw new Error(data.details || data.error)
        }
      }))

      const failed = results.filter(r => r.status === 'rejected').length
      if (failed > 0) {
        toast.error(`批量操作完成，但有 ${failed} 项失败`)
      } else {
        toast.success(`已批量${publish ? '发布' : '取消发布'}`)
      }

      setSelectedNewsIds([])
      setSelectAll(false)
      await fetchNews()
    } catch (error) {
      console.error('Error batch updating:', error)
      toast.error('批量操作失败')
    }
  }

  const filteredNews = news.filter(item => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        item.title.toLowerCase().includes(searchLower) ||
        (item.content && item.content.toLowerCase().includes(searchLower)) ||
        (item.summary && item.summary.toLowerCase().includes(searchLower))
      )
    }
    return true
  })

  // 分页逻辑
  const totalPages = Math.ceil(filteredNews.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedNews = filteredNews.slice(startIndex, endIndex)

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

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">新闻资讯管理</h1>
        <div className="text-center py-12">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">新闻资讯管理</h1>
          <p className="text-muted-foreground">管理平台上的所有新闻资讯</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingNews(null)
              setFormData({
                title: '',
                content: '',
                summary: '',
                cover_image: '',
                category_id: 'none',
                is_published: false
              })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              添加新闻
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingNews ? '编辑新闻' : '添加新新闻'}</DialogTitle>
              <DialogDescription>
                {editingNews ? '修改新闻内容' : '创建一条新的新闻资讯'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    ���闻标题
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="summary" className="text-right pt-2">
                    摘要
                  </Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="col-span-3"
                    placeholder="输入新闻摘要"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="content" className="text-right pt-2">
                    新闻内容
                  </Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="col-span-3 font-mono text-sm"
                    placeholder="输入新闻内容"
                    rows={10}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category_id" className="text-right">
                    分类
                  </Label>
                  <div className="col-span-3">
                    <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择分类" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">未分类</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="cover_image" className="text-right pt-2">
                    封面图片
                  </Label>
                  <div className="col-span-3">
                    <ImageUpload
                      value={formData.cover_image}
                      onChange={(url) => setFormData({ ...formData, cover_image: url })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_published" className="text-right">
                    立即发布
                  </Label>
                  <div className="col-span-3">
                    <Checkbox
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked as boolean })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">
                  {editingNews ? '更新' : '创建'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索新闻标题或内容"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="分类筛选" />
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
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 新闻列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>新闻列表 ({filteredNews.length})</CardTitle>
            {selectedNewsIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  已选择 {selectedNewsIds.length} 项
                </span>
                <Select onValueChange={(value) => {
                  if (value === 'publish') handleBatchPublish(true)
                  else if (value === 'unpublish') handleBatchPublish(false)
                }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="批量修改状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publish">设为发布</SelectItem>
                    <SelectItem value="unpublish">设为草稿</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  批量删除
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>标题</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>作者</TableHead>
                <TableHead>浏览量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>发布时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedNews.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedNewsIds.includes(item.id)}
                      onCheckedChange={() => handleSelectNews(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {item.cover_image && (
                        <div className="relative w-16 h-16">
                          <Image
                            src={item.cover_image}
                            alt={item.title}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium max-w-md truncate">{item.title}</p>
                        {item.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {item.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category_name || '未分类'}</Badge>
                  </TableCell>
                  <TableCell>{item.author_name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
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
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePublish(item.id, item.is_published)}
                        title={item.is_published ? '取消��布' : '发布'}
                      >
                        <Power className={`h-4 w-4 ${item.is_published ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredNews.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              暂无新闻数据
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredNews.length}
          />
        </CardContent>
      </Card>
    </div>
  )
}
