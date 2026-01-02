import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Force scroll to top on route change
        window.scrollTo(0, 0);

        // Mobile specific: try to reset viewport if it was pushed up by keyboard
        if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }, [pathname]);

    return null;
}
