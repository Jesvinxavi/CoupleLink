---
name: research-deep-dive
description: Use when investigating complex problems, exploring unfamiliar codebases, or gathering information from multiple sources before implementation.
---

# Research Deep Dive Skill

Load this skill when you need to thoroughly understand a problem before coding.

## Core Instructions

1. **Multi-Source Research**
   - Use `search_web` for external patterns and documentation
   - Use `grep_search` to find related code in codebase
   - Use `view_file_outline` to understand file structures
   - Read `backlog/KNOWLEDGE.md` for past lessons

2. **Structured Investigation**
   - Define the question clearly before searching
   - Document findings as you go
   - Cross-reference multiple sources
   - Identify contradictions or gaps

3. **Synthesis**
   - Summarize findings before implementation
   - Create a mini-spec if complexity warrants
   - Identify risks and unknowns
   - Propose 2-3 approaches if unclear

## Research Template

```markdown
## Research: [Topic]

### Question
What am I trying to understand?

### Sources Consulted
1. [Source 1] - Key finding
2. [Source 2] - Key finding

### Codebase Investigation
- Found X in `path/to/file.ts`
- Pattern Y is used in existing code

### Conclusion
Based on research, the best approach is...

### Risks/Unknowns
- Unknown 1
- Risk 1
```

## Guidelines

- Don't rush to code; understand first
- Read at least 3 sources before concluding
- Check if similar problems were solved in codebase
- Update `KNOWLEDGE.md` with new learnings

## Verification

- [ ] Question clearly defined
- [ ] Multiple sources consulted
- [ ] Codebase patterns identified
- [ ] Conclusion documented
