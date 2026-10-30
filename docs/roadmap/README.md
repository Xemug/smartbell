# Roadmap

This folder holds the **specs** for this project's roadmap items. HyperCoder
scaffolded it; edit it freely.

## The board is authoritative, this folder is the reasoning

The roadmap **board** — the Roadmap pane in HyperCoder, and `hc roadmap` from
any agent pane — is the source of truth for *what exists and what order it is
in*. It is backend-side: no folder is required for it to work. Any other
roadmap-ish document in this repo (a `ROADMAP.md`, a `plans/` folder, an old
`*-roadmap.md`) is **not** authoritative — migrate it onto the board rather
than editing it in parallel.

Each file here is the *body* of one item: `docs/roadmap/<slug>.md`, where
`<slug>` matches the item's slug on the board. The board owns the workflow
state — lane, order, tier, effort, the branch link, the shipped stamp — so
editing `lane:` in a spec moves nothing once the item is on the board. Use
`hc roadmap move` / `reorder`.

## Spec shape

Every spec has the same six H2 sections, in this order:

- **Problem**
- **Why**
- **What it touches**
- **Approach**
- **Effort**
- **Acceptance**

One more is optional: **Verify** — what to re-check before the spec is trusted
again. `hc roadmap audit` reports the mechanical evidence (are the files this
spec names still there? did it already ship?) and surfaces that section for an
agent to work through.

Copy [`_template.md`](./_template.md) to `<slug>.md` and fill it in, or let an
agent do it (`hc roadmap spec <slug>` writes the templated file for a card
that has none). Frontmatter stays minimal: `id`, `title`, and a one-or-two
sentence `summary` that becomes the card's blurb on the board.

## Working an item

```bash
hc roadmap list                    # the board as displayed
hc roadmap add "<title>"           # capture an idea
hc roadmap spec <slug>             # write the templated spec file for a card
hc roadmap start <slug>            # open a workspace and launch an agent on the spec
```

`hc roadmap start` cuts a git worktree, carries `docs/roadmap/<slug>.md` into
it, and launches an agent on that file — which is why the spec's *Approach* and
*Acceptance* sections matter: they are the brief. An item with no spec file
still starts; the agent just has the title to go on.
