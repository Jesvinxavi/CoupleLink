# Tailwind Patterns

## Color Palette

Use these semantic color utilities instead of raw colors:

| Purpose | Class | Notes |
|---------|-------|-------|
| Primary Action | `bg-pink-500` / `from-pink-500 to-rose-500` | Gradients preferred |
| Secondary | `bg-gray-100` | Light backgrounds |
| Success | `bg-emerald-500` | Confirmations |
| Warning | `bg-amber-500` | Cautions |
| Danger | `bg-red-500` | Destructive actions |

## Spacing System

Follow 4px increments: `p-1` (4px), `p-2` (8px), `p-4` (16px), `p-6` (24px)

## Shadow Utilities

```
shadow-sm  → Subtle depth
shadow     → Buttons, cards
shadow-lg  → Modals, overlays
shadow-xl  → Prominent elements
```

## Border Radius

```
rounded-lg   → Standard components (8px)
rounded-xl   → Buttons, inputs (12px)
rounded-2xl  → Cards, modals (16px)
rounded-full → Avatars, pills
```

## Responsive Breakpoints

| Prefix | Min Width | Use Case |
|--------|-----------|----------|
| (none) | 0px | Mobile first |
| `sm:` | 640px | Landscape phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Desktops |
| `xl:` | 1280px | Large screens |
