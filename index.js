import express from 'express';
import logger from './src/logger.js';
import ideaProcessor from './src/ideaProcessor.js';

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

    res.json(result);
  } catch (error) {
    logger.error(`Error processing idea: ${error.message}`);
    res.status(500).json({ error: 'Processing failed' });
  }
});

app.listen(port, () => {
  logger.success(`Server running at http://localhost:${port}`);
});