let inferredTriples = [];

function addInferredTriple(sourceId, predId, targetId) {
    inferredTriples.push({
        "rule": "rdfs1",
        "condition": [
            {
                "subject": namedNode("someSubject"),
                "predicate": namedNode("somePredicate"),
                "object": namedNode("someObject"),
            }
        ],
        "inferred": {
            "subject": namedNode(sourceId),
            "predicate": namedNode(predId),
            "object": namedNode(targetId),
        }
    });
}

document.addEventListener('parsingFinished', (event) => {
    // addInferredTriple("sub1", "pred1", "obj1");
    // addInferredTriple("sub1", "pred2", "obj1");
    // addInferredTriple("sub1", "pred3", "obj1");
    // addInferredTriple("sub1", "pred4", "obj1");
    // addInferredTriple("sub1", "pred5", "obj1");
    // addInferredTriple("sub1", "pred6", "obj1");

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

// RDFS Entailment Rule
// rdfs1
    function rdfs1() {
        store.getQuads().forEach((triple) => {
            if (triple.subject.termType === "NamedNode") {
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
        });
    }

// rdfs2
    function rdfs2() {
        store.getQuads().forEach((triple) => {
            if (triple.predicate.id === RDFS.domain.id) {
                let prop = triple.subject.id;
                let domain = triple.object.id;

                store.getQuads().forEach((tripleInner) => {
                    if (tripleInner.predicate.id === prop) {
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
                });
            }
        });
    }

// rdfs3
    function rdfs3() {
        store.getQuads().forEach((triple) => {
            if (triple.predicate.id === RDFS.range.id) {
                let prop = triple.subject.id;
                let range = triple.object.id;

                store.getQuads().forEach((tripleInner) => {
                    if (tripleInner.predicate.id === prop) {
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
                });
            }
        });
    }

// rdfs4a
    function rdfs4a() {
        store.getQuads().forEach((triple) => {
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
        store.getQuads().forEach((triple) => {
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

            addNewInferredTriple("rdfs4b", condition, inferredTriple);
        })
    }

// rdfs5
    function rdfs5() {
        store.getQuads().forEach((triple) => {
            let p1 = triple.subject;
            let p2 = triple.object;

            if (triple.predicate.id === RDFS.subPropertyOf.id) {
                store.getQuads().forEach((tripleInner) => {
                    if (tripleInner.subject.id === p2.id && tripleInner.predicate.id === RDFS.subPropertyOf.id) {
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
        store.getQuads().forEach((triple) => {
            let subj = triple.subject;

            if (triple.predicate.id === RDF.type.id && triple.object.id === RDF.Property.id) {
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
        store.getQuads().forEach((triple) => {
            let subprop = triple.subject;
            let superprop = triple.object;

            if (triple.predicate.id === RDFS.subPropertyOf.id) {
                store.getQuads().forEach((tripleInner) => {
                    let subj = tripleInner.subject;
                    let obj = tripleInner.object;

                    if (tripleInner.predicate.id === subprop.id) {
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
        store.getQuads().forEach((triple) => {
            let subj = triple.subject;

            if (triple.predicate.id === RDF.type.id && triple.object.id === RDFS.Class.id) {
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
        store.getQuads().forEach((triple) => {
            let subclass = triple.subject;
            let superclass = triple.object;

            if (triple.predicate.id === RDFS.subClassOf.id) {
                store.getQuads().forEach((tripleInner) => {
                    let subj = tripleInner.subject;

                    if (tripleInner.predicate.id === RDF.type.id && tripleInner.object.id === subclass.id) {
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

                        addNewInferredTriple("rdfs9", condition, inferredTriple);
                    }
                })
            }
        })
    }

// rdfs10
    function rdfs10() {
        store.getQuads().forEach((triple) => {
            let subj = triple.subject;

            if (triple.predicate.id === RDF.type.id && triple.object.id === RDFS.Class.id) {
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
        store.getQuads().forEach((triple) => {
            let subj = triple.subject;
            let obj = triple.object;

            if (triple.predicate.id === RDFS.subClassOf.id) {
                store.getQuads().forEach((tripleInner) => {
                    let obj2 = tripleInner.object;

                    if (tripleInner.subject.id === obj.id && tripleInner.predicate.id === RDFS.subClassOf.id) {
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
        store.getQuads().forEach((triple) => {
            let subj = triple.subject;

            if (triple.predicate.id === RDF.type.id && triple.object.id === RDFS.ContainerMembershipProperty.id) {
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
        store.getQuads().forEach((triple) => {
            let subj = triple.subject;

            if (triple.predicate.id === RDF.type.id && triple.object.id === RDFS.Datatype.id) {
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

    document.getElementById('entail').addEventListener('click', async () => {
        // Picking rules
        // const checkboxes = ["rdfs2", "rdfs3", "rdfs5", "rdfs6", "rdfs7", "rdfs8", "rdfs9", "rdfs10", "rdfs11", "rdfs12", "rdfs13"];
        // checkboxes.forEach(id => {
        //     const checkbox = document.getElementById(id);
        //     if (checkbox) {
        //         checkbox.checked = true;
        //     }
        // });

        document.querySelectorAll('input[name="rules"]:checked').forEach((checkbox) => {
            selectedRules.push(checkbox.value);
        });

        console.log("Selected Rules: ", selectedRules)

        if (selectedRules.length === 0) {
            console.log("Please select at least one rule");
        } else {
            // Start of entailment engine
            console.time('runtime');

            let hasNewInference = true;
            while (hasNewInference) {
                hasNewInference = false;

                const initialSize = inferredTriples.length;

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

                const finalSize = inferredTriples.length;

                // console.log("Initial size", initialSize);
                // console.log("Final size", finalSize);

                if (finalSize > initialSize) {
                    hasNewInference = true;
                }
            }

            console.log("Inferred Triples:")
            console.log(inferredTriples);

            // inferredTriples.forEach(triple => {
            //     console.log(`${triple.inferred.subject.id} - ${triple.inferred.predicate.id} - ${triple.inferred.object.id}`);
            // })

            const ruleCounts = inferredTriples.reduce((counts, entry) => {
                counts[entry.rule] = (counts[entry.rule] || 0) + 1;
                return counts;
            }, {});

            console.log("Number of inferred triples by rule:");
            console.log(ruleCounts);

            // End of entailment engine
            console.timeEnd('runtime');
        }
    });
});

function addNewInferredTriple(rule, condition, inferredTriple) {
    // Check if the triple already exist in the initial graph
    const alreadyExist = store.getQuads().some(triple =>
        triple.subject.id === inferredTriple.subject.id &&
        triple.predicate.id === inferredTriple.predicate.id &&
        triple.object.id === inferredTriple.object.id
    );

    const alreadyInferred = inferredTriples.some(triple =>
        triple.inferred.subject.id === inferredTriple.subject.id &&
        triple.inferred.predicate.id === inferredTriple.predicate.id &&
        triple.inferred.object.id === inferredTriple.object.id
    );

    if (!alreadyExist && !alreadyInferred) {
        inferredTriples.push(
            {
                "rule": rule,
                "condition": condition,
                "inferred": inferredTriple,
            }
        );
        store.addQuad(inferredTriple.subject, inferredTriple.predicate, inferredTriple.object);
    }
}

const selectedRules = [];

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