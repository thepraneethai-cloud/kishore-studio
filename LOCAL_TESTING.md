# Local Testing

Use this setup to test saved projects, project switching, and database-backed settings locally.

## 1. Start Docker Desktop

Docker must be running before the local MySQL container can start.

## 2. Start MySQL

```bash
npm run db:local:up
```

If you want a clean database:

```bash
npm run db:local:reset
```

## 3. Apply migrations

```bash
npm run db:local:migrate
```

## 4. Run the app locally

Development mode:

```bash
npm run dev:local
```

Production-like mode:

```bash
npm run start:local
```

Open `http://localhost:3000` and sign in with:

```text
codex-test
```

## 5. Test saved projects

1. Enter a subject and title on the Concept page.
2. Wait a moment for autosave.
3. Click `NEW PROJECT`.
4. Use the sidebar `PROJECT` dropdown to select the saved project.
5. Confirm the title, scenes, prompts, and current workflow step return.

## Useful Commands

```bash
npm run db:local:logs
npm run db:local:down
```
