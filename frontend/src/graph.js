import * as d3 from "d3";

export function drawGraph(svgEl, data, tooltipEl) {
  const width = svgEl.clientWidth;
  const height = svgEl.clientHeight;

  const svg = d3.select(svgEl);
  svg.selectAll("*").remove();
  const g = svg.append("g"); // zoom this group, not the svg

  const nodes = data.nodes.map(d => ({ ...d, id: String(d.id) }));
  const links = data.links.map(d => ({ ...d, source: String(d.source), target: String(d.target) }));

  const sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(20))
    .force("charge", d3.forceManyBody().strength(-30))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05));

  const link = g.append("g").attr("stroke", "#999").attr("stroke-opacity", 0.6)
    .selectAll("line").data(links).join("line")
    .attr("stroke-width", d => Math.sqrt(d.value));

  const node = g.append("g").selectAll("circle").data(nodes).join("circle")
    .attr("r", 4)
    .attr("fill", "#782F40") // FSU red
    .attr("stroke", "#fff").attr("stroke-width", 0.5);

  // tooltip (bonus): metadata already came with the nodes
  const tip = d3.select(tooltipEl);
  const clip = (s, n) => (s && s.length > n ? s.slice(0, n) + "…" : s || "");
  node
    .on("mouseover", (e, d) => {
      tip.style("display", "block").text(
        `${clip(d.title, 100) || d.id}\n${d.year || ""} · ${clip(d.venue, 50)}\n${clip(d.authors, 80)}`);
    })
    .on("mousemove", e => tip.style("left", e.pageX + 12 + "px").style("top", e.pageY + 12 + "px"))
    .on("mouseout", () => tip.style("display", "none"));

  // drag individual nodes
  node.call(d3.drag()
    .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
    .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

  // zoom + pan on the container group
  const zoom = d3.zoom().scaleExtent([0.05, 30])
    .on("zoom", e => g.attr("transform", e.transform));
  svg.call(zoom);

  sim.on("tick", () => {
    link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
    node.attr("cx", d => d.x).attr("cy", d => d.y);
  });

  // zoom-to-fit once the simulation settles
  sim.on("end", () => {
    const x0 = d3.min(nodes, d => d.x), x1 = d3.max(nodes, d => d.x);
    const y0 = d3.min(nodes, d => d.y), y1 = d3.max(nodes, d => d.y);
    const k = 0.9 * Math.min(width / (x1 - x0), height / (y1 - y0));
    const t = d3.zoomIdentity
      .translate(width / 2 - (k * (x0 + x1)) / 2, height / 2 - (k * (y0 + y1)) / 2)
      .scale(k);
    svg.transition().duration(750).call(zoom.transform, t);
  });

  return sim;
}