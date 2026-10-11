import os
import pandas as pd
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # frontend dev server is a different origin

HERE = os.path.dirname(os.path.abspath(__file__))

def build_network():
    links = pd.read_csv(os.path.join(HERE, "data/paper_citation_links_within_fsu.csv"), dtype=str)
    works = pd.read_csv(os.path.join(HERE, "data/fsu_works_2021_2026.csv"), dtype=str)
    works = works.fillna("").drop_duplicates("openalex_id").set_index("openalex_id")

    # one link per unique (source, target); value = how many times it repeats
    agg = (links.groupby(["paper_id_1", "paper_id_2"]).size()
                .reset_index(name="value"))
    link_list = [{"source": str(r.paper_id_1), "target": str(r.paper_id_2), "value": int(r.value)}
                 for r in agg.itertuples()]

    ids = pd.unique(pd.concat([links["paper_id_1"], links["paper_id_2"]]))
    nodes = []
    for i in ids:
        i = str(i)
        if i in works.index:
            w = works.loc[i]
            nodes.append({"id": i, "group": w["primary_field"] or "Unknown",
                          "title": w["title"], "year": w["publication_year"],
                          "venue": w["venue"], "authors": w["authors"]})
        else:
            nodes.append({"id": i, "group": "Unknown"})
    return {"nodes": nodes, "links": link_list}

@app.get("/api/network")
def network():
    return jsonify(build_network())

if __name__ == "__main__":
    app.run(port=5001, debug=True)