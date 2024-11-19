from rdflib import Graph, URIRef, Literal, BNode, Namespace
from rdflib.namespace import NamespaceManager, RDF, RDFS
import kglab
from pyvis.network import Network

# Parse in .ttl file
ttl_path = "family_rdf.ttl"
g = Graph()
g.parse(ttl_path, format='ttl')
# g.parse("EnDe-Lite50(without_Ontology).ttl", format='ttl')

kg = kglab.KnowledgeGraph().load_rdf(ttl_path)

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
# rdfs6
# Get all subj of type rdf:property
for subj, _, _ in g.triples((None, RDF.type, RDF.Property)):
    g.add((subj, RDFS.subPropertyOf, subj))

# rdfs7
for subprop, _, superprop in g.triples((None, RDFS.subPropertyOf, None)):
    for subj, pred, obj in g:
        if pred == subprop:
            g.add((subj, superprop, obj))

# rdfs9
for subclass, _, superclass in g.triples((None, RDFS.subClassOf, None)):
    for subj, pred, obj in g:
        if obj == subclass:
            g.add((subj, pred, superclass))

# Adding nodes and edges in g for visualization
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

g.serialize(destination="rdfdata_entailed.ttl")
