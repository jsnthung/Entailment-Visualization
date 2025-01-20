document.getElementById('fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];

    if (file && file.name.endsWith('.ttl')) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const turtleData = e.target.result;

            window.prefixMap = extractPrefixes(turtleData);
            window.store = new N3.Store();

            const parser = new N3.Parser();
            parser.parse(turtleData, (error, triple) => {
                if (triple) {
                    store.addQuad(triple);
                } else if (error) {
                    console.error('Error parsing Turtle:', error);
                } else {
                    console.log('Parsing complete. Store contains:', store.size, 'triples.');
                    console.log(store.getQuads());

                    const event = new CustomEvent('parsingFinished', {detail: store});
                    document.dispatchEvent(event);
                }
            });
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
