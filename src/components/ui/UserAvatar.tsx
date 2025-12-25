
import { Avatar, AvatarImage, AvatarFallback } from './avatar';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface UserAvatarProps {
    user: {
        first_name: string | null;
        avatar_url: string | null;
        email?: string | null;
    } | null | undefined;
    className?: string;
    showStatus?: boolean; // For online status if needed later
    iconClassName?: string;
    onClick?: () => void;
}

export function UserAvatar({ user, className, iconClassName, onClick }: UserAvatarProps) {
    const getInitials = () => {
        if (user?.first_name) {
            return user.first_name.charAt(0).toUpperCase();
        }
        if (user?.email) {
            return user.email.charAt(0).toUpperCase();
        }
        return null;
    };

    return (
        <Avatar className={cn("bg-gray-200 dark:bg-gray-800", className)} onClick={onClick}>
            <AvatarImage
                src={user?.avatar_url || undefined}
                alt={user?.first_name || 'User Avatar'}
                className="object-cover"
            />
            <AvatarFallback className={cn("bg-gray-200 dark:bg-gray-800 text-gray-500 font-bold", className)}>
                {getInitials() || <User className={cn("w-1/2 h-1/2", iconClassName)} />}
            </AvatarFallback>
        </Avatar>
    );
}
