---
name: frontend-mastery
description: Use when implementing UI components, pages, or any visual elements. Enforces premium aesthetics, responsive design, and consistent styling patterns.
---

# Frontend Mastery Skill

Load this skill when working on React components, styling, or UI/UX tasks.

## Core Instructions

1. **Premium Aesthetics First** - Every component must look polished and professional
   - Use smooth gradients, subtle shadows, and micro-animations
   - Avoid plain/generic colors - use curated palettes
   - Apply glassmorphism where appropriate

2. **Tailwind Best Practices**
   - Use design tokens from `index.css` (e.g., `--color-primary`)
   - Prefer responsive utilities (`sm:`, `md:`, `lg:`)
   - Use `clsx` for conditional classes

3. **Component Structure**
   - Props interface at top of file
   - Destructure props with defaults
   - Extract complex logic to custom hooks
   - Keep JSX clean and readable

4. **Animation Guidelines**
   - Use `transition-all duration-200` for hover states
   - Apply `animate-pulse` sparingly for loading states
   - Consider `framer-motion` for complex animations

## Examples

**Good Button:**
```tsx
<button className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 
  text-white font-medium rounded-xl shadow-lg 
  hover:shadow-xl hover:scale-105 transition-all duration-200">
  Click Me
</button>
```

**Bad Button:**
```tsx
<button className="bg-red-500 text-white p-2">Click</button>
```

## Guidelines

- Never use default browser styles
- Always add hover/focus states
- Test on mobile viewport first
- Use semantic HTML elements
- Include loading and error states

## Verification

- [ ] Component renders correctly on mobile
- [ ] Hover states are smooth and visible
- [ ] Colors match design system
- [ ] No Tailwind class conflicts
- [ ] Accessibility: focusable elements have visible focus rings
