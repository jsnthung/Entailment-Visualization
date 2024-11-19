from rdflib import Graph, URIRef, Literal, BNode, Namespace
from rdflib.namespace import NamespaceManager
import kglab
from pyvis.network import Network

# Parse in .ttl file
g = Graph()
g.parse("family_rdf.ttl", format='ttl')
# g.parse("EnDe-Lite50(without_Ontology).ttl", format='ttl')
g.serialize(destination="rdfdata.ttl")

kg = kglab.KnowledgeGraph().load_rdf("rdfdata.ttl")

# Create a pyvis Network for visualization
pyvis_graph = Network(notebook=True, directed=True, width="100%", height="750px")

# NamespaceManager to shorten uri
namespace_manager = NamespaceManager(g)


def get_label(term):
    if isinstance(term, URIRef):
        return namespace_manager.qname(str(term))
    if isinstance(term, Literal):
        return str(term)
    elif isinstance(term, BNode):
        return "BNode"
    return "Not URIRef, Literal, nor BNode"


# RDFS Entailment Engine
rdfs = Namespace("http://www.w3.org/2000/01/rdf-schema#")

# RDFS7
# Build a map of subproperties to their parent properties
subproperty_map = {}
for subprop, _, superprop in g.triples((None, rdfs.subPropertyOf, None)):
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

# RDFS9
# Build a map of subclass to their parent class
subclass_map = {}
for subclass, _, superclass in g.triples((None, rdfs.subClassOf, None)):
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

# Adding nodes and edges
for subj, pred, obj in g:
    subj_str = get_label(subj)
    obj_str = get_label(obj)
    pred_str = get_label(pred)

    # add nodes
    pyvis_graph.add_node(subj_str, label=subj_str)
    pyvis_graph.add_node(obj_str, label=obj_str)

    # add edge
    pyvis_graph.add_edge(subj_str, obj_str, label=pred_str)

pyvis_graph.force_atlas_2based(gravity=-50, central_gravity=0.01, spring_length=100, spring_strength=0.08, damping=0.4,
                               overlap=0)
# pyvis_graph.barnes_hut()
# pyvis_graph.hrepulsion()
# pyvis_graph.repulsion()
pyvis_graph.show("graph_init.html")
