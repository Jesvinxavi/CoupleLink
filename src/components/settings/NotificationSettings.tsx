import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Json } from '@/lib/database.types';
import { useAuth } from '@/context/AuthContext';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Default notification preferences structure
const DEFAULT_PREFERENCES = {
    master_toggle: true,
    sections: {
        challenges_streak: true,
        sexploration_fun: true,
        dates_reminders: true
    },
    types: {
        daily_question: true,
        challenge_completion: true,
        streak_expiry: true,
        daily_expiry: true,
        weekly_expiry: true,
        monthly_expiry: true,
        new_sticky_note: true,
        new_journal_post: true,
        fantasies: true,
        coupons: true,
        calendar_events: true,
        partner_birthday: true,
        my_birthday: true,
        anniversary: true
    }
};

interface NotificationPreferences {
    master_toggle: boolean;
    sections: {
        challenges_streak: boolean;
        sexploration_fun: boolean;
        dates_reminders: boolean;
    };
    types: {
        daily_question: boolean;
        challenge_completion: boolean;
        streak_expiry: boolean;
        daily_expiry: boolean;
        weekly_expiry: boolean;
        monthly_expiry: boolean;
        new_sticky_note: boolean;
        new_journal_post: boolean;
        fantasies: boolean;
        coupons: boolean;
        calendar_events: boolean;
        partner_birthday: boolean;
        my_birthday: boolean;
        anniversary: boolean;
    };
}

// Section configuration
const SECTIONS = [
    {
        key: 'challenges_streak',
        title: 'Challenges & Streak',
        icon: 'emoji_events',
        types: [
            { key: 'daily_question', label: 'Daily Questions', description: 'When partner answers daily question' },
            { key: 'challenge_completion', label: 'Partner Challenge Completion', description: 'When partner completes challenges' },
            { key: 'streak_expiry', label: 'Streak At Risk Warnings', description: 'Before your streak expires' },
            { key: 'daily_expiry', label: 'Daily Challenge Expiry', description: 'Daily challenge ending reminders' },
            { key: 'weekly_expiry', label: 'Weekly Challenge Expiry', description: 'Weekly challenge ending reminders' },
            { key: 'monthly_expiry', label: 'Monthly Challenge Expiry', description: 'Monthly challenge ending reminders' }
        ]
    },
    {
        key: 'sexploration_fun',
        title: 'Sexploration & Fun',
        icon: 'local_fire_department',
        types: [
            { key: 'fantasies', label: 'Fantasy Notifications', description: 'New fantasies and approvals' },
            { key: 'coupons', label: 'Coupon Received', description: 'When partner sends a coupon' }
        ]
    },
    {
        key: 'dates_reminders',
        title: 'Dates & Reminders',
        icon: 'event',
        types: [
            { key: 'calendar_events', label: 'Calendar Events', description: 'New events from partner' },
            { key: 'partner_birthday', label: 'Partner Birthday', description: '1 week before and on the day' },
            { key: 'my_birthday', label: 'My Birthday', description: 'Birthday wishes on your day' },
            { key: 'anniversary', label: 'Anniversary', description: '1 week before and on the day' },
            { key: 'new_journal_post', label: 'Journal Posts', description: 'New journal entries from partner' },
            { key: 'new_sticky_note', label: 'Sticky Notes', description: 'Love notes from partner' }
        ]
    }
];

export function NotificationSettings() {
    const { user } = useAuth();
    const { isSubscribed, isSupported, permission, subscribe, unsubscribe, isLoading } = usePushSubscription();
    const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
    const [expandedSections, setExpandedSections] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessingToggle, setIsProcessingToggle] = useState(false);

    // Fetch preferences on mount
    useEffect(() => {
        if (user) {
            fetchPreferences();
        }
    }, [user]);

    const fetchPreferences = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('notification_preferences')
                .eq('id', user!.id)
                .single();

            if (error) throw error;
            if (data?.notification_preferences) {
                setPreferences({ ...DEFAULT_PREFERENCES, ...(data.notification_preferences as unknown as NotificationPreferences) });
            }
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
        }
    };

    const savePreferences = useCallback(async (newPrefs: NotificationPreferences) => {
        if (!user) return;
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ notification_preferences: newPrefs as unknown as Json })
                .eq('id', user.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving notification preferences:', error);
            // Rollback on error
            fetchPreferences();
        } finally {
            setIsSaving(false);
        }
    }, [user]);

    const handleMasterToggle = async (checked: boolean) => {
        // Prevent flash by setting processing state if we might need to subscribe
        if (checked && !isSubscribed) {
            setIsProcessingToggle(true);
        }

        const newPrefs = { ...preferences, master_toggle: checked };
        setPreferences(newPrefs);
        await savePreferences(newPrefs);

        // Also manage push subscription based on master toggle
        if (checked && !isSubscribed) {
            try {
                await subscribe();
            } finally {
                setIsProcessingToggle(false);
            }
        } else if (!checked && isSubscribed) {
            await unsubscribe();
        }
    };

    const handleSectionToggle = async (sectionKey: string, checked: boolean) => {
        const newPrefs = {
            ...preferences,
            sections: { ...preferences.sections, [sectionKey]: checked }
        };
        setPreferences(newPrefs);
        await savePreferences(newPrefs);
    };

    const handleTypeToggle = async (typeKey: string, checked: boolean) => {
        const newPrefs = {
            ...preferences,
            types: { ...preferences.types, [typeKey]: checked }
        };
        setPreferences(newPrefs);
        await savePreferences(newPrefs);
    };

    const toggleSection = (sectionKey: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionKey)
                ? prev.filter(k => k !== sectionKey)
                : [...prev, sectionKey]
        );
    };

    const handleEnableNotifications = async () => {
        const success = await subscribe();
        if (success) {
            const newPrefs = { ...preferences, master_toggle: true };
            setPreferences(newPrefs);
            await savePreferences(newPrefs);
        }
    };

    if (!isSupported) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl">notifications</span>
                        Notifications
                    </CardTitle>
                    <CardDescription>Push notifications are not supported in this browser.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (permission === 'denied') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl">notifications_off</span>
                        Notifications Blocked
                    </CardTitle>
                    <CardDescription>
                        You've blocked notifications for this site. To enable them, please update your browser settings.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!isSubscribed && preferences.master_toggle && !isLoading && !isProcessingToggle) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xl">notifications</span>
                        Notifications
                    </CardTitle>
                    <CardDescription>Enable push notifications to stay connected with your partner.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleEnableNotifications} disabled={isLoading}>
                        {isLoading ? 'Enabling...' : 'Enable Notifications'}
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xl">notifications</span>
                    Notifications
                </CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Master Toggle */}
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-rose-500">notifications_active</span>
                        <div>
                            <Label className="text-base font-medium">All Notifications</Label>
                            <p className="text-xs text-muted-foreground">Enable or disable all notifications</p>
                        </div>
                    </div>
                    <Switch
                        checked={preferences.master_toggle}
                        onCheckedChange={handleMasterToggle}
                        disabled={isSaving || isLoading}
                    />
                </div>

                {/* Sections */}
                {preferences.master_toggle && (
                    <div className="space-y-1">
                        {SECTIONS.map((section) => {
                            const isExpanded = expandedSections.includes(section.key);
                            const sectionEnabled = preferences.sections[section.key as keyof typeof preferences.sections];

                            return (
                                <div key={section.key} className="overflow-hidden">
                                    {/* Section Header */}
                                    <div
                                        className="flex items-center justify-between py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded transition-colors"
                                        onClick={() => toggleSection(section.key)}
                                    >
                                        <div className="flex items-center gap-3 pl-4">
                                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
                                                {section.icon}
                                            </span>
                                            <span className="font-medium text-sm">{section.title}</span>
                                            <span className={`material-symbols-outlined text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                expand_more
                                            </span>
                                        </div>
                                        <Switch
                                            checked={sectionEnabled}
                                            onCheckedChange={(checked) => {
                                                handleSectionToggle(section.key, checked);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            disabled={isSaving || !preferences.master_toggle}
                                        />
                                    </div>

                                    {/* Section Types */}
                                    {
                                        isExpanded && (
                                            <div className={`divide-y divide-gray-100 dark:divide-gray-800 ${!sectionEnabled ? 'opacity-50' : ''}`}>
                                                {section.types.map((type) => (
                                                    <div
                                                        key={type.key}
                                                        className="flex items-center justify-between px-4 py-3 pl-14"
                                                    >
                                                        <div>
                                                            <Label className="text-sm">{type.label}</Label>
                                                            <p className="text-xs text-muted-foreground">{type.description}</p>
                                                        </div>
                                                        <Switch
                                                            checked={preferences.types[type.key as keyof typeof preferences.types]}
                                                            onCheckedChange={(checked) => handleTypeToggle(type.key, checked)}
                                                            disabled={isSaving || !preferences.master_toggle || !sectionEnabled}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    }
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card >
    );
}
