'use client'

import { useState, useRef } from 'react'
import { XMarkIcon, PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { makeAuthenticatedRequest } from '@/lib/auth/client-auth'

export default function BankLogoUploadModal({ 
    isOpen, 
    onClose, 
    onUploadSuccess, 
    currentLogoUrl = null,
    bankName = 'Bank'
}) {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const fileInputRef = useRef(null)

    const handleFileSelect = (event) => {
        const file = event.target.files[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (JPEG, PNG, GIF, or WebP)')
            return
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB')
            return
        }

        setSelectedFile(file)
        setError(null)

        // Create preview URL
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload')
            return
        }

        setIsUploading(true)
        setUploadProgress(0)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('logo', selectedFile)

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval)
                        return 90
                    }
                    return prev + 10
                })
            }, 100)

            const response = await fetch('/api/upload/bank-logo', {
                method: 'POST',
                body: formData
            })

            clearInterval(progressInterval)
            setUploadProgress(100)

            const data = await response.json()

            if (data.success) {
                // Now save the logo URL to the database using authenticated request
                const updateResponse = await makeAuthenticatedRequest('/api/users/update-bank-logo', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ logo_url: data.logo_url })
                })

                if (!updateResponse) {
                    throw new Error('Authentication failed')
                }

                if (updateResponse.ok) {
                    setSuccess(true)
                    setError(null)
                    
                    // Call success callback with new logo URL
                    if (onUploadSuccess) {
                        onUploadSuccess(data.logo_url)
                    }

                    // Close modal after 2 seconds
                    setTimeout(() => {
                        onClose()
                        resetState()
                    }, 2000)
                } else {
                    const updateData = await updateResponse.json()
                    throw new Error(updateData.error || 'Failed to save logo to database')
                }
            } else {
                throw new Error(data.error || 'Upload failed')
            }
        } catch (err) {
            setError(err.message || 'Upload failed. Please try again.')
            setUploadProgress(0)
        } finally {
            setIsUploading(false)
        }
    }

    const resetState = () => {
        setSelectedFile(null)
        setPreviewUrl(null)
        setError(null)
        setSuccess(false)
        setUploadProgress(0)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleClose = () => {
        resetState()
        onClose()
    }

    const handleDragOver = (e) => {
        e.preventDefault()
    }

    const handleDrop = (e) => {
        e.preventDefault()
        const files = e.dataTransfer.files
        if (files.length > 0) {
            const file = files[0]
            if (file.type.startsWith('image/')) {
                setSelectedFile(file)
                setError(null)
                const url = URL.createObjectURL(file)
                setPreviewUrl(url)
            } else {
                setError('Please drop an image file')
            }
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

                <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Update {bankName} Logo
                        </h3>
                        <button
                            onClick={handleClose}
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Current Logo Display */}
                    {currentLogoUrl && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">Current Logo:</p>
                            <div className="flex items-center space-x-3">
                                <img
                                    src={currentLogoUrl}
                                    alt={`Current ${bankName} logo`}
                                    className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
                                />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{bankName}</p>
                                    <p className="text-xs text-gray-500">Current logo</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload Area */}
                    <div className="mb-4">
                        <div
                            className={`border-2 border-dashed rounded-lg p-6 text-center ${
                                selectedFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            {selectedFile ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-center">
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="w-20 h-20 rounded-lg object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="font-medium text-blue-600 hover:text-blue-500"
                                            >
                                                Click to upload
                                            </button>{' '}
                                            or drag and drop
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG, GIF, WebP up to 5MB
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Upload Progress */}
                    {isUploading && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Uploading...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm text-green-600">
                                ✅ Logo uploaded successfully! The modal will close automatically.
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={handleClose}
                            disabled={isUploading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isUploading ? (
                                <>
                                    <ArrowUpTrayIcon className="h-4 w-4 mr-2 animate-pulse" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                                    Upload Logo
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
