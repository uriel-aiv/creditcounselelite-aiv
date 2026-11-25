# Instructions for AI assistants working in this repo

This repo is the second brain for the **Credit Counsel Elite (CCE)** brand.

## How to use it
1. Before writing any copy, script, ad or prompt for CCE, read `business/` and `brand/messaging.md`.
2. Before publishing any claim, check `business/compliance-and-legal.md` (results-vary language, no guarantees, not credit repair).
3. Use only facts found here. If a number or claim is not in this repo, flag it rather than inventing it.
4. File new knowledge in the right folder; put unsorted material in `inbox/`.
5. Workflows go in `workflows/` as step-by-step markdown; reusable prompts go in `prompts/`.
6. Motion tests (code-rendered founder split-screens): read `workflows/code-motion-tests.md`, then work in `motion-kit/` following `motion-kit/README.md`. Run `workflows/motion-qa-checklist.md` on every encoded film before delivering. Record new feedback in the workflow doc and commit it.
7. Never write personal machine paths (home folders, user names) into this repo. Use `$CCE_ROOT` for the team's shared CCE folder.

## Conventions
- Markdown only, kebab-case filenames. Exception: `motion-kit/` holds the source code, fonts and generated art for the motion tests.
- Each file starts with a one-line purpose and a `Source:` / `Last updated:` line.
- Mark unverified claims as _(site claim)_.
- Never store client personal data, card numbers, or credentials here.
