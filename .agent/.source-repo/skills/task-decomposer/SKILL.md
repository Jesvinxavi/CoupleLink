---
name: task-decomposer
description: Use when receiving vague or complex requests. Asks clarifying questions, then breaks down requirements into structured subtasks. Prevents rushing into code.
---

# Task-Decomposer Skill

Transform vague requests into clear, executable plans.

---

## When to Trigger

- Request is vague ("make it better", "fix the issues", "I want X")
- Request spans multiple files or systems
- Request has unclear acceptance criteria
- Effort estimate is L or XL
- You're unsure where to start
- Invoked by `/create-task-spec` workflow

---

## Step 1: Assess Complexity (FIRST)

| Complexity | Signs | Action |
|------------|-------|--------|
| **Simple** | Clear request, single file, cosmetic | Skip questions, proceed |
| **Medium** | Multiple files, some unknowns | Ask 2-3 targeted questions |
| **Complex** | Vague, architecture impact | Full elicitation below |

**Examples:**
- "Make button purple" → **Simple** → Confirm which button, proceed
- "Add dark mode" → **Medium** → Scope, components, persistence
- "I want notifications" → **Complex** → Full question battery

---

## Step 2: Clarifying Questions (Adaptive)

**Universal Rule:** For EVERY task, briefly scan these 4 categories for ambiguity:
1.  **Technical Implementation** (Schema, APIs, Perf)
2.  **UI & UX** (Empty states, transitions, mobile)
3.  **Concerns** (Security, failure states)
4.  **Tradeoffs** (Speed vs Robustness)

---

### For SIMPLE Tasks
**Action:** Quick Scan.
- Is the request *actually* simple, or are there hidden UI/Tech implications?
- **IF Clear**: Just confirm the specific element/file.
- **IF Ambiguous**: Ask with a recommendation.
  - *Example:* "This button submits data. I recommend adding a **loading spinner** for feedback. Or we could just disable it. Shall we add the spinner?"

→ Then skip to Step 5 (Subtasks).

---

### For MEDIUM Tasks
**Action:** Targeted Scan.
Don't just ask "what is the flow?". **Check the 4 categories** and ask only about what's missing.
- **Technical**: "Does this need a new DB column? I suggest **adding 'status' to 'tasks'** for tracking."
- **UI/UX**: "For mobile, I recommend **stacking the columns**. Or we could hide the sidebar. Thoughts?"
- **Concerns**: "If offline, I suggest we **queue the request**. Agree?"

**Decision:**
- If a category is obvious (e.g., standard button), skip it.
- If a category has *any* doubt, ASK with a recommendation.

→ Then proceed to Step 3.

---

### For COMPLEX Tasks (Deep Interview Mode)

**Goal:** Interview the user in detail. **Avoid obvious questions.** Dig for edge cases, tradeoffs, and hidden complexity.

#### 1. The Interview Protocol
Act as a Senior Architect. Don't just ask "what do you want?". Ask "what have you considered?".

**CRITICAL: Always provide Options + Recommendation.**
- **❌ Bad:** "How should we handle errors?"
- **✅ Good:** "I recommend we **toast the error** so the user knows to retry. We could also just log it, but that feels silent. Thoughts?"

- **UI & UX:** "For empty states, I suggest a **placeholder illustration** (cleaner) vs just text. Do you agree?"
- **Technical:** "What are the performance implications? Security concerns?"
- **Tradeoffs:** "We could do X (fast) or Y (robust). Which do you prefer?"
- **Concerns:** "I'm worried about [potential issue]. How should we handle it?"

#### 2. Question Categories (Must Cover All)
1.  **Technical Implementation:** Database schema, API design, libraries.
2.  **UI & UX Details:** Interactions, error states, responsiveness.
3.  **Risk & Concerns:** "What if the API fails?", "What if user is offline?"
4.  **Strategic Tradeoffs:** Quality vs Speed, Flexibility vs Simplicity.

#### 3. The Loop (Continual Interview)
```
REPEAT:
  1. Analyze current understanding.
  2. Identify GAPS (non-obvious ones).
  3. Ask deep, investigative questions.
  4. Wait for response.
UNTIL: You can write the FULL spec without guessing.
```

---

## Step 3: Identify Components

Break into independent pieces:
- [ ] Frontend changes
- [ ] Backend/database changes  
- [ ] Configuration changes
- [ ] Documentation updates

---

## Step 4: Pre-Mortem Analysis (Elite Move)

**For Complex/Critical Tasks, ask:**
"Imagine we released this and it FAILED. What happened?"

*Examples:*
- "We migrated the DB but didn't update the types."
- "The UI looks good but the API is slow."
- "Users on mobile can't see the button."

**Action:** Turn these failures into **Prevention Subtasks** (e.g., "Add loading skeleton", "Verify mobile overflow").

---

## Step 5: Create Subtask List

Format for task file:
```markdown
## Implementation Plan
- [ ] Subtask 1 (effort: S)
- [ ] Subtask 2 (effort: M, depends on 1)
- [ ] Subtask 3 (effort: S)
```

---

## Step 6: Estimate Effort

| Size | Criteria |
|------|----------|
| XS | < 30 min, single file |
| S | 30 min - 2 hr, 1-3 files |
| M | 2-4 hr, multiple files |
| L | 4-8 hr, multiple components |
| XL | > 8 hr, consider splitting |

---

## Output Template

```markdown
## Task Decomposition: [Original Request]

### Complexity: [Simple/Medium/Complex]

### Clarifying Questions Asked
1. Q: [Question] → A: [Answer]
2. Q: [Question] → A: [Answer]

### Goal (After Clarification)
[What I now understand the user wants]

### Components Affected
- Component A
- Component B

### Subtasks
1. **[Subtask 1]** - [Description] (effort: S)
2. **[Subtask 2]** - [Description] (effort: M)

### Risks/Unknowns
- [Any remaining uncertainties]
```

---

## Verification
- [ ] Complexity assessed before questioning
- [ ] Questions proportional to complexity
- [ ] All ambiguities resolved before decomposition
- [ ] Subtasks are actionable and sized

---

## Anti-Patterns (Avoid These)

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Ask 20 questions for a button color change | Assess complexity first |
| Start coding with "I'll figure it out" | Clarify unknowns upfront |
| Create subtasks without effort estimates | Size every subtask |
| Ignore edge cases | Explicitly ask "what should NOT happen?" |
| Assume database changes are obvious | Always confirm RLS/schema impact |
| Make subtasks too large (> 4hr) | Split anything XL into multiple tasks |

---

## Success Criteria

Your decomposition is "good enough" when:
- [ ] A different agent could execute it without asking questions
- [ ] Each subtask has ONE clear deliverable
- [ ] Dependencies are explicit (not assumed)
- [ ] Effort estimates are realistic
- [ ] Edge cases are documented
- [ ] User has confirmed understanding

---

> [!CAUTION]
> ## THIS SKILL DOES NOT IMPLEMENT
> 
> **Scope of this skill:**
> - ✅ Ask questions
> - ✅ Break down requirements
> - ✅ Create subtask lists
> - ✅ Estimate effort
> 
> **NOT in scope:**
> - ❌ Writing code
> - ❌ Creating files
> - ❌ Running commands
> - ❌ Starting implementation
> 
> After decomposition, **return control to the workflow**. Implementation happens via `/start-task`.

