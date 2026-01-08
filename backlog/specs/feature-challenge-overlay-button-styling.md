# Feature: Challenge Overlay Button Styling

## User Stories
- As a user, I want the "Rain Check" button to be a solid **purple** button so it stands out as a distinct action.
- As a user, I want the "Unskip" and "Undo Completion" buttons to be filled (not outline/ghost style) so they feel more actionable.

## Technical Implementation

### Files to Modify
#### [MODIFY] [ChallengeOverlay.tsx](file:///Users/jesvinxavi/Downloads/CoupleLink-main/src/components/dashboard/ChallengeOverlay.tsx)

**1. Rain Check Button (Lines 337-356)**
- **Current**: `variant="ghost"` with purple text on hover (`text-purple-600 hover:bg-purple-50`).
- **Change**: Replace with a solid purple button.
```tsx
// FROM:
variant="ghost"
className={`... text-purple-600 hover:bg-purple-50 ...`}

// TO:
className="w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
```

**2. Unskip / Undo Completion Button (Lines 311-321)**
- **Current**: `variant="outline"` with red text and red border.
- **Change**: Replace with a filled red/gray button (soft fill, not aggressive red).
```tsx
// FROM:
variant="outline"
className="... text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"

// TO (Option A - Soft Gray Fill):
className="w-full h-14 text-lg font-bold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"

// TO (Option B - Soft Red Fill):
className="w-full h-14 text-lg font-bold rounded-xl bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300"
```

## Database Changes
None.

## Decision
**Unskip / Undo Completion button**: Use **Option A** (Soft Gray Fill) per user preference.

## Verification Plan
### Manual Verification
1.  Open a challenge overlay (Daily, Weekly, or Monthly).
2.  Verify the **Rain Check** button is a solid purple button.
3.  Complete a challenge, then re-open the overlay.
4.  Verify the **Undo Completion** button is filled (not outline).
5.  Skip a challenge, then re-open the overlay.
6.  Verify the **Unskip** button is filled (not outline).
