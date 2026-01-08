# Skill Template

Use this as a starting point when creating new skills.

```markdown
---
name: <skill-name>
description: <When should an agent load this skill? Be specific about triggers.>
---

# <Skill Name> Skill

Brief description of what this skill enables.

## Core Instructions

1. **First Principle** - Explanation
2. **Second Principle** - Explanation
3. **Third Principle** - Explanation

## Guidelines

- Specific constraint or pattern
- Another constraint
- Edge case handling

## Verification

- [ ] Verification step 1
- [ ] Verification step 2
- [ ] Verification step 3
```

## Naming Conventions

- Use lowercase with hyphens: `my-skill-name`
- Maximum 64 characters
- Be descriptive: `api-error-handling` not `errors`
- Avoid generic names: `react-forms` not `forms`

## Description Best Practices

The description determines when the skill is loaded. Write it as a trigger condition:

**Good:**
> Use when implementing form validation in React components with error states and accessibility.

**Bad:**
> A skill for forms.

## Resource Files

Create `resources/*.md` files for:
- Code templates
- Detailed patterns
- Reference tables
- Examples too long for SKILL.md
