let triples = [];
let prefixMap = {}

document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];

    if (file && file.name.endsWith('.ttl')) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const turtleData = e.target.result;

            const parser = new N3.Parser();
            triples = parser.parse(turtleData);

            const nodes = [];
            const links = [];
            const nodeSet = new Set();
            let linkSet = new Set();

            prefixMap = extractPrefixes(turtleData);

            // Create nodes and links from triples
            triples.forEach(triple => {
                const source = triple.subject.value;
                const target = triple.object.value;
                const predicate = triple.predicate.value;

                if (!nodeSet.has(source)) {
                    nodes.push({id: source});
                    nodeSet.add(source);
                }
                if (!nodeSet.has(target)) {
                    nodes.push({id: target});
                    nodeSet.add(target);
                }

                const linkIdentifier = `${source}|${target}|${predicate}`;

                if (!linkSet.has(linkIdentifier)) {
                    links.push({ source, target, predicate });
                    linkSet.add(linkIdentifier); // Mark this link as added
                }
            });

            //for debugging
            console.log('Triples:', triples);

            const width = window.innerWidth;
            const height = window.innerHeight;

            const svg = d3.select("body").append("svg")
                .attr("width", width)
                .attr("height", height)
                .call(d3.zoom().scaleExtent([0.1, 3]).on("zoom", zoomed))
                .append('g');

            function zoomed(event) {
                svg.attr("transform", event.transform);
            }

            const zoom = d3.zoom()
                .scaleExtent([0.1, 3])
                .on("zoom", (event) => {
                    svg.attr("transform", event.transform);
                });

            const svgContainer = d3.select("svg");
            svgContainer.call(zoom);

            document.getElementById("zoom-in").addEventListener("click", () => {
                svgContainer.transition().duration(500).call(zoom.scaleBy, 1.4);
            });

            document.getElementById("zoom-out").addEventListener("click", () => {
                svgContainer.transition().duration(500).call(zoom.scaleBy, 0.6);
            });

            // Create groups for links and nodes
            const linkGroup = svg.append('g').attr('class', 'links');
            const nodeGroup = svg.append('g').attr('class', 'nodes');
            const labelGroup = svg.append('g').attr('class', 'labels');

            const simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.id).distance(240)) // Increase distance
                .force("charge", d3.forceManyBody().strength(-150)) // Adjust repulsion
                .force("collision", d3.forceCollide(20)) // Prevent overlap
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collision", d3.forceCollide().radius(20)) // Set radius to avoid overlaps;
                .on("tick", ticked);

            // Draw links
            let link = linkGroup.selectAll('.link')
                .data(links)
                .enter()
                .append('path')
                .attr('class', 'link');

            // Draw nodes
            let node = nodeGroup.selectAll('.node')
                .data(nodes)
                .enter()
                .append('g')
                .attr('class', 'node')
                .call(d3.drag()
                    .on('start', dragStarted)
                    .on('drag', dragged)
                    .on('end', dragEnded));

            node.append('circle')
                .attr('r', 25);

            // node.append('text')
            //     .attr('dy', 4)
            //     .attr('text-anchor', 'middle')
            //     .text(d => qname(d.id, prefixMap));

            node.append('text')
                .attr('class', 'node-label-outline')
                .attr('text-anchor', 'middle')
                .attr('dy', 4)
                .text(d => qname(d.id, prefixMap));

            // Create groups for edge labels with background
            let edgeLabels = labelGroup.selectAll('.edge-label')
                .data(links)
                .enter()
                .append('g')
                .attr('class', 'edge-label-group'); // Create a group for rect and text

            // Add the label text
            edgeLabels.append('text')
                .attr('class', 'edge-label-outline')
                .attr('text-anchor', 'middle')
                .attr('dy', d => (d.source.id === d.target.id ? -64 : 4)) // Adjust 'dy' for self-loops
                .text(d => qname(d.predicate, prefixMap));

            // Update positions on tick
            function ticked() {
                link.attr('d', (d, i) => computePath(d, i));
                node.attr('transform', d => `translate(${d.x},${d.y})`);

                // Update the position of the label group (rect + text)
                edgeLabels
                    .attr('transform', d => {
                        const midPoint = getMidPoint(d);
                        const angle = getLabelRotation(d);
                        return `translate(${midPoint.x},${midPoint.y}) rotate(${angle})`;
                    })
                    .selectAll('rect')
                    .attr('x', -30)  // Center the rectangle
                    .attr('y', d => getOffset(d) - 10); // Apply vertical offset for positioning

                // Update label text position to be centered within the rectangle
                edgeLabels
                    .selectAll('text')
                    .attr('x', 0)  // Ensure text is centered
                    .attr('y', d => getOffset(d)); // Apply vertical offset for positioning
            }

            // Helper to calculate the midpoint of a link
            function getMidPoint(d) {
                return {
                    x: (d.source.x + d.target.x) / 2,
                    y: (d.source.y + d.target.y) / 2,
                };
            }

            // Helper to calculate vertical offset for labels based on the number of edges
            function getOffset(d) {
                const linksBetweenNodes = links.filter(link =>
                    (link.source.id === d.source.id && link.target.id === d.target.id) ||
                    (link.source.id === d.target.id && link.target.id === d.source.id)
                );
                const edgeIndex = linksBetweenNodes.findIndex(link => link === d);
                const totalEdges = linksBetweenNodes.length;

                // Adjust the gap between labels
                const gap = 29; // Vertical gap between multiple labels

                // Make sure the offset is calculated based on the position of the edge
                return (edgeIndex - (totalEdges - 1) / 2) * gap;
            }

            // Helper to calculate label rotation angle
            function getLabelRotation(d) {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                let angle = Math.atan2(dy, dx) * (180 / Math.PI);

                if (angle > 90) angle -= 180;
                if (angle < -90) angle += 180;

                return angle;
            }

            function computePath(d, i) {
                const sourceNode = d.source;
                const targetNode = d.target;

                // Handle self-loops (reflexive relationships)
                if (sourceNode.id === targetNode.id) {
                    const x = sourceNode.x;
                    const y = sourceNode.y;

                    const loopRadius = 80; // Define a radius for the self-loop
                    return `M${x},${y} C${x + loopRadius},${y - loopRadius} ${x - loopRadius},${y - loopRadius} ${x},${y}`;
                }

                const x1 = sourceNode.x;
                const y1 = sourceNode.y;
                const x2 = targetNode.x;
                const y2 = targetNode.y;

                const dx = x2 - x1;
                const dy = y2 - y1;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const totalEdges = links.filter(link =>
                    (link.source.id === d.source.id && link.target.id === d.target.id) ||
                    (link.source.id === d.target.id && link.target.id === d.source.id)
                ).length;

                const edgeIndex = links.slice(0, i).filter(link =>
                    (link.source.id === d.source.id && link.target.id === d.target.id) ||
                    (link.source.id === d.target.id && link.target.id === d.source.id)
                ).length;


                const offset = (edgeIndex - (totalEdges - 1) / 2) * 60;

                const cx = x1 + dx / 2 - dy * (offset / distance);
                const cy = y1 + dy / 2 + dx * (offset / distance);

                return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
            }

            let curStep = 0;
            let tripleSource;
            let tripleTarget;
            let triplePred;
            let rule;
            let condition;

            function updateStep() {
                tripleSource = inferredTriples[curStep].inferred.subject.id;
                triplePred = inferredTriples[curStep].inferred.predicate.id;
                tripleTarget = inferredTriples[curStep].inferred.object.id;
                rule = inferredTriples[curStep].rule;
                condition = inferredTriples[curStep].condition;
            }

            function addEdge(sourceId, targetId, predId) {
                // Check if the source and target nodes exist
                let sourceNode = nodes.find(node => node.id === sourceId);
                let targetNode = nodes.find(node => node.id === targetId);

                if (!sourceNode) {
                    sourceNode = {id: sourceId}; // Default new node properties
                    nodes.push(sourceNode);
                }

                if (!targetNode) {
                    targetNode = {id: targetId}; // Default new node properties
                    nodes.push(targetNode);
                }

                // Add a new edge between source and target with a label
                links.push({
                    source: sourceNode.id,
                    target: targetNode.id,
                    predicate: predId
                });

                // Restart the simulation and re-render
                updateGraph();
                console.log("Added edge:");
                console.log(`${sourceId} - ${predId} - ${targetId} by ${rule}`);
            }

            let num = 0;

            // Add the Add Edge button functionality
            document.getElementById("next-step").addEventListener("click", () => {
                if (curStep === inferredTriples.length) {
                    console.log("Graph is fully entailed");
                    return;
                }

                updateStep();
                curStep++;
                const newEdge = {sourceId: tripleSource, targetId: tripleTarget, predicate: triplePred};

                addEdge(newEdge.sourceId, newEdge.targetId, newEdge.predicate);
            });

            function removeEdge(sourceId, targetId, predId) {
                // Find the specific edge to remove based on source, target, and label
                const edgeIndex = links.findIndex(link =>
                    link.source.id === sourceId && // Compare the id of the source
                    link.target.id === targetId && // Compare the id of the target
                    link.predicate === predId       // Match the predicate
                );

                if (edgeIndex !== -1) {
                    // Remove the edge from the graph
                    links.splice(edgeIndex, 1);

                    // Check if the source node still has edges connected
                    const sourceConnected = links.some(link =>
                        link.source.id === sourceId || link.target.id === sourceId
                    );

                    // Check if the target node still has edges connected
                    const targetConnected = links.some(link =>
                        link.source.id === targetId || link.target.id === targetId
                    );

                    // Remove source node if it is no longer connected
                    if (!sourceConnected) {
                        const sourceNodeIndex = nodes.findIndex(node => node.id === sourceId);
                        if (sourceNodeIndex !== -1) {
                            nodes.splice(sourceNodeIndex, 1);
                        }
                    }

                    // Remove target node if it is no longer connected
                    if (!targetConnected) {
                        const targetNodeIndex = nodes.findIndex(node => node.id === targetId);
                        if (targetNodeIndex !== -1) {
                            nodes.splice(targetNodeIndex, 1);
                        }
                    }

                    // Restart the simulation and re-render
                    updateGraph();
                    console.log(`Removed edge: ${sourceId} - ${predId} - ${targetId}`);
                } else {
                    console.log(`Edge from ${sourceId} to ${targetId} with label "${predId}" not found.`);
                }
            }


            document.getElementById("prev-step").addEventListener("click", () => {
                if (curStep === 0) {
                    console.log("This is the initial graph")
                    return;
                }

                curStep--;
                updateStep();
                const edgeToRemove = {sourceId: tripleSource, targetId: tripleTarget, predicate: triplePred};

                removeEdge(edgeToRemove.sourceId, edgeToRemove.targetId, edgeToRemove.predicate);
            });

// Function to update the graph
            function updateGraph() {
                // Update the links
                link = linkGroup.selectAll('.link')
                    .data(links, d => `${d.source}-${d.target}-${d.predicate}`);

                const newLink = link.enter()
                    .append('path')
                    .attr('class', 'link');

                link.exit().remove();
                link = newLink.merge(link);

                // Update the edge labels
                edgeLabels = labelGroup.selectAll('.edge-label-group')
                    .data(links, d => `${d.source}-${d.target}-${d.predicate}`);

                const newLabelGroup = edgeLabels.enter()
                    .append('g')
                    .attr('class', 'edge-label-group');

                newLabelGroup.append('text')
                    .attr('class', 'edge-label-outline')
                    .attr('text-anchor', 'middle');

                edgeLabels.exit().remove();
                edgeLabels = newLabelGroup.merge(edgeLabels);

                // Ensure `d.source` and `d.target` are objects before calculating `dy`
                edgeLabels.selectAll('text')
                    .attr('dy', d => {
                        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
                        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
                        return sourceId === targetId ? -64 : 4; // Adjust for self-loops
                    })
                    .text(d => qname(d.predicate, prefixMap));

                // Update the nodes
                node = nodeGroup.selectAll('.node')
                    .data(nodes, d => d.id);

                const newNode = node.enter()
                    .append('g')
                    .attr('class', 'node')
                    .call(d3.drag()
                        .on('start', dragStarted)
                        .on('drag', dragged)
                        .on('end', dragEnded));

                newNode.append('circle')
                    .attr('r', 25);

                // newNode.append('text')
                //     .attr('dy', 4)
                //     .attr('text-anchor', 'middle')
                //     .text(d => qname(d.id, prefixMap));

                newNode.append('text')
                    .attr('class', 'node-label-outline')
                    .attr('text-anchor', 'middle')
                    .attr('dy', 4)
                    .text(d => qname(d.id, prefixMap));

                node.exit().remove();
                node = newNode.merge(node);

                // Restart simulation
                simulation.nodes(nodes);
                simulation.force("link").links(links);
                simulation.alpha(1).restart();
            }

            function dragStarted(event, d) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(event, d) {
                d.fx = event.x;
                d.fy = event.y;
            }

            function dragEnded(event, d) {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }

            // function exportGraph() {
            //     const allTriples = [...triples, ...inferredTriples.map(triple => triple.inferred)];
            //     const graph = allTriples.map(triple => ({
            //         subject: triple.subject.value,
            //         predicate: triple.predicate.value,
            //         object: triple.object.value,
            //     }));
            //
            //     const graphJSON = JSON.stringify(graph, null, 2);
            //     console.log("Exporting Graph:");
            //     console.log(graphJSON);
            //
            //     // Optionally download as a file
            //     const blob = new Blob([graphJSON], {type: "application/json"});
            //     const url = URL.createObjectURL(blob);
            //     const link = document.createElement("a");
            //     link.href = url;
            //     link.download = "graph.json";
            //     document.body.appendChild(link);
            //     link.click();
            //     document.body.removeChild(link);
            // }

// Function to count edge crossings (simple heuristic example)
//             function countEdgeCrossings(graph) {
//                 let crossings = 0;
//
//                 for (let i = 0; i < graph.length; i++) {
//                     for (let j = i + 1; j < graph.length; j++) {
//                         const edgeA = graph[i];
//                         const edgeB = graph[j];
//
//                         // Simplistic crossing detection (assumes edges are direct lines)
//                         if (edgeA.subject !== edgeB.subject && edgeA.object !== edgeB.object) {
//                             crossings++;
//                         }
//                     }
//                 }
//
//                 console.log(`Edge Crossings: ${crossings}`);
//                 return crossings;
//             }

// Bind export and count functionality to buttons or specific events
//             document.getElementById('exportGraph').addEventListener('click', () => {
//                 exportGraph();
//
//                 const allTriples = [...triples, ...inferredTriples.map(triple => triple.inferred)];
//                 const graph = allTriples.map(triple => ({
//                     subject: triple.subject.value,
//                     predicate: triple.predicate.value,
//                     object: triple.object.value,
//                 }));
//
//                 countEdgeCrossings(graph);
//             });

            document.getElementById("log").addEventListener("click", () => {
                console.log(nodes)
            })
        };

        reader.readAsText(file);
    } else {
        alert('Please select a valid Turtle (.ttl) file.');
    }
});

// Extract prefix definitions from ttl data
function extractPrefixes(turtleData) {
    const prefixMap = {};
    const prefixRegex = /^@prefix\s+([a-zA-Z0-9\-]+):\s+<([^>]+)>/gm; // Regex to match prefix declarations
    let match;

    while ((match = prefixRegex.exec(turtleData)) !== null) {
        const prefix = match[1];
        const uri = match[2];
        prefixMap[prefix] = uri;
    }
    return prefixMap;
}

// Function to replace URI with corresponding prefix
function qname(uri, prefixMap) {
    for (let prefix in prefixMap) {
        const baseUri = prefixMap[prefix];
        if (uri.startsWith(baseUri)) {
            return `${prefix}:${uri.slice(baseUri.length)}`;
        }
    }
    return uri; // Return the original URI if no prefix matches
}