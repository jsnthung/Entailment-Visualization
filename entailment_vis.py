from rdflib import Graph
from rdflib.namespace import NamespaceManager
import kglab
from pyvis.network import Network

# Parse in .ttl file
g = Graph()
g.parse("family_rdf.ttl", format='ttl')
# g.parse("EnDe-Lite50(without_Ontology).ttl", format='ttl')
g.serialize(destination="rdfdata.ttl")

# NamespaceManager to shorten uri
namespace_manager = NamespaceManager(g)

kg = kglab.KnowledgeGraph().load_rdf("rdfdata.ttl")

# Create a pyvis Network for visualization
pyvis_graph = Network(notebook=True, directed=True, width="100%", height="750px")

# Adding nodes and edges
for subj, pred, obj in g:
    subj_str = str(subj)
    obj_str = str(obj)
    pred_str = str(pred)

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
# pyvis_graph.show("graph_init.html")

# for index, (subj, pred, obj) in enumerate(g):
#     subj_str_uri = str(subj)
#     pred_str_uri = str(pred)
#     obj_str_uri = str(obj)
#
#     print(f"Subject: {subj_str_uri}")
#     print(f"Predicate: {pred_str_uri}")
#     print(f"Object: {obj_str_uri}")
#     if index == 1:
#         break

label_with_uri = "http://www.w3.org/2000/01/rdf-schema#type"
shortened_label = namespace_manager.qname(label_with_uri)
print(shortened_label)