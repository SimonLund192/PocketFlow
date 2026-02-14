// filepath: frontend/.github/copilot-instructions.md
- Use Next.js 14 App Router patterns (not Pages Router).
- Import shadcn/ui components from `@/components/ui/`.
- Use `useSearchParams()` from `next/navigation` for URL state.
- API base URL: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'`.
- Auth token from `localStorage.getItem("token")`.
- Always attach X-User-Id header via `frontend/lib/api.ts` helpers.