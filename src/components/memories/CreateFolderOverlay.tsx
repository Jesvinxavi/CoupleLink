// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, FolderPlus, X, UploadCloud, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useCoupleData } from "@/hooks/useCoupleData"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface CreateFolderOverlayProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void // Called after folder (and optional photos) created
    onFocusChange?: (isFocused: boolean) => void
}

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export function CreateFolderOverlay({ isOpen, onClose, onSuccess, onFocusChange }: CreateFolderOverlayProps) {
    useLockBodyScroll(isOpen)

    const { couple } = useCoupleData()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [uploading, setUploading] = useState(false)
    const [folderName, setFolderName] = useState("")
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [previewUrls, setPreviewUrls] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    // Mobile Viewport Logic
    const overlayRef = useRef<HTMLDivElement>(null)
    const [isFocused, setIsFocused] = useState(false)
    const [viewportStyle, setViewportStyle] = useState<{ height: number; top: number } | undefined>(undefined)

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    // Combined body lock + viewport resize handler
    useEffect(() => {
        if (!isOpen) {
            // Reset state
            previewUrls.forEach((url) => URL.revokeObjectURL(url))
            setPreviewUrls([])
            setSelectedFiles([])
            setFolderName("")
            setError(null)
            return
        }

        // Handle Visual Viewport for mobile keyboard
        const handleVisualResize = () => {
            const activeEl = document.activeElement
            const isActiveInOverlay = overlayRef.current?.contains(activeEl)
            const isTextInput = activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA"

            if (!isActiveInOverlay || !isTextInput) return

            if (window.visualViewport) {
                setViewportStyle({
                    height: window.visualViewport.height,
                    top: window.visualViewport.offsetTop
                })
            }
        }

        window.visualViewport?.addEventListener("resize", handleVisualResize)
        window.visualViewport?.addEventListener("scroll", handleVisualResize)
        handleVisualResize()

        return () => {
            window.visualViewport?.removeEventListener("resize", handleVisualResize)
            window.visualViewport?.removeEventListener("scroll", handleVisualResize)

            // Reset focus state on close
            if (onFocusChange) onFocusChange(false)
        }
    }, [isOpen, onFocusChange, previewUrls])

    const handleOverlayFocus = (e: React.FocusEvent) => {
        const target = e.target as HTMLElement
        const isTextInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA"
        if (!isTextInput) return

        setIsFocused(true)
        if (onFocusChange) onFocusChange(true)

        if (window.visualViewport) {
            requestAnimationFrame(() => {
                setViewportStyle({
                    height: window.visualViewport!.height,
                    top: window.visualViewport!.offsetTop
                })
            })
        }
    }

    const handleOverlayBlur = (e: React.FocusEvent) => {
        if (overlayRef.current?.contains(e.relatedTarget as Node)) return
        setIsFocused(false)
        if (onFocusChange) onFocusChange(false)
        setViewportStyle(undefined)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            setSelectedFiles((prev) => [...prev, ...files])
            const newPreviews = files.map((file) => URL.createObjectURL(file))
            setPreviewUrls((prev) => [...prev, ...newPreviews])
        }
    }

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
        setPreviewUrls(prev => {
            URL.revokeObjectURL(prev[index])
            return prev.filter((_, i) => i !== index)
        })
    }

    const handleCreateFolder = async () => {
        if (!couple || !folderName.trim()) return
        setError(null)
        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("No user")

            // 1. Create Folder
            const { data: folder, error } = await supabase
                .from("folders")
                .insert({
                    couple_id: couple.id,
                    name: folderName.trim()
                })
                .select()
                .single()

            if (error) throw error

            // 2. Upload photos to this folder if any
            if (selectedFiles.length > 0) {
                for (const file of selectedFiles) {
                    const fileExt = file.name.split(".").pop()
                    const fileName = `${Math.random()}.${fileExt}`
                    const filePath = `${couple.id}/${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from("memories")
                        .upload(filePath, file)

                    if (uploadError) throw uploadError

                    const { data: { publicUrl } } = supabase.storage
                        .from("memories")
                        .getPublicUrl(filePath)

                    await supabase
                        .from("memories")
                        .insert({
                            couple_id: couple.id,
                            uploader_id: user.id,
                            type: "photo",
                            media_url: publicUrl,
                            caption: "", // No caption support for initial folder creation to keep it simple
                            folder_id: folder.id
                        })
                }
            }

            onSuccess()
            onClose()

        } catch (err) {
            logger.error("CreateFolderOverlay", "Error creating folder", err)
            setError("Failed to create folder. Please try again.")
        } finally {
            setUploading(false)
        }
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                        style={{ touchAction: 'none' }}
                        onTouchMove={(e) => e.preventDefault()}
                    />

                    {/* Slide-up Panel */}
                    <motion.div
                        ref={overlayRef}
                        initial={{ y: "100%" }}
                        animate={{
                            y: 0,
                            height: isFocused && viewportStyle ? viewportStyle.height : 'auto',
                            top: isFocused && viewportStyle ? viewportStyle.top : 'auto'
                        }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 35, stiffness: 150, mass: 1 }}
                        onFocus={handleOverlayFocus}
                        onBlur={handleOverlayBlur}
                        className="fixed inset-x-0 bottom-0 z-[51] outline-none overflow-hidden"
                        style={{
                            maxHeight: isFocused ? 'none' : 'calc(100dvh - 70px)',
                            touchAction: 'none',
                            overscrollBehavior: 'none'
                        }}
                        onTouchMove={(e) => e.preventDefault()}
                    >
                        {/* The Skirt */}
                        <div
                            className="absolute top-full inset-x-0 h-[100vh] bg-rose-50 dark:bg-gray-900"
                            style={{ touchAction: 'none' }}
                            onTouchMove={(e) => e.preventDefault()}
                        />

                        {/* Inner Content Container */}
                        <div className={`flex flex-col w-full bg-rose-50 dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 rounded-t-[32px] overflow-hidden ${isFocused ? 'h-full' : ''}`}
                            style={{
                                maxHeight: isFocused ? 'none' : 'calc(100dvh - 70px)'
                            }}
                        >

                            {/* Distinct Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <FolderPlus className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Folder</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Organize your memories
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <X className="w-6 h-6 text-gray-500" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div
                                className="p-6 flex flex-col flex-1 bg-rose-50 dark:bg-gray-900 overflow-y-auto space-y-6"
                                style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
                                onTouchMove={(e) => e.stopPropagation()}
                            >

                                {/* Folder Name Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="folderName" className="text-gray-700 dark:text-gray-300">Folder Name</Label>
                                    <Input
                                        id="folderName"
                                        value={folderName}
                                        onChange={(e) => setFolderName(e.target.value)}
                                        placeholder="e.g. Summer Vacation 2024"
                                        className="bg-white dark:bg-gray-800"
                                    />
                                </div>

                                {error && (
                                    <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2">
                                        {error}
                                    </div>
                                )}

                                {/* Conditional Upload UI (Tall Dropzone -> Grid + Plus Button) */}
                                <div className="space-y-2">
                                    <Label className="text-gray-700 dark:text-gray-300">Add Photos (Optional)</Label>

                                    {selectedFiles.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {/* Existing Previews */}
                                            {previewUrls.map((url, idx) => (
                                                <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden group shadow-sm bg-white border border-gray-100 dark:border-gray-800">
                                                    <img
                                                        src={url}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
                                                    <button
                                                        onClick={() => removeFile(idx)}
                                                        className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Add More Button (Square) */}
                                            <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                <Plus className="w-6 h-6 text-gray-400" />
                                                <input
                                                    id="folder-dropzone-file"
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileSelect}
                                                />
                                            </label>
                                        </div>
                                    ) : (
                                        /* Initial Tall Drop Zone */
                                        <div className="flex items-center justify-center w-full">
                                            <label htmlFor="folder-dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <div className="w-12 h-12 bg-blue-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                                                        <UploadCloud className="w-6 h-6 text-blue-500" />
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Tap to upload photos</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Start your folder with memories</p>
                                                </div>
                                                <input
                                                    id="folder-dropzone-file"
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileSelect}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div className="h-8"></div> {/* Spacer for keyboard */}
                            </div>

                            {/* Footer Action - Hidden when keyboard is open */}
                            {!isFocused && (
                                <div className="p-4 bg-white dark:bg-gray-900 border-t border-rose-100 dark:border-gray-800 safebottom">
                                    <Button
                                        onClick={handleCreateFolder}
                                        disabled={uploading || !folderName.trim()}
                                        className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12 shadow-lg shadow-blue-500/20 text-lg font-medium"
                                    >
                                        {uploading ? (
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        ) : (
                                            <FolderPlus className="w-5 h-5 mr-2" />
                                        )}
                                        {uploading ? 'Creating...' : 'Create Folder'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}
