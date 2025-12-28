'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface CartContextType {
  cartCount: number
  refreshCart: () => Promise<void>
  isLoading: boolean
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  refreshCart: async () => {},
  isLoading: true,
})

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart', {
        credentials: 'include'
      })

      if (res.ok) {
        const data = await res.json()
        setCartCount(data.items?.length || 0)
      } else {
        setCartCount(0)
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error)
      setCartCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  return (
    <CartContext.Provider value={{ cartCount, refreshCart, isLoading }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
