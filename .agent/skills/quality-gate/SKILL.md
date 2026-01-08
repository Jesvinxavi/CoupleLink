---
name: quality-gate
description: Use before marking any task as "In Review" or "Done". Self-review against skill checklists and project standards. Catches issues before human review.
---

# Quality-Gate Skill

Self-review before requesting human review.

---

## When to Trigger

- Before changing status to "In Review"
- Before changing status to "Done"
- After completing a significant code block
- When unsure if implementation is correct

---

## Quality Gate Process

### 1. Build Check
```bash
npm run build
```
- ❌ Build fails → Fix before proceeding
- ✅ Build passes → Continue

### 2. Skill Verification Checklists
Review applicable skill checklists:

**If UI work (frontend-mastery):**
- [ ] Component renders on mobile
- [ ] Hover states are smooth
- [ ] Colors match design system
- [ ] Accessibility: focus rings visible

**If DB work (supabase-expert):**
- [ ] RLS enabled on new tables
- [ ] Types regenerated
- [ ] No security advisories

**If Git work (git-operations):**
- [ ] Branch name follows convention
- [ ] Commits use conventional format
- [ ] No secrets committed

### 3. Code Quality Review

| Check | Question |
|-------|----------|
| Readability | Would another developer understand this? |
| Simplicity | Is there a simpler way? |
| Edge Cases | What could break this? |
| Error Handling | Are errors handled gracefully? |
| Performance | Any obvious bottlenecks? |

### 4. Documentation Check
- [ ] Complex logic has comments
- [ ] Public functions have JSDoc
- [ ] README updated if needed
- [ ] KNOWLEDGE.md updated if lesson learned

### 5. Test Verification
- [ ] Existing tests still pass
- [ ] New functionality tested (manually or automated)
- [ ] Edge cases verified

---

## Gate Results

| Result | Action |
|--------|--------|
| All checks pass | Proceed to "In Review" |
| Minor issues found | Fix immediately, re-check |
| Major issues found | Return to implementation |
| Uncertain about quality | Request early human review |

---

## Quick Self-Review Template

Before marking complete, answer:

```markdown
## Quality Gate: Task [ID]

### Build Status
- [ ] Build passes

### Skill Checklists Applied
- [ ] frontend-mastery (if applicable)
- [ ] supabase-expert (if applicable)

### Self-Assessment
- Confidence: [High/Medium/Low]
- Concerns: [Any remaining concerns]

### Ready for Review
- [ ] Yes, all gates passed
```

---

## Integration

- Automatically triggered by /finish-task workflow
- Runs after self-reflection
- Blocks "Done" status until passed
