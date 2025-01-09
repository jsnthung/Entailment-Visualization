const {DataFactory} = N3;
const {namedNode} = DataFactory;

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

const RDFS = {
    domain: namedNode("http://www.w3.org/2000/01/rdf-schema#domain"),
    range: namedNode("http://www.w3.org/2000/01/rdf-schema#range"),
    subPropertyOf: namedNode("http://www.w3.org/2000/01/rdf-schema#subPropertyOf"),
    Class: namedNode("http://www.w3.org/2000/01/rdf-schema#Class"),
    subClassOf: namedNode("http://www.w3.org/2000/01/rdf-schema#subClassOf"),
    ContainerMembershipProperty: namedNode("http://www.w3.org/2000/01/rdf-schema#member"),
    member: namedNode("http://www.w3.org/2000/01/rdf-schema#ContainerMembershipProperty"),
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

            addNewInferredTriple("rdfs1", condition, inferredTriple);
        }
        if (triple.predicate.termType === "NamedNode") {
            let condition = [];
            let inferredTriple = {
                "subject": triple.subject,
                "predicate": RDF.type,
                "object": RDFS.Datatype
            }

            addNewInferredTriple("rdfs1", condition, inferredTriple);
        }
        if (triple.object.termType === "NamedNode") {
            let condition = [];
            let inferredTriple = {
                "subject": triple.object,
                "predicate": RDF.type,
                "object": RDFS.Datatype
            }

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

        addNewInferredTriple("rdfs4a", condition, inferredTriple);
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
                            "predicate": RDFS.subPropertyOf,
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
        )
    }
}

// Function to check or uncheck all checkboxes based on the master checkbox
document.getElementById('checkAll').addEventListener('change', function() {
    // Get all checkboxes with the name 'rules'
    const checkboxes = document.querySelectorAll('input[name="rules"]');

    // Set all checkboxes to the state of the master checkbox
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = document.getElementById('checkAll').checked;
    });
});

// Listen for changes in individual checkboxes to update the master checkbox
const checkboxes = document.querySelectorAll('input[name="rules"]');
checkboxes.forEach(function(checkbox) {
    checkbox.addEventListener('change', function() {
        const allChecked = Array.from(checkboxes).every(function(checkbox) {
            return checkbox.checked;
        });

        // If all checkboxes are checked, set the master checkbox to checked
        document.getElementById('checkAll').checked = allChecked;

        // If any checkbox is unchecked, uncheck the master checkbox
        if (!this.checked) {
            document.getElementById('checkAll').indeterminate = true; // Set the master checkbox to indeterminate
        } else {
            const anyUnchecked = Array.from(checkboxes).some(function(checkbox) {
                return !checkbox.checked;
            });
            document.getElementById('checkAll').indeterminate = anyUnchecked; // Set it to indeterminate if any are unchecked
        }
    });
});

document.getElementById('entail').addEventListener('click', () => {
    // Resetting the inferredTriples list
    inferredTriples.length = 0;

    // Picking rules
    const selectedRules = [];
    document.querySelectorAll('input[name="rules"]:checked').forEach((checkbox) => {
        selectedRules.push(checkbox.value);
    });

    if (selectedRules.length === 0) {
        console.log("Please select at least one rule");
    } else {
        console.log("Selected Rules:", selectedRules);

        if (selectedRules.includes("rdfs1")) {
            rdfs1();
        }
        if (selectedRules.includes("rdfs2")) {
            rdfs2();
        }
        if (selectedRules.includes("rdfs3")) {
            rdfs3();
        }
        if (selectedRules.includes("rdfs4a")) {
            rdfs4a();
        }
        if (selectedRules.includes("rdfs4b")) {
            rdfs4b();
        }
        if (selectedRules.includes("rdfs5")) {
            rdfs5();
        }
        if (selectedRules.includes("rdfs6")) {
            rdfs6();
        }
        if (selectedRules.includes("rdfs7")) {
            rdfs7();
        }
        if (selectedRules.includes("rdfs8")) {
            rdfs8();
        }
        if (selectedRules.includes("rdfs9")) {
            rdfs9();
        }
        if (selectedRules.includes("rdfs10")) {
            rdfs10();
        }
        if (selectedRules.includes("rdfs11")) {
            rdfs11();
        }
        if (selectedRules.includes("rdfs12")) {
            rdfs12();
        }
        if (selectedRules.includes("rdfs13")) {
            rdfs13();
        }
    }

    console.log("There are " + inferredTriples.length + " new triples to be added");
});

document.getElementById('toggle-sidebar').addEventListener('click', function () {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        this.textContent = '⏪';
    } else {
        sidebar.classList.add('hidden');
        this.textContent = '⏩';
    }
});