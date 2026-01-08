---
name: test-strategist
description: Use during create-task-spec to decide if tests are needed and what type. Use during finish-task to verify tests exist. Can write tests to the codebase.
---

# Test Strategist Skill

Determine testing needs, select appropriate test types, and implement tests.

---

## Trigger Points

1. **create-task-spec** (Step 8) → Plan testing strategy
2. **finish-task** (quality-gate) → Verify tests exist

---

## Step 1: Evaluate Test Need

Ask: "If this breaks in production, what's the impact?"

| Impact | Examples | Test Needed? |
|--------|----------|--------------|
| **Critical** | Auth, payments, data loss | Yes, mandatory |
| **High** | Core features, navigation | Yes, recommended |
| **Medium** | UI polish, secondary features | Optional |
| **Low** | Copy changes, minor styling | No |

### Decision Matrix
| Feature Type | Test Required? |
|--------------|----------------|
| Auth/Security | ✅ Always |
| Database operations | ✅ Always |
| Payment/billing | ✅ Always |
| Core user flows | ✅ Recommended |
| API integrations | ✅ Recommended |
| Form validation | ✅ Recommended |
| UI components | ⚠️ If complex logic |
| Styling changes | ❌ Rarely |
| Static content | ❌ No |

---

## Step 2: Select Test Type

| Test Type | When to Use | Speed | Confidence |
|-----------|-------------|-------|------------|
| **Unit** | Pure functions, utilities, hooks | Fast | Lower |
| **Integration** | Component + API, DB interactions | Medium | Medium |
| **E2E** | Critical user flows, auth, payments | Slow | Highest |

### Recommendation Logic
```
IF feature involves multiple systems (DB + UI + API)
  → E2E test for happy path
  → Integration tests for edge cases

IF feature is a utility function or hook
  → Unit tests

IF feature is a UI component with logic
  → Integration test with React Testing Library

IF feature is just styling
  → Visual regression test OR skip
```

---

## Step 3: Data Strategy (Elite Move)

**Tests fail because of DATA, not code.** Plan this upfront.

| Scenario | Strategy | Code Example |
|----------|----------|--------------|
| **Specific User State** | Seed DB before test | `await seedUser({ isPremium: true })` |
| **Empty State** | Mock empty response | `mockAPI.get('/items', [])` |
| **Error State** | Mock 500 triggers | `mockAPI.error('/items', 500)` |
| **Complex Relationship** | Use Factory Pattern | `createOrgWithMembers(5)` |

**Question to Ask:**
"Does this feature depend on specific data (e.g., a premium user with 3 active challenges)?"
- If YES: How will we create that state in the test?

---

## Step 4: Write the Test

### For React/Vite Projects (like CoupleLink)

**Unit Tests** (Vitest):
```typescript
// src/utils/__tests__/myFunction.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction('input')).toBe('output');
  });
});
```

**Integration Tests** (React Testing Library):
```typescript
// src/components/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

**E2E Tests** (Playwright):
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can log in', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## Step 5: Test Placement

| Test Type | Location |
|-----------|----------|
| Unit | `src/**/__tests__/*.test.ts` |
| Integration | `src/**/__tests__/*.test.tsx` |
| E2E | `e2e/*.spec.ts` |

---

## Output Template (For Specs)

```markdown
## Testing Strategy

### Tests Required: Yes/No
**Reason**: [Why tests are/aren't needed]

### Test Plan
| Test | Type | File | Description |
|------|------|------|-------------|
| Happy path login | E2E | `e2e/auth.spec.ts` | User can log in successfully |
| Invalid password | Integration | `src/auth/__tests__/login.test.tsx` | Shows error message |

### Acceptance Criteria
- [ ] All tests pass
- [ ] Coverage > 80% for new code
- [ ] E2E runs in CI
```

---

## Verification Checklist (For finish-task)

- [ ] Tests were identified in spec
- [ ] Tests were actually written
- [ ] Tests pass locally (`npm test`)
- [ ] Test files are in correct location
- [ ] Tests cover edge cases, not just happy path

---

## Anti-Patterns

| ❌ Don't | ✅ Do Instead |
|----------|---------------|
| Write tests for everything | Prioritize by impact |
| Only test happy path | Test edge cases and errors |
| Skip tests because "it's simple" | Ask "what if this breaks?" |
| Write E2E for utility functions | Match test type to feature |
| Forget to run tests before PR | Integrate into quality-gate |
