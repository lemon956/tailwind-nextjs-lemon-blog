# Tool Workbench UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the JSON and SQL formatter pages into a shared professional workbench and replace custom SQL formatting with open-source formatting libraries.

**Architecture:** Add a reusable `ToolWorkbench` UI shell for the shared page chrome and panels. Move SQL/MongoDB formatting into a focused helper so behavior can be tested independently from the React page. Keep JSON-specific tree rendering and repair behavior in the JSON page while moving its page layout onto the shared shell.

**Tech Stack:** Next.js App Router, React client components, Tailwind CSS v4, TypeScript, `sql-formatter`, Prettier standalone plugins, `bson`, Node test runner.

---

### Task 1: Shared Tool Workbench UI Component

**Files:**

- Create: `components/tools/ToolWorkbench.tsx`
- Modify: none
- Test: `npm run lint`

- [ ] Create `ToolWorkbench`, `ToolPanel`, `ToolNotice`, and `ToolButton` exports.
- [ ] Give the workbench a full-width professional tool layout that still fits inside the existing blog shell.
- [ ] Support toolbar, feedback, two-panel work area, usage notes, and responsive stacking.
- [ ] Run `npm run lint` and fix component-level lint errors.

### Task 2: Formatter Helper Tests

**Files:**

- Create: `lib/tools/sqlFormatters.test.mjs`
- Test target: `lib/tools/sqlFormatters.ts`
- Test: `node --test lib/tools/sqlFormatters.test.mjs`

- [ ] Write tests for MySQL formatting through an exported helper.
- [ ] Write tests for Doris using MySQL-compatible formatting.
- [ ] Write tests for MongoDB shell-chain formatting.
- [ ] Write tests for MongoDB object/EJSON formatting.
- [ ] Run the tests and verify they fail because the helper does not exist yet.

### Task 3: Open-Source Formatter Helper

**Files:**

- Create: `lib/tools/sqlFormatters.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: `node --test lib/tools/sqlFormatters.test.mjs`

- [ ] Install `sql-formatter`, `prettier`, and `bson`.
- [ ] Implement `formatDatabaseQuery()` for MySQL, Doris, and MongoDB Query modes.
- [ ] Use `sql-formatter` for SQL modes.
- [ ] Use Prettier standalone for MongoDB shell-chain input.
- [ ] Use EJSON/JSON formatting for MongoDB object or array input.
- [ ] Run the helper tests and verify they pass.

### Task 4: SQL Formatter Workbench Page

**Files:**

- Modify: `app/tools/sql-formatter/page.tsx`
- Test: `npm run lint`

- [ ] Replace custom SQL formatting calls with `formatDatabaseQuery()`.
- [ ] Remove custom SQL formatter helper functions that are no longer used.
- [ ] Rebuild the page with `ToolWorkbench`, `ToolPanel`, `ToolNotice`, and `ToolButton`.
- [ ] Rename MongoDB mode to `MongoDB Query` and Doris to `Doris (MySQL compatible)`.
- [ ] Keep syntax highlighting visual only.
- [ ] Run `npm run lint` and fix SQL page errors.

### Task 5: JSON Formatter Workbench Page

**Files:**

- Modify: `app/tools/json-formatter/page.tsx`
- Test: `npm run lint`

- [ ] Rebuild the page with `ToolWorkbench`, `ToolPanel`, `ToolNotice`, and `ToolButton`.
- [ ] Preserve format, compress, repair menu, repair logs, tree output, search, copy, clear, and sample data.
- [ ] Add compact input/output metadata in the shared panel headers.
- [ ] Keep the output search usable without covering primary content on mobile.
- [ ] Run `npm run lint` and fix JSON page errors.

### Task 6: Final Verification

**Files:**

- Modify as needed based on verification failures.
- Test: `npm run lint`
- Test: `npm run build`

- [ ] Run `node --test lib/tools/sqlFormatters.test.mjs`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Start the local dev server if needed for manual checks.
- [ ] Manually check both formatter pages for empty input, valid input, invalid input, copy, clear, sample data, and mobile stacking.
