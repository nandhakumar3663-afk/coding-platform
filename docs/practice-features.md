# Practice experience

## Levels

The catalog exposes `level` and `level_question_number` from the original PDF source. Level 2 contains 57 questions; Level 3 contains 52. Problem lists, the question picker, dashboard, and admin list display these levels. The existing database difficulty values remain compatible with older clients. Additional admin-created questions without a source level appear as Practice.

## Browser drafts

Code is automatically saved on editing, and the editor also has a visible Save button. Each key contains the signed-in account ID, question slug, and programming language. Guest drafts have a separate namespace. Switching accounts, languages, questions, or reloading restores the matching browser draft. Reset stores an empty draft for only the current account/question/language.

Drafts are stored in localStorage on the current site origin. They do not sync across devices, browser profiles, or different deployment URLs. Clearing site data deletes these drafts. If storage is unavailable or full, the editor keeps the current text in memory and displays a save failure. Existing Supabase saved_code records are left intact; this editor now reads and writes browser drafts instead.

## Leaderboard

The public `GET /api/user/leaderboard?limit=50&offset=0` endpoint returns student usernames, ranks, solve counts, and points. It also returns the signed-in user's row when authenticated. No email addresses, code, passwords, or hidden test data are returned.

- Level 2: 10 points per unique solved question.
- Level 3: 20 points per unique solved question.
- Other Practice questions: 10 points per unique solved question.
- Only server-verified solved progress for published questions contributes.
- Admin and guest accounts are excluded.
- Higher points rank first, then more solves. Identical points and solve counts share a competition rank (1, 1, 3).
- Usernames give tied entries a consistent display order.
- The UI refreshes on opening, returning focus, and using Refresh. Pages contain 50 users.

Deploy the updated backend as well as the frontend. The judge's SQLite database must be on persistent storage. All users must share this backend/database; separate databases or independent replicas will show separate rankings. Supabase users enter this database through the existing authenticated backend synchronization.

## Appearance

The navigation includes a light/dark toggle. The first visit follows the system theme; an explicit choice persists in the browser. Monaco follows the selected theme. Small screens have an accessible navigation row, wrapped controls, and a vertically stacked description/editor. Motion follows prefers-reduced-motion.

## Verification

Use Node 22.6+ (Node 24 recommended for node:sqlite). Install dependencies in frontend and backend, then run:

```bash
npm test
npm --prefix frontend run build
npm --prefix backend run build
```

Tests cover the existing catalog/judge suite, source-level metadata, leaderboard scoring/ties/pagination/privacy, repeated submissions, unpublished questions, and draft storage isolation/error handling.
