/**
 * Demo idea processor module
 * Simulates idea refinement and structuring
 */
class IdeaProcessor {
  /**
   * Process a new idea
   * @param {string} ideaText - The raw idea text
   * @returns {object} - Processed idea object
   */
  async processIdea(ideaText) {
    if (typeof ideaText !== 'string' || ideaText.trim() === '') {
      throw new Error('Invalid idea text: must be non-empty string');
    }

    const apiKey = process.env.ANANNAS_API_KEY;
    if (!apiKey) {
      throw new Error('ANANNAS_API_KEY not set');
    }

    const prompt = `Refine and structure this idea. Output as JSON: {"title": "short title", "refined": "refined text", "tags": ["tag1", "tag2"], "connections": ["related idea 1"]}

Idea: ${ideaText}`;

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

    return {
      original: ideaText,
      title: parsed.title || parsed.refined.slice(0, 50) + (parsed.refined.length > 50 ? '...' : ''),
      refined: parsed.refined,
      tags: parsed.tags,
      connections: parsed.connections
    };
  }
}

export default new IdeaProcessor();
