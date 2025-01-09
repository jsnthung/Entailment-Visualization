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
            const nodeSet = new Set(); // Define Set to avoid duplicate

            prefixMap = extractPrefixes(turtleData);

            // Create nodes and links from triples
            triples.forEach(triple => {
                if (!nodeSet.has(qname(triple.subject.value, prefixMap))) {
                    nodes.push({ id: qname(triple.subject.value, prefixMap) });
                    nodeSet.add(qname(triple.subject.value, prefixMap));
                }
                if (!nodeSet.has(qname(triple.object.value, prefixMap))) {
                    nodes.push({ id: qname(triple.object.value, prefixMap) });
                    nodeSet.add(qname(triple.object.value, prefixMap));
                }
                links.push({
                    source: qname(triple.subject.value, prefixMap),
                    target: qname(triple.object.value, prefixMap),
                    predicate: qname(triple.predicate.value, prefixMap)
                });
            });

            // Log nodes and links (for debugging)
            console.log('Nodes:', nodes);
            console.log('Links:', links);

            // D3 visualization part (same as previous code, no need for x/y properties)
            const width = window.innerWidth - 300;
            const height = window.innerHeight;

            const svg = d3.select("body").append("svg");

            svg.append("defs").append("marker")
                .attr("id", "arrow")
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 20)
                .attr("refY", 0)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
                .append("path")
                .attr("d", "M0,-5L10,0L0,5")
                .attr("fill", "#666");

            let link, node, linkText;

            link = svg.append("g")
                .selectAll("line")
                .data(links)
                .enter().append("line")
                .attr("class", "link")
                .attr("marker-end", "url(#arrow)");

            node = svg.append("g")
                .selectAll("g")
                .data(nodes)
                .enter().append("g")
                .attr("class", "node");

            node.append("circle")
                .attr("r", 25);

            node.append("rect")
                .attr("x", d => d.id.length * -4) // Adjust positioning
                .attr("y", -10)
                .attr("width", d => d.id.length * 8) // Adjust size dynamically
                .attr("height", 15)
                .style("fill", "#fff")
                .style("opacity", 0.8);

            node.append("text")
                .attr("x", 0)
                .attr("y", 3)
                .text(d => d.id);

            linkText = svg.append("g")
                .selectAll("text")
                .data(links)
                .enter().append("text")
                .attr("class", "link-label")
                .attr("font-size", 10)
                .text(d => d.predicate);

            const simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.id).distance(120)) // Increase distance
                .force("charge", d3.forceManyBody().strength(-150)) // Adjust repulsion
                .force("collision", d3.forceCollide(20)) // Prevent overlap
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collision", d3.forceCollide().radius(20)); // Set radius to avoid overlaps;

            simulation.on("tick", () => {
                link.attr("x1", d => Math.max(10, Math.min(width - 10, d.source.x)))
                    .attr("y1", d => Math.max(10, Math.min(height - 10, d.source.y)))
                    .attr("x2", d => Math.max(10, Math.min(width - 10, d.target.x)))
                    .attr("y2", d => Math.max(10, Math.min(height - 10, d.target.y)));

                node.attr("transform", d => {
                    d.x = Math.max(10, Math.min(width - 10, d.x));
                    d.y = Math.max(10, Math.min(height - 10, d.y));
                    return `translate(${d.x},${d.y})`;
                });

                linkText.attr("x", d => (d.source.x + d.target.x) / 2 + 10)
                    .attr("y", d => (d.source.y + d.target.y) / 2 + 10);
            });

            const drag = d3.drag()
                .on("start", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on("drag", (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                });

            node.call(drag);

            // TODO: Adjust on window resize

            // Int to track current step
            let curStep = 0;

            let tripleSource;
            let tripleTarget;
            let triplePred;
            let conditions;

            function updateStep() {
                tripleSource = qname(inferredTriples[curStep].inferred.subject.value, prefixMap);
                triplePred = qname(inferredTriples[curStep].inferred.predicate.value, prefixMap);
                tripleTarget = qname(inferredTriples[curStep].inferred.object.value, prefixMap);
                conditions = inferredTriples[curStep].condition;
            }

            function addNodeIfNotExist(nodeId) {
                nodes.push({ id: nodeId });
                // Update the node elements
                node = svg.selectAll(".node")
                    .data(nodes)
                    .join(
                        enter => {
                            const newNodes = enter.append("g").attr("class", "node");

                            newNodes.append("circle").attr("r", 25);
                            newNodes.append("rect")
                                .attr("x", d => d.id.length * -4) // Adjust positioning
                                .attr("y", -10)
                                .attr("width", d => d.id.length * 8) // Adjust size dynamically
                                .attr("height", 15)
                                .style("fill", "#fff")
                                .style("opacity", 0.8);
                            newNodes.append("text")
                                .attr("x", 0)
                                .attr("y", 3)
                                .text(d => d.id);

                            return newNodes;
                        },
                        update => update,  // No changes for updates
                        exit => exit.remove()  // Remove outdated nodes
                    );

                // Rebind drag behavior to the newly added nodes
                node.call(drag);

                // Restart the simulation
                simulation.nodes(nodes);
            }

            function nextStep() {
                // If there are no more triple to be added
                if (curStep === inferredTriples.length) {
                    console.log("Graph is fully entailed");
                    return;
                }

                // Edge to be added
                updateStep();
                curStep++;
                const newEdge = {source: tripleSource, target: tripleTarget, predicate: triplePred};

                // Check if source and target node exist
                const sourceNodeExists = nodes.some(node => node.id === newEdge.source);
                const targetNodeExists = nodes.some(node => node.id === newEdge.target);

                // Add missing node(s)
                if (!sourceNodeExists) {
                    addNodeIfNotExist(newEdge.source);
                }

                if (!targetNodeExists) {
                    addNodeIfNotExist(newEdge.target);
                }

                // Add new edge to the links array
                links.push(newEdge);

                // Update link elements
                link = svg.selectAll(".link")
                    .data(links)
                    .join(
                        enter => enter.append("line")
                            .attr("class", "link")
                            .attr("marker-end", "url(#arrow)"),  // Attach arrowhead marker
                        update => update,  // No change in the link properties here
                        exit => exit.remove()  // Remove outdated link elements
                    )
                    .lower();

                // Update linkText labels
                linkText = svg.selectAll(".link-label")
                    .data(links)
                    .join(
                        enter => enter.append("text")
                            .attr("class", "link-label")
                            .attr("font-size", 10)
                            .text(d => d.predicate),
                        update => update,  // No change in the label properties here
                        exit => exit.remove()  // Remove outdated labels
                    );

                // TODO: Highlight condition(s) and new triple
                highlightCondition(conditions);

                // Log nodes and links after adding an edge
                console.log("Added edge:" + newEdge.source + " - " + newEdge.predicate + " - " + newEdge.target);

                simulation.force("link").links(links);
                simulation.alpha(1).restart();
            }
            // Handle button for next step on click
            document.getElementById("add-edge-button").addEventListener("click", nextStep);

            function onInitialGraph(nodeId) {
                return nodeSet.has(nodeId);
            }

            function hasEdge(nodeId) {
                return links.some(link => link.source.id === nodeId || link.target.id === nodeId);
            }

            function removeNode(nodeId) {
                const indexToRemove = nodes.findIndex(node => node.id === nodeId);
                if (indexToRemove !== -1) {
                    nodes.splice(indexToRemove, 1); // Remove the node directly
                }

                // Update the graph visualization
                node = svg.selectAll(".node")
                    .data(nodes)
                    .join(
                        enter => {
                            const newNodes = enter.append("g").attr("class", "node");

                            newNodes.append("circle").attr("r", 10);
                            newNodes.append("text")
                                .attr("x", 12)
                                .attr("y", 3)
                                .text(d => d.id);

                            return newNodes;
                        },
                        update => update,
                        exit => exit.remove()
                    );

                simulation.nodes(nodes);
                simulation.alpha(1).restart();
            }

            // Handle button for back step on click
            document.getElementById("remove-edge-button").addEventListener("click", () => {
                // If you reach the initial graph
                if (curStep === 0) {
                    console.log("This is the initial graph");
                    return;
                }

                curStep--;
                updateStep();
                const edgeToRemove = {source: tripleSource, target: tripleTarget, predicate: triplePred};

                // Find the index of the edge to remove
                const index = links.findIndex(d =>
                    d.source.id === edgeToRemove.source &&
                    d.target.id === edgeToRemove.target &&
                    d.predicate === edgeToRemove.predicate
                );

                if (index !== -1) {
                    // Remove the edge from the links array
                    links.splice(index, 1);

                    // Update the link elements (remove the removed link)
                    link = svg.selectAll(".link")
                        .data(links)
                        .join(
                            enter => enter.append("line")
                                .attr("class", "link")
                                .attr("marker-end", "url(#arrow)"),  // Attach arrowhead marker
                            update => update,  // No change in the link properties here
                            exit => exit.remove()  // Remove the removed link elements
                        );

                    // Remove the corresponding linkText labels
                    linkText = svg.selectAll(".link-label")
                        .data(links)
                        .join(
                            enter => enter.append("text")
                                .attr("class", "link-label")
                                .attr("font-size", 10)
                                .text(d => d.predicate),
                            update => update,  // No change in the label properties here
                            exit => exit.remove()  // Remove outdated labels
                        );

                    // Remove edge if it no longer has any edge and not present in the initial graph
                    if (!onInitialGraph(edgeToRemove.source) && !hasEdge(edgeToRemove.source)) {
                        removeNode(edgeToRemove.source);
                    }

                    if (!onInitialGraph(edgeToRemove.target) && !hasEdge(edgeToRemove.target)) {
                        removeNode(edgeToRemove.target);
                    }

                    // TODO: Highlight triple to be removed

                    // Log nodes and links after removing an edge
                    console.log("Removed edge:" + edgeToRemove.source + " - " + edgeToRemove.predicate + " - " + edgeToRemove.target);
                } else {
                    console.log('Edge not found, nothing to remove.');
                }
            });

            let timer;
            let isRunning = false;

            // Event listener for the button to toggle between start and pause
            document.getElementById('pause_resume').addEventListener('click', function() {
                if (isRunning) {
                    // If the timer is running, stop it
                    clearInterval(timer);
                    this.textContent = 'Start'; // Change button text to "Start"
                } else {
                    // If the timer is not running, start it
                    timer = setInterval(nextStep, 1000);
                    this.textContent = 'Pause'; // Change button text to "Pause"
                }
                isRunning = !isRunning; // Toggle the isRunning state
            });

            function highlightCondition(conditions) {
                conditions.forEach(condition => {
                    // Highlight subject
                    const subjectNode = d3.selectAll(".node").filter(node => node.id === qname(condition.subject.value, prefixMap));
                    subjectNode.select("circle").transition().duration(500).attr("r", 25).style("fill", "red");

                    // Highlight predicate
                    const predEdge = d3.selectAll(".link")
                        .filter(edge => edge.source.id === qname(condition.subject.value, prefixMap) &&
                            edge.predicate === qname(condition.predicate.value, prefixMap) &&
                            edge.target.id === qname(condition.object.value, prefixMap));
                    // predEdge.transition().duration(500).style("stroke", "red").style("stroke-width", "3px");
                    // TODO: Make a function to assign marker-end with a unique id, so that no new marker-end needs to be created

                    // Highlight object
                    const objectNode = d3.selectAll(".node").filter(node => node.id === qname(condition.object.value, prefixMap));
                    objectNode.select("circle").transition().duration(500).attr("r", 25).style("fill", "red");

                    setTimeout(() => {
                        subjectNode.select("circle").transition().duration(500).attr("r", 25).style("fill", "#1f3a93");
                        predEdge.transition().duration(500).style("stroke", "#1f3a93").style("stroke-width", "1.5px");
                        objectNode.select("circle").transition().duration(500).attr("r", 25).style("fill", "#1f3a93");
                    }, 2000);
                })
            }

            // document.getElementById("change-node-color-button").addEventListener("click", () => {
            //     const bobNode = d3.selectAll(".node").filter(node => node.id === tripleSource);
            //
            //     bobNode.select("circle")
            //         .transition()
            //         .duration(500)
            //         .attr("r", 16)
            //         .style("fill", "red");
            // });
            //
            // document.getElementById("change-node-color-button").addEventListener("dblclick", () => {
            //     const bobNode = d3.selectAll(".node").filter(node => node.id === tripleSource);
            //
            //     bobNode.select("circle")
            //         .transition()
            //         .duration(500)
            //         .attr("r", 10)
            //         .style("fill", "#1f78b4");
            // });

            // document.getElementById("change-edge-color-button").addEventListener("click", () => {
            //     const bobPersonEdge = d3.selectAll(".link")
            //         .filter(edge =>  edge.source.id === "ex:ed" &&
            //             edge.target.id === "Ed" &&
            //             edge.predicate === "foaf:name");
            //
            //     bobPersonEdge.each(function() {
            //         const markerId = d3.select(this).attr("marker-end");
            //         console.log(`Marker ID for bobPersonEdge: ${markerId}`);
            //     });
            //
            //     // Create a new marker for this specific edge
            //     const uniqueMarkerId = "arrow-bob-person";
            //
            //     d3.select("defs").append("marker")
            //         .attr("id", uniqueMarkerId)
            //         .attr("viewBox", "0 -5 10 10")
            //         .attr("refX", 17) // Adjust position
            //         .attr("refY", 0)
            //         .attr("markerWidth", 4)
            //         .attr("markerHeight", 4)
            //         .attr("orient", "auto")
            //         .append("path")
            //         .attr("d", "M0,-5L10,0L0,5") // Arrowhead shape
            //         .attr("fill", "red");
            //
            //     // Apply the custom marker-end to the selected edge
            //     bobPersonEdge
            //         .transition()
            //         .duration(500)
            //         .style("stroke", "red")
            //         .style("stroke-width", "3px")
            //         .attr("marker-end", `url(#${uniqueMarkerId})`);
            // });
            //
            // document.getElementById("change-edge-color-button").addEventListener("dblclick", () => {
            //     const bobPersonEdge = d3.selectAll(".link")
            //         .filter(edge =>  edge.source.id === "ex:ed" &&
            //             edge.target.id === "Ed" &&
            //             edge.predicate === "foaf:name");
            //
            //     bobPersonEdge
            //         .transition()
            //         .duration(500)
            //         .style("stroke", "#2cb81d")
            //         .style("stroke-width", "1.5px")
            //         .attr("marker-end", "url(#arrow)");
            // });
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