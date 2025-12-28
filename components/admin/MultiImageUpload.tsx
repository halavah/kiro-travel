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
  // Ensure value is always an array
  const imageValues = value || ['']

  const handleImageChange = (index: number, url: string) => {
    const newImages = [...imageValues]
    newImages[index] = url
    onChange(newImages)
  }

  const handleAddImage = () => {
    if (imageValues.length < maxImages) {
      onChange([...imageValues, ''])
    }
  }

  const handleRemoveImage = (index: number) => {
    if (imageValues.length > minImages) {
      const newImages = imageValues.filter((_, i) => i !== index)
      onChange(newImages.length === 0 ? [''] : newImages)
    }
  }

  return (
    <div className="space-y-4">
      {imageValues.map((img, index) => (
        <div key={index} className="relative">
          <ImageUpload
            label={imageValues.length > 1 ? `图片 ${index + 1}` : label}
            value={img}
            onChange={(url) => handleImageChange(index, url)}
            required={required && index === 0}
          />
          {imageValues.length > 1 && (
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

      {imageValues.length < maxImages && (
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
