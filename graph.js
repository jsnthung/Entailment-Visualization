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
            const linkSet = new Set();

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
                    links.push({source, target, predicate});
                    linkSet.add(linkIdentifier); // Mark this link as added
                }
            });

            // debug
            // console.log('Triples:', triples);

            // SVG canvas
            const width = window.innerWidth;
            const height = window.innerHeight;

            const svg = d3.select("body").append("svg")
                .attr("width", width)
                .attr("height", height)
                .call(d3.zoom().scaleExtent([0.1, 3]).on("zoom", zoomed))
                .append('g');

            // const tooltip = d3.select("body").append("div")
            //     .attr("class", "tooltip") // You can define CSS styles for this class
            //     .style("position", "absolute")
            //     .style("visibility", "hidden")
            //     .style("background", "#fff")
            //     .style("border", "1px solid #ccc")
            //     .style("padding", "5px")
            //     .style("border-radius", "5px")
            //     .style("box-shadow", "0 2px 5px rgba(0, 0, 0, 0.2)");

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
            const labelGroup = svg.append('g').attr('class', 'labels');
            const nodeGroup = svg.append('g').attr('class', 'nodes');

            const simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.id).distance(300).strength(0.7))
                .force("collide", d3.forceCollide(13))
                .force("charge", d3.forceManyBody().strength(-300))
                .force("center", d3.forceCenter(width / 4, height / 4))
                .velocityDecay(0.6)
                .on("tick", ticked);

            // Add marker definition
            const defs = svg.append('defs');

            // Marker for positive linknum
            defs.append('marker')
                .attr('id', 'arrowhead-positive')
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 31)
                .attr('refY', 0.5)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', '#3c3c3e');

            // Marker for negative linknum
            defs.append('marker')
                .attr('id', 'arrowhead-negative')
                .attr('viewBox', '-10 -5 10 10')
                .attr('refX', -31)
                .attr('refY', -0.5)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L-10,0L0,5')   // Reversed path
                .attr('fill', '#3c3c3e');

            // Marker for reflexive relation
            defs.append('marker')
                .attr('id', 'arrowhead-reflexive')
                .attr('viewBox', '-10 -5 10 10')
                .attr('refX', -31)
                .attr('refY', 2.5)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L-10,0L0,5')   // Reversed path
                .attr('fill', '#3c3c3e');

            // Draw links
            let link = linkGroup.selectAll('.link')
                .data(links)
                .enter()
                .append('path')
                .attr('class', 'link')
                .attr('source', d => d.source.id)
                .attr('target', d => d.target.id)
                .attr('marker-end', d => d.source.id < d.target.id ? 'url(#arrowhead-positive)' : null)
                .attr('marker-start', d => {
                    if (d.source.id > d.target.id) {
                        return 'url(#arrowhead-negative)';
                    } else if (d.source.id === d.target.id) {
                        return 'url(#arrowhead-reflexive)';
                        // return null;
                    } else {
                        return null;
                    }
                });

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

            node.append('text')
                .attr('class', 'node-label-outline')
                .attr('text-anchor', 'middle')
                .attr('dy', 4)
                .text(d => qname(d.id, prefixMap));

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

            const linkDirectionMap = {};

            links.forEach(link => {
                const key = link.source.id < link.target.id ?
                    link.source.id + ':' + link.target.id :
                    link.target.id + ':' + link.source.id;

                if (!linkDirectionMap.hasOwnProperty(key)) {
                    linkDirectionMap[key] = [];
                }

                linkDirectionMap[key].push(link);
            })

            links.forEach(link => {
                const key = link.source.id < link.target.id ?
                    link.source.id + ':' + link.target.id :
                    link.target.id + ':' + link.source.id;

                const group = linkDirectionMap[key];

                if (group[group.length - 1] === link) {
                    setLinkNumber(group);
                }
            })

            function setLinkNumber(group) {
                const len = group.length;
                const linksA = [];
                const linksB = [];

                for (let i = 0; i < len; i++) {
                    const link = group[i];

                    if (link.source.id < link.target.id) {
                        linksA.push(link);
                    } else {
                        linksB.push(link);
                    }

                    let startLinkANumber = 1;
                    linksA.forEach(linkA => {
                        linkA.linknum = startLinkANumber++;
                    })

                    let startLinkBNumber = -1;
                    linksB.forEach(linkB => {
                        linkB.linknum = startLinkBNumber--;
                    })
                }
            }

            const isConnected = (s, t) =>
                links.some(link =>
                    (link.source.id === s && link.target.id === t) ||
                    (link.source.id === t && link.target.id === s)
                ) || s === t;

            function mouseOverFunction(event, d) {
                // tooltip.style("visibility", "visible")
                //     .html(() => `Node: ${qname(d.id, prefixMap)}`);

                // Reduce opacity for some nodes
                node.transition(500)
                    .style('opacity', o => isConnected(o.id, d.id) ? 1.0 : 0.1);

                // Reduce opacity for some links
                link.transition(500)
                    .style('stroke-opacity', o =>
                        o.source.id === d.id || o.target.id === d.id ? 1.0 : 0.1
                    );

                // Reduce opacity for some edgeLabels
                edgeLabels.transition(500)
                    .style('opacity', o => o.source.id === d.id || o.target.id === d.id ? 1.0 : 0.1);
            }

            function mouseOutFunction(d) {
                // tooltip.style("visibility", "hidden");

                // Reset opacity for all nodes
                node.transition(500).style('opacity', 1.0);

                // Reset opacity for all links
                link.transition(500)
                    .style('stroke-opacity', 1.0);

                // Reset opacity for all edgeLabels
                edgeLabels.transition(500)
                    .style('opacity', 1.0);
            }

            node.on('mouseover', mouseOverFunction)
                .on('mouseout', mouseOutFunction);


            // Update positions on tick
            function ticked() {
                link.attr('d', d => computePath(d));
                node.attr('transform', d => `translate(${d.x},${d.y})`);

                edgeLabels
                    .selectAll('text')
                    .attr('x', 0)  // Ensure text is centered
                    .attr('y', d => getOffset(d))
                    .attr('transform', d => {
                        const midPoint = getMidPoint(d);
                        const angle = getLabelRotation(d);
                        return `translate(${midPoint.x},${midPoint.y}) rotate(${angle})`;
                    });
            }

            // Set edgeLabels in the center
            function getMidPoint(d) {
                return {
                    x: (d.source.x + d.target.x) / 2,
                    y: (d.source.y + d.target.y) / 2,
                };
            }

            // Offset for edgeLabels
            function getOffset(d) {
                let sourceNode = d.source;
                let targetNode = d.target;

                if (sourceNode.id === targetNode.id) {
                    return 26 + d.linknum * 30;
                }

                const x1 = sourceNode.x;
                const y1 = sourceNode.y;
                const x2 = targetNode.x;
                const y2 = targetNode.y;

                const dx = x2 - x1;
                const dy = y2 - y1;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                let linkCountSameDirection;
                const key = d.source.id < d.target.id ?
                    d.source.id + ':' + d.target.id :
                    d.target.id + ':' + d.source.id;
                if (d.linknum < 0) {
                    linkCountSameDirection = linkDirectionMap[key].filter(link => link.linknum < 0).length;
                } else {
                    linkCountSameDirection = linkDirectionMap[key].filter(link => link.linknum > 0).length;
                }

                let edgeIndex;
                if (d.linknum < 0) {
                    edgeIndex = Math.abs(d.linknum) - 1;
                } else {
                    edgeIndex = d.linknum + linkCountSameDirection - 1;
                }

                let gap = 29;

                if (d.linknum < 0) {
                    if ((angle < 0 && angle >= -90) || (angle < 90 && angle >= 0)) {
                        return (((linkCountSameDirection * 2) - edgeIndex - 1) - (linkCountSameDirection * 2 - 1) / 2) * gap;
                    }

                    if ((angle < -90 && angle >= -180) || (angle < 180 && angle >= 90)) {
                        return (edgeIndex - (linkCountSameDirection * 2 - 1) / 2) * gap;
                    }
                } else {
                    if ((angle < 0 && angle >= -90) || (angle < 90 && angle >= 0)) {
                        return (edgeIndex - (linkCountSameDirection * 2 - 1) / 2) * gap;
                    }

                    if ((angle < -90 && angle >= -180) || (angle < 180 && angle >= 90)) {
                        return (((linkCountSameDirection * 2) - edgeIndex - 1) - (linkCountSameDirection * 2 - 1) / 2) * gap;
                    }
                }
            }

            // Adjust angle of edgeLabels
            function getLabelRotation(d) {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                let angle = Math.atan2(dy, dx) * (180 / Math.PI);

                if (angle > 90) {
                    angle -= 180;
                }

                if (angle < -90) {
                    angle += 180;
                }

                return angle;
            }

            // Calculate path of multiple edges and reflexive edges
            function computePath(d) {
                let sourceNode;
                let targetNode;

                if (d.source.id < d.target.id) {
                    sourceNode = d.source;
                    targetNode = d.target;
                } else {
                    sourceNode = d.target;
                    targetNode = d.source;
                }

                if (sourceNode.id === targetNode.id) {
                    // Reflexive relation always have negative linknum
                    const x = sourceNode.x;
                    const y = sourceNode.y;

                    const loopRadius = 60 + Math.abs(d.linknum * 40);
                    return `M${x},${y} C${x + loopRadius},${y - loopRadius} ${x - loopRadius},${y - loopRadius} ${x},${y}`;
                }

                const x1 = sourceNode.x;
                const y1 = sourceNode.y;
                const x2 = targetNode.x;
                const y2 = targetNode.y;

                const dx = x2 - x1;
                const dy = y2 - y1;
                const distance = Math.sqrt(dx * dx + dy * dy);

                let linkCountSameDirection;
                const key = d.source.id < d.target.id ?
                    d.source.id + ':' + d.target.id :
                    d.target.id + ':' + d.source.id;
                if (d.linknum < 0) {
                    linkCountSameDirection = linkDirectionMap[key].filter(link => link.linknum < 0).length;
                } else {
                    linkCountSameDirection = linkDirectionMap[key].filter(link => link.linknum > 0).length;
                }

                let edgeIndex;
                if (d.linknum < 0) {
                    edgeIndex = Math.abs(d.linknum) - 1;
                } else {
                    edgeIndex = d.linknum + linkCountSameDirection - 1;
                }

                const offset = (edgeIndex - (linkCountSameDirection * 2 - 1) / 2) * 60;

                const cx = x1 + dx / 2 - dy * (offset / distance);
                const cy = y1 + dy / 2 + dx * (offset / distance);

                return `M${x1} ${y1} Q${cx} ${cy} ${x2} ${y2}`
            }

            // Variables for iterating through each steps
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

                // Default coordinates (center of the graph)
                const defaultX = width / 2;
                const defaultY = height / 2;

                // Add the source node if it doesn't exist
                if (!sourceNode) {
                    const targetReferenceX = targetNode ? targetNode.x : defaultX;
                    const targetReferenceY = targetNode ? targetNode.y : defaultY;

                    const sourceX = targetReferenceX + (Math.random() - 0.5) * 100; // Offset by a small random value
                    const sourceY = targetReferenceY + (Math.random() - 0.5) * 100; // Offset by a small random value

                    sourceNode = {id: sourceId, x: sourceX, y: sourceY};
                    nodes.push(sourceNode);
                }

                // Add the target node if it doesn't exist
                if (!targetNode) {
                    const sourceReferenceX = sourceNode ? sourceNode.x : defaultX;
                    const sourceReferenceY = sourceNode ? sourceNode.y : defaultY;

                    const targetX = sourceReferenceX + (Math.random() - 0.5) * 100; // Offset by a small random value
                    const targetY = sourceReferenceY + (Math.random() - 0.5) * 100; // Offset by a small random value

                    targetNode = {id: targetId, x: targetX, y: targetY};
                    nodes.push(targetNode);
                }

                // Add a new edge between source and target with a label
                const newLink = {
                    source: sourceNode,
                    target: targetNode,
                    predicate: predId
                }

                links.push(newLink);

                const key = sourceId < targetId ?
                    sourceId + ':' + targetId :
                    targetId + ':' + sourceId;

                if (!linkDirectionMap.hasOwnProperty(key)) {
                    linkDirectionMap[key] = [];
                }

                linkDirectionMap[key].push(newLink);

                const group = linkDirectionMap[key];
                setLinkNumber(group);

                // Restart the simulation and re-render
                updateGraph();
                highlightTriple();
                console.log("Added edge:");
                console.log(`${qname(sourceId, prefixMap)} - ${qname(predId, prefixMap)} - ${qname(targetId, prefixMap)} by ${rule}`);
            }

            document.getElementById("next-step").addEventListener("click", () => {
                if (curStep === inferredTriples.length) {
                    console.log("Graph is fully entailed");
                    const rulePanelContent = document.getElementById('rulePanelContent');
                    rulePanelContent.innerHTML = 'Graph is fully entailed';
                    return;
                }

                updateRulePanelContentAdd(inferredTriples[curStep].rule, inferredTriples[curStep].condition, inferredTriples[curStep].inferred);

                updateStep();
                curStep++;
                const newEdge = {sourceId: tripleSource, targetId: tripleTarget, predicate: triplePred};

                addEdge(newEdge.sourceId, newEdge.targetId, newEdge.predicate);
            });

            function removeEdge(sourceId, targetId, predId) {
                // Find the specific edge to remove based on source, target, and label
                const edgeIndex = links.findIndex(link =>
                    link.source.id === sourceId &&
                    link.target.id === targetId &&
                    link.predicate === predId
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

                    const key = sourceId < targetId ?
                        sourceId + ':' + targetId :
                        targetId + ':' + sourceId;

                    console.log(linkDirectionMap[key]);

                    if (linkDirectionMap.hasOwnProperty(key)) {
                        const index = linkDirectionMap[key].findIndex(link =>
                            link.source.id === sourceId &&
                            link.target.id === targetId &&
                            link.predicate === predId);

                        console.log("Links:", links);

                        if (index !== -1) {
                            linkDirectionMap[key].splice(index, 1);
                        }
                    }

                    // Restart the simulation and re-render
                    updateGraph();
                    console.log(`Removed edge: ${qname(sourceId, prefixMap)} - ${qname(predId, prefixMap)} - ${qname(targetId, prefixMap)}`);
                } else {
                    console.log(`Edge from ${qname(sourceId, prefixMap)} to ${qname(predId, prefixMap)} with label "${qname(targetId, prefixMap)}" not found.`);
                }
            }

            document.getElementById("prev-step").addEventListener("click", () => {
                if (curStep === 0) {
                    console.log("This is the initial graph")
                    const rulePanelContent = document.getElementById('rulePanelContent');
                    rulePanelContent.innerHTML = 'This is the initial graph';
                    return;
                }

                curStep--;
                updateStep();
                const edgeToRemove = {sourceId: tripleSource, targetId: tripleTarget, predicate: triplePred};

                removeEdge(edgeToRemove.sourceId, edgeToRemove.targetId, edgeToRemove.predicate);
                updateRulePanelContentRemove(edgeToRemove.sourceId, edgeToRemove.targetId, edgeToRemove.predicate);
            });

            // Function to update the graph
            function updateGraph() {
                // Update links
                link = linkGroup.selectAll('.link')
                    .data(links, d => `${d.source}-${d.target}-${d.predicate}`);

                const newLink = link.enter()
                    .append('path')
                    .attr('class', 'link')
                    .attr('marker-end', d => d.source.id < d.target.id ? 'url(#arrowhead-positive)' : null)
                    .attr('marker-start', d => {
                        if (d.source.id > d.target.id) {
                            return 'url(#arrowhead-negative)';
                        } else if (d.source.id === d.target.id) {
                            return 'url(#arrowhead-reflexive)';
                        } else {
                            return null;
                        }
                    });

                link.exit().remove();
                link = newLink.merge(link);

                // Update edge labels
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

                edgeLabels.selectAll('text')
                    .attr('dy', d => {
                        const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
                        const targetId = typeof d.target === 'object' ? d.target.id : d.target;
                        return sourceId === targetId ? -64 : 4; // Adjust for self-loops
                    })
                    .text(d => qname(d.predicate, prefixMap));

                // Update nodes
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

                newNode.append('text')
                    .attr('class', 'node-label-outline')
                    .attr('text-anchor', 'middle')
                    .attr('dy', 4)
                    .text(d => qname(d.id, prefixMap));

                node.exit().remove();
                node = newNode.merge(node);

                // Reapply event listeners
                node.on('mouseover', mouseOverFunction)
                    .on('mouseout', mouseOutFunction);

                // Restart simulation
                simulation.nodes(nodes);
                simulation.force("link").links(links);
                simulation.alpha(1).restart();
            }


            // Highlighting
            function highlightTriple() {
                // Helper function to apply highlight styling
                function applyHighlight(triples, nodeStyle, linkStyle) {
                    triples.forEach(triple => {
                        // const relatedNodes = node.filter(d => d.id === triple.subject.id || d.id === triple.object.id);
                        const relatedLink = link.filter(d =>
                            d.source.id === triple.subject.id &&
                            d.predicate === triple.predicate.id &&
                            d.target.id === triple.object.id);

                        // relatedNodes
                        //     .transition(500)
                        //     .select('circle')
                        //     .style('fill', nodeStyle.fill);
                        relatedLink
                            .transition(500)
                            .style('stroke', linkStyle.stroke)
                            .style('stroke-width', linkStyle.strokeWidth);
                    });
                }

                // Highlight new inference
                const highlightedTriple = inferredTriples[curStep - 1].inferred;
                applyHighlight([highlightedTriple], { fill: 'red' }, { stroke: 'red', strokeWidth: '3px' });

                // Highlight conditions
                const conditionTriples = inferredTriples[curStep - 1].condition;
                applyHighlight(conditionTriples, { fill: 'green' }, { stroke: 'green', strokeWidth: '3px' });

                // Restore styling after timeout
                setTimeout(() => {
                    const defaultStyle = { fill: '#1f3a93', stroke: '#1f3a93', strokeWidth: '2px' };
                    applyHighlight([highlightedTriple], defaultStyle, defaultStyle);
                    applyHighlight(conditionTriples, defaultStyle, defaultStyle);
                }, 3500);
            }


            // Drag functionality
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

            // Highlighting current step
            function updateRulePanelContentAdd(rule, conditions, inferredTriple) {
                const rulePanelContent = document.getElementById('rulePanelContent');

                // Handle the conditions array
                let conditionsHTML;
                if (conditions.length === 0) {
                    conditionsHTML = '<p>No conditions</p>';
                } else {
                    conditionsHTML = '<ul>' +
                        conditions.map(condition => `<li>${qname(condition.subject.id, prefixMap)} - ${qname(condition.predicate.id, prefixMap)} - ${qname(condition.object.id, prefixMap)}</li>`).join('') +
                        '</ul>';
                }

                // Update the rule panel content
                rulePanelContent.innerHTML = `
                    <h2>Rule</h2>
                    <p>${rule}</p>
                    <h2>Condition(s)</h2>
                    ${conditionsHTML}
                    <h2>Inferred Triple</h2>
                    <p>${qname(inferredTriple.subject.id, prefixMap)} - ${qname(inferredTriple.predicate.id, prefixMap)} - ${qname(inferredTriple.object.id, prefixMap)}</p>
                `;
            }

            function updateRulePanelContentRemove(removedTripleSubject, removedTripleObject, removedTriplePredicate) {
                const rulePanelContent = document.getElementById('rulePanelContent');
                rulePanelContent.innerHTML = `
                    <h2>Removed Triple</h2>
                    <p>${qname(removedTripleSubject, prefixMap)} - ${qname(removedTriplePredicate, prefixMap)} - ${qname(removedTripleObject, prefixMap)}</p>
                `;
            }
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

// Function to export the graph, including inferred triples
function exportGraph() {
    const allTriples = [...triples, ...inferredTriples.map(triple => triple.inferred)];
    const graph = allTriples.map(triple => ({
        subject: triple.subject.value,
        predicate: triple.predicate.value,
        object: triple.object.value,
    }));

    const graphJSON = JSON.stringify(graph, null, 2);
    console.log("Exporting Graph:");
    console.log(graphJSON);

    // Optionally download as a file
    const blob = new Blob([graphJSON], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "graph.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to count edge crossings (simple heuristic example)
function countEdgeCrossings(graph) {
    let crossings = 0;

    for (let i = 0; i < graph.length; i++) {
        for (let j = i + 1; j < graph.length; j++) {
            const edgeA = graph[i];
            const edgeB = graph[j];

            // Simplistic crossing detection (assumes edges are direct lines)
            if (edgeA.subject !== edgeB.subject && edgeA.object !== edgeB.object) {
                crossings++;
            }
        }
    }

    console.log(`Edge Crossings: ${crossings}`);
    return crossings;
}

// Bind export and count functionality to buttons or specific events
document.getElementById('exportGraph').addEventListener('click', () => {
    exportGraph();

    const allTriples = [...triples, ...inferredTriples.map(triple => triple.inferred)];
    const graph = allTriples.map(triple => ({
        subject: triple.subject.value,
        predicate: triple.predicate.value,
        object: triple.object.value,
    }));

    countEdgeCrossings(graph);
});