/*global chrome*/
import React, { useCallback, useEffect, useRef} from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider
} from 'reactflow';

/*import { nodes as initialNodes, edges as initialEdges } from './initial-elements';*/
/*import CustomNode from './CustomNode';*/

import 'reactflow/dist/style.css';
import './overview.css';

/*const nodeTypes = {
  custom: CustomNode,
};*/

const minimapStyle = {
  height: 120,
};

const onInit = (reactFlowInstance) => console.log('flow loaded:', reactFlowInstance);
const initialNode = [{
  id: "0",
  data: {label: "Test node"},
  position: {x: 100, y: 0}
}]
const OverviewFlow = () => {
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  let currentId = useRef(0);
  
  const tabs = new Map()

  let currentTab;
  /*chrome.tabs.query({active: true, currentWindow: true}, (restabs) => {
    currentTab = restabs
    chrome.runtime.sendMessage({newVispage: currentTab})
  })*/

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
        console.log("New tab")
        console.log(message.newTab)
        console.log(message.newTab.tabId)
        console.log(message.newTab['tabId'])
        //addNode();
        
        setNodes((nodes) => {
          const newNode = {
            id: `${currentId.current}`,
            position: {x: currentId.current * 75, y: 0},
            data: {label: `${message.newTab.title}\n${message.newTab.url}`}
          };
          tabs.set(message.newTab.tabId, currentId.current)
          console.log("current id, new tab: " + currentId.current)
          currentId.current += 1;
          console.log("current id, new tab: " + currentId.current)
          console.log("inside addNode, new tab")
          console.log(nodes)
          return nodes.concat(newNode)
        })
        
      }

      if(message.changedTab) {
        console.log("Changed tab")
        console.log(message.changedTab.title)
        console.log("tabs, changed tab:")
        console.log(tabs)
        setNodes((nodes) => {
          const tabId = message.changedTab.id
          console.log("tabId: " + tabId)
          const nodeId = tabs.get(tabId);
          console.log("nodeId: " + nodeId)
          console.log("debugging, nodes[0]: " + nodes[0])
          const prevNode = nodes.find((node) => node.id === `${nodeId}`)
          console.log("prevNode: " + prevNode)
          const newNode = {
            id: `${currentId.current}`,
            position: {x: prevNode ? prevNode.position.x : 0, y: prevNode ? prevNode.position.y + 100 : 0},
            data: {label: `${message.changedTab.title}\n${message.changedTab.url}`}
          };
          tabs.set(tabId, currentId.current)
          console.log("current id, changed tab: " + currentId.current)
          currentId.current += 1;
          console.log("current id, changed tab: " + currentId.current)
          console.log("inside addNode, changed tab")
          console.log(nodes)
          return nodes.concat(newNode)
        })
        setEdges((eds) => eds.concat({id: `${currentId.current}`, source: `${currentId.current-1}`, target: `${currentId.current}`}));
      }

      if(message.updatedTab) {
        setNodes((nodes) => {
          console.log("Updated tab")
          console.log(message.updatedTab)
          const tabId = message.updatedTab.tabId
          const title = message.updatedTab.title
          const url = message.updatedTab.url
          console.log("Title: " + title)
          console.log("tabId: " + tabId)
          console.log("url: " + url)
          const nodeId = tabs.get(tabId);
          console.log("nodeId: " + nodeId)
          const changeNode = nodes.find((node) => node.id === `${nodeId}`)
          console.log("changeNode")
          console.log(changeNode)
          changeNode.data.label = "Test"
          //return nodes
          return nodes.map((node) => {
            if(node.id === `${nodeId}`) {
              node.data = {...node.data, label: `${title}\n${url}`}
            }
            return node
          })
        })
      }
    });
  }, [])

  return (
    <div style={{ width: 1200, height: 720 }}>
    <h1>Hyper History</h1>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onInit={onInit}
      fitView
      attributionPosition="top-right"
    >
      <MiniMap style={minimapStyle} zoomable pannable />
      <Controls />
      <Background color="#aaa" gap={16} />
    </ReactFlow>
    </div>
  );
};

export default OverviewFlow;