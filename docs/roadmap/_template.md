---
id: <slug>
title: <human title>
summary: <one or two sentences — this is the card's blurb on the board>
---

# <human title>

## Problem

<The pain, in one or two sentences. What is hard, slow, or impossible today?
Concrete and grounded — not "it would be nice if". Who hits this and when?>

## Why

<Why this is worth doing now. Tie it to the product north-star (the repo's
CLAUDE.md / README) and to what is already shipped. What does it unlock?>

## What it touches

<The surfaces, modules, and data this reaches. Name real files / components /
tables where you can — this is the "blast radius" reviewers care about.>

## Approach

<The intended shape of the solution. Enough that an agent could start. Note key
decisions, anything explicitly out of scope, and dependencies on other specs.>

## Effort

<S / M / L / XL and a one-line justification. What makes it that size?>

## Acceptance

<Bulleted, checkable outcomes. "Done" means these are true. Each should be
observable — a behavior to demo or a check that passes, not a vibe. End a
criterion with `(human)` when a person has to verify it by hand; the board's
card shows these as the test checklist once the PR is ready for review.>

- [ ] <criterion>
- [ ] <criterion>

## Verify

<Optional. What to RE-CHECK before this spec is trusted again — the claims most
likely to rot, written as prose or as commands (a `grep`, a file to open,
`hc roadmap list --json`). `hc roadmap audit` surfaces this section and an
AGENT runs what it says, under its own permissions; the CLI and the app never
execute it. Delete this section if the mechanical check is enough.>
