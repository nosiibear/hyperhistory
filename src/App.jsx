/*global chrome*/
import React, { useCallback, useEffect, useRef, useState} from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useKeyPress
} from 'reactflow';
import { saveAs } from 'file-saver';

/*import { nodes as initialNodes, edges as initialEdges } from './initial-elements';*/
/*import CustomNode from './CustomNode';*/
import WebNode from './nodes/WebNode.jsx'
import WebNodeRoot from './nodes/WebNodeRoot.jsx'
import WebNodeImage from './nodes/WebNodeImage.jsx'
import DotNode from './nodes/DotNode.jsx'

import 'reactflow/dist/style.css';
import './overview.css';

let windowWidth = document.getElementById('root').clientWidth
let windowHeight = document.getElementById('root').clientHeight
console.log("Window width:")
console.log(windowWidth)
console.log("Window height:")
console.log(windowHeight)

const nodeTypes = {
  webNode: WebNode,
  webNodeRoot: WebNodeRoot,
  webNodeImage: WebNodeImage,
  dotNode: DotNode
};

const minimapStyle = {
  height: 120,
};

const onInit = (reactFlowInstance) => console.log('flow loaded:', reactFlowInstance);

const OverviewFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const spacePressed = useKeyPress('Space');
  const shiftPressed = useKeyPress('Shift');
  const [num, setNum] = useState(0);
  
  let tabs = new Map()

  useEffect(() => {
    async function fetchPrevNodes() {
      const retrievedNodes = await chrome.storage.local.get('nodes');
      if(retrievedNodes.nodes != null) {
        setNodes((nodes) => nodes.concat(retrievedNodes.nodes))
      }
      const retrievedEdges = await chrome.storage.local.get('edges');
      if(retrievedEdges.edges != null) {
        setEdges((edges) => edges.concat(retrievedEdges.edges))
      }
    }
    fetchPrevNodes();
  }, []);

  const handleDownload = async () => {
    const retrievedNodes = await chrome.storage.local.get('nodes');
    const retrievedEdges = await chrome.storage.local.get('edges');
    const nodesJSON = JSON.stringify(retrievedNodes)
    const edgesJSON = JSON.stringify(retrievedEdges)
    //const file = new Blob(['Hello, world!'], { type: 'text/plain;charset=utf-8' });
    const file = new Blob([nodesJSON, edgesJSON], { type: 'text/plain;charset=utf-8' });
    saveAs(file, 'nodes.txt');
  };

  const Test = () => {
    setNodes((nodes) => {
      const id = Date.now()
      const newNode = {
        id: `${id}`,
        type: 'dotNode',
        position: {x: (num % 10) * 10, y: Math.floor(num / 10) * 10}
      };
      setNum(num + 1);
      return nodes.concat(newNode)
    })
  }

  async function getRightChildren(){

  }
    
  async function addNewNode(tab, prevNodeId) {
    const id = Date.now()
    let x = 0;
    let y = await getMaxYPos() + 100;
    let type = "webNode";
    console.log("resulting y: ")
    console.log(y)
    setNodes((nodes) => {
      console.log("Nodes:")
      console.log(nodes)
      let prevNode = "";
      let data = {title: tab.title, url: tab.url}
      if(prevNodeId) {
        prevNode = nodes.find((node) => node.id === `${prevNodeId}`)
        if(tab.url.endsWith(".png") || tab.url.endsWith(".jpg")) {
          type = "webNodeImage"
          data = {imgUrl: tab.url}
        } else {
          data = {...data, input: true}
        }
        x = prevNode.position.x + prevNode.width + 40
        y = prevNode.position.y;
      }
      const newNode = {
        id: `${id}`,
        type: type,
        position: {x: x, y: y},
        data: data
      };
      chrome.storage.local.set({nodes: {...nodes, newNode}})
      tabs.set(tab.tabId, id)
      return nodes.concat(newNode)
    })
    return id;
  }

  async function getExistingNode(url) {
    const tempNodes = await chrome.storage.local.get('nodes');
    if(tempNodes.nodes) {
      for (const node of tempNodes.nodes) {
        if(url === node.data.url) {
          return node;
        }
      }
    }
    return null;
  }
  
  async function getMaxYPos() {
    const tempNodes = await chrome.storage.local.get('nodes');
    console.log("maxYPos, finding tempNodes:")
    console.log(tempNodes);
    let maxYPos = 0;
    if(tempNodes.nodes) {
      console.log("tempNodes.nodes exists")
      console.log(tempNodes.nodes)
      for (const node of tempNodes.nodes) {
        if(node.position.y > maxYPos) {
          maxYPos = node.position.y
        }
      }
    }
    console.log("resulting maxYPos:" )
    console.log(maxYPos)
    return maxYPos;
  }

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.click) {
        console.log("Clicked, inside vispage")
        console.log(message.click.link)
        //console.log(message.click.href)
        return true;
      }
      if (message.auxClick) {
        console.log("Aux clicked, inside vispage")
        console.log(message.auxClick.link)
        //console.log(message.auxClick.href)
        return true;
      }

      if(message.newTab) {
        (async () => {
          const existingNode = await getExistingNode(message.newTab.url)
          if(existingNode) {
            tabs.set(message.newTab.tabId, existingNode.id)
          } else {
            addNewNode(message.newTab);
          }
        })();
      }

      if(message.newTabBranched) {
        (async () => {
          const existingNode = await getExistingNode(message.newTabBranched.url)
          if(existingNode) {
            tabs.set(message.newTabBranched.tabId, existingNode.id)
          } else {
            const openerNodeId = tabs.get(message.newTabBranched.openerTabId)
            //console.log("openerNodeId:")
            //console.log(openerNodeId)
            const newNodeId = await addNewNode(message.newTabBranched, openerNodeId);
            setEdges((edges) => {
              const edge = {source: `${openerNodeId}`, target: `${newNodeId}`}
              chrome.storage.local.set({edges: [...edges, edge]})
              return edges.concat(edge)
            });
          }
        })();
      }

      if(message.changedTab) {
        (async () => {
          const id = Date.now()
          const tabId = message.changedTab.tabId
          const existingNode = await getExistingNode(message.changedTab.url)
          if(existingNode) {
            tabs.set(tabId, existingNode.id)
          } else {
            const nodeId = tabs.get(tabId);
            const newNodeId = await addNewNode(message.changedTab, nodeId)
            tabs.set(tabId, newNodeId)
            setEdges((edges) => {
              const edge = {source: `${nodeId}`, target: `${newNodeId}`}
              chrome.storage.local.set({edges: [...edges, edge]})
              /*chrome.storage.local.get('edges', (res) => {
                console.log("changedTab edges chrome storage: ")
                console.log(res)
              })*/
              return edges.concat(edge)
            });
          }
        })();
      }

      if(message.updatedTab) {
        setNodes((nodes) => {
          const nodeId = tabs.get(message.updatedTab.tabId);
          //return nodes
          const newNodes = nodes.map((node) => {
            if(node.id === `${nodeId}`) {
              node.data = {...node.data, title: `${message.updatedTab.title}`}
            }
            return node
          })
          chrome.storage.local.set({nodes: newNodes})
          return newNodes
        })
      }
    });
  }, [])

  return (
    <div style={{ width: 1600, height: 900 }}>
      <h1>Hyper History</h1>
      {spacePressed ? <p>Space pressed!</p> : <p>Space not pressed.</p>}
      {shiftPressed ? <p>Shift pressed!</p> : <p>Shift not pressed.</p>}
      <button onClick={() => chrome.action.setBadgeText({text: "ON",})}>Start HyperHistory</button>
      <button onClick={handleDownload}>Save node graph</button>
      <button onClick={Test}>Test</button>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit}
          fitView
          attributionPosition="top-right"
          nodeTypes={nodeTypes}
        >
          <MiniMap style={minimapStyle} zoomable pannable />
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default OverviewFlow;