'use client'

import { useState, useRef } from 'react'
import { Upload, X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageUploaderProps {
  workspaceId: string
  images: string[]
  onImagesChange: (images: string[]) => void
}

export default function ImageUploader({
  workspaceId,
  images,
  onImagesChange,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)

    const newUrls: string[] = []

    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('workspaceId', workspaceId)

      const res = await fetch('/api/forms/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const { url } = await res.json()
        newUrls.push(url)
      }
    }

    onImagesChange([...images, ...newUrls])
    setUploading(false)

    if (fileRef.current) fileRef.current.value = ''
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    // 파일 업로드 드롭 (이미지 재정렬이 아닐 때)
    if (dragIndex !== null) return
    handleFiles(e.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  // 드래그앤드롭 재정렬
  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null) return
    setOverIndex(index)
  }

  const handleDragEnd = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const copy = [...images]
      const [moved] = copy.splice(dragIndex, 1)
      copy.splice(overIndex, 0, moved)
      onImagesChange(copy)
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <div className="space-y-3">
      {/* 업로드 영역 */}
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-[13px] text-gray-500">업로드 중...</span>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-500">
              클릭하거나 이미지를 드래그하세요
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              JPG, PNG, WebP, GIF · 최대 10MB
            </p>
          </>
        )}
      </div>

      {/* 이미지 프리뷰 (드래그앤드롭 재정렬) */}
      {images.length > 0 && (
        <div className="space-y-1">
          {images.length > 1 && (
            <p className="text-[11px] text-gray-400 mb-1">드래그하여 순서를 변경할 수 있습니다.</p>
          )}
          {images.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 rounded-xl p-2 transition-all ${
                dragIndex === index
                  ? 'opacity-40 bg-gray-100'
                  : overIndex === index && dragIndex !== null
                    ? 'bg-primary/5 ring-2 ring-primary/20'
                    : 'bg-gray-50'
              }`}
            >
              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab active:cursor-grabbing shrink-0" />
              <img
                src={url}
                alt={`이미지 ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              />
              <span className="text-[12px] text-gray-500 flex-1 truncate">
                {index + 1}번 이미지
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-400 hover:text-red-600 shrink-0"
                onClick={() => removeImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
