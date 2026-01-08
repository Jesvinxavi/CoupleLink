---
name: self-reflection
description: Use at the end of every completed task to analyze what went well, what could improve, and capture lessons for KNOWLEDGE.md. Triggers automatically after /finish-task workflow.
---

# Self-Reflection Skill

Analyze completed work to improve future performance.

---

## When to Trigger

- After completing any task (automatically via /finish-task)
- After encountering unexpected difficulties
- After making mistakes that required backtracking
- When discovering patterns worth documenting

---

## Reflection Process

### 1. Task Analysis
Ask yourself:
- What was the original goal?
- Did I achieve it completely?
- What unexpected challenges arose?

### 2. Quality Assessment
| Dimension | Question |
|-----------|----------|
| Accuracy | Did my solution work correctly first try? |
| Efficiency | Did I take the most direct path? |
| Completeness | Did I handle edge cases? |
| Communication | Did I explain changes clearly? |

### 3. Pattern Recognition
Identify:
- Repeated mistakes (candidate for skill improvement)
- Successful patterns (candidate for skill creation)
- Knowledge gaps (candidate for KNOWLEDGE.md)
- Process friction (candidate for workflow creation)

### 4. Knowledge Capture
If lesson is valuable, append to `backlog/KNOWLEDGE.md`:

```markdown
## [Category]
* [YYYY-MM-DD] **[Context]**: [Specific lesson learned]
```

---

## Reflection Template

```markdown
## Reflection: Task [ID]

### What Went Well
- Point 1
- Point 2

### What Could Improve
- Point 1
- Point 2

### Lessons Learned
- Lesson 1 (→ Added to KNOWLEDGE.md)
- Lesson 2

### Follow-up Actions
- [ ] Update skill X with new pattern
- [ ] Create workflow for process Y
```

---

## Confidence Thresholds for Actions

| Finding | Confidence | Action |
|---------|------------|--------|
| New skill needed | 80%+ | Trigger skill-creator |
| Process improvement | 80%+ | Trigger workflow-creator |
| Knowledge gap | 60%+ | Add to KNOWLEDGE.md |
| Skill update needed | 70%+ | Update existing skill |

---

## Integration with /finish-task

Add this step to the finish-task workflow:
1. Before marking task Done, run self-reflection
2. Capture at least one lesson learned
3. Update KNOWLEDGE.md if applicable
