// API 请求工具函数
export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: any; error?: string; pagination?: any }> {
  const token = localStorage.getItem('token')

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `请求失败: ${response.statusText}`,
      }
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    }
  } catch (error) {
    console.error('API request error:', error)
    return {
      success: false,
      error: '网络错误，请检查您的网络连接',
    }
  }
}

// GET 请求
export function apiGet(url: string, params?: Record<string, any>) {
  const searchParams = params ? new URLSearchParams(params).toString() : ''
  const fullUrl = searchParams ? `${url}?${searchParams}` : url
  return apiRequest(fullUrl)
}

// POST 请求
export function apiPost(url: string, data?: any) {
  return apiRequest(url, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// PUT 请求
export function apiPut(url: string, data?: any) {
  return apiRequest(url, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

// DELETE 请求
export function apiDelete(url: string) {
  return apiRequest(url, {
    method: 'DELETE',
  })
}