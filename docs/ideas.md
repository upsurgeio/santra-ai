# Santra AI - Project ideas

## Overview

Santra AI is an AI-native note-taking app where ideas are automatically structured and connected.

### Key Features
- **Idea Structuring**: Automatically refine and organize dumped ideas using AI.
- **Idea Connections**: Link related ideas, similar to an Obsidian graph view.
- **Plain Text Storage**: All ideas stored in Markdown format for portability.

## Phase 1: Core Functionality

### Input Methods
- **Text Input**: Primary input for dumping ideas.
- **Audio Input**: Future feature; audio will be transcribed to text for processing.

### Processing Workflow
1. User inputs an idea (text).
2. AI refines and structures the idea.
3. Connects the new idea to existing ones in the knowledge base.
4. Stores everything in Markdown format.

### Technical Requirements

#### Backend
- **Process Idea Endpoint**: API endpoint to handle new idea submissions.
- **Idea Processing Function**: Backend logic that uses LLM to analyze, refine, and connect ideas.
- **Knowledge Base**: Storage system for structured ideas (initially file-based, potentially database later).

#### Frontend & Tools
- **Simple UI**: Web interface for dumping ideas.
- **CLI Tool**: Command-line interface for quick idea entry and LLM-assisted iteration/testing.

### Data Flow
1. User submits idea via UI or CLI.
2. Backend receives idea.
3. LLM processes the idea: refines content, identifies connections, updates knowledge base.
4. Response sent back (e.g., confirmation, links to related ideas).

The core processing function will require careful design to ensure accurate structuring and meaningful connections. This will involve prompt engineering and possibly fine-tuning the LLM for note-taking tasks.
