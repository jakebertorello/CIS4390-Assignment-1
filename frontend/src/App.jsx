import { useEffect, useRef, useState } from "react";
import { drawGraph } from "./graph";
import "./App.css";

export default function App() {
  const svgRef = useRef(null);
  const tipRef = useRef(null);
  const [status, setStatus] = useState("Loading…");

  useEffect(() => {
    let sim;
    fetch("http://127.0.0.1:5001/api/network")
      .then(r => r.json())
      .then(data => {
        setStatus(`${data.nodes.length} papers, ${data.links.length} citations`);
        sim = drawGraph(svgRef.current, data, tipRef.current);
      })
      .catch(err => setStatus("Error: " + err));
    return () => sim && sim.stop();
  }, []);

  return (
    <div className="app">
      <h1>Citation Network Visualization in FSU (jmb23a, JakeBertorello)</h1>
      <div className="status">{status}</div>
      <svg ref={svgRef} className="graph" />
      <div ref={tipRef} className="tooltip" />
    </div>
  );
}