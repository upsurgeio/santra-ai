import express from 'express';
import { createLogger } from './src/logger.js';
import ideaProcessor from './src/ideaProcessor.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
dotenv.config();

const logger = createLogger('Server');
const app = express();
const port = process.env.PORT;

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Santra AI Server');
});

// Process idea endpoint
app.post('/process-idea', async (req, res) => {
  try {
    const { idea } = req.body;
    if (!idea) {
      logger.warn('No idea provided in request');
      return res.status(400).json({ error: 'Idea text required' });
    }

    logger.info(`Processing idea: ${idea.substring(0, 50)}...`);
    const result = await ideaProcessor.processIdea(idea);
    logger.success('Idea processed successfully');

    // Save to file
    const id = randomUUID();
    const dir = 'data/ideas/';
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${dir}${id}.md`;
    const frontmatter = `---
id: "${id}"
title: "${result.title}"
tags: ${JSON.stringify(result.tags)}
connections: ${JSON.stringify(result.connections)}
created: "${new Date().toISOString()}"
modified: "${new Date().toISOString()}"
source: "CLI"
---
`;
    const content = frontmatter + result.refined;
    fs.writeFileSync(filename, content);
    result.id = id;
    logger.success(`Idea saved as ${filename}`);

    res.json(result);
  } catch (error) {
    logger.error(`Error processing idea: ${error.message}`);
    res.status(500).json({ error: 'Processing failed' });
  }
});

// List ideas endpoint
app.get('/list-ideas', (req, res) => {
  try {
    const dir = 'data/ideas/';
    if (!fs.existsSync(dir)) return res.json([]);

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    const ideas = files.map(f => {
      try {
        const content = fs.readFileSync(path.join(dir, f), 'utf8');
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) return null;

        const fm = frontmatterMatch[1];
        const lines = fm.split('\n').filter(line => line.trim());
        const obj = {};
        lines.forEach(line => {
          const colonIndex = line.indexOf(': ');
          if (colonIndex === -1) return;
          const key = line.slice(0, colonIndex);
          let value = line.slice(colonIndex + 2);
          if (value.startsWith('[') && value.endsWith(']')) {
            value = JSON.parse(value);
          } else if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          obj[key] = value;
        });
        return { id: obj.id, title: obj.title, tags: obj.tags, created: obj.created };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);

    res.json(ideas);
  } catch (error) {
    logger.error(`Error listing ideas: ${error.message}`);
    res.status(500).json({ error: 'Failed to list ideas' });
  }
});

// Get idea by id
app.get('/idea/:id', (req, res) => {
  try {
    const id = req.params.id;
    const file = `data/ideas/${id}.md`;
    if (!fs.existsSync(file)) return res.status(404).json({ error: 'Idea not found' });

    const content = fs.readFileSync(file, 'utf8');
    res.type('text/markdown').send(content);
  } catch (error) {
    logger.error(`Error getting idea: ${error.message}`);
    res.status(500).json({ error: 'Failed to get idea' });
  }
});

app.listen(port, () => {
  logger.success(`Server running at http://localhost:${port}`);
});