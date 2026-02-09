import { useEffect } from 'react';

// ═══════════════════════════════════════
// HOOK
// ═══════════════════════════════════════
let lockCount = 0;
let originalOverflow = '';
let originalPosition = '';
let originalTop = '';
let originalWidth = '';
let lockedScrollY = 0;

export function useLockBodyScroll(isLocked = true) {
    useEffect(() => {
        if (!isLocked) return;

        if (lockCount === 0) {
            lockedScrollY = window.scrollY;
            originalOverflow = document.body.style.overflow;
            originalPosition = document.body.style.position;
            originalTop = document.body.style.top;
            originalWidth = document.body.style.width;

            document.body.style.position = 'fixed';
            document.body.style.top = `-${lockedScrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        }
        lockCount += 1;
        return () => {
            lockCount = Math.max(0, lockCount - 1);
            if (lockCount === 0) {
                document.body.style.overflow = originalOverflow;
                document.body.style.position = originalPosition;
                document.body.style.top = originalTop;
                document.body.style.width = originalWidth;
                window.scrollTo(0, lockedScrollY);
            }
        };
    }, [isLocked]);
}
