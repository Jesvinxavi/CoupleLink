import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCoupleData } from '../../hooks/useCoupleData';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, Image as ImageIcon, Loader2, Folder, FolderPlus, ChevronLeft, X, UploadCloud, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { ConfirmationModal } from '../ui/ConfirmationModal';

interface Moment {
    id: string;
    media_url: string | null;
    caption: string | null;
    created_at: string;
    uploader_id: string | null;
    folder_id: string | null;
}

interface FolderItem {
    id: string;
    name: string;
    created_at: string;
}

export function MomentsGallery() {
    const { couple } = useCoupleData();
    const [moments, setMoments] = useState<Moment[]>([]);
    const [folders, setFolders] = useState<FolderItem[]>([]);
    const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
    const [loading, setLoading] = useState(true);

    // Upload State
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [caption, setCaption] = useState('');
    const [newFolderName, setNewFolderName] = useState('');

    // Expansion & Management State
    const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
    const [isEditCaptionOpen, setIsEditCaptionOpen] = useState(false);
    const [editingCaption, setEditingCaption] = useState('');
    const [isDeleteMomentOpen, setIsDeleteMomentOpen] = useState(false);

    // Folder Management State
    const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
    const [editingFolderName, setEditingFolderName] = useState('');
    const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);

    const fetchData = async () => {
        if (!couple) return;
        try {
            setLoading(true);

            // Fetch Folders (only if in root)
            let foldersData: FolderItem[] = [];
            if (!currentFolder) {
                const { data: fData, error: fError } = await supabase
                    .from('folders')
                    .select('*')
                    .eq('couple_id', couple.id)
                    .order('created_at', { ascending: false });
                if (fError) throw fError;
                foldersData = (fData as FolderItem[]) || [];
            }
            setFolders(foldersData);

            // Fetch Moments
            let query = supabase
                .from('memories')
                .select('*')
                .eq('couple_id', couple.id)
                .eq('type', 'photo')
                .order('created_at', { ascending: false });

            if (currentFolder) {
                query = query.eq('folder_id', currentFolder.id);
            } else {
                query = query.is('folder_id', null);
            }

            const { data: mData, error: mError } = await query;
            if (mError) throw mError;
            setMoments(mData as any || []);

        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [couple, currentFolder]);

    // Check for action=new_post in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('action') === 'new_post') {
            setIsUploadDialogOpen(true);
            // Clean up URL
            window.history.replaceState({}, '', window.location.pathname + '?tab=moments');
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...files]);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleUpload = async (targetFolderId: string | null = null) => {
        if (!couple) return;
        if (selectedFiles.length === 0 && !targetFolderId) return; // Must have files if just uploading photo

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            for (const file of selectedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${couple.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('memories')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('memories')
                    .getPublicUrl(filePath);

                await supabase
                    .from('memories')
                    .insert({
                        couple_id: couple.id,
                        uploader_id: user.id,
                        type: 'photo',
                        media_url: publicUrl,
                        caption: caption,
                        folder_id: targetFolderId || currentFolder?.id || null
                    });
            }

            // Reset
            setSelectedFiles([]);
            setPreviewUrls([]);
            setCaption('');
            setIsUploadDialogOpen(false);
            setIsFolderDialogOpen(false);
            setNewFolderName('');
            fetchData();

        } catch (err) {
            console.error('Error uploading:', err);
            alert('Failed to upload. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateFolder = async () => {
        if (!couple || !newFolderName.trim()) return;
        setUploading(true);
        try {
            // 1. Create Folder
            const { data: folder, error } = await supabase
                .from('folders')
                .insert({
                    couple_id: couple.id,
                    name: newFolderName
                })
                .select()
                .single();

            if (error) throw error;

            // 2. Upload photos to this folder if any
            if (selectedFiles.length > 0) {
                await handleUpload(folder.id);
            } else {
                // Just reset if no files
                setNewFolderName('');
                setIsFolderDialogOpen(false);
                fetchData();
            }

        } catch (err) {
            console.error('Error creating folder:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateMoment = async () => {
        if (!selectedMoment) return;
        try {
            const { error } = await supabase
                .from('memories')
                .update({ caption: editingCaption })
                .eq('id', selectedMoment.id);

            if (error) throw error;

            setMoments(prev => prev.map(m =>
                m.id === selectedMoment.id ? { ...m, caption: editingCaption } : m
            ));
            setSelectedMoment(prev => prev ? { ...prev, caption: editingCaption } : null);
            setIsEditCaptionOpen(false);
        } catch (error) {
            console.error('Error updating caption:', error);
        }
    };

    const handleDeleteMoment = async () => {
        if (!selectedMoment) return;
        try {
            // 1. Delete file from storage if url exists
            if (selectedMoment.media_url) {
                const path = selectedMoment.media_url.split('/memories/')[1];
                if (path) {
                    await supabase.storage
                        .from('memories')
                        .remove([path]); // Remove uses array of paths
                }
            }

            // 2. Delete record
            const { error } = await supabase
                .from('memories')
                .delete()
                .eq('id', selectedMoment.id);

            if (error) throw error;

            setMoments(prev => prev.filter(m => m.id !== selectedMoment.id));
            setSelectedMoment(null);
            setIsDeleteMomentOpen(false);
        } catch (error) {
            console.error('Error deleting moment:', error);
        }
    };

    const handleUpdateFolder = async () => {
        if (!currentFolder || !editingFolderName.trim()) return;
        try {
            const { error } = await supabase
                .from('folders')
                .update({ name: editingFolderName })
                .eq('id', currentFolder.id);

            if (error) throw error;

            setCurrentFolder({ ...currentFolder, name: editingFolderName });
            setIsEditFolderOpen(false);
        } catch (error) {
            console.error('Error updating folder:', error);
        }
    };

    const handleDeleteFolder = async () => {
        if (!currentFolder) return;
        try {
            // 1. Get all memories in folder to delete their files
            const { data: folderMoments } = await supabase
                .from('memories')
                .select('media_url')
                .eq('folder_id', currentFolder.id);

            if (folderMoments && folderMoments.length > 0) {
                const pathsToRemove = folderMoments
                    .map(m => {
                        if (m.media_url) {
                            return m.media_url.split('/memories/')[1];
                        }
                        return null;
                    })
                    .filter((p): p is string => p !== null);

                if (pathsToRemove.length > 0) {
                    await supabase.storage
                        .from('memories')
                        .remove(pathsToRemove);
                }
            }

            // 2. Delete Folder (Cascade should handle memories rows if set up, but let's be safe and delete memories rows first)
            await supabase
                .from('memories')
                .delete()
                .eq('folder_id', currentFolder.id);

            // 3. Delete Folder
            const { error } = await supabase
                .from('folders')
                .delete()
                .eq('id', currentFolder.id);

            if (error) throw error;

            setCurrentFolder(null); // Go back to root
            fetchData(); // Refresh root list
        } catch (error) {
            console.error('Error deleting folder:', error);
        }
    };


    const resetUploadForm = () => {
        setSelectedFiles([]);
        setPreviewUrls([]);
        setCaption('');
        setNewFolderName('');
    };

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
                        <Dialog open={isFolderDialogOpen} onOpenChange={(open) => {
                            setIsFolderDialogOpen(open);
                            if (!open) resetUploadForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <FolderPlus className="w-4 h-4" />
                                    <span className="hidden sm:inline">New Folder</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                className="w-[90%] sm:max-w-[425px] rounded-xl"
                            >
                                <DialogHeader>
                                    <DialogTitle>Create New Folder</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="folderName">Folder Name</Label>
                                        <Input
                                            id="folderName"
                                            value={newFolderName}
                                            onChange={(e) => setNewFolderName(e.target.value)}
                                            placeholder="e.g. Summer Vacation 2024"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Add Photos (Optional)</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {previewUrls.map((url, idx) => (
                                                <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden group">
                                                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => removeFile(idx)}
                                                        className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                <ImageIcon className="w-6 h-6 text-gray-400" />
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleFileSelect}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateFolder} disabled={uploading || !newFolderName.trim()} className="bg-rose-500 hover:bg-rose-600 text-white">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Folder'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
                        setIsUploadDialogOpen(open);
                        if (!open) resetUploadForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button
                                size={currentFolder ? 'icon' : 'default'}
                                className="bg-rose-500 hover:bg-rose-600 text-white gap-2 border border-transparent"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Photo</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            className="w-[90%] sm:max-w-[425px] rounded-xl"
                        >
                            <DialogHeader>
                                <DialogTitle>Upload Photo</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="flex items-center justify-center w-full">
                                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                                            <p className="text-sm text-gray-500">Click to upload photos</p>
                                        </div>
                                        <input
                                            id="dropzone-file"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </label>
                                </div>

                                {selectedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {previewUrls.map((url, idx) => (
                                            <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden group">
                                                <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => removeFile(idx)}
                                                    className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="caption">Caption (Optional)</Label>
                                    <Input
                                        id="caption"
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="What's happening?"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => handleUpload()} disabled={uploading || selectedFiles.length === 0} className="bg-rose-500 hover:bg-rose-600 text-white">
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                    {moments.map((moment) => (
                        <motion.div
                            layoutId={`moment-${moment.id}`}
                            key={moment.id}
                            onClick={() => setSelectedMoment(moment)}
                            className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100 cursor-pointer"
                        >
                            <img
                                src={moment.media_url || ''}
                                alt={moment.caption || 'Moment'}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </motion.div>
                    ))}

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
                            <div
                                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                                onClick={() => setSelectedMoment(null)}
                            >
                                <motion.div
                                    layoutId={`moment-${selectedMoment.id}`}
                                    className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center gap-4"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Top Control Bar - Actions */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 border border-gray-200/50 dark:border-gray-700/50"
                                    >
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
                                    </motion.div>

                                    {/* Image */}
                                    <img
                                        src={selectedMoment.media_url || ''}
                                        alt={selectedMoment.caption || 'Expanded Moment'}
                                        className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                                    />

                                    {/* Bottom Control Bar - Caption */}
                                    {selectedMoment.caption && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl px-3 py-1.5 shadow-lg max-w-md w-auto text-center border border-gray-200/50 dark:border-gray-700/50"
                                        >
                                            <p className="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed font-medium">
                                                {selectedMoment.caption}
                                            </p>
                                        </motion.div>
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

        </div >
    );
}
