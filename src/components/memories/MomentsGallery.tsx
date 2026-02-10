// ═══════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════
import { useEffect, useMemo, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Image as ImageIcon, Folder, FolderPlus, ChevronLeft, Trash2, Pencil, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import { useCoupleData } from "@/hooks/useCoupleData"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmationModal } from "@/components/ui/ConfirmationModal"
import { AddMomentsOverlay } from "@/components/memories/AddMomentsOverlay"
import { CreateFolderOverlay } from "@/components/memories/CreateFolderOverlay"

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
interface Moment {
    id: string
    media_url: string | null
    caption: string | null
    created_at: string
    uploader_id: string | null
    folder_id: string | null
}

interface FolderItem {
    id: string
    name: string
    created_at: string
}

const MOMENTS_PAGE_SIZE = 24

// ═══════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════
export const MomentsGallery = () => {
    const { couple } = useCoupleData()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════
    const [moments, setMoments] = useState<Moment[]>([])
    const [folders, setFolders] = useState<FolderItem[]>([])
    const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null)
    const [loading, setLoading] = useState(true)

    // Overlay States
    const [isUploadOpen, setIsUploadOpen] = useState(false)
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)

    // Expansion & Management State
    const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null)
    const [isEditCaptionOpen, setIsEditCaptionOpen] = useState(false)
    const [editingCaption, setEditingCaption] = useState("")
    const [isDeleteMomentOpen, setIsDeleteMomentOpen] = useState(false)

    // Folder Management State
    const [isEditFolderOpen, setIsEditFolderOpen] = useState(false)
    const [editingFolderName, setEditingFolderName] = useState("")
    const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false)
    const [visibleCount, setVisibleCount] = useState(MOMENTS_PAGE_SIZE)



    // ═══════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════
    const fetchData = useCallback(async () => {
        if (!couple) return
        try {
            setLoading(true)

            // Fetch Folders (only if in root)
            let foldersData: FolderItem[] = []
            if (!currentFolder) {
                const { data: fData, error: fError } = await supabase
                    .from("folders")
                    .select("id, name, created_at")
                    .eq("couple_id", couple.id)
                    .order("created_at", { ascending: false })
                if (fError) throw fError
                foldersData = (fData as FolderItem[]) || []
            }
            setFolders(foldersData)

            // Fetch Moments
            let query = supabase
                .from("memories")
                .select("id, media_url, caption, created_at, uploader_id, folder_id")
                .eq("couple_id", couple.id)
                .eq("type", "photo")
                .order("created_at", { ascending: false })

            if (currentFolder) {
                query = query.eq("folder_id", currentFolder.id)
            } else {
                query = query.is("folder_id", null)
            }

            const { data: mData, error: mError } = await query
            if (mError) throw mError
            setMoments(mData as any || [])
        } catch (err) {
            logger.error("MomentsGallery", "Error fetching data", err)
        } finally {
            setLoading(false)
        }
    }, [couple, currentFolder])

    // ═══════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════
    useEffect(() => {
        fetchData()
    }, [fetchData])

    useEffect(() => {
        setVisibleCount(MOMENTS_PAGE_SIZE)
    }, [currentFolder?.id, moments.length])

    const visibleMoments = useMemo(() => {
        return moments.slice(0, visibleCount)
    }, [moments, visibleCount])

    const canLoadMore = moments.length > visibleCount

    const handleLoadMore = useCallback(() => {
        setVisibleCount((prev) => Math.min(prev + MOMENTS_PAGE_SIZE, moments.length))
    }, [moments.length])

    // Check for action=new_post in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get("action") === "new_post") {
            setIsUploadOpen(true)
            // Clean up URL
            window.history.replaceState({}, "", window.location.pathname + "?tab=moments")
        }
    }, [])

    const handleUpdateMoment = async () => {
        if (!selectedMoment) return
        try {
            const { error } = await supabase
                .from("memories")
                .update({ caption: editingCaption })
                .eq("id", selectedMoment.id)

            if (error) throw error

            setMoments(prev => prev.map(m =>
                m.id === selectedMoment.id ? { ...m, caption: editingCaption } : m
            ))
            setSelectedMoment(prev => prev ? { ...prev, caption: editingCaption } : null)
            setIsEditCaptionOpen(false)
        } catch (error) {
            logger.error("MomentsGallery", "Error updating caption", error)
        }
    }

    const handleDeleteMoment = async () => {
        if (!selectedMoment) return
        try {
            // 1. Delete file from storage if url exists
            if (selectedMoment.media_url) {
                const path = selectedMoment.media_url.split("/memories/")[1]
                if (path) {
                    await supabase.storage
                        .from("memories")
                        .remove([path]) // Remove uses array of paths
                }
            }

            // 2. Delete record
            const { error } = await supabase
                .from("memories")
                .delete()
                .eq("id", selectedMoment.id)

            if (error) throw error

            setMoments(prev => prev.filter(m => m.id !== selectedMoment.id));
            setSelectedMoment(null)
            setIsDeleteMomentOpen(false)
        } catch (error) {
            logger.error("MomentsGallery", "Error deleting moment", error)
        }
    }

    const handleUpdateFolder = async () => {
        if (!currentFolder || !editingFolderName.trim()) return
        try {
            const { error } = await supabase
                .from("folders")
                .update({ name: editingFolderName })
                .eq("id", currentFolder.id)

            if (error) throw error

            setCurrentFolder({ ...currentFolder, name: editingFolderName })
            setIsEditFolderOpen(false)
        } catch (error) {
            logger.error("MomentsGallery", "Error updating folder", error)
        }
    }

    const handleDeleteFolder = async () => {
        if (!currentFolder) return
        try {
            // 1. Get all memories in folder to delete their files
            const { data: folderMoments } = await supabase
                .from("memories")
                .select("media_url")
                .eq("folder_id", currentFolder.id)

            if (folderMoments && folderMoments.length > 0) {
                const pathsToRemove = folderMoments
                    .map(m => {
                        if (m.media_url) {
                            return m.media_url.split("/memories/")[1]
                        }
                        return null
                    })
                    .filter((p): p is string => p !== null)

                if (pathsToRemove.length > 0) {
                    await supabase.storage
                        .from("memories")
                        .remove(pathsToRemove)
                }
            }

            // 2. Delete Folder (Cascade should handle memories rows if set up, but let's be safe and delete memories rows first)
            await supabase
                .from("memories")
                .delete()
                .eq("folder_id", currentFolder.id)

            // 3. Delete Folder
            const { error } = await supabase
                .from("folders")
                .delete()
                .eq("id", currentFolder.id)

            if (error) throw error

            setCurrentFolder(null) // Go back to root
            fetchData() // Refresh root list
        } catch (error) {
            logger.error("MomentsGallery", "Error deleting folder", error)
        }
    }

    // ═══════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════
    return (
        <div className="space-y-6">
            {/* Header / Breadcrumbs */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {currentFolder && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentFolder(null)}
                            className="mr-1"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                        {currentFolder ? currentFolder.name : 'Gallery'}
                    </h2>
                </div>

                <div className="flex gap-2">
                    {currentFolder ? (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                className="bg-white dark:bg-gray-800"
                                onClick={() => {
                                    setEditingFolderName(currentFolder.name);
                                    setIsEditFolderOpen(true);
                                }}
                            >
                                <Pencil className="w-4 h-4 text-gray-500" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="bg-white dark:bg-gray-800"
                                onClick={() => setIsDeleteFolderOpen(true)}
                            >
                                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500" />
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => setIsCreateFolderOpen(true)}
                        >
                            <FolderPlus className="w-4 h-4" />
                            <span className="hidden sm:inline">New Folder</span>
                        </Button>
                    )}

                    <Button
                        size={currentFolder ? 'icon' : 'default'}
                        className="bg-rose-500 hover:bg-rose-600 text-white gap-2 border border-transparent"
                        onClick={() => setIsUploadOpen(true)}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add Photo</span>
                    </Button>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Folders */}
                    {!currentFolder && folders.map((folder) => (
                        <div
                            key={folder.id}
                            onClick={() => setCurrentFolder(folder)}
                            className="group relative aspect-square bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                        >
                            <Folder className="w-12 h-12 text-blue-400 mb-2" />
                            <span className="font-medium text-gray-700 dark:text-gray-200 text-center px-2 truncate w-full">
                                {folder.name}
                            </span>
                        </div>
                    ))}

                    {/* Moments */}
                    {visibleMoments.map((moment) => (
                        <div
                            key={moment.id}
                            onClick={() => setSelectedMoment(moment)}
                            className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer"
                        >
                            <motion.img
                                layoutId={`moment-${moment.id}`}
                                src={moment.media_url || ''}
                                alt={moment.caption || 'Moment'}
                                className="h-full w-full object-cover"
                                style={{ transformOrigin: "center" }}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                loading="lazy"
                                decoding="async"
                            />
                        </div>
                    ))}

                    {canLoadMore && (
                        <div className="col-span-full flex justify-center pt-4">
                            <Button variant="outline" onClick={handleLoadMore}>
                                Load more ({visibleMoments.length} of {moments.length})
                            </Button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && moments.length === 0 && folders.length === 0 && (
                        <div className="col-span-full">
                            <Card className="border-dashed border-2 border-gray-200 shadow-none">
                                <CardContent className="flex flex-col items-center justify-center h-64 text-center p-6">
                                    <ImageIcon className="w-12 h-12 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No moments yet</h3>
                                    <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                        {currentFolder
                                            ? "This folder is empty. Upload some photos!"
                                            : "Upload photos or create folders to organize your memories."}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            )}

            {/* Expanded Moment View */}
            <AnimatePresence>
                {selectedMoment && (
                    <>
                        {createPortal(
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                                    onClick={() => setSelectedMoment(null)}
                                />

                                {/* Content */}
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center gap-4 z-10"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Top Control Bar - Actions */}
                                    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 border border-gray-200/50 dark:border-gray-700/50">
                                        <button
                                            onClick={() => {
                                                setEditingCaption(selectedMoment.caption || '');
                                                setIsEditCaptionOpen(true);
                                            }}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-700 dark:text-gray-200"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <div className="h-3 w-px bg-gray-300 dark:bg-gray-600 shrink-0" />
                                        <button
                                            onClick={() => setIsDeleteMomentOpen(true)}
                                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="h-3 w-px bg-gray-300 dark:bg-gray-600 shrink-0" />
                                        <button
                                            onClick={() => {
                                                setSelectedMoment(null)
                                            }}
                                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-700 dark:text-gray-200"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Image */}
                                    <motion.img
                                        layoutId={`moment-${selectedMoment.id}`}
                                        src={selectedMoment.media_url || ''}
                                        alt={selectedMoment.caption || 'Expanded Moment'}
                                        className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                                        style={{ transformOrigin: "center" }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        loading="lazy"
                                        decoding="async"
                                    />

                                    {/* Bottom Control Bar - Caption */}
                                    {selectedMoment.caption && (
                                        <div
                                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-lg max-w-md w-auto text-center border border-gray-200/50 dark:border-gray-700/50"
                                        >
                                            <p className="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed font-medium">
                                                {selectedMoment.caption}
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            </div>,
                            document.body
                        )}
                    </>
                )}
            </AnimatePresence>

            {/* Modals */}

            {/* Delete Moment Confirmation */}
            <ConfirmationModal
                isOpen={isDeleteMomentOpen}
                onClose={() => setIsDeleteMomentOpen(false)}
                onConfirm={handleDeleteMoment}
                title="Delete Photo"
                description="Are you sure you want to delete this photo? This action cannot be undone."
                variant="destructive"
                confirmText="Delete"
            />

            {/* Edit Caption Dialog */}
            <Dialog open={isEditCaptionOpen} onOpenChange={setIsEditCaptionOpen}>
                <DialogContent
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="max-w-sm rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Edit Caption</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Textarea
                            value={editingCaption}
                            onChange={(e) => setEditingCaption(e.target.value)}
                            placeholder="Add a caption..."
                            className="min-h-[100px] resize-none"
                        />
                        <DialogFooter>
                            <Button onClick={handleUpdateMoment} className="bg-rose-500 hover:bg-rose-600 text-white">
                                Save
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Folder Confirmation */}
            <ConfirmationModal
                isOpen={isDeleteFolderOpen}
                onClose={() => setIsDeleteFolderOpen(false)}
                onConfirm={handleDeleteFolder}
                title="Delete Folder"
                description="Are you sure you want to delete this folder? All photos inside it will be permanently deleted. This action cannot be undone."
                variant="destructive"
                confirmText="Delete Folder"
            />

            {/* Edit Folder Name Dialog */}
            <Dialog open={isEditFolderOpen} onOpenChange={setIsEditFolderOpen}>
                <DialogContent
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="max-w-sm rounded-xl">
                    <DialogHeader>
                        <DialogTitle>Rename Folder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Input
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            placeholder="Folder Name"
                        />
                        <DialogFooter>
                            <Button onClick={handleUpdateFolder} disabled={!editingFolderName.trim()} className="bg-rose-500 hover:bg-rose-600 text-white">
                                Save
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Overlays */}
            <AddMomentsOverlay
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                currentFolderId={currentFolder?.id || null}
                onSuccess={fetchData}
            />

            <CreateFolderOverlay
                isOpen={isCreateFolderOpen}
                onClose={() => setIsCreateFolderOpen(false)}
                onSuccess={fetchData}
            />

        </div>
    );
}
