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
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const fileCategories = {
  Documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
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

export default function Home() {
  console.log("FileConverter page rendering")

  useEffect(() => {
    console.log("FileConverter page mounted")
  }, [])

  const [file, setFile] = useState<File | null>(null)
  const [convertTo, setConvertTo] = useState<string>("")
  const [isConverting, setIsConverting] = useState(false)
  const [availableFormats, setAvailableFormats] = useState<string[]>([])
  const [fileCategory, setFileCategory] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const handleFileChange = useCallback(
    (selectedFile: File) => {
      setFile(selectedFile)
      setConvertTo("")
      
      // Handle HEIC files which might have different MIME types
      const fileType = selectedFile.type || '';
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      
      // Normalize HEIC file type
      const normalizedType = 
        (fileExtension === 'heic' || fileExtension === 'heif') 
          ? 'image/heic'
          : fileType;
      
      const category =
        Object.entries(fileCategories).find(([_, types]) => 
          types.includes(normalizedType))?.[0] || null;
          
      setFileCategory(category)
      const formats = conversionMap[normalizedType] || []
      setAvailableFormats(formats)
      if (formats.length === 0) {
        toast({
          title: "Unsupported File Type",
          description: "Sorry, we don't support conversions for this file type.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0])
      }
    },
    [handleFileChange],
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  const simulateFileConversion = (originalFile: File, newFormat: string): File => {
    const newFileName = originalFile.name.replace(/\.[^/.]+$/, "") + "." + newFormat
    return new File([originalFile], newFileName, { type: `application/${newFormat}` })
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
    if (!file || !convertTo) {
      toast({
        title: "Error",
        description: "Please select a file and conversion type.",
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

    const convertedFile = simulateFileConversion(file, convertTo)

    setIsConverting(false)
    setProgress(100)

    console.log(
      `Conversion complete: ${file.name} has been converted to ${convertTo.toUpperCase()}. Downloading now...`,
    )

    triggerDownload(convertedFile)
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
              onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
              className="hidden"
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-muted-foreground">Drag and drop your file here, or click to select</p>
          </div>

          <AnimatePresence>
            {file && fileCategory && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center space-x-4 bg-muted p-4 rounded-lg"
              >
                {getCategoryIcon(fileCategory)}
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{fileCategory}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {file && availableFormats.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <Label htmlFor="convertTo">Convert To</Label>
                <Select onValueChange={setConvertTo} value={convertTo}>
                  <SelectTrigger id="convertTo">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFormats.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </AnimatePresence>

          <Button onClick={handleConvert} disabled={isConverting || !file || !convertTo} className="w-full">
            {isConverting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting
              </>
            ) : (
              "Convert and Download"
            )}
          </Button>

          {isConverting && <Progress value={progress} className="w-full" />}
        </div>
      </div>
    </div>
  )
}

