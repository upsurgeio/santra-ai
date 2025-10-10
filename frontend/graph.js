/**
 * Minimal D3.js graph visualization for idea connections
 */

// Graph constants
const GRAPH_CONFIG = {
  width: 800,
  height: 600,
  nodeRadius: 30,
  gridSpacing: 120,
  linkDistance: 100,
  chargeStrength: -800
};

// Graph state
let nodes = [];
let links = [];
let svg = null;
let simulation = null;

/**
 * Initialize the graph visualization
 * @param {SVGElement} svgElement - SVG element to render into
 */
function initGraph(svgElement) {
  svg = d3.select(svgElement);

  // Set SVG dimensions
  svg.attr('width', GRAPH_CONFIG.width).attr('height', GRAPH_CONFIG.height);

  return {
    render: renderGraph,
    highlightNode: highlightNode,
    clearGraph: clearGraph
  };
}

/**
 * Render the graph with new data
 * @param {Array} ideas - Array of idea objects
 */
function renderGraph(ideas) {
  console.log('Rendering minimal graph with ideas:', ideas?.length || 0);

  if (!ideas || ideas.length === 0) {
    clearGraph();
    return;
  }

  if (!svg) {
    console.error('SVG not initialized!');
    return;
  }

  nodes = ideas.map(idea => ({
    id: idea.id,
    title: idea.title,
    connections: idea.connections || []
  }));

  // Position nodes in a square grid
  const gridSize = Math.ceil(Math.sqrt(nodes.length));
  nodes.forEach((node, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    node.x = (col + 1) * GRAPH_CONFIG.gridSpacing;
    node.y = (row + 1) * GRAPH_CONFIG.gridSpacing;
  });

  // Create links only for actual connections
  links = [];
  ideas.forEach(idea => {
    if (idea.connections && idea.connections.length > 0) {
      idea.connections.forEach(connectionTitle => {
        // Try to find the target node using multiple matching strategies

        // Strategy 1: Exact title match
        let targetNode = nodes.find(node => node.title === connectionTitle);

        // Strategy 2: Partial match (if exact match fails)
        if (!targetNode) {
          targetNode = nodes.find(node =>
            node.title.toLowerCase().includes(connectionTitle.toLowerCase()) ||
            connectionTitle.toLowerCase().includes(node.title.toLowerCase())
          );
        }

        // Strategy 3: Find by similar keywords/themes
        if (!targetNode) {
          const connectionWords = connectionTitle.toLowerCase().split(' ');
          targetNode = nodes.find(node => {
            const nodeWords = node.title.toLowerCase().split(' ');
            // Look for at least 2 matching significant words
            const matchingWords = connectionWords.filter(word =>
              word.length > 3 && nodeWords.some(nodeWord =>
                nodeWord.includes(word) || word.includes(nodeWord)
              )
            );
            return matchingWords.length >= 2;
          });
        }

        if (targetNode && targetNode.id !== idea.id) {
          links.push({
            source: nodes.find(n => n.id === idea.id), // Use actual node object
            target: targetNode // Use actual node object
          });
        }
      });
    }
  });

  // Remove duplicate links
  const uniqueLinks = links.filter((link, index, self) =>
    index === self.findIndex(l => (l.source.id === link.source.id && l.target.id === link.target.id) ||
                                 (l.source.id === link.target.id && l.target.id === link.source.id))
  );

  links = uniqueLinks;

  // Clear existing graph
  svg.selectAll('*').remove();

  // Create links
  svg.selectAll('.link')
    .data(links)
    .enter().append('line')
    .attr('class', 'link')
    .attr('x1', d => d.source.x)
    .attr('y1', d => d.source.y)
    .attr('x2', d => d.target.x)
    .attr('y2', d => d.target.y)
    .attr('stroke', '#007bff')
    .attr('stroke-width', 2);

  // Create nodes
  const node = svg.selectAll('.node')
    .data(nodes)
    .enter().append('g')
    .attr('class', 'node')
    .attr('data-id', d => d.id)
    .attr('transform', d => `translate(${d.x},${d.y})`);

  // Add circles to nodes
  node.append('circle')
    .attr('r', GRAPH_CONFIG.nodeRadius)
    .attr('fill', 'white')
    .attr('stroke', '#333')
    .attr('stroke-width', 2);

  // Add labels to nodes
  node.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .style('font-size', '12px')
    .style('fill', '#333')
    .text(d => truncateText(d.title, 15));

  // Start force simulation
  startSimulation();

  // Update network info display
  updateNetworkInfo(nodes.length, links.length);
}

/**
 * Update the network information display
 * @param {number} nodeCount - Number of nodes in the graph
 * @param {number} linkCount - Number of links in the graph
 */
function updateNetworkInfo(nodeCount, linkCount) {
  const nodeCountElement = document.getElementById('nodeCount');
  const linkCountElement = document.getElementById('linkCount');

  if (nodeCountElement) {
    nodeCountElement.textContent = `${nodeCount} node${nodeCount !== 1 ? 's' : ''}`;
  }

  if (linkCountElement) {
    linkCountElement.textContent = `${linkCount} connection${linkCount !== 1 ? 's' : ''}`;
  }
}

/**
 * Clear the graph
 */
function clearGraph() {
  if (svg) {
    svg.selectAll('*').remove();
  }
  nodes = [];
  links = [];
  updateNetworkInfo(0, 0);
}

/**
 * Start the force simulation
 */
function startSimulation() {
  simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).distance(GRAPH_CONFIG.linkDistance))
    .force('charge', d3.forceManyBody().strength(GRAPH_CONFIG.chargeStrength))
    .force('center', d3.forceCenter(GRAPH_CONFIG.width / 2, GRAPH_CONFIG.height / 2))
    .force('collision', d3.forceCollide().radius(GRAPH_CONFIG.nodeRadius + 10));

  // Update positions on simulation tick
  simulation.on('tick', () => {
    // Update link positions
    svg.selectAll('.link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    // Update node positions
    svg.selectAll('.node')
      .attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Add drag behavior to nodes
  svg.selectAll('.node')
    .call(d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        d3.select(event.sourceEvent.target.closest('.node')).classed('dragging', true);
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        d3.select(event.sourceEvent.target.closest('.node')).classed('dragging', false);
      })
    );
}

/**
 * Highlight a specific node
 * @param {string} nodeId - ID of the node to highlight
 */
function highlightNode(nodeId) {
  if (!svg) return;

  // Reset all highlights
  svg.selectAll('.node').classed('highlighted', false);

  // Highlight the selected node
  svg.select(`[data-id="${nodeId}"]`).classed('highlighted', true);
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Initialize graph when script loads
document.addEventListener('DOMContentLoaded', () => {
  const svgElement = document.getElementById('graphSvg');
  if (svgElement) {
    console.log('Initializing minimal graph...');
    window.graph = initGraph(svgElement);
    console.log('Minimal graph initialized');
  } else {
    console.error('SVG element not found!');
  }
});
