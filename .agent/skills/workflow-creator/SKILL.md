---
name: workflow-creator
description: Use when you identify repeated multi-step processes that should be automated. Creates new .agent/workflows/*.md files. Companion to skill-creator.
---

# Workflow-Creator Skill

Create standardized workflows for repeated processes.

---

## Skills vs Workflows

| Aspect | Skill | Workflow |
|--------|-------|----------|
| Purpose | Domain knowledge & patterns | Step-by-step processes |
| Format | SKILL.md with instructions | Numbered steps with commands |
| Trigger | Task type (Feature, Bug) | Slash command (/workflow-name) |
| Example | frontend-mastery | /start-task, /finish-task |

---

## When to Trigger

- Same sequence of steps performed 3+ times
- Complex process with multiple decision points
- Process that requires specific order of operations
- Onboarding a new team member to a process

---

## Workflow Creation Process

### 1. Identify the Process
- What steps are always done in sequence?
- What decisions need to be made at each step?
- What commands or tools are used?

### 2. Document the Steps
Create `.agent/workflows/<workflow-name>.md`:

```markdown
---
description: <What this workflow accomplishes>
---

<Detailed steps for completing this workflow>

1. **Step Name**
   * Action to take
   * Expected outcome

2. **Step Name**
   * Action to take
   * Decision point: If X, do Y; otherwise Z

// turbo (if step is safe to auto-run)
3. **Auto-Run Step**
   * Command to execute
```

### 3. Register the Workflow
- File automatically discovered via `.agent/workflows/` directory
- User can invoke via `/workflow-name` slash command

---

## Workflow Template

```markdown
---
description: <Brief description of when to use this workflow>
---

This workflow automates <process description>.

1. **Step One**
   * Gather required information
   * Validate prerequisites

2. **Step Two**
   * Execute main action
   * Handle errors if they occur

3. **Step Three**
   * Verify results
   * Clean up if needed

## Completion Criteria
- [ ] Criterion 1
- [ ] Criterion 2
```

---

## Quality Checklist

- [ ] Description clearly states purpose
- [ ] Steps are numbered and actionable
- [ ] Decision points are clearly marked
- [ ] Commands are exact (copy-pasteable)
- [ ] Safe steps marked with `// turbo`
- [ ] Completion criteria defined
