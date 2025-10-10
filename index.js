import express from 'express';
import { createLogger } from './src/logger.js';
import ideaProcessor from './src/ideaProcessor.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
dotenv.config();

const logger = createLogger('Server');
const app = express();
const port = process.env.PORT;

// Middleware
app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));
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

    // Load all previous ideas for context
    const contextIdeas = ideaProcessor.loadAllIdeas();

    // Process the idea with context
    const processedIdeas = await ideaProcessor.processIdea(idea, contextIdeas);

    logger.success('Idea processed successfully');

    // Handle both single idea and multiple ideas
    const ideas = Array.isArray(processedIdeas) ? processedIdeas : [processedIdeas];
    const savedIdeas = [];

    // Save each processed idea
    for (const processedIdea of ideas) {
      try {
        const filename = ideaProcessor.saveProcessedIdea(processedIdea);
        savedIdeas.push({
          id: processedIdea.id,
          title: processedIdea.title,
          filename: filename
        });
        logger.success(`Idea saved as ${filename}`);
      } catch (saveError) {
        logger.error(`Failed to save idea ${processedIdea.id}: ${saveError.message}`);
        // Continue with other ideas even if one fails to save
      }
    }

    // Return appropriate response
    if (savedIdeas.length === 0) {
      throw new Error('No ideas were successfully saved');
    }

    const response = savedIdeas.length === 1
      ? { ...processedIdeas, id: savedIdeas[0].id }  // Single idea response
      : { ideas: savedIdeas, count: savedIdeas.length }; // Multiple ideas response

    res.json(response);
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
        return { id: obj.id, title: obj.title, tags: obj.tags, connections: obj.connections, created: obj.created };
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