const {DataFactory} = N3;
const {namedNode, quad} = DataFactory;

// TODO: RDFS Entailment Engine
let inferredTriples = [];
// Structure:
// [
//     {
//         "rule": "rdfs2",
//         "condition": [
//             {
//                 "subject": "fam:fatherOf",
//                 "predicate": "rdfs:domain",
//                 "object": "foaf:Person"
//             },
//             {
//                 "subject": "ex:bob",
//                 "predicate": "fam:fatherOf",
//                 "object": "ex:alice"
//             }
//         ],
//         "inferred": {
//             "subject": "ex:bob",
//             "predicate": "rdf:type",
//             "object": "foaf:Person"
//         }
//     },
//     ...
// ]

// let numOfInference = 10000;

const RDFS = {
    domain: namedNode("http://www.w3.org/2000/01/rdf-schema#domain"),
    range: namedNode("http://www.w3.org/2000/01/rdf-schema#range"),
    subPropertyOf: namedNode("http://www.w3.org/2000/01/rdf-schema#subPropertyOf"),
    Class: namedNode("http://www.w3.org/2000/01/rdf-schema#Class"),
    subClassOf: namedNode("http://www.w3.org/2000/01/rdf-schema#subClassOf"),
    ContainerMembershipProperty: namedNode("http://www.w3.org/2000/01/rdf-schema#ContainerMembershipProperty"),
    member: namedNode("http://www.w3.org/2000/01/rdf-schema#member"),
    Datatype: namedNode("http://www.w3.org/2000/01/rdf-schema#Datatype"),
    Resource: namedNode("http://www.w3.org/2000/01/rdf-schema#Resource"),
    Literal: namedNode("http://www.w3.org/2000/01/rdf-schema#Literal"),
}

const RDF = {
    type: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
    Property: namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#Property"),
}

// RDFS Entailment Rules
// rdfs1
function rdfs1() {
    triples.forEach(triple => {
        if (triple.subject.termType === "NamedNode") {
            let condition = [];
            let inferredTriple = {
                "subject": triple.subject,
                "predicate": RDF.type,
                "object": RDFS.Datatype
            }

            // if (inferredTriples.length < numOfInference) {
            //     addNewInferredTriple("rdfs1", condition, inferredTriple);
            // }

            addNewInferredTriple("rdfs1", condition, inferredTriple);
        }
        if (triple.object.termType === "NamedNode") {
            let condition = [];
            let inferredTriple = {
                "subject": triple.object,
                "predicate": RDF.type,
                "object": RDFS.Datatype
            }

            // if (inferredTriples.length < numOfInference) {
            //     addNewInferredTriple("rdfs1", condition, inferredTriple);
            // }

            addNewInferredTriple("rdfs1", condition, inferredTriple);
        }
    })
}

// rdfs2
function rdfs2() {
    triples.forEach(triple => {
        if (triple.predicate.equals(RDFS.domain)) {
            let prop = triple.subject;
            let domain = triple.object;

            triples.forEach(tripleInner => {
                if (tripleInner.predicate.equals(prop)) {
                    let condition = [
                        {
                            "subject": prop,
                            "predicate": RDFS.domain,
                            "object": domain
                        },
                        {
                            "subject": tripleInner.subject,
                            "predicate": prop,
                            "object": tripleInner.object
                        },
                    ];
                    let inferredTriple = {
                        "subject": tripleInner.subject,
                        "predicate": RDF.type,
                        "object": domain
                    };

                    // if (inferredTriples.length < numOfInference) {
                    //     addNewInferredTriple("rdfs2", condition, inferredTriple);
                    // }

                    addNewInferredTriple("rdfs2", condition, inferredTriple);
                }
            })
        }
    })
}

// rdfs3
function rdfs3() {
    triples.forEach(triple => {
        let prop = triple.subject;
        let range = triple.object;

        if (triple.predicate.equals(RDFS.range)) {
            triples.forEach(tripleInner => {
                if (tripleInner.predicate.equals(prop)) {
                    let condition = [
                        {
                            "subject": prop,
                            "predicate": RDFS.range,
                            "object": range
                        },
                        {
                            "subject": tripleInner.subject,
                            "predicate": prop,
                            "object": tripleInner.object
                        }
                    ];
                    let inferredTriple = {
                        "subject": tripleInner.object,
                        "predicate": RDF.type,
                        "object": range
                    }

                    // if (inferredTriples.length < numOfInference) {
                    //     addNewInferredTriple("rdfs3", condition, inferredTriple);
                    // }

                    addNewInferredTriple("rdfs3", condition, inferredTriple);
                }
            })
        }
    })
}

// rdfs4a
function rdfs4a() {
    triples.forEach(triple => {
        let condition = [
            {
                "subject": triple.subject,
                "predicate": triple.predicate,
                "object": triple.object
            }
        ];
        let inferredTriple = {
            "subject": triple.subject,
            "predicate": RDF.type,
            "object": RDFS.Resource
        }

        // if (inferredTriples.length < numOfInference) {
        //     addNewInferredTriple("rdfs4a", condition, inferredTriple);
        // }

        addNewInferredTriple("rdfs4a", condition, inferredTriple);
    })
}

// rdfs4b
function rdfs4b() {
    triples.forEach(triple => {
        let condition = [
            {
                "subject": triple.subject,
                "predicate": triple.predicate,
                "object": triple.object
            }
        ];
        let inferredTriple = {
            "subject": triple.object,
            "predicate": RDF.type,
            "object": RDFS.Resource
        }


        // if (inferredTriples.length < numOfInference) {
        //     addNewInferredTriple("rdfs4b", condition, inferredTriple);
        // }

        addNewInferredTriple("rdfs4b", condition, inferredTriple);
    })
}

// rdfs5
function rdfs5() {
    triples.forEach(triple => {
        let p1 = triple.subject;
        let p2 = triple.object;

        if (triple.predicate.equals(RDFS.subPropertyOf)) {
            triples.forEach(tripleInner => {
                if (tripleInner.subject.equals(p2) && tripleInner.predicate.equals(RDFS.subPropertyOf)) {
                    let p3 = tripleInner.object;

                    let condition = [
                        {
                            "subject": p1,
                            "predicate": RDFS.subPropertyOf,
                            "object": p2,
                        },
                        {
                            "subject": p2,
                            "predicate": RDFS.subPropertyOf,
                            "object": p3,
                        }
                    ];
                    let inferredTriple = {
                        "subject": p1,
                        "predicate": RDFS.subPropertyOf,
                        "object": p3
                    }


                    // if (inferredTriples.length < numOfInference) {
                    //     addNewInferredTriple("rdfs5", condition, inferredTriple);
                    // }

                    addNewInferredTriple("rdfs5", condition, inferredTriple);
                }
            })
        }
    })
}

// rdfs6
function rdfs6() {
    triples.forEach(triple => {
        let subj = triple.subject;

        if (triple.predicate.equals(RDF.type) && triple.object.equals(RDF.Property)) {
            let condition = [
                {
                    "subject": subj,
                    "predicate": RDF.type,
                    "object": RDF.Property
                }
            ];
            let inferredTriple = {
                "subject": subj,
                "predicate": RDFS.subPropertyOf,
                "object": subj
            }

            // if (inferredTriples.length < numOfInference) {
            //     addNewInferredTriple("rdfs6", condition, inferredTriple);
            // }

            addNewInferredTriple("rdfs6", condition, inferredTriple);
        }
    })
}

// rdfs7
function rdfs7() {
    triples.forEach(triple => {
        let subprop = triple.subject;
        let superprop = triple.object;

        if (triple.predicate.equals(RDFS.subPropertyOf)) {
            triples.forEach(tripleInner => {
                let subj = tripleInner.subject;
                let obj = tripleInner.object;

                if (tripleInner.predicate.equals(subprop)) {
                    let condition = [
                        {
                            "subject": subprop,
                            "predicate": RDFS.subPropertyOf,
                            "object": superprop,
                        },
                        {
                            "subject": subj,
                            "predicate": subprop,
                            "object": obj
                        }
                    ];
                    let inferredTriple = {
                        "subject": subj,
                        "predicate": superprop,
                        "object": obj
                    }

                    // if (inferredTriples.length < numOfInference) {
                    //     addNewInferredTriple("rdfs7", condition, inferredTriple);
                    // }

                    addNewInferredTriple("rdfs7", condition, inferredTriple);
                }
            })
        }
    })
}

// rdfs8
function rdfs8() {
    triples.forEach(triple => {
        let subj = triple.subject;

        if (triple.predicate.equals(RDF.type) && triple.object.equals(RDFS.Class)) {
            let condition = [
                {
                    "subject": subj,
                    "predicate": RDF.type,
                    "object": RDFS.Class
                }
            ];
            let inferredTriple = {
                "subject": subj,
                "predicate": RDFS.subClassOf,
                "object": RDFS.Resource
            }

            // if (inferredTriples.length < numOfInference) {
            //     addNewInferredTriple("rdfs8", condition, inferredTriple);
            // }

            addNewInferredTriple("rdfs8", condition, inferredTriple);
        }
    })
}

// rdfs9
function rdfs9() {
    triples.forEach(triple => {
        let subclass = triple.subject;
        let superclass = triple.object;

        if (triple.predicate.equals(RDFS.subClassOf)) {
            triples.forEach(tripleInner => {
                let subj = tripleInner.subject;

                if (tripleInner.predicate.equals(RDF.type) && tripleInner.object.equals(subclass)) {
                    let condition = [
                        {
                            "subject": subclass,
                            "predicate": RDFS.subClassOf,
                            "object": superclass
                        },
                        {
                            "subject": subj,
                            "predicate": RDF.type,
                            "object": subclass
                        }
                    ]
                    let inferredTriple = {
                        "subject": subj,
                        "predicate": RDF.type,
                        "object": superclass
                    }

                    // if (inferredTriples.length < numOfInference) {
                    //     addNewInferredTriple("rdfs9", condition, inferredTriple);
                    // }

                    addNewInferredTriple("rdfs9", condition, inferredTriple);
                }
            })
        }
    })
}

// rdfs10
function rdfs10() {
    triples.forEach(triple => {
        let subj = triple.subject;

        if (triple.predicate.equals(RDF.type) && triple.object.equals(RDFS.Class)) {
            let condition = [
                {
                    "subject": subj,
                    "predicate": RDF.type,
                    "object": RDFS.Class
                }
            ]
            let inferredTriple = {
                "subject": subj,
                "predicate": RDFS.subClassOf,
                "object": subj
            }

            // if (inferredTriples.length < numOfInference) {
            //     addNewInferredTriple("rdfs10", condition, inferredTriple);
            // }

            addNewInferredTriple("rdfs10", condition, inferredTriple);
        }
    })
}

// rdfs11
function rdfs11() {
    triples.forEach(triple => {
        let subj = triple.subject;
        let obj = triple.object;

        if (triple.predicate.equals(RDFS.subClassOf)) {
            triples.forEach(tripleInner => {
                let obj2 = tripleInner.object;

                if (tripleInner.subject.equals(obj) && tripleInner.predicate.equals(RDFS.subClassOf)) {
                    let condition = [
                        {
                            "subject": subj,
                            "predicate": RDFS.subClassOf,
                            "object": obj2
                        },
                        {
                            "subject": obj,
                            "predicate": RDFS.subClassOf,
                            "object": obj2
                        }
                    ]
                    let inferredTriple = {
                        "subject": subj,
                        "predicate": RDFS.subClassOf,
                        "object": obj2
                    }

                    // if (inferredTriples.length < numOfInference) {
                    //     addNewInferredTriple("rdfs11", condition, inferredTriple);
                    // }

                    addNewInferredTriple("rdfs11", condition, inferredTriple);
                }
            })
        }
    })
}

// rdfs12
function rdfs12() {
    triples.forEach(triple => {
        let subj = triple.subject;

        if (triple.predicate.equals(RDF.type) && triple.object.equals(RDFS.ContainerMembershipProperty)) {
            let condition = [
                {
                    "subject": subj,
                    "predicate": RDF.type,
                    "object": RDFS.ContainerMembershipProperty
                }
            ]
            let inferredTriple = {
                "subject": subj,
                "predicate": RDFS.subPropertyOf,
                "object": RDFS.member
            }

            // if (inferredTriples.length < numOfInference) {
            //     addNewInferredTriple("rdfs12", condition, inferredTriple);
            // }

            addNewInferredTriple("rdfs12", condition, inferredTriple);
        }
    })
}

// rdfs13
function rdfs13() {
    triples.forEach(triple => {
        let subj = triple.subject;

        if (triple.predicate.equals(RDF.type) && triple.object.equals(RDFS.Datatype)) {
            let condition = [
                {
                    "subject": subj,
                    "predicate": RDF.type,
                    "object": RDFS.Datatype
                }
            ]
            let inferredTriple = {
                "subject": subj,
                "predicate": RDFS.subClassOf,
                "object": RDFS.Literal
            }

            // if (inferredTriples.length < numOfInference) {
            //     addNewInferredTriple("rdfs13", condition, inferredTriple);
            // }

            addNewInferredTriple("rdfs13", condition, inferredTriple);
        }
    })
}

function addNewInferredTriple(rule, condition, inferredTriple) {
    // Check if already exist in initial graph
    const alreadyExist = triples.some(triple =>
        triple.subject.equals(inferredTriple.subject) &&
        triple.predicate.equals(inferredTriple.predicate) &&
        triple.object.equals(inferredTriple.object));

    // Check if triple is already inferred before
    const alreadyInferred = inferredTriples.some(triple =>
        triple.inferred.subject.equals(inferredTriple.subject) &&
        triple.inferred.predicate.equals(inferredTriple.predicate) &&
        triple.inferred.object.equals(inferredTriple.object));

    // Add new triple if not exist yet
    if (!alreadyExist && !alreadyInferred) {
        inferredTriples.push(
            {
                "rule": rule,
                "condition": condition,
                "inferred": inferredTriple,
            }
        );

        triples.push(quad(
            inferredTriple.subject, inferredTriple.predicate, inferredTriple.object
        ));
    }
}

let selectedRules = [];

document.getElementById('checkAll').addEventListener('change', function () {
    // Get all checkboxes with the name 'rules'
    const checkboxes = document.querySelectorAll('input[name="rules"]');

    // Set all checkboxes to the state of the master checkbox
    checkboxes.forEach(function (checkbox) {
        checkbox.checked = document.getElementById('checkAll').checked;
    });
});

const checkboxes = document.querySelectorAll('input[name="rules"]');
checkboxes.forEach(function (checkbox) {
    checkbox.addEventListener('change', function () {
        // If all checkboxes are checked, set the master checkbox to checked
        document.getElementById('checkAll').checked = Array.from(checkboxes).every(function (checkbox) {
            return checkbox.checked;
        });

        // If any checkbox is unchecked, uncheck the master checkbox
        if (!this.checked) {
            document.getElementById('checkAll').indeterminate = true; // Set the master checkbox to indeterminate
        } else {
            document.getElementById('checkAll').indeterminate = Array.from(checkboxes).some(function (checkbox) {
                return !checkbox.checked;
            }); // Set it to indeterminate if any are unchecked
        }
    });
});

document.getElementById('entail').addEventListener('click', async () => {
    // addNewInferredTriple("test", [], {
    //     subject: namedNode("http://example.org/jasonn"),
    //     predicate: namedNode("http://example.org/pred1"),
    //     object: namedNode("http://example.org/thungg")
    // });
    // addNewInferredTriple("test", [], {
    //     subject: namedNode("http://example.org/jiayangg"),
    //     predicate: namedNode("http://example.org/pred1"),
    //     object: namedNode("http://example.org/zhouu")
    // });

    // selectedRules = ["rdfs1", "rdfs2", "rdfs3", "rdfs4a", "rdfs4b", "rdfs5", "rdfs6", "rdfs7", "rdfs8", "rdfs9", "rdfs10", "rdfs11", "rdfs12", "rdfs13"];

    document.querySelectorAll('input[name="rules"]:checked').forEach((checkbox) => {
        selectedRules.push(checkbox.value);
    });

    if (selectedRules.length === 0) {
        console.log("Please select at least one rule");
    } else {
        console.time('runtime');

        let hasNewInference = true;

        const heapLimit = performance.memory.jsHeapSizeLimit;
        console.log("JS Heap limit: " + heapLimit / 1024 / 1024 + " MB");

        const initialTotalHeapSize = performance.memory.totalJSHeapSize;
        const initialUsedHeapSize = performance.memory.usedJSHeapSize;

        console.log("Initial total heap size: " + initialTotalHeapSize / 1024 / 1024 + " MB");
        console.log("Initial used heap size: " + initialUsedHeapSize / 1024 / 1024 + " MB");

        let iteration = 0;
        let memoryUsage = [];

        while (hasNewInference) {
            hasNewInference = false;

            const initialSize = inferredTriples.length;

            if (selectedRules.includes("rdfs1")) {
                rdfs1();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs1",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs2")) {
                rdfs2();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs2",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs3")) {
                rdfs3();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs3",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs4a")) {
                rdfs4a();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs4a",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs4b")) {
                rdfs4b();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs4b",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs5")) {
                rdfs5();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs5",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs6")) {
                rdfs6();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs6",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs7")) {
                rdfs7();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs7",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs8")) {
                rdfs8();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs8",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs9")) {
                rdfs9();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs9",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs10")) {
                rdfs10();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs10",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs11")) {
                rdfs11();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs11",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs12")) {
                rdfs12();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs12",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }
            if (selectedRules.includes("rdfs13")) {
                rdfs13();
                memoryUsage.push({
                    iteration: iteration,
                    rule: "rdfs13",
                    usedJSHeapSize: performance.memory.usedJSHeapSize / 1024 / 1024,
                    totalJSHeapSize: performance.memory.totalJSHeapSize / 1024 / 1024,
                });
            }

            const finalSize = inferredTriples.length;
            if (finalSize > initialSize) {
                hasNewInference = true;
            }

            iteration++;
        }

        console.timeEnd('runtime');

        const finalTotalHeapSize = performance.memory.totalJSHeapSize;
        const finalUsedHeapSize = performance.memory.usedJSHeapSize;

        console.log("Final total heap size: " + finalTotalHeapSize / 1024 / 1024 + " MB");
        console.log("Final used heap size:", finalUsedHeapSize / 1024 / 1024 + " MB");

        console.log("finalUsedHeapSize - initialUsedHeapSize:", (finalUsedHeapSize - initialUsedHeapSize) / 1024 / 1024 + " MB");

        console.log("Memory usage:", memoryUsage);

        console.log("Inferred Triples:")
        console.log(inferredTriples);

        // inferredTriples.forEach(triple => {
        //     console.log(`${qname(triple.inferred.subject.id, prefixMap)} - ${qname(triple.inferred.predicate.id, prefixMap)} - ${qname(triple.inferred.object.id, prefixMap)}`);
        // })

        const ruleCounts = inferredTriples.reduce((counts, entry) => {
            counts[entry.rule] = (counts[entry.rule] || 0) + 1;
            return counts;
        }, {});

        console.log("Number of inferred triples by rule:");
        console.log(ruleCounts);
    }
});