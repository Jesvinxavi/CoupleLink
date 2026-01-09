---
description: Complete a spec with quality gates and memory updates
---

# Finish Spec Workflow

**Use after ALL tasks in a spec are completed.**
This runs a holistic quality gate and captures lessons learned.

---

## 1. Identify the Spec
- Ask user which spec is complete (e.g., "skills-migration")
- Locate `backlog/specs/feature-<name>.md` or `backlog/docs/<name>.md`
- Find all related tasks via the `spec:` field in task frontmatter

---

## 2. Verify All Tasks Complete
```bash
# Check task files for this spec
grep -l "spec:.*<spec-name>" backlog/tasks/*.md
```

- All related tasks should have `status: Done`
- If any tasks are not Done → ABORT. Complete them first.

---

## 3. Comprehensive Audit (CRITICAL)

**Load `.agent/skills/comprehensive-audit/SKILL.md`**

**Goal:** Identify any mistakes and ensure the implementation is as robust as possible.

The skill contains:
- 6-phase audit methodology
- Task-level and code-level review checklists
- Correctness, robustness, security, and test audits
- Severity classification and resolution tracking
- Anti-patterns to avoid

> [!IMPORTANT]
> **Elite Standard:** You must achieve a **Robustness Score of 100/100**.
> If score < 100:
> 1. Fix issues
> 2. Commit fix: `fix(audit): resolve robustness issues (Score: X -> 100)`
> 3. Re-run audit to confirm 100/100

---

## 4. Run Quality-Gate Skill
Load `.agent/skills/quality-gate/SKILL.md`

1. **Build Check:**
   ```bash
   npm run build
   ```
   - If fail → ABORT. Fix and re-run.

2. **Skill Checklists:** Complete all applicable skill checklists for the tasks.

3. **Test Verification (via test-strategist):**
   - Check if spec required tests
   - If yes: Verify tests exist and pass (`npm test`)
   - If tests missing: Write them before proceeding

---

## 5. Context Binding (Automatic)
- Run `git diff --name-only main...HEAD`
- Update the spec file to add a summary of changes:
  ```markdown
  ## Files Changed (Auto-Generated)
  - `src/modified/file.ts`
  - `scripts/scaffold-agents.sh`
  ```

---

## 6. Run Self-Reflection Skill
Load `.agent/skills/self-reflection/SKILL.md`

**Preparation:**
- **CRITICAL:** You must READ all `backlog/tasks/task-*.md` files associated with this spec.
- Do not rely solely on your memory or the last task's context.
- Extract "Lessons Learned" or specific nuances from each task description and completion notes.

**Answer these questions for the ENTIRE spec (holistic view):**
- What went well across all tasks?
- What could improve?
- What patterns emerged?
- Any architectural insights?

**Capture at least 2-3 lessons learned.**
Append to `backlog/KNOWLEDGE.md` under the appropriate category.

---

## 7. Check Context-Curator Trigger
- If `KNOWLEDGE.md` > 200 lines, run context-curator skill.

---

## 8. Generate Status Report
- Run `backlog board export` to generate a markdown snapshot of the project status.
- Save this snapshot to `backlog/docs/status/` (create folder if needed) with the naming convention `YYYY-MM-DD-status-report.md`.
- This provides a historical record of the project state at the time of spec completion.

---


## 9. Merge Strategy

| Spec Type | Action |
|-----------|--------|
| Had feature branch | Create PR or merge to main |
| No feature branch (≤2 tasks) | Already on main, just commit |

**Merge command (if on feature branch):**
```bash
git checkout main
git merge feature/<spec-name>
git push
```

---

## 10. Update Spec Status
- Add completion timestamp to spec file
- Mark all related tasks as Done (if not already)
- Commit: `chore: complete spec <spec-name>`

---

## Definition of Done (Spec Finished When)
- [ ] All tasks have `status: Done`
- [ ] Comprehensive audit completed (no issues found)
- [ ] Build passes
- [ ] Tests pass (if required)
- [ ] Self-reflection completed
- [ ] KNOWLEDGE.md updated
- [ ] Feature branch merged (if applicable)
