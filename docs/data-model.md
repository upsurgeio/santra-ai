# Data Flow & Model for Santra AI

## Data Flow for Idea Restructuring

Based on the simulated process, here's the end-to-end data flow for processing a new ideas dump (assuming no existing knowledge base for simplicity):

1. **User Input**: User submits raw text dump via UI/CLI (e.g., POST to `/process-idea` with JSON `{"idea": "raw text"}`).

2. **Backend Reception**: Server validates input (check for non-empty string, length limits).

3. **LLM Processing**:
   - Prepare context: If existing ideas, include summaries (e.g., recent titles/tags); else, none.
   - Send prompt to LLM: "Restructure this ideas dump into connected Markdown docs. Output as JSON with docs array, each having title, content, tags, connections."
   - LLM generates structured response (e.g., split into multiple docs, add tags, suggest connections).

4. **Parsing & Validation**: Parse LLM output (JSON). Validate structure, handle errors (e.g., if LLM fails, return error).

5. **Storage**:
   - Generate unique IDs for new docs.
   - Save each doc as a Markdown file with frontmatter (YAML metadata).
   - Update any global index if needed.

6. **Response**: Return success with doc IDs, titles, or links for user confirmation/editing.

7. **Graph Building**: On-demand, scan all files for `[[links]]` to build connection graph.

This keeps it minimal: No complex DB queries, just file ops and LLM calls.

## Data Model

Drawing from the brainstorming and Obsidian's approach:

### Core Structure (Inspired by Obsidian)
Obsidian stores data as plain Markdown files in a local folder (vault). No database—everything is file-based. The "graph" is computed dynamically by scanning links in files. This is perfect for minimalism: Portable, no DB setup, easy to version control.

- **Storage Format**: Each idea as a `.md` file (e.g., `data/ideas/idea-uuid.md`).
- **File Content**:
  - **Frontmatter (YAML)**: Metadata at top, separated by `---`.
  - **Body**: Markdown content with `[[links]]` for connections.

### Proposed Data Model per Idea Doc
```yaml
---
id: "unique-uuid"
title: "AI Productivity Tool Concept"
tags: ["productivity", "AI", "task-management"]
connections:
  - id: "related-idea-id"
    type: "related"
  - id: "parent-idea-id"
    type: "parent"
created: "2025-10-01T20:00:00Z"
modified: "2025-10-01T20:00:00Z"
source: "UI"  # or "CLI"
---

# AI Productivity Tool Concept

An AI-native productivity app that acts as a "second brain"...

- Core Features: ...
```

- **Fields**:
  - `id`: UUID for uniqueness.
  - `title`: Auto-generated or refined.
  - `tags`: Semantic tags array.
  - `connections`: Array of objects `{id, type}` (types: "related", "parent", "child", etc.).
  - `created/modified`: Timestamps.
  - `source`: How it was added.
- **Body**: Refined Markdown content.
- **Links**: Use `[[Other Idea Title]]` in body for explicit connections (Obsidian-style).

### Graph Storage
- **No Dedicated Graph DB**: Like Obsidian, build the graph on-the-fly.
  - Scan all `.md` files for `[[links]]` and frontmatter connections.
  - Create an in-memory adjacency list or JSON index (e.g., `data/graph.json` with nodes/edges).
  - For visualization: Use a library like D3.js or vis.js to render from the index.
- **Why This Works**: Minimal deps, portable (just files), scales with file system. Obsidian handles vaults with thousands of notes this way.

### Implementation Notes
- **File Ops**: Use Node's `fs` for reading/writing. Create `data/ideas/` folder.
- **Indexing**: On app start or after saves, rebuild graph index.
- **Search**: Simple grep on files, or build a basic inverted index for tags/titles.
- **Future**: Migrate to MongoDB if needed, but start file-based.

This mirrors Obsidian's simplicity—focus on Markdown as the source of truth, with metadata for structure.
