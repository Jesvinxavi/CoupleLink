/**
 * Shared Date Night types used across datenight components.
 */

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
export interface DateIdeaItem {
    id?: string
    title: string
    description: string
    imageUrl: string
    duration: string
    cost?: string
    link?: string
    buttonText?: string
    checklist?: string[]
}

export interface DateIdea {
    title: string
    description: string
    imageUrl: string
    duration: string
    cost?: string
    categories: string[]
    link?: string
    type: "simple" | "modal"
    modalItems?: DateIdeaItem[]
    buttonText?: string
    showExternalIcon?: boolean
}
