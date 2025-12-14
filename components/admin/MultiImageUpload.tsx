'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import ImageUpload from './ImageUpload'

interface MultiImageUploadProps {
  label?: string
  value: string[]
  onChange: (urls: string[]) => void
  required?: boolean
  minImages?: number
  maxImages?: number
}

export default function MultiImageUpload({
  label,
  value,
  onChange,
  required = false,
  minImages = 0,
  maxImages = 10
}: MultiImageUploadProps) {
  const handleImageChange = (index: number, url: string) => {
    const newImages = [...value]
    newImages[index] = url
    onChange(newImages)
  }

  const handleAddImage = () => {
    if (value.length < maxImages) {
      onChange([...value, ''])
    }
  }

  const handleRemoveImage = (index: number) => {
    if (value.length > minImages) {
      const newImages = value.filter((_, i) => i !== index)
      onChange(newImages.length === 0 ? [''] : newImages)
    }
  }

  return (
    <div className="space-y-4">
      {value.map((img, index) => (
        <div key={index} className="relative">
          <ImageUpload
            label={value.length > 1 ? `图片 ${index + 1}` : label}
            value={img}
            onChange={(url) => handleImageChange(index, url)}
            required={required && index === 0}
          />
          {value.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute top-0 right-0"
              onClick={() => handleRemoveImage(index)}
            >
              <X className="h-4 w-4" />
              移除
            </Button>
          )}
        </div>
      ))}

      {value.length < maxImages && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddImage}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加更多图片
        </Button>
      )}
    </div>
  )
}
