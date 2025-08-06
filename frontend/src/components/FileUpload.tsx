import React, { useState, useCallback } from 'react'
import { Upload, X, File, Image, AlertCircle, CheckCircle } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  acceptedTypes?: string[]
  disabled?: boolean
}

interface UploadedFile {
  filename: string
  originalname: string
  mimetype: string
  size: number
  url: string
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  maxFiles = 3,
  maxSize = 10, // 10MB
  acceptedTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt'],
  disabled = false
}) => {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // ตรวจสอบขนาดไฟล์
    if (file.size > maxSize * 1024 * 1024) {
      return `ไฟล์ "${file.name}" มีขนาดใหญ่เกินกำหนด (สูงสุด ${maxSize}MB)`
    }

    // ตรวจสอบประเภทไฟล์
    const isAccepted = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      } else if (type.includes('/*')) {
        const category = type.split('/')[0]
        return file.type.startsWith(category)
      } else {
        return file.type === type
      }
    })

    if (!isAccepted) {
      return `ไฟล์ "${file.name}" ไม่ใช่ประเภทที่รองรับ`
    }

    return null
  }

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return

    // ตรวจสอบจำนวนไฟล์
    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`สามารถอัพโหลดได้สูงสุด ${maxFiles} ไฟล์`)
      return
    }

    // ตรวจสอบไฟล์แต่ละไฟล์
    for (const file of files) {
      const error = validateFile(file)
      if (error) {
        toast.error(error)
        return
      }
    }

    setUploading(true)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await axios.post('/files/upload-temp', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(prev => ({
              ...prev,
              current: progress
            }))
          }
        }
      })

      const newFiles = response.data.files as UploadedFile[]
      const allFiles = [...uploadedFiles, ...newFiles]
      
      setUploadedFiles(allFiles)
      onFilesUploaded(allFiles)
      
      toast.success(`อัพโหลดไฟล์สำเร็จ ${newFiles.length} ไฟล์`)

    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์')
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }

  const removeFile = (filename: string) => {
    const newFiles = uploadedFiles.filter(file => file.filename !== filename)
    setUploadedFiles(newFiles)
    onFilesUploaded(newFiles)
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    uploadFiles(files)
  }, [disabled, uploadedFiles, maxFiles, uploadFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    
    const files = Array.from(e.target.files || [])
    uploadFiles(files)
    
    // Reset input value เพื่อให้สามารถเลือกไฟล์เดิมซ้ำได้
    e.target.value = ''
  }

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />
    }
    return <File className="h-8 w-8 text-gray-500" />
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {uploadedFiles.length < maxFiles && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-300 dark:border-gray-600'
          } ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            disabled={disabled || uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />

          <div className="text-center">
            <Upload className={`mx-auto h-12 w-12 ${
              dragActive ? 'text-primary-500' : 'text-gray-400'
            }`} />
            
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {uploading ? 'กำลังอัพโหลด...' : 'คลิกเพื่อเลือกไฟล์หรือลากไฟล์มาวางที่นี่'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                รองรับ: รูปภาพ, PDF, Word, Text • สูงสุด {maxSize}MB • ได้ {maxFiles} ไฟล์
              </p>
            </div>

            {uploading && uploadProgress.current && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.current}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{uploadProgress.current}%</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            ไฟล์ที่อัพโหลดแล้ว ({uploadedFiles.length}/{maxFiles})
          </h4>
          
          {uploadedFiles.map((file, index) => (
            <div
              key={file.filename}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center space-x-3">
                {getFileIcon(file.mimetype)}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.originalname}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)} • {file.mimetype}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                {!disabled && (
                  <button
                    onClick={() => removeFile(file.filename)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                    title="ลบไฟล์"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Limits Info */}
      {uploadedFiles.length >= maxFiles && (
        <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ถึงขีดจำกัดการอัพโหลดแล้ว ({maxFiles} ไฟล์)
          </p>
        </div>
      )}
    </div>
  )
}

export default FileUpload