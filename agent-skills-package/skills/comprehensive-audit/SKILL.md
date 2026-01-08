---
name: comprehensive-audit
description: Use at the end of a spec (before merge) to identify any mistakes and ensure the implementation is as robust as possible. This is a deep review of all tasks and code changes.
---

# Comprehensive Audit Skill

**Purpose:** Perform a meticulous review of all work completed in a spec to identify any mistakes and ensure the implementation is as robust as possible.

> [!CAUTION]
> This is a CRITICAL skill. Do NOT skip or rush through it.
> The goal is to catch issues BEFORE they reach production.

---

## When to Trigger

- Invoked by `/finish-spec` (Step 3)
- Can be manually invoked anytime for mid-spec checkpoints
- Should be run after any major refactoring effort

---

## Phase 1: Preparation

### 1.1 Gather Context
1. **Identify the spec** being audited
2. **List all related tasks** (via `spec:` field in task frontmatter)
3. **Run `git diff main...HEAD --stat`** to see the scope of changes

### 1.2 Mental Preparation
Before diving into code, ask:
- "If this code goes to production and breaks, what would be the worst outcome?"
- "What are the highest-risk areas of this implementation?"
- "What assumptions did I make that could be wrong?"

---

## Phase 2: Task-Level Audit

For **EACH task** in the spec, perform these checks:

### 2.1 Requirements Verification
| Check | Question |
|-------|----------|
| **Completeness** | Were ALL subtasks completed? Check each `- [ ]` in the task file. |
| **Accuracy** | Does the implementation match the original description EXACTLY? |
| **Scope Creep** | Did I add anything NOT in the requirements? (Flag for review) |
| **Scope Miss** | Did I miss anything that WAS in the requirements? |

### 2.2 Subtask Deep Dive
For each subtask:
1. Re-read the subtask description
2. Find the code/file that implements it
3. Verify the implementation is correct
4. Mark as ✅ verified or ❌ needs fix

---

## Phase 3: Automated Pattern Check (Security & Cleanup)

Run these checks from the project root. Any hits must be investigated.

### 3.1 Secrets & Keys
```bash
grep -rE "AWS_ACCESS_KEY|BEGIN RSA|MIIC|AIza|sk_live" . --exclude-dir={node_modules,dist,.git}
```

### 3.2 Debugging Leftovers
```bash
grep -rE "console\.log|debugger|TODO|FIXME" . --exclude-dir={node_modules,dist,.git}
```

### 3.3 Dangerous Patterns
```bash
grep -rE "dangerouslySetInnerHTML|eval\(|document\.write" . --exclude-dir={node_modules,dist,.git}
```

---

## Phase 4: Code-Level Audit

Run `git diff main...HEAD` and review EVERY changed line.

### 3.1 Correctness Checklist

| Category | What to Check |
|----------|---------------|
| **Logic Errors** | Off-by-one errors, incorrect conditionals, wrong operators |
| **Null/Undefined** | Are null checks present where needed? Optional chaining used? |
| **Type Safety** | Are types correct? Any `any` types that should be specific? |
| **Edge Cases** | Empty arrays, zero values, negative numbers, very long strings |
| **Boundary Conditions** | First/last items, min/max values, pagination boundaries |
| **Error Handling** | Are errors caught and handled gracefully? User-friendly messages? |
| **Race Conditions** | Async operations handled correctly? Loading states? |

### 3.2 Robustness Checklist

| Category | What to Check |
|----------|---------------|
| **Input Validation** | Are user inputs validated before use? |
| **External Dependencies** | What if an API call fails? Timeout? Wrong format? |
| **State Management** | Is state updated correctly? Any stale state issues? |
| **Memory Leaks** | Are event listeners cleaned up? Subscriptions unsubscribed? |
| **Performance** | Any O(n²) loops? Unnecessary re-renders? Large bundle impact? |

### 3.3 Code Quality Checklist

| Category | What to Check |
|----------|---------------|
| **Naming** | Are variable/function names clear and descriptive? |
| **Comments** | Are complex sections commented? Are comments accurate? |
| **DRY Principle** | Any duplicated code that should be extracted? |
| **Consistency** | Does code follow existing patterns in the codebase? |
| **Dead Code** | Any unreachable code? Unused imports/variables? |
| **Debug Artifacts** | Any `console.log`, `debugger`, or TODO comments left behind? |

---

## Phase 4: Integration Audit

### 4.1 Cross-File Impact
- Did changes to File A break File B?
- Are imports/exports correct?
- Are shared utilities updated in all places they're used?

### 4.2 Configuration Audit
- Are environment variables correct?
- Are new dependencies added to package.json?
- Are database migrations applied correctly?

### 4.3 Documentation Audit
- Are new features documented?
- Are API changes reflected in relevant docs?
- Are comments accurate after code changes?

---

## Phase 5: Security Audit

| Check | Question |
|-------|----------|
| **Secrets** | Are any API keys, passwords, or tokens hardcoded? |
| **Injection** | Is user input sanitized before use in DB queries or HTML? |
| **Authentication** | Are protected routes properly guarded? |
| **Authorization** | Can users access resources they shouldn't? |
| **Data Exposure** | Is sensitive data logged or exposed in error messages? |

---

## Phase 6: Test Audit

| Check | Question |
|-------|----------|
| **Test Existence** | If tests were required, do they exist? |
| **Test Coverage** | Do tests cover happy path AND edge cases? |
| **Test Quality** | Are tests actually testing the right things? |
| **Test Passing** | Do all tests pass locally? |

---

## Audit Output Format

### 1. Robustness Score (0-100)
Calculate your score:
- **Start with 100 points**
- **-10** for each Critical issue
- **-5** for each High issue
- **-2** for each Medium issue
- **-1** for each Low issue

**Target:**
- 100/100: Elite
- 90-99: Production Ready
- < 90: Needs Improvement (Fix issues before merge)

### 2. Findings Log

Document ALL findings using this table:

```markdown
## Audit Findings

| ID | File | Line | Issue | Severity | Status |
|----|------|------|-------|----------|--------|
| A1 | `scripts/scaffold.sh` | 45 | Missing error check | Medium | ✅ Fixed |
| A2 | `src/utils/api.ts` | 23 | No timeout on fetch | Low | ✅ Fixed |
| A3 | N/A | N/A | No issues found | N/A | ✅ Clear |
```

### Severity Levels

| Level | Definition | Action Required |
|-------|------------|-----------------|
| **Critical** | Could cause data loss, security breach, or system crash | MUST fix before merge |
| **High** | Breaks core functionality | MUST fix before merge |
| **Medium** | Degrades UX or causes edge-case bugs | SHOULD fix before merge |
| **Low** | Minor improvements, style issues | MAY fix, or create follow-up task |

---

## Post-Audit Actions

1. **Calculate Score.** If < 100, create an "Audit Resolution" commit.
2. **Fix Medium issues if time permits** (or create tasks for later)
3. **Document Low issues** in a follow-up task if not fixing now
4. **Re-run audit** on any files that were modified during fixes
5. **Confirm all issues resolved** before proceeding to next step

---

## Verification Checklist

Before declaring the audit complete:

- [ ] All tasks re-reviewed against requirements
- [ ] All changed files reviewed line-by-line
- [ ] Correctness checklist completed
- [ ] Robustness checklist completed
- [ ] Code quality checklist completed
- [ ] Security checklist completed (if applicable)
- [ ] Test checklist completed (if applicable)
- [ ] All Critical/High issues fixed
- [ ] Audit findings documented

---

## Anti-Patterns to Avoid

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Skim the diff quickly | Read every line carefully |
| Assume code works because tests pass | Manually trace logic paths |
| Skip security checks for "internal" code | Always audit for security |
| Rush because you're confident | Confidence leads to blind spots |
| Fix issues without documenting them | Document everything in the audit table |

---

> [!TIP]
> **Pro Move:** Read the code as if someone ELSE wrote it and you're reviewing their PR.
> This perspective shift helps catch issues you'd otherwise miss.
