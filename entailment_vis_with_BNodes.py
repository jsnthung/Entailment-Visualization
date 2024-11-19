from rdflib import Graph, Namespace, URIRef, Literal, BNode
import kglab
from pyvis.network import Network

g = Graph()
g.parse("family_rdf.ttl", format='ttl')
# g.parse("EnDe-Lite50(without_Ontology).ttl", format='ttl')
g.serialize(destination="rdfdata.ttl")

kg = kglab.KnowledgeGraph().load_rdf("rdfdata.ttl")

pyvis_graph = Network(notebook=True, directed=True)

# Define prefixes
prefixes = {
    "foaf": Namespace("http://xmlns.com/foaf/0.1/"),
    "fam": Namespace("http://example.org/family#"),
    "rdfs": Namespace("http://www.w3.org/2000/01/rdf-schema#"),
    "rdf": Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#"),
    "ex": Namespace("http://example.org/"),
}


# Convert namespaces into predefined prefixes
def get_prefixed_uri(uri):
    for prefix, base_uri in prefixes.items():
        if uri.startswith(base_uri):
            return uri.replace(base_uri, f"{prefix}:")
    return uri


# Get name to act as identifier for blank nodes
def get_label(node):
    # Check if node is a blank node
    if isinstance(node, BNode):
        name = g.value(node, prefixes["foaf"].name)
        # Check if node has foaf:name property
        if isinstance(name, Literal):
            return str(name)
    # Otherwise, return prefixed URI for non-blank nodes
    return get_prefixed_uri(str(node))

# Build a map of subproperties to their parent properties
subproperty_map = {}
for subprop, _, superprop in g.triples((None, prefixes["rdfs"].subPropertyOf, None)):
    subproperty_map[subprop] = superprop

# Generate entailments based on subPropertyOf relationships
new_triples = set()
for subj, pred, obj in g:
    # Check if the predicate has a superproperty
    if pred in subproperty_map:
        # Add a new triple for the inferred relationship
        superpred = subproperty_map[pred]
        new_triples.add((subj, superpred, obj))

# Add the new inferred triples to the graph
for subj, superpred, obj in new_triples:
    g.add((subj, superpred, obj))

# Build a map of subclass to their parent class
subclass_map = {}
for subclass, _, superclass in g.triples((None, prefixes["rdfs"].subClassOf, None)):
    subclass_map[subclass] = superclass

# Generate entailments based on subClassOf relationships
subclass_new_triples = set()
for subj, pred, obj in g:
    # Check if the object has a superclass
    if obj in subclass_map:
        # Add a new triple for the inferred relationship
        superobj = subclass_map[obj]
        subclass_new_triples.add((subj, pred, superobj))

# Add the new inferred triples to the graph
for subj, pred, superobj in subclass_new_triples:
    g.add((subj, pred, superobj))

# Visualize the graph with original and inferred triples
for subj, pred, obj in g:
    # add prefix
    subj_label = get_label(subj)
    obj_label = get_label(obj)
    pred_label = get_prefixed_uri(str(pred))

    # add nodes
    pyvis_graph.add_node(subj, label=subj_label)
    pyvis_graph.add_node(obj, label=obj_label)

    # add edge
    pyvis_graph.add_edge(subj, obj, label=pred_label, title=pred_label)

pyvis_graph.force_atlas_2based(gravity=-50, central_gravity=0.01, spring_length=100, spring_strength=0.08, damping=0.4,
                               overlap=0)
# pyvis_graph.barnes_hut()
# pyvis_graph.hrepulsion()
# pyvis_graph.repulsion()
pyvis_graph.show("graph_init.html")
