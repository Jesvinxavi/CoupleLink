# Feature: Stop Scroll Top on Page Change

## Goal Description
The user wants to prevent the page from scrolling to the top immediately when navigating between pages. Currently, when a user navigates (e.g., from the sidebar or a tile), the current page scrolls to the top *before* the transition animation completes, causing a jarring visual effect.
The goal is to ensure a smooth transition where the *current* page remains at its position while it exits, and the *new* page likely starts at the top (handled safely by `PageTransition`).

## Technical Implementation

### Analysis
- `src/components/ScrollToTop.tsx`: This component listens to `pathname` changes and invokes `window.scrollTo(0, 0)` immediately. This runs *before* the page transition (exit animation) completes, causing the "old" page to jump to the top.
- `src/components/PageTransition.tsx`: This component invokes `window.scrollTo(0, 0)` on mount. Since the app uses `AnimatePresence mode="wait"`, the new page mounts *after* the old one has exited. This behavior is desirable as it ensures the new page starts at the top without affecting the exiting page.

### Proposed Changes
1.  **Remove `ScrollToTop` Component usage**:
    -   Modify `src/App.tsx` to remove the `<ScrollToTop />` component.
    -   This prevents the immediate scroll restart on route change.

2.  **Verify `PageTransition` Behavior**:
    -   Ensure `src/components/PageTransition.tsx` keeps its `useEffect` with `window.scrollTo(0, 0)` to handle the "start at top" for the *new* page content.

### Files to Modify
#### [MODIFY] [App.tsx](file:///Users/jesvinxavi/Downloads/CoupleLink-main/src/App.tsx)
- Remove import of `ScrollToTop`.
- Remove `<ScrollToTop />` from the JSX.

## Verification Plan

### Manual Verification
1.  **Scroll Down & Navigate**:
    -   Go to a long page (e.g., Dashboard or Journal).
    -   Scroll to the bottom.
    -   Click a link in the sidebar (e.g., to Games).
    -   **Expected**: The old page should fade/slide out *without* jumping to the top first. The new page should appear starting at the top.
2.  **Tile Navigation**:
    -   Go to Dashboard.
    -   Scroll down to a tile (e.g., Stat of the Week).
    -   Click the tile to navigate to the detailed page.
    -   **Expected**: Smooth transition, no jump.
