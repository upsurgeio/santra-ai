/**
 * Idea processor module
 */
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

class IdeaProcessor {
  /**
   * Load all previously saved ideas from the data directory
   * @returns {Array} Array of idea objects with metadata
   */
  loadAllIdeas() {
    const dir = 'data/ideas/';
    if (!fs.existsSync(dir)) {
      return [];
    }

    return fs.readdirSync(dir)
      .filter(file => file.endsWith('.md'))
      .map(file => {
        try {
          const filePath = path.join(dir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          return this.parseIdeaFile(content, file);
        } catch (error) {
          // Skip invalid files, don't throw
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * Parse markdown file content into idea object
   * @param {string} content - Raw markdown content
   * @param {string} filename - Original filename
   * @returns {object|null} Parsed idea object or null if invalid
   */
  parseIdeaFile(content, filename) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      return null;
    }

    const [, frontmatter, markdownContent] = frontmatterMatch;
    const metadata = this.parseFrontmatter(frontmatter);
    if (!metadata.id) {
      return null;
    }

    return {
      id: metadata.id,
      title: metadata.title,
      tags: metadata.tags || [],
      connections: metadata.connections || [],
      created: metadata.created,
      content: markdownContent.trim()
    };
  }

  /**
   * Parse frontmatter into object
   * @param {string} frontmatter - Raw frontmatter text
   * @returns {object} Parsed metadata object
   */
  parseFrontmatter(frontmatter) {
    const lines = frontmatter.split('\n').filter(line => line.trim());
    const obj = {};

    lines.forEach(line => {
      const colonIndex = line.indexOf(': ');
      if (colonIndex === -1) return;

      const key = line.slice(0, colonIndex);
      let value = line.slice(colonIndex + 2);

      // Handle different value types
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          obj[key] = JSON.parse(value);
        } catch {
          obj[key] = [];
        }
      } else if (value.startsWith('"') && value.endsWith('"')) {
        obj[key] = value.slice(1, -1);
      } else {
        obj[key] = value;
      }
    });

    return obj;
  }

  /**
   * Save processed idea as markdown file with frontmatter
   * @param {object} processedIdea - Processed idea object
   * @returns {string} Generated filename
   */
  saveProcessedIdea(processedIdea) {
    if (!processedIdea || typeof processedIdea !== 'object') {
      throw new Error('Invalid processed idea: must be object');
    }

    if (!processedIdea.id || !processedIdea.title || !processedIdea.refined) {
      throw new Error('Invalid processed idea: missing required fields (id, title, refined)');
    }

    const id = processedIdea.id;
    const dir = 'data/ideas/';
    fs.mkdirSync(dir, { recursive: true });

    const filename = `${dir}${id}.md`;
    const frontmatter = `---
id: "${id}"
title: "${processedIdea.title}"
tags: ${JSON.stringify(processedIdea.tags || [])}
connections: ${JSON.stringify(processedIdea.connections || [])}
created: "${processedIdea.created || new Date().toISOString()}"
modified: "${new Date().toISOString()}"
source: "CLI"
---
`;

    // Convert connections to Obsidian-style links in content
    let content = processedIdea.refined;
    if (processedIdea.connections && processedIdea.connections.length > 0) {
      const linkedContent = this.addObsidianLinks(content, processedIdea.connections);
      content = linkedContent;
    }

    const fullContent = frontmatter + content;
    fs.writeFileSync(filename, fullContent);

    return filename;
  }

  /**
   * Add Obsidian-style links to content for connected ideas
   * @param {string} content - Original content
   * @param {Array} connections - Array of connection names/titles
   * @returns {string} Content with Obsidian links
   */
  addObsidianLinks(content, connections) {
    if (!connections || connections.length === 0) {
      return content;
    }

    // Add a section at the end with links if not already present
    const linkSection = '\n\n## Related Ideas\n' +
      connections.map(conn => `- [[${conn}]]`).join('\n');

    return content + linkSection;
  }

  /**
   * Process a new idea with optional context from previous ideas
   * @param {string} ideaText - The raw idea text
   * @param {Array} contextIdeas - Array of previous ideas for context
   * @returns {object|Array} Processed idea object or array of ideas
   */
  async processIdea(ideaText, contextIdeas = []) {
    if (typeof ideaText !== 'string' || ideaText.trim() === '') {
      throw new Error('Invalid idea text: must be non-empty string');
    }

    const apiKey = process.env.ANANNAS_API_KEY;
    if (!apiKey) {
      throw new Error('ANANNAS_API_KEY not set');
    }

    // Format context for the prompt
    const contextPrompt = this.formatContextForPrompt(contextIdeas);

    const prompt = `Refine and structure this idea. Output as JSON.

Context from previous ideas:
${contextPrompt}

Idea: ${ideaText}

Return a JSON object or array of objects with this structure:
{"title": "short title", "refined": "refined text", "tags": ["tag1", "tag2"], "connections": ["related idea 1", "related idea 2"]}

If this idea naturally branches into multiple related ideas, return an array of such objects.`;

    try {
      const response = await fetch('https://api.anannas.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);

      // Handle both single idea and multiple ideas
      const ideas = Array.isArray(parsed) ? parsed : [parsed];

      // Add IDs and timestamps to all ideas
      return ideas.map(idea => ({
        ...idea,
        id: randomUUID(),
        created: new Date().toISOString(),
        original: ideaText
      }));
    } catch (error) {
      throw new Error(`Processing failed: ${error.message}`);
    }
  }

  /**
   * Format context ideas for inclusion in AI prompt
   * @param {Array} contextIdeas - Array of context idea objects
   * @returns {string} Formatted context string
   */
  formatContextForPrompt(contextIdeas) {
    if (!contextIdeas || contextIdeas.length === 0) {
      return 'No previous context available.';
    }

    return contextIdeas.map(idea =>
      `Title: ${idea.title}
Content: ${idea.content?.slice(0, 200) || 'No content'}...
Tags: ${idea.tags?.join(', ') || 'None'}
---`
    ).join('\n\n');
  }
}

export default new IdeaProcessor();
