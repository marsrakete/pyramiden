import test from "node:test";
import assert from "node:assert/strict";
import { parseWords, buildGraph } from "../word-network/graph.js";
import {
  pinNode,
  stepSimulation,
  resetGraph,
} from "../word-network/simulation.js";

/** Prüft die öffentlichen APIs der Wortgeflecht-Module. Keine Parameter. @returns {Promise<void>} Prüfabschluss. */
async function contracts() {
  const expected = {
    config: ["planes", "maximumWords", "simulationSettings", "cameraPosition"],
    graph: ["parseWords", "buildGraph"],
    simulation: ["pinNode", "stepSimulation", "resetGraph"],
    model: ["createNetworkModel"],
    interaction: ["createInteraction"],
  };
  for (const [file, exports] of Object.entries(expected)) {
    assert.deepEqual(
      Object.keys(await import(`../word-network/${file}.js`)).sort(),
      exports.sort(),
    );
  }
}
test("Word network module contracts", contracts);

/** Prüft Normalisierung, Wiederholungen und Eingabegrenzen. Keine Parameter. @returns {void} Prüfergebnis. */
function parsing() {
  assert.deepEqual(parseWords("Raum\n RAUM\tIdee").words, [
    { text: "Raum", key: "raum" },
    { text: "Idee", key: "idee" },
  ]);
  assert.equal(parseWords("Ähre A\u0308hre").words.length, 1);
  assert.equal(parseWords("  \n ").words.length, 0);
  assert.throws(() => parseWords(null), TypeError);
  const words = [];
  for (let i = 0; i < 65; i++) {
    words.push("Wort" + i);
  }
  assert.equal(parseWords(words.join(" ")).omitted, 5);
  assert.equal(parseWords(words.join(" ")).words.length, 60);
}
test("Word parsing and transparent limits", parsing);

/** Prüft Wortketten, gemeinsame Begriffe und exakte Ausgangsebenen. Keine Parameter. @returns {void} Prüfergebnis. */
function connections() {
  const graph = buildGraph(["Eins Zwei eins", "zwei Drei", "ZWEI"]);
  assert.equal(graph.nodes.length, 5);
  const chains = graph.edges.filter(isChain),
    shared = graph.edges.filter(isShared);
  assert.equal(chains.length, 2);
  assert.equal(shared.length, 3);
  assert.deepEqual(chains.map(endpoints), [
    [0, 1],
    [2, 3],
  ]);
  for (const node of graph.nodes) {
    if (node.plane === "x") {
      assert.equal(node.position[2], 0);
    } else if (node.plane === "y") {
      assert.equal(node.position[0], 0);
    } else {
      assert.equal(node.position[1], 0);
    }
  }
  assert.equal(buildGraph(["", "", ""]).edges.length, 0);
  assert.equal(buildGraph(["Solo", "", ""]).nodes.length, 1);
  assert.throws(() => buildGraph(["One"]), TypeError);
  assert.throws(() => buildGraph(["", null, ""]), TypeError);
}
/** Erkennt Ebenenketten. @param {object} edge Kante. @returns {boolean} Kettentyp. */
function isChain(edge) {
  return edge.kind === "chain";
}
/** Erkennt Raumverbindungen. @param {object} edge Kante. @returns {boolean} Raumtyp. */
function isShared(edge) {
  return edge.kind === "shared";
}
/** Liefert die Endpunktindizes. @param {object} edge Kante. @returns {number[]} Endpunkte. */
function endpoints(edge) {
  return [edge.source, edge.target];
}
test("Planar chains and three-way shared words", connections);

/** Prüft Mitziehen, stabile Fixierungen und exakte Wiederherstellung. Keine Parameter. @returns {void} Prüfergebnis. */
function springs() {
  const graph = buildGraph(["A B C", "B D", ""]);
  const original = graph.nodes.map(copyPosition);
  stepSimulation(graph, 0);
  assert.deepEqual(graph.nodes.map(copyPosition), original);
  const target = [8, 4, 7];
  pinNode(graph.nodes[1], target);
  for (let i = 0; i < 240; i++) {
    stepSimulation(graph, 1 / 60);
  }
  assert.deepEqual(graph.nodes[1].position, target);
  assert.notDeepEqual(graph.nodes[0].position, original[0]);
  assert.notDeepEqual(graph.nodes[3].position, original[3]);
  for (const node of graph.nodes) {
    assert.ok(node.position.every(Number.isFinite));
  }
  resetGraph(graph);
  assert.deepEqual(graph.nodes.map(copyPosition), original);
  for (const node of graph.nodes) {
    assert.equal(node.pinned, false);
    assert.deepEqual(node.velocity, [0, 0, 0]);
  }
  stepSimulation(buildGraph(["", "", ""]), 10);
  assert.throws(() => stepSimulation(graph, -1), TypeError);
  assert.throws(() => pinNode(graph.nodes[0], [Infinity, 0, 0]), TypeError);
}
/** Kopiert die Knotenposition. @param {object} node Knoten. @returns {number[]} XYZ-Kopie. */
function copyPosition(node) {
  return [...node.position];
}
test("Elastic propagation, pinning and exact reset", springs);
