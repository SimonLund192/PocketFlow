# AI Context: Pocketflow

Pocketflow helps users understand and control their finances with clarity and trust.
The product should feel calm, predictable, and reliable.
The code should be easy to reason about and safe to extend.

---

## Product Intent

* Enable users to track transactions, budgets, goals, and trends.
* Make the dashboard understandable at a glance.
* Avoid surprise behavior; changes should be visible and explainable.
* Favor correctness and trust over feature novelty.

---

## UX Intent

* Consistency matters more than novelty.
* Reuse existing layout patterns and shadcn/ui components.
* Pages should be focused, with clear primary actions and clear empty states.
* Loading and error states should be graceful and consistent across the app.

---

## Engineering Intent

* Financial logic must be correct and stable:

  * consistent currency representation and rounding
  * no duplicated or ambiguous business rules
* User trust includes **strict isolation between users**.
* API access is centralized in `frontend/lib/api.ts`.
* Prefer small, incremental improvements over large rewrites.
* Tests are part of the feature, not an afterthought.

---

## Long-Term Direction

Pocketflow should remain easy to extend without becoming complex:

* recurring transactions
* categories and tagging
* budget periods
* import/export
* analytics and forecasting

Build foundations that scale in capability without scaling in complexity.
