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
import WebNode from './nodes/WebNode.jsx'
import WebNodeRoot from './nodes/WebNodeRoot.jsx'
import WebNodeImage from './nodes/WebNodeImage.jsx'

import 'reactflow/dist/style.css';
import './overview.css';

const nodeTypes = {
  webNode: WebNode,
  webNodeRoot: WebNodeRoot,
  webNodeImage: WebNodeImage
};

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
  
  //let currentId = useRef(0);
  
  let tabs = new Map()

  let currentTab;
  /*chrome.tabs.query({active: true, currentWindow: true}, (restabs) => {
    currentTab = restabs
    chrome.runtime.sendMessage({newVispage: currentTab})
  })*/
  useEffect(() => {
    async function fetchPrevNodes() {
      const retrievedNodes = await chrome.storage.local.get('nodes');
      //console.log("Start of app, Retrieved nodes:")
      //console.log(retrievedNodes)
      //console.log(retrievedNodes.nodes)
      //console.log(retrievedNodes.nodes == null)
      //console.log(retrievedNodes.nodes.length)
      //console.log(retrievedNodes instanceof Array)
      //console.log(retrievedNodes.nodes instanceof Array)
      if(retrievedNodes.nodes != null) {
        //console.log("Setting nodes")
        //console.log("Nodes before")
        //console.log(nodes)
        setNodes((nodes) => nodes.concat(retrievedNodes.nodes))
        //console.log("After setting nodes")
        //console.log("Nodes after")
        //console.log(nodes)
      }
      const retrievedEdges = await chrome.storage.local.get('edges');
      //console.log("Start of app, retrieved edges:")
      //console.log(retrievedEdges)
      //console.log(retrievedEdges.edges)
      //console.log(retrievedNodes.edges == null)
      //console.log(retrievedEdges.edges.length)
      //console.log(retrievedEdges instanceof Array)
      //console.log(retrievedEdges.edges instanceof Array)
      if(retrievedEdges.edges != null) {
        //console.log("Setting edges")
        //console.log("Edges before")
        //console.log(edges)
        setEdges((edges) => edges.concat(retrievedEdges.edges))
        //console.log("After setting edges")
        //console.log("Edges after")
        //console.log(edges)
      }
    }
    fetchPrevNodes();
  }, []);
    

  function addNewNode(tab, prevNodeId) {
    console.log("Add new node, tab:")
    console.log(tab)
    console.log("Add new node, tab.title and tab.url:")
    console.log(tab.title)
    console.log(tab.url)
    console.log("Add new node, prevNodeId:")
    console.log(prevNodeId)
    const id = Date.now()
    setNodes((nodes) => {
      let type = "webNodeRoot";
      let x = 0;
      let y = 0;
      let prevNode = "";
      let data = {title: tab.title, url: tab.url}
      if(prevNodeId) {
        prevNode = nodes.find((node) => node.id === `${prevNodeId}`)
        console.log("addNewNode retrieved prevNode:")
        console.log(prevNode)
        if(tab.url.endsWith(".png") || tab.url.endsWith(".jpg")) {
          type = "webNodeImage"
          data = {imgUrl: tab.url}
        } else {
          type = "webNode"
        }
        x = prevNode.position.x + prevNode.width / 2 + 200;
        y = prevNode.position.y;
      }
      const newNode = {
        id: `${id}`,
        type: type,
        position: {x: x, y: y},
        data: data
      };
      console.log("inside addNewNode, setting nodes")
      chrome.storage.local.set({nodes: [...nodes, newNode]})
      chrome.storage.local.get('nodes', (res) => {
        console.log("addNewNode chrome storage: ")
        console.log(res)
      })
      console.log("addNewNode setting nodes to id:")
      tabs.set(tab.tabId, id)
      console.log(tabs)
      console.log("addNewTab, nodes:")
      console.log(nodes)
      return nodes.concat(newNode)
    })
    return id;
  }

  async function getExistingNode(url) {
    const tempNodes = await chrome.storage.local.get('nodes');
    console.log("inside getExistingNode, nodes:")
    console.log(tempNodes.nodes)
    if(tempNodes.nodes) {
      for (const node of tempNodes.nodes) {
        if(url === node.data.url) {
          return node;
        }
      }
    }
    return null;
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
          console.log("New tab and tabId:")
          console.log(message.newTab)
          console.log(message.newTab.tabId)
          const existingNode = await getExistingNode(message.newTab.url)
          console.log("newTab existingNode")
          console.log(existingNode)
          if(existingNode) {
            console.log("Node with newTab url already exists, setting changed tab id to it")
            tabs.set(message.newTab.tabId, existingNode.id)
          } else {
            /*setNodes((nodes) => {
              console.log("inside setNodes, new tab")
              const id = Date.now()
              console.log("newTab new node id: " + id)
              //const newNode = {
              //  id: `${id}`,
              //  position: {x: 0, y: 0},
              //  data: {label: `${message.newTab.title}\n${message.newTab.url}`}
              //};
              const newNode = {
                id: `${id}`,
                type: 'webNodeRoot',
                position: {x: 0, y: 0},
                data: {title: message.newTab.title, url: message.newTab.url}
              };
              console.log("inside setNodes, setting nodes")
              chrome.storage.local.set({nodes: {...nodes, newNode}})
              chrome.storage.local.get('nodes', (res) => {
                console.log("newTab chrome storage: ")
                console.log(res)
              })
              console.log("newTab setting nodes to id:")
              tabs.set(message.newTab.tabId, id)
              console.log(tabs)
              console.log("newTab, nodes:")
              console.log(nodes)
              return nodes.concat(newNode)
            })*/
            addNewNode(message.newTab);
          }
        })();
      }

      if(message.changedTab) {
        (async () => {
          console.log("Changed tab, title:")
          console.log(message.changedTab.title)
          console.log("changedTab tabs:")
          console.log(tabs)
          const id = Date.now()
          console.log("inside setNodes, changed tab")
          console.log("changedTab new node id: " + id)
          const tabId = message.changedTab.tabId
          /*const existingNode = nodes.find((node) => {
            console.log("changedTab url: " + message.changedTab.url + ", node url: " + node.data.url)
            return message.changedTab.url === node.data.url
          })*/
          /*let existingNode = undefined;
          const tempNodes = await chrome.storage.local.get('nodes');
          for (const node of tempNodes.nodes) {
            console.log("changedTab url: " + message.changedTab.url + ", node url: " + node.data.url)
            if(message.changedTab.url === node.data.url) {
              console.log("Match!")
              existingNode = node;
            }
          }*/
          const existingNode = await getExistingNode(message.changedTab.url)
          if(existingNode) {
            console.log("Node with changeTab url already exists, setting changed tab id to it")
            tabs.set(tabId, existingNode.id)
          } else {
            console.log("Node's url is new, create new node")
            console.log("changedTab tabId: " + tabId)
            const nodeId = tabs.get(tabId);
            console.log("changedTab retrieved nodeId: " + nodeId)
            console.log("outside setNodes, nodes:")
            /*setNodes((nodes) => {
              //console.log("debugging, nodes[0]: " + nodes[0])
              const prevNode = nodes.find((node) => node.id === `${nodeId}`)
              console.log("changedTab retrieved prevNode:")
              console.log(prevNode)
              //const newNode = {
              //  id: `${id}`, 
              //  position: {x: prevNode ? prevNode.position.x : 0, y: prevNode ? prevNode.position.y + 100 : 0},
              //  data: {label: `${message.changedTab.title}\n${message.changedTab.url}`}
              //};
              let newNode = null;
              let newX = prevNode.position.x + prevNode.width / 2 + 200;
              if(message.changedTab.url.endsWith(".png") || message.changedTab.url.endsWith(".jpg")) {
                newNode = {
                  id: `${id}`,
                  type: 'webNodeImage',
                  position: {x: prevNode ? newX : 0, y: prevNode ? prevNode.position.y : 0},
                  data: {imgUrl: message.changedTab.url}
                };
              } else {
                newNode = {
                  id: `${id}`,
                  type: 'webNode',
                  position: {x: prevNode ? newX : 0, y: prevNode ? prevNode.position.y : 0},
                  data: {title: message.changedTab.title, url: message.changedTab.url}
                };
              }
              chrome.storage.local.set({nodes: {...nodes, newNode}})
              chrome.storage.local.get('nodes', (res) => {
                console.log("changedTab chrome storage: ")
                console.log(res)
              })
              console.log("changedTab inside setNodes, nodes")
              console.log(nodes)
              return nodes.concat(newNode)
            })
            */
            const newNodeId = addNewNode(message.changedTab, nodeId)
            //const nodeId = tabs.get(tabId);
            setEdges((edges) => {
              console.log("edges")
              console.log(edges)
              console.log(edges instanceof Array)
              const edge = {source: `${nodeId}`, target: `${newNodeId}`}
              chrome.storage.local.set({edges: [...edges, edge]})
              chrome.storage.local.get('edges', (res) => {
                console.log("changedTab edges chrome storage: ")
                console.log(res)
              })
              return edges.concat(edge)
            });
            console.log("changeNode tabs:")
            console.log(tabs)
            console.log("setting tabId to our id, tabs:")
            console.log(tabs)
            tabs.set(tabId, newNodeId)
          }
        })();
      }

      if(message.updatedTab) {
        setNodes((nodes) => {
          console.log("Updated tab:")
          console.log(message.updatedTab)
          const tabId = message.updatedTab.tabId
          const title = message.updatedTab.title
          const url = message.updatedTab.url
          console.log("updatedTab title: " + title)
          console.log("updatedTab tabId: " + tabId)
          console.log("updatedTab url: " + url)
          const nodeId = tabs.get(tabId);
          console.log("updatedTab retrieved nodeId: " + nodeId)
          const changeNode = nodes.find((node) => node.id === `${nodeId}`)
          console.log("updatedTab retrieved changeNode:")
          console.log(changeNode)
          //return nodes
          const newNodes = nodes.map((node) => {
            if(node.id === `${nodeId}`) {
              node.data = {...node.data, title: `${title}`}
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