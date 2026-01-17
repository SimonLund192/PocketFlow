# AI Context: Budget App

This app helps people understand and control their money with clarity and trust.
The product should feel calm and reliable. The code should be predictable and testable.

---

## Product Intent

- Help users track transactions, budgets, goals, and trends.
- Make the dashboard understandable at a glance.
- Avoid surprise behavior. Changes should be visible and explainable.
- Prefer correctness over flashy complexity.

---

## UX Intent

- Consistency matters more than novelty.
- Use existing layout patterns (Sidebar/layout components) and shadcn/ui components.
- Keep pages focused: clear headings, clear primary actions, clear empty states.
- Loading and error states should be graceful and consistent.

---

## Engineering Intent

- Financial logic must be correct and stable:
  - be consistent about currency formatting and rounding
  - avoid ambiguous calculations and duplicated business rules
- Centralize API access in `frontend/lib/api.ts`.
- Prefer small refactors that improve clarity rather than large rewrites.
- Add tests when changing logic to prevent regressions.

---

## Long-Term Direction

The codebase should stay easy to extend:
- recurring transactions
- categories/tags
- budget periods
- export/import
- analytics and forecasting

Build foundations that scale without making the system complicated today.
