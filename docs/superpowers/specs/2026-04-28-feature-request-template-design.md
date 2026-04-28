# Feature Request Template Design

## Overview

A JSON schema for capturing feature ideas in `docs/ideas/`. Replaces the existing freeform markdown files. Each file represents one feature and is the entry point for handing work to an agent.

## Schema

**Required fields:**

- `title` — short feature name
- `main_idea` — one or two sentences describing what this is
- `reason` — the motivation or problem it solves

**Optional fields:**

- `requirements` — string array of what the feature must do
- `out_of_scope` — string array of what is explicitly not being built in this pass
- `ui_notes` — string array of visual/UX considerations
- `references` — string array of related files, docs, or external links
- `open_questions` — string array of unresolved decisions

## Template File

```json
{
  "title": "Short feature name",
  "main_idea": "One or two sentences describing what this is.",
  "reason": "Why we're building this — the motivation or problem it solves.",

  "requirements": [
    "Must do X",
    "Must support Y"
  ],

  "out_of_scope": [
    "Not building Z in this pass"
  ],

  "ui_notes": [
    "Visual or UX detail"
  ],

  "references": [
    "docs/ideas/related_feature.json",
    "https://example.com"
  ],

  "open_questions": [
    "Unresolved decision?"
  ]
}
```

## Usage

1. Create a new file in `docs/ideas/<feature-name>.json`
2. Fill in `title`, `main_idea`, and `reason` at minimum
3. Add optional fields as relevant — omit any that don't apply
4. Hand the file to an agent to begin the brainstorm/design/implementation flow

## File Location

All feature request files live in `docs/ideas/`. One file per feature.
