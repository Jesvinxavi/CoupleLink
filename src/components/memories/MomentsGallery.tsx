import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCoupleData } from '../../hooks/useCoupleData';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Plus, Image as ImageIcon, Loader2, Folder, ChevronLeft, X, UploadCloud } from 'lucide-react';

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
    const [isInputFocused, setIsInputFocused] = useState(false);

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

    const resetUploadForm = () => {
        setSelectedFiles([]);
        setPreviewUrls([]);
        setCaption('');
        setNewFolderName('');
        setIsInputFocused(false);
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
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {currentFolder ? currentFolder.name : 'Gallery'}
                    </h2>
                </div>

                <div className="flex gap-2">
                    {!currentFolder && (
                        <Dialog open={isFolderDialogOpen} onOpenChange={(open) => {
                            setIsFolderDialogOpen(open);
                            if (!open) resetUploadForm();
                        }}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <Folder className="w-4 h-4" />
                                    <span className="hidden sm:inline">New Folder</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent
                                onOpenAutoFocus={(e) => e.preventDefault()}
                                className={`w-[90%] sm:max-w-[425px] rounded-xl ${isInputFocused ? '!top-auto !bottom-24 !translate-y-0 sm:!top-[50%] sm:!bottom-auto sm:!translate-y-[-50%]' : ''}`}
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
                                            onFocus={() => setIsInputFocused(true)}
                                            onBlur={() => setIsInputFocused(false)}
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
                            <Button className="bg-rose-500 hover:bg-rose-600 text-white gap-2">
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Add Photo</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            onOpenAutoFocus={(e) => e.preventDefault()}
                            className={`w-[90%] sm:max-w-[425px] rounded-xl ${isInputFocused ? '!top-auto !bottom-4 !translate-y-0 sm:!top-[50%] sm:!bottom-auto sm:!translate-y-[-50%]' : ''}`}
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
                                        onFocus={() => setIsInputFocused(true)}
                                        onBlur={() => setIsInputFocused(false)}
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
                        <div key={moment.id} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
                            <img
                                src={moment.media_url || ''}
                                alt={moment.caption || 'Moment'}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {moment.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                                    <p className="text-xs text-white truncate">{moment.caption}</p>
                                </div>
                            )}
                        </div>
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
        </div>
    );
}
