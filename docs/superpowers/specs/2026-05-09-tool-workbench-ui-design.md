# Tool Workbench UI Design

Date: 2026-05-09
Scope: `/tools/json-formatter` and `/tools/sql-formatter`

## Goal

Upgrade the two tool pages into a consistent professional workbench experience while preserving their existing user-facing capabilities. The focus is UI and interaction quality, not a broad rewrite of the blog site.

The SQL formatter must stop relying on hand-written formatting rules. SQL formatting will use an open-source formatter library. MongoDB query formatting will use open-source JavaScript/JSON formatting tools rather than custom string rules.

## Current Context

The project currently has two local tool pages:

- `app/tools/json-formatter/page.tsx`
- `app/tools/sql-formatter/page.tsx`

The JSON page already supports formatting, compression, repair options, tree output, output search, copy actions, examples, and input history.

The SQL page supports MySQL, Doris, and MongoDB modes, plus formatting, compression, syntax highlighting, examples, copy, and input history. Its SQL formatting is currently implemented with custom keyword lists and string/regex-based formatting helpers such as SELECT, INSERT, UPDATE, DELETE, and DDL formatters. That approach should be replaced.

## Product Direction

Use a professional workbench direction:

- Dense but readable layout.
- A compact title/status header.
- A unified action toolbar.
- Stable input/output panels.
- Clear state feedback for empty input, success, parse errors, and copied results.
- Desktop-first split view with clean mobile stacking.

The design should feel like a practical developer utility embedded in the existing blog, not a marketing page.

## Architecture

Add a shared tool workbench shell used by both pages. The shared shell owns common layout and interaction structure:

- Page title, short description, and compact status summary.
- Main toolbar area.
- Input panel and output panel layout.
- Feedback zones for errors, repair logs, and informational notices.
- Optional usage notes section.
- Responsive desktop split view and mobile stacked view.

The pages keep their own domain logic:

- JSON parsing, repair, tree rendering, search, and node copy behavior stay in the JSON page or JSON-specific components.
- SQL/MongoDB formatting, dialect controls, and syntax highlighting stay in the SQL page or SQL-specific components.

This avoids duplicating layout code while keeping the business logic boundaries clear.

## Page Structure

Both pages use the same high-level structure:

1. Compact header
   - Tool name.
   - One-line description.
   - Current state summary such as empty input, formatted, compressed, parse error, or copied.

2. Toolbar
   - Primary actions on the left.
   - Format-specific controls on the right.
   - Buttons keep stable dimensions and clear hierarchy.

3. Work area
   - Desktop: input and output panels side by side.
   - Mobile: input panel above output panel.
   - Each panel shows title, character/line metadata, and local actions where useful.
   - Panels keep stable minimum heights so content changes do not jump the layout.

4. Feedback area
   - Errors use a consistent danger style.
   - JSON repair logs use a compact structured notice.
   - Copy success uses the existing toast pattern, restyled to match the workbench.

5. Usage notes
   - Keep only concise, practical notes.
   - Reduce the current long-list feeling so the tool remains the focus.

## JSON Formatter Behavior

Preserve the existing JSON capabilities:

- Format JSON with configurable indentation.
- Compress JSON.
- Repair common malformed JSON input through the existing repair menu.
- Show repair logs after repair actions.
- Render formatted output as an expandable tree.
- Render compressed output as text.
- Support output search.
- Copy the whole output.
- Copy JSON tree nodes and key/value pairs.
- Clear input and output.
- Load sample data.

The visual redesign should make these controls easier to scan. The repair menu remains a dropdown because it has multiple sub-actions.

JSON formatting continues to use native `JSON.parse` and `JSON.stringify`, which is correct for valid JSON and does not need a third-party formatter.

## SQL and MongoDB Formatter Behavior

Replace the custom SQL formatter implementation with open-source formatting libraries.

### SQL

Use `sql-formatter` for SQL formatting.

Supported modes:

- MySQL: use `sql-formatter` with the MySQL dialect.
- Doris: use the MySQL-compatible configuration and label it as `Doris (MySQL compatible)` in the UI.

Expose user controls that map cleanly to formatter options:

- Dialect.
- Keyword case.
- Indentation width.
- Lines between queries if it fits the toolbar without crowding.

If formatting fails, show an explicit parse/format error. Do not silently keep stale output and do not fall back to the old hand-written formatter.

### MongoDB

Keep MongoDB support, but label it as `MongoDB Query` rather than a SQL dialect.

Use open-source tools instead of custom string rules:

- Use Prettier for Mongo shell-style JavaScript such as `db.users.find({...}).sort({...}).limit(10)`.
- Use EJSON/JSON formatting for pure object, array, or Extended JSON input where appropriate.
- Use `mongodb-query-parser` only if needed for validation or safer parsing of MongoDB query fragments.

MongoDB formatting should be presented as query beautification, not SQL parsing.

## Removed or Replaced SQL Code

The implementation should remove or stop using the custom SQL formatting helpers currently responsible for:

- Keyword lists as formatter behavior.
- Manual SELECT formatting.
- Manual INSERT formatting.
- Manual UPDATE formatting.
- Manual DELETE formatting.
- Manual DDL formatting.
- Regex-based comment extraction/restoration as part of formatter behavior.

Syntax highlighting can remain custom if it is only visual, but it must not be the formatting source of truth.

## Responsive Behavior

Desktop and wide tablet:

- Use a two-panel workbench layout.
- JSON may keep a wider output panel if tree output benefits from more space.
- SQL can use balanced input/output widths.

Mobile:

- Stack input above output.
- Toolbar wraps into compact rows.
- Selects and buttons remain tappable.
- Floating search or menu UI must not cover primary content.

## Accessibility and Interaction

- Buttons must have descriptive accessible labels when the visible label is not enough.
- Icon-only actions need titles or accessible names.
- Keyboard users must be able to reach toolbars, textareas, dropdowns, and output search.
- Error text must be visible and not only color-coded.
- Text in buttons and controls must not overflow on narrow screens.

## Validation

Implementation is complete when these checks have been run or explicitly reported as blocked:

- `npm run lint`
- `npm run build`

Manual checks:

- JSON page: empty input, valid input, invalid input, format, compress, repair menu, tree output, search, copy, clear, sample data, mobile stacking.
- SQL page: empty input, invalid input, MySQL formatting, Doris/MySQL-compatible formatting, MongoDB chain formatting, MongoDB object formatting, copy, clear, sample data, mobile stacking.

The final implementation report must list:

- Files changed.
- Dependencies added.
- Which library handles SQL formatting.
- Which library or combination handles MongoDB formatting.
- Any unsupported syntax or remaining limitations.
