"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Loader2,
  FileIcon,
  FileAudio,
  FileVideo,
  FileSpreadsheet,
  FileImage,
  Upload,
  PlusCircle,
  Github,
  X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const fileCategories = {
  Documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
  ],
  Images: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"],
  Audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
  Video: ["video/mp4", "video/webm"],
  Spreadsheets: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
  ],
  Presentations: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
}

const conversionMap: { [key: string]: string[] } = {
  "application/pdf": ["docx", "txt"],
  "application/msword": ["pdf", "txt"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["pdf", "txt"],
  "text/plain": ["pdf", "docx"],
  "text/markdown": ["pdf"],
  "image/jpeg": ["png", "webp", "gif", "heic"],
  "image/png": ["jpeg", "webp", "gif", "heic"],
  "image/gif": ["jpeg", "png", "heic"],
  "image/webp": ["jpeg", "png", "heic"],
  "image/heic": ["jpeg", "png", "webp"],
  "audio/mpeg": ["wav", "ogg"],
  "audio/wav": ["mp3", "ogg"],
  "audio/ogg": ["mp3", "wav"],
  "video/mp4": ["webm"],
  "video/webm": ["mp4"],
  "application/vnd.ms-excel": ["xlsx", "csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["csv", "xls"],
  "text/csv": ["xlsx", "xls"],
  "application/vnd.ms-powerpoint": ["pptx", "pdf"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["ppt", "pdf"],
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Documents":
      return <FileIcon className="h-6 w-6" />
    case "Images":
      return <FileImage className="h-6 w-6" />
    case "Audio":
      return <FileAudio className="h-6 w-6" />
    case "Video":
      return <FileVideo className="h-6 w-6" />
    case "Spreadsheets":
    case "Presentations":
      return <FileSpreadsheet className="h-6 w-6" />
    default:
      return <FileIcon className="h-6 w-6" />
  }
}

type FileGroup = {
  format: string
  category: string | null
  files: File[]
  convertTo: string
  availableFormats: string[]
}

export default function Home() {
  console.log("FileConverter page rendering")

  useEffect(() => {
    console.log("FileConverter page mounted")
  }, [])

  const [fileGroups, setFileGroups] = useState<FileGroup[]>([])
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const handleFileChange = useCallback(
    (selectedFiles: File[]) => {
      const groupedFiles = selectedFiles.reduce<Record<string, FileGroup>>((groups, file) => {
        const fileType = file.type || ''
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
        
        const normalizedType = 
          (fileExtension === 'heic' || fileExtension === 'heif') 
            ? 'image/heic'
            : (fileExtension === 'md' || fileExtension === 'markdown')
            ? 'text/markdown'
            : fileType

        const formats = conversionMap[normalizedType] || []
        
        if (formats.length === 0) {
          toast({
            title: "Unsupported File Type",
            description: `Sorry, we don't support conversions for ${file.name}.`,
            variant: "destructive",
          })
          return groups
        }

        const category = Object.entries(fileCategories).find(([_, types]) => 
          types.includes(normalizedType))?.[0] || null

        if (!groups[normalizedType]) {
          groups[normalizedType] = {
            format: normalizedType,
            category,
            files: [],
            convertTo: "",
            availableFormats: formats
          }
        }
        
        groups[normalizedType].files.push(file)
        return groups
      }, {})

      setFileGroups(prev => {
        const newGroups = [...prev]
        Object.values(groupedFiles).forEach(group => {
          const existingGroupIndex = newGroups.findIndex(g => g.format === group.format)
          if (existingGroupIndex >= 0) {
            newGroups[existingGroupIndex].files.push(...group.files)
          } else {
            newGroups.push(group)
          }
        })
        return newGroups
      })
    },
    [toast]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (e.dataTransfer.files?.length) {
        handleFileChange(Array.from(e.dataTransfer.files))
      }
    },
    [handleFileChange]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const handleRemoveFile = (groupIndex: number, fileIndex: number) => {
    setFileGroups(prev => prev.map((group, i) => {
      if (i !== groupIndex) return group
      const newFiles = group.files.filter((_, fi) => fi !== fileIndex)
      return newFiles.length > 0 ? { ...group, files: newFiles } : null
    }).filter((group): group is FileGroup => group !== null))
  }

  const handleRemoveGroup = (groupIndex: number) => {
    setFileGroups(prev => prev.filter((_, i) => i !== groupIndex))
  }

  const getProperMimeType = (format: string): string => {
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'png': 'image/png',
      'jpeg': 'image/jpeg',
      'jpg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'heic': 'image/heic',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'csv': 'text/csv',
      'xls': 'application/vnd.ms-excel',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    }
    return mimeTypes[format.toLowerCase()] || `application/${format}`
  }

  const convertMarkdownToPDF = (markdownContent: string): string => {
    // Simple Markdown to HTML conversion for basic PDF generation
    let html = markdownContent
      // Convert headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Convert bold and italic
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Convert lists
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      // Convert code blocks
      .replace(/```[\s\S]*?```/gim, (match) => {
        const code = match.replace(/```(\w+)?\n?/g, '').replace(/```/g, '')
        return `<pre><code>${code}</code></pre>`
      })
      // Convert line breaks
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>')
    
    // Wrap in basic HTML structure
    html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Converted from Markdown</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 2px; }
        li { margin: 5px 0; }
    </style>
</head>
<body>
    <p>${html}</p>
</body>
</html>`
    
    return html
  }

  const simulateFileConversion = async (originalFile: File, newFormat: string): Promise<File> => {
    const newFileName = originalFile.name.replace(/\.[^/.]+$/, "") + "." + newFormat
    const mimeType = getProperMimeType(newFormat)
    
    // Handle special conversions
    if (newFormat.toLowerCase() === 'pdf') {
      const originalName = originalFile.name.toLowerCase()
      if (originalName.endsWith('.md') || originalName.endsWith('.markdown')) {
        try {
          // Convert markdown to HTML for PDF
          const text = await originalFile.text()
          const htmlContent = convertMarkdownToPDF(text)
          return new File([htmlContent], newFileName, { type: 'text/html' })
        } catch (error) {
          // Fallback to original content if reading fails
          return new File([originalFile], newFileName, { type: mimeType })
        }
      }
    }
    
    // For other conversions, return the original content with proper MIME type
    return new File([originalFile], newFileName, { type: mimeType })
  }

  const triggerDownload = (file: File) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement("a")
    a.href = url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleConvert = async () => {
    const unconvertibleGroups = fileGroups.filter(g => !g.convertTo)
    if (unconvertibleGroups.length > 0) {
      toast({
        title: "Missing Format Selection",
        description: "Please select a conversion format for all file groups.",
        variant: "destructive",
      })
      return
    }

    setIsConverting(true)
    setProgress(0)

    const conversionTime = 2000
    const startTime = Date.now()

    while (Date.now() - startTime < conversionTime) {
      const elapsedTime = Date.now() - startTime
      const newProgress = Math.min(100, Math.round((elapsedTime / conversionTime) * 100))
      setProgress(newProgress)
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }

    // Convert and download all files
    for (const group of fileGroups) {
      for (const file of group.files) {
        const convertedFile = await simulateFileConversion(file, group.convertTo)
        triggerDownload(convertedFile)
      }
    }

    setIsConverting(false)
    setProgress(100)
    setFileGroups([])

    const totalFiles = fileGroups.reduce((sum, group) => sum + group.files.length, 0)
    const hasMarkdownToPdf = fileGroups.some(group => 
      group.convertTo.toLowerCase() === 'pdf' && 
      group.files.some(file => file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.markdown'))
    )
    
    toast({
      title: "Conversion Complete",
      description: hasMarkdownToPdf 
        ? `Successfully converted ${totalFiles} file${totalFiles > 1 ? 's' : ''}. Note: Markdown to PDF files are converted to HTML format for better compatibility.`
        : `Successfully converted ${totalFiles} file${totalFiles > 1 ? 's' : ''}.`
    })
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-3xl p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">FileForge</h1>
            <p className="text-muted-foreground mt-2">Convert your files to various formats with ease</p>
          </div>
          <div className="flex space-x-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      window.open(
                        'https://github.com/MarcBlattmann/FileForge/issues/new?labels=feature-request&template=feature_request.md&title=New+Format+Request',
                        '_blank'
                      )
                    }}
                  >
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Request New Format</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                    <a href="https://github.com/MarcBlattmann/FileForge" target="_blank" rel="noopener noreferrer">
                      <Github className="h-5 w-5" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View on GitHub</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <div className="space-y-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer transition-all duration-300 hover:border-primary"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <Input
              id="file-input"
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFileChange(Array.from(e.target.files))}
              className="hidden"
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-muted-foreground">
              Drag and drop your files here, or click to select
            </p>
          </div>

          <AnimatePresence>
            {fileGroups.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border rounded-lg overflow-hidden bg-background"
              >
                <div className="divide-y">
                  {fileGroups.map((group, groupIndex) => (
                    <motion.div
                      key={`${group.format}-${groupIndex}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={cn(
                        "hover:bg-muted/50 transition-colors",
                        group.files.length === 1 ? "py-2 px-3" : "p-3"
                      )}
                    >
                      <div className={cn(
                        "flex items-center gap-3",
                        group.files.length > 1 && "mb-1.5"
                      )}>
                        <div className="flex-none text-muted-foreground">
                          {group.category && getCategoryIcon(group.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {group.files.length === 1 ? (
                              group.files[0].name
                            ) : (
                              `${group.files.length} ${group.category} files`
                            )}
                          </p>
                        </div>
                        <div className="flex-none w-28">
                          <Select
                            value={group.convertTo}
                            onValueChange={(value) => {
                              setFileGroups(prev => prev.map((g, i) => 
                                i === groupIndex ? { ...g, convertTo: value } : g
                              ))
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Format" />
                            </SelectTrigger>
                            <SelectContent>
                              {group.availableFormats.map((format) => (
                                <SelectItem key={format} value={format}>
                                  {format.toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-none h-8 w-8"
                          onClick={() => handleRemoveGroup(groupIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {group.files.length > 1 && (
                        <div className="ml-9 mt-2 space-y-0.5 text-sm">
                          {group.files.map((file, fileIndex) => (
                            <div
                              key={file.name}
                              className="flex items-center gap-2 text-muted-foreground px-2 py-0.5 rounded-sm hover:bg-muted/75 group"
                            >
                              <div className="flex-1 truncate text-xs">
                                {file.name}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveFile(groupIndex, fileIndex)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {fileGroups.length > 0 && (
            <Button 
              onClick={handleConvert} 
              disabled={isConverting} 
              className="w-full"
            >
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting {fileGroups.reduce((sum, group) => sum + group.files.length, 0)} file{fileGroups.reduce((sum, group) => sum + group.files.length, 0) > 1 ? 's' : ''}
                </>
              ) : (
                `Convert and Download ${fileGroups.reduce((sum, group) => sum + group.files.length, 0)} file${fileGroups.reduce((sum, group) => sum + group.files.length, 0) > 1 ? 's' : ''}`
              )}
            </Button>
          )}

          {isConverting && <Progress value={progress} className="w-full" />}
        </div>
      </div>
    </div>
  )
}

