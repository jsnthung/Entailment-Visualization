def generate_ttl_file(filename):
    # Define prefixes
    prefixes = """@prefix ex: <http://example.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .\n
"""
    # Initialize content with prefixes
    content = prefixes

    rdfs2_limit = 50 # 2
    rdfs3_limit = 50# 2
    rdfs5_limit = 10 # 2
    rdfs6_limit = 20 # 1
    rdfs7_limit = 5 # 2
    rdfs8_10_limit = 10 # 1
    rdfs11_limit = 5 # 2
    rdfs12_limit = 10 # 1
    dummy_uri = 0 # 1
    dummy_literal = 0 # 1

    # rdfs2
    # initial triples: 2
    # rules applied: 7 rdfs1, 1 rdfs2, 5 rdfs4a, 2 rdfs4b, 7 rdfs9, 7 rdfs13
    # total inference: 29
    content += f"# rdfs2\n"
    for i in range(1, rdfs2_limit + 1):
        content += f"ex:domainPred{i} rdfs:domain ex:domainType{i} .\n"
        content += f"ex:domainSubject{i} ex:domainPred{i} ex:domainObject{i} .\n\n"

    # rdfs3
    # initial triples: 2
    # rules applied: 7 rdfs1, 1 rdfs3, 5 rdfs4a, 2 rdfs4b, 7 rdfs9, 7 rdfs13
    # total inference: 29
    content += f"# rdfs3\n"
    for i in range(1, rdfs3_limit + 1):
        content += f"ex:rangePred{i} rdfs:range ex:rangeType{i} .\n"
        content += f"ex:rangeSubject{i} ex:rangePred{i} ex:domainObject{i} .\n\n"

    # rdfs5
    # initial triples: 2
    # rules applied: 6 rdfs1, 4 rdfs4a, 2 rdfs4b, 1 rdfs5, 6 rdfs9, 6 rdfs13
    # total inference: 25
    content += f"# rdfs5\n"
    for i in range(1, rdfs5_limit + 1):
        content += f"ex:rdfs5First{i} rdfs:subPropertyOf ex:rdfs5Second{i} .\n"
        content += f"ex:rdfs5Second{i} rdfs:subPropertyOf ex:rdfs5Third{i} .\n\n"

    # rdfs6
    # initial triples: 1
    # rules applied: 5 rdfs1, 3 rdfs4a, 2 rdfs4b, 1 rdfs6, 5 rdfs9, 5 rdfs13
    # total inference: 21
    content += f"# rdfs6\n"
    for i in range(1, rdfs6_limit + 1):
        content += f"ex:rdfs6Sub{i} rdf:type rdf:Property .\n\n"

    # rdfs7
    # initial triples: 2
    # rules applied: 7 rdfs1, 5 rdfs4a, 2 rdfs4b, 1 rdfs7, 7 rdfs9, 7 rdfs13
    # total inference: 29
    content += f"# rdfs7\n"
    for i in range(1, rdfs7_limit + 1):
        content += f"ex:subProp{i} rdfs:subPropertyOf rdf:superProp{i} .\n"
        content += f"ex:rdfs7Sub{i} ex:subProp{i} rdf:rdfs7Obj{i} .\n\n"

    # rdfs8 + rdfs10
    # initial triples: 1
    # rules applied: 5 rdfs1, 3 rdfs4a, 2 rdfs4b, 1 rdfs8, 5 rdfs9, 1 rdfs10, 5 rdfs13
    # total inference: 22
    content += f"# rdfs8 + rdfs10\n"
    for i in range(1, rdfs8_10_limit + 1):
        content += f"ex:rdfs8Sub{i} rdf:type rdfs:Class .\n\n"

    # rdfs11
    # initial triples: 2
    # rules applied: 6 rdfs1, 4 rdfs4a, 2 rdfs4b, 6 rdfs9, 1 rdfs11, 6 rdfs13
    # total inference: 25
    content += f"# rdfs11\n"
    for i in range(1, rdfs11_limit + 1):
        content += f"ex:rdfs11First{i} rdfs:subClassOf ex:rdfs11Second{i} .\n"
        content += f"ex:rdfs11Second{i} rdfs:subClassOf ex:rdfs11Third{i} .\n\n"

    # rdfs12
    # initial triples: 1
    # rules applied: 6 rdfs1, 4 rdfs4a, 2 rdfs4b, 6 rdfs9, 1 rdfs12, 6 rdfs13
    # total inference: 25
    content += f"# rdfs12\n"
    for i in range(1, rdfs12_limit + 1):
        content += f"ex:rdfs12Sub{i} rdf:type rdfs:ContainerMembershipProperty .\n\n"

    # Dummy triples (object is a uri)
    # initial triples: 1
    # rules applied: 5 rdfs1, 3 rdfs4a, 2 rdfs4b, 5 rdfs9, 5 rdfs13
    # total inference: 20
    content += f"# dummy triples (object is a namedNode)\n"
    for i in range(1, dummy_uri + 1):
        content += f"ex:dummySub{i} ex:dummyPred{i} ex:dummyObj{i} .\n"

    # Dummy triples (object is a namedNode)
    # initial triples: 1
    # rules applied: 4 rdfs1, 2 rdfs4a, 3 rdfs4b, 5 rdfs9, 4 rdfs13
    # total inference: 18
    content += f"# dummy triples (object is a literal)\n"
    for i in range(1, dummy_literal + 1):
        content += f"ex:dummySub{i} ex:dummyPred{i} \"dummyObj{i}\" .\n"

    # Write to file
    with open(filename, "w") as file:
        file.write(content)

generate_ttl_file("generated_test.ttl")
