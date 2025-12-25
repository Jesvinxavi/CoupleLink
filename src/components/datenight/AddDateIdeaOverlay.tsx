import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Loader2, Plus, Upload, CheckSquare, Trash2, Image as ImageIcon, ChevronDown, ChevronUp, X } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export interface DateIdeaItem {
    id?: string;
    title: string;
    description: string;
    imageUrl: string;
    duration: string;
    cost?: string;
    link?: string;
    buttonText?: string;
    checklist?: string[];
}

interface AddDateIdeaOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    coupleId: string;
    initialData?: DateIdeaItem | null;
}

export function AddDateIdeaOverlay({ isOpen, onClose, onSuccess, coupleId, initialData }: AddDateIdeaOverlayProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Initialize state with initialData if present
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");

    // Parse duration string "2 Hours" -> value: "2", unit: "Hours"
    const parseDuration = (durStr: string) => {
        if (!durStr) return { value: "", unit: "Hours" };
        const parts = durStr.split(' ');
        return {
            value: parts[0] || "",
            unit: parts[1] || "Hours"
        };
    };

    const initialDuration = parseDuration(initialData?.duration || "");
    const [durationValue, setDurationValue] = useState(initialDuration.value);
    const [durationUnit, setDurationUnit] = useState(initialDuration.unit);

    const [cost, setCost] = useState(initialData?.cost || "");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.imageUrl || null);
    const [checklistItems, setChecklistItems] = useState<string[]>(initialData?.checklist || []);
    const [newItem, setNewItem] = useState("");
    const [isChecklistExpanded, setIsChecklistExpanded] = useState(!!initialData?.checklist?.length);

    const fileInputRef = useRef<HTMLInputElement>(null);



    // Mobile Viewport Logic
    const [viewportStyle, setViewportStyle] = useState<{ height: number; top: number } | undefined>(undefined);

    useEffect(() => {
        if (isOpen) {
            // Lock body scroll
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';

            // Handle Visual Viewport for mobile keyboard
            const handleResize = () => {
                if (window.visualViewport) {
                    setViewportStyle({
                        height: window.visualViewport.height,
                        top: window.visualViewport.offsetTop
                    });
                }
            };

            window.visualViewport?.addEventListener('resize', handleResize);
            window.visualViewport?.addEventListener('scroll', handleResize);

            // Initial set
            handleResize();

            return () => {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                window.visualViewport?.removeEventListener('resize', handleResize);
                window.visualViewport?.removeEventListener('scroll', handleResize);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && initialData) {
            setTitle(initialData.title);
            setDescription(initialData.description);
            const dur = parseDuration(initialData.duration);
            setDurationValue(dur.value);
            setDurationUnit(dur.unit);
            setCost(initialData.cost || "");
            setPreviewUrl(initialData.imageUrl);
            setChecklistItems(initialData.checklist || []);
            setIsChecklistExpanded(!!initialData.checklist?.length);
        } else if (isOpen && !initialData) {
            resetForm();
        }
    }, [isOpen, initialData]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleAddChecklistItem = () => {
        if (newItem.trim()) {
            setChecklistItems([...checklistItems, newItem.trim()]);
            setNewItem("");
        }
    };

    const handleRemoveChecklistItem = (index: number) => {
        setChecklistItems(checklistItems.filter((_, i) => i !== index));
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setDurationValue("");
        setDurationUnit("Hours");
        setCost("");
        setFile(null);
        setPreviewUrl(null);
        setChecklistItems([]);
        setNewItem("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !coupleId) return;

        try {
            setLoading(true);
            let imageUrl = previewUrl; // Default to existing URL

            // Upload new image if selected
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${coupleId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('date_images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('date_images')
                    .getPublicUrl(filePath);

                imageUrl = publicUrl;
            }

            const dateData = {
                couple_id: coupleId,
                title,
                description,
                duration: `${durationValue} ${durationUnit}`,
                cost,
                image_url: imageUrl,
                checklist: checklistItems
            };

            let error;

            if (initialData?.id) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('user_dates')
                    .update(dateData)
                    .eq('id', initialData.id);
                error = updateError;
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from('user_dates')
                    .insert(dateData);
                error = insertError;
            }

            if (error) throw error;

            onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error saving date:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // Wait for keyboard to slide up (iOS animation is usually ~300ms)
        setTimeout(() => {
            e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                        onClick={handleClose}
                    />

                    {/* Slide-up Overlay */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}
                        // Force height/top to match viewport to snap to visible area
                        style={viewportStyle ? {
                            height: `${viewportStyle.height}px`,
                            top: `${viewportStyle.top}px`
                        } : { height: 'auto' }}
                        className={`fixed inset-x-0 z-[61] bg-white dark:bg-gray-900 rounded-t-3xl shadow-xl flex flex-col overflow-hidden ${viewportStyle ? '' : 'bottom-0'}`}
                    >
                        {/* Sticky Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {initialData ? "Edit Date Idea" : "Add New Date Idea"}
                            </h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleClose}
                                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </Button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-6 overscroll-contain">
                            <form id="date-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        onFocus={handleInputFocus}
                                        placeholder="e.g. Picnic in the Park"
                                        required
                                        className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        onFocus={handleInputFocus}
                                        placeholder="Describe what you'll be doing..."
                                        required
                                        className="min-h-[100px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Approx. Duration</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="duration"
                                                type="number"
                                                min="0"
                                                value={durationValue}
                                                onChange={(e) => setDurationValue(e.target.value)}
                                                onFocus={handleInputFocus}
                                                placeholder="1"
                                                required
                                                className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex-1 no-spinner text-base md:text-sm"
                                            />
                                            <div className="relative w-[110px]">
                                                <select
                                                    value={durationUnit}
                                                    onChange={(e) => setDurationUnit(e.target.value)}
                                                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-white dark:bg-gray-700"
                                                >
                                                    <option value="Minutes">Minutes</option>
                                                    <option value="Hours">Hours</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cost">Estimated Cost</Label>
                                        <div className="relative">
                                            <select
                                                id="cost"
                                                value={cost}
                                                onChange={(e) => setCost(e.target.value)}
                                                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-white dark:bg-gray-700"
                                                required
                                            >
                                                <option value="" disabled>Select cost...</option>
                                                <option value="Free">Free</option>
                                                <option value="$">$ (Cheap)</option>
                                                <option value="$$">$$ (Moderate)</option>
                                                <option value="$$$">$$$ (Expensive)</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-1">
                                        Cover Image <span className="text-red-500">*</span>
                                    </Label>
                                    <div
                                        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors h-48 relative overflow-hidden group mt-2"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {previewUrl ? (
                                            <>
                                                <img
                                                    src={previewUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white font-medium flex items-center gap-2">
                                                        <Upload className="w-4 h-4" /> Change Image
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm font-medium">Click to upload image</p>
                                                <p className="text-xs mt-1 text-gray-400">PNG, JPG up to 5MB</p>
                                            </div>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
                                        className="flex items-center justify-between w-full text-left bg-gray-50 dark:bg-gray-800 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <Label className="flex items-center gap-2 cursor-pointer pointer-events-none">
                                            <CheckSquare className="w-4 h-4" /> Checklist (Optional)
                                        </Label>
                                        {isChecklistExpanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                                    </button>

                                    {isChecklistExpanded && (
                                        <div className="space-y-3 mt-3 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newItem}
                                                    onChange={(e) => setNewItem(e.target.value)}
                                                    onFocus={handleInputFocus}
                                                    placeholder="Add item needed (e.g. Blanket, Wine)"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddChecklistItem();
                                                        }
                                                    }}
                                                    className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={handleAddChecklistItem}
                                                    variant="outline"
                                                    size="icon"
                                                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            {checklistItems.length > 0 && (
                                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 space-y-2">
                                                    {checklistItems.map((item, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-800 group"
                                                        >
                                                            <li className="flex items-center gap-2 text-sm list-none">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                                                {item}
                                                            </li>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveChecklistItem(index)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Sticky Footer */}
                        <div className="p-4 pt-2 shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-area-bottom">
                            <Button
                                type="submit"
                                form="date-form"
                                className="w-full bg-rose-500 hover:bg-rose-600 text-white h-12 rounded-xl font-bold font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || !title || !description || !durationValue || !cost || (!file && !previewUrl)}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {initialData ? "Saving..." : "Creating..."}
                                    </>
                                ) : (
                                    initialData ? "Save Changes" : "Create Date"
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
