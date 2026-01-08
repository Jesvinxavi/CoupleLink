---
name: skill-creator
description: A meta-skill for creating new skills. Use when you identify repeated patterns, gaps in existing skills, or domain-specific knowledge that would benefit future tasks. Trigger autonomously when confidence is HIGH (80%+) that a new skill would improve future work.
---

# Skill-Creator Meta-Skill

This is a **meta-skill** that enables autonomous creation of new skills.

---

## When to Trigger (Confidence Thresholds)

| Confidence | Action |
|------------|--------|
| 90%+ | Auto-create skill without asking |
| 80-89% | Propose skill to user, proceed if approved |
| 60-79% | Note in KNOWLEDGE.md for future consideration |
| <60% | Do not create skill |

### High Confidence Signals
- Same pattern used 3+ times in a session
- Explicit user request for standardization
- Critical domain knowledge missing from existing skills
- Repeated mistakes that a skill could prevent

### Low Confidence Signals
- One-off task unlikely to repeat
- Pattern already covered by existing skill
- Uncertain if pattern is correct

---

## Skill Creation Process

### 1. Identify the Gap
Ask yourself:
- What knowledge/pattern am I using repeatedly?
- What would have made this task easier?
- What mistakes did I make that a skill could prevent?

### 2. Define the Skill
- **Name**: lowercase-with-hyphens (max 64 chars)
- **Description**: When should an agent load this? (max 1024 chars)
- **Purpose**: What problem does it solve?

### 3. Create the Structure
```bash
mkdir -p .agent/skills/<skill-name>/resources
```

### 4. Write SKILL.md
Follow this template:

```markdown
---
name: <skill-name>
description: <when to use this skill>
---

# <Skill Name> Skill

## Core Instructions
1. Step one
2. Step two

## Guidelines
- Guideline 1
- Guideline 2

## Verification
- [ ] Check 1
- [ ] Check 2
```

### 5. Add Resources (if needed)
Create `resources/*.md` files for:
- Detailed patterns (keep SKILL.md < 500 lines)
- Code templates
- Reference documentation

### 6. Register the Skill
Update `backlog/AGENTS.md` → Skill Loading Protocol table

### 7. Update Scaffold Script (Optional)
If this skill should be in all new repos, add to `scaffold-agents.sh`

---

## Quality Checklist

Before finalizing a new skill:
- [ ] Name follows `lowercase-hyphen` format
- [ ] Description clearly states trigger conditions
- [ ] SKILL.md is under 500 lines
- [ ] Core Instructions are actionable
- [ ] Verification checklist exists
- [ ] No duplicate of existing skill

---

## Examples of Good Skill Candidates

| Pattern | Potential Skill |
|---------|-----------------|
| Repeated API integration | `api-integration` |
| Consistent error handling | `error-handling` |
| Notification system work | `notifications-expert` |
| Animation patterns | `animation-system` |
| Testing approaches | `testing-strategy` |

---

## Memory Integration

After creating a skill:
1. Log in `backlog/KNOWLEDGE.md`:
   ```
   ## 🎯 Skills Created
   - [YYYY-MM-DD] Created `<skill-name>` skill to address <problem>
   ```
2. Reference the skill in future task templates if relevant
