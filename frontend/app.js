/**
 * Main application logic for Santra AI Frontend
 */

// Constants
const API_BASE_URL = 'http://localhost:3000';
const STATUS_MESSAGES = {
  READY: 'Ready',
  PROCESSING: 'Processing idea...',
  LOADING: 'Loading ideas...',
  ERROR: 'Error occurred'
};

// State management
let currentIdeas = [];
let selectedIdeaId = null;

/**
 * Initialize the application
 */
function init() {
  setupEventListeners();
  loadIdeas();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Omnibar submit
  const ideaInput = document.getElementById('ideaInput');
  const submitBtn = document.getElementById('submitBtn');

  ideaInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitIdea();
    }
  });

  submitBtn.addEventListener('click', submitIdea);

  // Graph controls
  document.getElementById('zoomIn').addEventListener('click', () => {
    if (window.graph) window.graph.zoomIn();
  });

  document.getElementById('zoomOut').addEventListener('click', () => {
    if (window.graph) window.graph.zoomOut();
  });

  document.getElementById('resetView').addEventListener('click', () => {
    if (window.graph) window.graph.resetView();
  });
}

/**
 * Submit a new idea for processing
 */
async function submitIdea() {
  const ideaInput = document.getElementById('ideaInput');
  const ideaText = ideaInput.value.trim();

  if (!ideaText) {
    setStatus('Please enter an idea', 'error');
    return;
  }

  setStatus(STATUS_MESSAGES.PROCESSING);

  try {
    console.log('Submitting idea:', ideaText.substring(0, 50) + '...');
    const response = await fetch(`${API_BASE_URL}/process-idea`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: ideaText })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('API response:', result);

    // Handle both single idea and multiple ideas
    const ideas = Array.isArray(result.ideas) ? result.ideas : [result];

    // Clear input
    ideaInput.value = '';

    // Reload ideas to show the new ones
    await loadIdeas();

    setStatus(`Processed ${ideas.length} idea(s) successfully`);

  } catch (error) {
    console.error('Error submitting idea:', error);
    setStatus(`Error: ${error.message}`, 'error');
  }
}

/**
 * Load all ideas from the API
 */
async function loadIdeas() {
  setStatus(STATUS_MESSAGES.LOADING);

  try {
    console.log('Loading ideas from:', `${API_BASE_URL}/list-ideas`);
    const response = await fetch(`${API_BASE_URL}/list-ideas`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const ideas = await response.json();
    console.log('Loaded ideas:', ideas.length);
    currentIdeas = ideas;
    renderIdeaList(ideas);
    renderGraph(ideas);

    setStatus(STATUS_MESSAGES.READY);

  } catch (error) {
    console.error('Error loading ideas:', error);
    setStatus(`Error loading ideas: ${error.message}`, 'error');
  }
}

/**
 * Render the idea list in the sidebar
 * @param {Array} ideas - Array of idea objects
 */
function renderIdeaList(ideas) {
  const ideaList = document.getElementById('ideaList');
  ideaList.innerHTML = '';

  if (ideas.length === 0) {
    ideaList.innerHTML = '<div class="no-ideas">No ideas yet. Add one above!</div>';
    return;
  }

  ideas.forEach(idea => {
    const ideaElement = createIdeaElement(idea);
    ideaList.appendChild(ideaElement);
  });
}

/**
 * Create an idea element for the sidebar
 * @param {object} idea - Idea object
 * @returns {HTMLElement} Idea element
 */
function createIdeaElement(idea) {
  const ideaDiv = document.createElement('div');
  ideaDiv.className = 'idea-item';
  ideaDiv.dataset.id = idea.id;

  if (selectedIdeaId === idea.id) {
    ideaDiv.classList.add('selected');
  }

  const tagsHtml = idea.tags
    ? idea.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
    : '';

  ideaDiv.innerHTML = `
    <div class="idea-title">${escapeHtml(idea.title)}</div>
    <div class="idea-meta">
      ${new Date(idea.created).toLocaleDateString()}
    </div>
    <div class="idea-tags">${tagsHtml}</div>
  `;

  ideaDiv.addEventListener('click', () => selectIdea(idea.id));

  return ideaDiv;
}

/**
 * Select an idea in the sidebar
 * @param {string} ideaId - ID of the idea to select
 */
function selectIdea(ideaId) {
  // Remove previous selection
  document.querySelectorAll('.idea-item.selected').forEach(item => {
    item.classList.remove('selected');
  });

  // Add selection to clicked item
  const selectedItem = document.querySelector(`[data-id="${ideaId}"]`);
  if (selectedItem) {
    selectedItem.classList.add('selected');
  }

  selectedIdeaId = ideaId;

  // Load and display the idea content
  loadIdeaContent(ideaId);

  // Highlight the node in the graph
  if (window.graph) {
    window.graph.highlightNode(ideaId);
  }
}

/**
 * Load and display the full content of an idea with markdown rendering
 * @param {string} ideaId - ID of the idea to load
 */
async function loadIdeaContent(ideaId) {
  try {
    const response = await fetch(`${API_BASE_URL}/idea/${ideaId}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const markdownContent = await response.text();

    // Update the viewer
    const viewerTitle = document.getElementById('viewerTitle');
    const viewerMeta = document.getElementById('viewerMeta');
    const viewerMarkdown = document.getElementById('viewerMarkdown');

    // Find the idea to get title and metadata
    const idea = currentIdeas.find(i => i.id === ideaId);
    if (idea) {
      viewerTitle.textContent = idea.title;
      viewerMeta.textContent = `Created: ${new Date(idea.created).toLocaleDateString()} | Tags: ${idea.tags.join(', ')}`;
    }

    // Render markdown content
    viewerMarkdown.innerHTML = renderMarkdown(markdownContent);

  } catch (error) {
    console.error('Error loading idea content:', error);
    const viewerMarkdown = document.getElementById('viewerMarkdown');
    viewerMarkdown.innerHTML = `<div class="error">Error loading idea content: ${error.message}</div>`;
  }
}

/**
 * Simple markdown renderer for basic formatting
 * @param {string} markdown - Raw markdown text
 * @returns {string} HTML formatted content
 */
function renderMarkdown(markdown) {
  if (!markdown) return '';

  let html = markdown;

  // Remove frontmatter (--- content ---)
  html = html.replace(/^---\n[\s\S]*?\n---\n/, '');

  // Convert markdown to HTML
  html = html
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')

    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')

    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')

    // Links (but not Obsidian-style [[links]])
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')

    // Line breaks
    .replace(/\n/g, '<br>');

  return html;
}

/**
 * Set status message
 * @param {string} message - Status message
 * @param {string} type - Message type ('normal' or 'error')
 */
function setStatus(message, type = 'normal') {
  const statusBar = document.getElementById('statusBar');
  statusBar.textContent = message;
  statusBar.className = `status-bar ${type}`;
}

/**
 * Escape HTML characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
