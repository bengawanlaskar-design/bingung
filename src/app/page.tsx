'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import {
  Image as ImageIcon,
  Sparkles,
  Trash2,
  Download,
  ZoomIn,
  Monitor,
  Globe,
  Smartphone,
  Loader2,
  AlertCircle,
  Clock,
  Info,
  Trash,
  ExternalLink,
  X,
  ChevronDown,
  Settings2,
} from 'lucide-react'

interface ImageData {
  id: string
  prompt: string
  size: string
  createdAt: string
  userIP?: string
  browser?: string
  os?: string
  device?: string
  imageData?: string
}

interface UserInfo {
  ip: string
  browser: string
  os: string
  device: string
  userAgent: string
}

const IMAGE_SIZES = [
  { value: '1024x1024', label: 'Square (1024x1024)', description: 'Best for portraits' },
  { value: '768x1344', label: 'Portrait (768x1344)', description: 'Vertical format' },
  { value: '864x1152', label: 'Portrait HD', description: 'HD Portrait' },
  { value: '1344x768', label: 'Landscape (1344x768)', description: 'Wide format' },
  { value: '1152x864', label: 'Landscape HD', description: 'HD Landscape' },
  { value: '1440x720', label: 'Ultra Wide', description: 'Cinematic' },
  { value: '720x1440', label: 'Tall', description: 'Phone wallpaper' },
]

export default function Home() {
  const [prompt, setPrompt] = useState('')
  const [imageCount, setImageCount] = useState(1)
  const [imageSize, setImageSize] = useState('1024x1024')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')
  const [images, setImages] = useState<ImageData[]>([])
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    fetchUserInfo()
    fetchImages()
  }, [])

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/user-info')
      const data = await response.json()
      if (data.success) {
        setUserInfo(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
  }

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images?limit=100')
      const data = await response.json()
      if (data.success) {
        setImages(data.data.images)
      }
    } catch (error) {
      console.error('Failed to fetch images:', error)
    }
  }

  const generateImages = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        variant: 'destructive',
      })
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setProgressText('Starting generation...')

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          count: imageCount,
          size: imageSize,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const total = data.data.total
        setProgressText(`Successfully generated ${total} image${total > 1 ? 's' : ''}!`)
        setProgress(100)
        
        toast({
          title: 'Success!',
          description: `Generated ${total} image${total > 1 ? 's' : ''} successfully`,
        })
        
        await fetchImages()
        
        setTimeout(() => {
          setPrompt('')
        }, 1000)
      } else {
        throw new Error(data.error || 'Failed to generate images')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate images',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
      setTimeout(() => {
        setProgress(0)
        setProgressText('')
      }, 2000)
    }
  }

  const viewImage = async (image: ImageData) => {
    setIsLoadingImage(true)
    setIsModalOpen(true)
    
    try {
      const response = await fetch(`/api/images/${image.id}`)
      const data = await response.json()
      
      if (data.success) {
        setSelectedImage(data.data)
      }
    } catch (error) {
      console.error('Failed to load image:', error)
      toast({
        title: 'Error',
        description: 'Failed to load image',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingImage(false)
    }
  }

  const deleteImage = async (id: string) => {
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Deleted',
          description: 'Image deleted successfully',
        })
        setImages(prev => prev.filter(img => img.id !== id))
        if (selectedImage?.id === id) {
          setIsModalOpen(false)
          setSelectedImage(null)
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      })
    }
  }

  const deleteAllImages = async () => {
    setIsDeletingAll(true)
    try {
      const response = await fetch('/api/images/all', {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast({
          title: 'Success',
          description: `Deleted ${data.deletedCount} images`,
        })
        setImages([])
        setIsModalOpen(false)
        setSelectedImage(null)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete all images',
        variant: 'destructive',
      })
    } finally {
      setIsDeletingAll(false)
      setShowDeleteAllDialog(false)
    }
  }

  const downloadImage = useCallback((image: ImageData) => {
    if (!image.imageData) return
    
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${image.imageData}`
    link.download = `generated-${image.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast({
      title: 'Downloaded',
      description: 'Image saved to your device',
    })
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDeviceIcon = (device?: string) => {
    switch (device?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />
      case 'tablet':
        return <Smartphone className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  AI Image Generator
                </h1>
              </div>
            </div>
            
            {/* User Info - Compact */}
            {userInfo && (
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded-full">
                <Globe className="w-3 h-3" />
                <span className="max-w-[80px] sm:max-w-none truncate">{userInfo.ip}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Generator Card - Always Full Width on Mobile */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm mb-3 sm:mb-4">
          <CardContent className="p-3 sm:p-4">
            {/* Prompt Input */}
            <div className="space-y-1.5 mb-3">
              <Label className="text-xs text-gray-300">Prompt</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                className="bg-gray-900/50 border-gray-600 focus:border-purple-500 focus:ring-purple-500/20 min-h-[80px] sm:min-h-[100px] text-sm resize-none"
                disabled={isGenerating}
              />
            </div>

            {/* Settings Toggle - Mobile */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full py-2 text-xs text-gray-400 mb-2"
            >
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5" />
                Settings
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </button>

            {/* Settings Panel - Collapsible on Mobile */}
            <div className={`${showSettings ? 'block' : 'hidden sm:block'} space-y-3 mb-3`}>
              {/* Image Count - Horizontal */}
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-xs text-gray-300 whitespace-nowrap">Images:</Label>
                <div className="flex gap-1">
                  {[1, 2, 4, 10, 20].map((num) => (
                    <Button
                      key={num}
                      size="sm"
                      variant={imageCount === num ? 'default' : 'outline'}
                      onClick={() => setImageCount(num)}
                      className={`h-7 w-7 p-0 text-xs ${imageCount === num ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600 hover:bg-gray-700'}`}
                      disabled={isGenerating}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Image Size */}
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-xs text-gray-300 whitespace-nowrap">Size:</Label>
                <Select value={imageSize} onValueChange={setImageSize} disabled={isGenerating}>
                  <SelectTrigger className="bg-gray-900/50 border-gray-600 focus:border-purple-500 text-xs h-8 flex-1 min-w-[140px]">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {IMAGE_SIZES.map((size) => (
                      <SelectItem key={size.value} value={size.value} className="text-xs">
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Progress */}
            {isGenerating && (
              <div className="space-y-1.5 mb-3">
                <Progress value={progress} className="h-1.5" />
                <p className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {progressText}
                </p>
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={generateImages}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium h-10 sm:h-11 text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate {imageCount} Image{imageCount > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Gallery Section */}
        <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
          <CardHeader className="py-2.5 sm:py-3 px-3 sm:px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-green-400" />
                Gallery
                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                  {images.length}
                </Badge>
              </CardTitle>
              {images.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowDeleteAllDialog(true)}
                  className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-gray-400">
                <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-50" />
                <p className="text-xs sm:text-sm">No images yet</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Enter a prompt to generate</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-gray-700/30 cursor-pointer transition-all hover:ring-2 hover:ring-purple-500 active:scale-95"
                    onClick={() => viewImage(image)}
                  >
                    <img
                      src={`/api/images/${image.id}?raw=true`}
                      alt={image.prompt}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Overlay on hover/touch */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2">
                        <p className="text-[10px] sm:text-xs text-white line-clamp-2">{image.prompt}</p>
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 mt-1 bg-black/50">
                          {image.size}
                        </Badge>
                      </div>
                    </div>
                    {/* Delete button */}
                    <button
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-500/80 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteImage(image.id)
                      }}
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Info Card - Compact */}
        {userInfo && (
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm mt-3 sm:mt-4">
            <CardContent className="p-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Globe className="w-3 h-3" />
                  <span className="truncate">{userInfo.ip}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  {getDeviceIcon(userInfo.device)}
                  <span className="truncate">{userInfo.browser}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Monitor className="w-3 h-3" />
                  <span className="truncate">{userInfo.os}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Smartphone className="w-3 h-3" />
                  <Badge variant="outline" className="border-gray-600 text-[10px] px-1.5">
                    {userInfo.device}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Image Modal - Fullscreen on Mobile */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[95vh] bg-gray-900 border-gray-700 p-0 overflow-hidden">
          <DialogHeader className="p-3 sm:p-4 border-b border-gray-700">
            <DialogTitle className="text-sm sm:text-base flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-purple-400" />
              Image Preview
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingImage ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : selectedImage ? (
            <div className="flex flex-col max-h-[calc(95vh-60px)]">
              {/* Image */}
              <div className="relative flex-1 overflow-auto bg-gray-800 flex items-center justify-center min-h-0">
                <img
                  src={`data:image/png;base64,${selectedImage.imageData}`}
                  alt={selectedImage.prompt}
                  className="max-w-full max-h-[50vh] sm:max-h-[60vh] object-contain"
                />
              </div>
              
              {/* Info & Actions - Fixed at bottom */}
              <div className="p-3 sm:p-4 border-t border-gray-700 space-y-2 sm:space-y-3">
                <p className="text-xs sm:text-sm">
                  <span className="text-gray-400">Prompt: </span>
                  <span className="text-white line-clamp-2">{selectedImage.prompt}</span>
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <Badge variant="outline" className="border-gray-600 text-[10px] sm:text-xs">
                    {selectedImage.size}
                  </Badge>
                  <Badge variant="outline" className="border-gray-600 text-[10px] sm:text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(selectedImage.createdAt)}
                  </Badge>
                </div>
                
                {/* Actions - Horizontal scroll on mobile */}
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => downloadImage(selectedImage)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-9 sm:h-10 text-xs sm:text-sm"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(`data:image/png;base64,${selectedImage.imageData}`, '_blank')
                    }}
                    className="border-gray-600 hover:bg-gray-700 h-9 sm:h-10 text-xs sm:text-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                    Open
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteImage(selectedImage.id)}
                    className="h-9 sm:h-10 px-3"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700 max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Delete All Images
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-sm">
              Are you sure you want to delete all {images.length} images? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="border-gray-600 hover:bg-gray-700 w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteAllImages}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              disabled={isDeletingAll}
            >
              {isDeletingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer - Compact */}
      <footer className="border-t border-gray-700/50 mt-4 sm:mt-6 py-3 text-center text-[10px] sm:text-xs text-gray-500">
        <p>AI Image Generator - Powered by Z.ai SDK</p>
      </footer>
    </div>
  )
}
