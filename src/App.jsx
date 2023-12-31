/*global chrome*/
import React, { useCallback, useEffect, useRef, useState} from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useKeyPress,
  useOnSelectionChange,
  ReactFlowProvider,
  MarkerType,
  useReactFlow
} from 'reactflow';
import { BiMenu, BiSave, BiUpload, BiPause, BiRightArrow } from "react-icons/bi";

/*import { nodes as initialNodes, edges as initialEdges } from './initial-elements';*/
/*import CustomNode from './CustomNode';*/
import WebNode from './nodes/WebNode.jsx'
import WebNodeImage from './nodes/WebNodeImage.jsx'
import AnnotateNode from './nodes/AnnotateNode.jsx';
import Hamburger from './components/Hamburger.jsx';
import ResetWarning from './components/ResetWarning.jsx'

import 'reactflow/dist/style.css';
import './overview.css';

//let windowWidth = document.getElementById('root').clientWidth
//let windowHeight = document.getElementById('root').clientHeight
//console.log("Window width:")
//console.log(windowWidth)
//console.log("Window height:")
//console.log(windowHeight)

const nodeTypes = {
  webNode: WebNode,
  webNodeImage: WebNodeImage,
  annotateNode: AnnotateNode
};

const minimapStyle = {
  height: 100,
};

function useWindowSize() {
  const [size, setSize] = useState([window.innerHeight - 54, window.innerWidth]);
  useEffect(() => {
    const topbarHeight = document.getElementsByClassName("topbar")[0].offsetHeight;
    const handleResize = () => {
      setSize([window.innerHeight - topbarHeight, window.innerWidth]);
    }
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    }
  }, [])
  return size;
}


const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);
  //const spacePressed = useKeyPress('Space');
  //const shiftPressed = useKeyPress('Shift');

  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [resetWarningOpen, setResetWarningOpen] = useState(false);
  const [flow, setFlow] = useState(null);

  const [logging, setLogging] = useState(true);
  const loggingRef = useRef(logging);
  const setLoggingRef = (data) => {
    loggingRef.current = data;
    setLogging(data);
  }
  const [height, width] = useWindowSize();
  const tabsRef = useRef(new Map());
  const { screenToFlowPosition } = useReactFlow()

  const onPaneClick = (event) => {
    console.log("onPaneClick", event);
  }

  const onPaneContextMenu = (event, node) => {
    event.preventDefault();
    console.log("onPaneContextMenu", event);
    const boundingBox = event.target.getBoundingClientRect();
    const viewport_x = event.pageX - boundingBox.left;
    const viewport_y = event.pageY - boundingBox.top;
    const returnPos = flow.screenToFlowPosition({ x: viewport_x, y: viewport_y });
    console.log("returnPos", returnPos)
    setNodes((nodes) => {
      const id = Date.now()
      const newNode = {
        id: `${id}`,
        type: 'annotateNode',
        position: returnPos,
        style: {width: 150, height: 100},
        data: {text: "", setNodes: setNodes}
      };
      chrome.storage.local.set({nodes: [...nodes, newNode]})
      return nodes.concat(newNode)
    })
    console.log("fail 4")
  }

  const onNodeClick = async (event) => {
    console.log("onNodeClick", event);
    const retrievedNodes = await chrome.storage.local.get('nodes');
    console.log(retrievedNodes)
  }

  const onNodeDoubleClick = (event) => {
    console.log("onNodeDoubleClick", event);
  }

  const onNodeContextMenu = (event) => {
    event.preventDefault();
    console.log("onNodeContextMenu", event);
  }

  const onInit = (reactFlowInstance) => {
    console.log('flow loaded:', reactFlowInstance)
    setFlow(reactFlowInstance);
  };

  useEffect(() => {
    async function fetchPrevNodes() {
      const retrievedNodes = await chrome.storage.local.get('nodes');
      if(retrievedNodes.nodes != null) {
        setNodes((nodes) => {
          const returnNodes = retrievedNodes.nodes.map((node) => {
            if(node.type == 'annotateNode') {
              node.data.setNodes = setNodes;
            }
            return node
          })
          return nodes.concat(returnNodes)
        })
      }
      const retrievedEdges = await chrome.storage.local.get('edges');
      if(retrievedEdges.edges != null) {
        setEdges((edges) => edges.concat(retrievedEdges.edges))
      }
    }
    fetchPrevNodes();
  }, []);

  function startStopLogging() {
    console.log("in startstoplogging")
    console.log(logging);
    console.log(loggingRef.current);
    if(logging) {
      console.log("is currently logging, setting logging to false");
      chrome.action.setBadgeText({text: "OFF",})
      setLoggingRef(false);
      console.log(logging);
      console.log(loggingRef.current);
    } else {
      console.log("is currently not logging, setting logging to true");
      chrome.action.setBadgeText({text: "ON",})
      setLoggingRef(true);
      console.log(logging);
      console.log(loggingRef.current);
    }
  }
    
  async function addNewNode(tab, prevNodeId) {
    console.log("%cCREATING NEW NODE", "background-color: yellow; color: black");
    console.log(`%cprevNodeId: ${prevNodeId}`, "background-color: yellow; color: black");
    const id = Date.now()
    let x = 0;
    let y = await getNewNodePos() + 100;
    let type = "webNode";
    const tempEdges = await chrome.storage.local.get('edges');
    console.log("tempEdges", tempEdges);
    const header = await fetch(tab.url, {method:'HEAD'})
    if(header) {
      const blobres = header.blob()
      if(blobres) {
        if((await blobres).type.startsWith('image/')) {
          console.log("SUCCESS, SETTING TYPE TO WEBNODEIMAGE")
          type = 'webNodeImage'
        }
      }
    }
    setNodes((nodes) => {
      let prevNode = "";
      let data = {title: tab.title, url: tab.url}
      if(prevNodeId) {
        prevNode = nodes.find((node) => node.id === `${prevNodeId}`)
        console.log(`%cprevNode: ${prevNode}`, "background-color: yellow; color: black");
        if(tab.url.startsWith("https://upload.wikimedia.org/") && (tab.url.endsWith(".png") || tab.url.endsWith(".jpg"))) {
          type = "webNodeImage"
        }
        let count = 0;
        let maxYPos = 0;
        let xPos = 0;
        if(tempEdges.edges) {
          console.log(`getNewChildNodePos, finding tempNodes for ${prevNodeId}:`)
          console.log("nodes");
          console.log(nodes)
          console.log("tempEdges");
          console.log(tempEdges);
          for(const edge of tempEdges.edges) {
            if(edge.source == prevNodeId) {
              console.log("Found edge with shared parent");
              console.log(edge);
              const childNode = nodes.find((node) => node.id == edge.target)
              console.log("childNode:")
              console.log(childNode);
              if(childNode.position.y + childNode.height) {
                count += 1;
                maxYPos = childNode.position.y + childNode.height;
                xPos = childNode.position.x;
              }
            }
          }
          console.log(maxYPos);
          console.log(xPos);
        }
        if(count > 0) {
          y = maxYPos + 20;
          x = xPos;
        } else {
          x = prevNode.position.x + (prevNode.width) + 40 //+ tab.title.length * 10
          y = prevNode.position.y;
        }
      }
      const newNode = {
        id: `${id}`,
        type: type,
        position: {x: x, y: y},
        data: data
      };
      chrome.storage.local.set({nodes: [...nodes, newNode]})
      //console.log("setting tabs")
      //console.log(tabs)
      //tabs.set(tab.tabId, id)
      tabsRef.current.set(tab.tabId, id)
      //console.log("after setting tabs")
      //console.log(tabs)
      console.log("%cRIGHT BEFORE SETNODES END", "background-color: green; color: black");
      //chrome.runtime.sendMessage({nodeReady: tab.tabId});
      chrome.runtime.sendMessage({nodeReady: tab.url});
      fetch(tab.url, {method:'HEAD'}).then((res) => {
        res.blob().then((res2) => {
          const resType = res2.type.startsWith('image/');
          console.log("RES TYPE");
          console.log(tab.url);
          console.log(tab.tabId)
          console.log(resType);
          if(resType) {
            /*setNodes((nodes) => {
              //return nodes
              const newNodes = nodes.map((node) => {
                if(node.id === `${tab.tabId}`) {
                  node.data = {...node.data, 'type': 'webNodeImage'}
                }
                return node
              })
              chrome.storage.local.set({nodes: newNodes})
              console.log(nodes);
              return newNodes
            })*/
            //chrome.runtime.sendMessage({updatedTabInfo: {url: tab.url, 'type': 'webNodeImage'}})
          }
        })
      });
      console.log("%cSETNODES END", "background-color: green; color: black");
      return nodes.concat(newNode)
    })
    console.log("%cCREATING NEW NODE END", "background-color: green; color: black");
    return id;
  }

  async function getExistingNode(url) {
    const tempNodes = await chrome.storage.local.get('nodes');
    console.log("let's see if tempNodes is iterable");
    console.log(tempNodes);
    if(tempNodes.nodes) {
      for (const node of tempNodes.nodes) {
        if(node.data != null && url === node.data.url) {
          return node;
        }
      }
    }
    return null;
  }
  
  async function getNewNodePos() {
    const tempNodes = await chrome.storage.local.get('nodes');
    console.log("getNewNodePos, finding tempNodes:")
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

  async function resetCanvas() {
    console.log("Resetting canvas!!!");
    setNodes([]);
    setEdges([]);
    console.log("tabs before:")
    console.log(tabsRef.current);
    tabsRef.current.clear();
    console.log("tabs after");
    console.log(tabsRef.current);
    chrome.storage.local.set({nodes: null});
    chrome.storage.local.set({edges: null});
    chrome.runtime.sendMessage({clearTabs: "true"});
  }

  /*const handleKeyPress = useCallback((event) => {
    console.log(`Key pressed: ${event.key}`);
    if(event.key == 'Delete') {
      if(selectedNodes.length > 0) {
        const {selectedNodes, ...rest} = 
      }
    }
  }, []);

  useEffect(() => {
    // attach the event listener
    document.addEventListener('keydown', handleKeyPress);

    // remove the event listener
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);*/

  const onNodesDelete = useCallback((deleted) => {
    console.log(deleted);
  })

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if(!loggingRef.current) {
        console.log("%cnot logging", 'background-color: yellow')
        console.log(logging);
        return;
      }
      console.log("message:")
      console.log(message)
      /*if (message) {
        console.log("%cClicked, inside vispage", 'background-color: black; color: red; font-size: 18px')
        console.log(message.click)
        //console.log(message.click.link)
        //console.log(message.click.href)
        return true;
      }
      if (message.auxClick) {
        console.log("%cAux clicked, inside vispage", 'background-color: black; color: red; font-size: 18px')
        console.log(message.auxClick)
        //console.log(message.auxClick.link)
        //console.log(message.auxClick.href)
        return true;
      }*/

      if(message.newTab) {
        console.log("%cNEW TAB", "background-color: yellow; color: black");
        (async () => {
          const existingNode = await getExistingNode(message.newTab.url)
          if(existingNode) {
            //tabs.set(message.newTab.tabId, existingNode.id)
            const currentNodeId = await tabsRef.current.get(message.newTab.tabId)
            console.log("in newTab, fetched currentNodeId:")
            console.log(currentNodeId)
            tabsRef.current.set(tabId, existingNode.id)
            setEdges((edges) => {
              const parentEdge = edges.find((edge) => edge.source == existingNode.id && edge.target == currentNodeId);
              if(!parentEdge) {
                const edge = {source: `${currentNodeId}`, target: `${existingNode.id}`, markerEnd: {type: MarkerType.ArrowClosed}}
                chrome.storage.local.set({edges: [...edges, edge]})
                return edges.concat(edge)
              }
              return edges
            });
          } else {
            console.log("%cAdded new node from new tab", "color: blue");
            addNewNode(message.newTab);
          }
        })();
        console.log("%cNEW TAB END", "background-color: green; color: black");
      }

      if(message.newTabBranched) {
        (async () => {
          console.log("In vispage, new tab branched")
          const existingNode = await getExistingNode(message.newTabBranched.url)
          if(existingNode) {
            //tabs.set(message.newTabBranched.tabId, existingNode.id)
            const currentNodeId = await tabsRef.current.get(message.newTabBranched.tabId)
            console.log("in newTabBranched, fetched currentNodeId:")
            console.log(currentNodeId)
            tabsRef.current.set(tabId, existingNode.id)
            setEdges((edges) => {
              const parentEdge = edges.find((edge) => edge.source == existingNode.id && edge.target == currentNodeId);
              if(!parentEdge) {
                const edge = {source: `${currentNodeId}`, target: `${existingNode.id}`, markerEnd: {type: MarkerType.ArrowClosed}}
                chrome.storage.local.set({edges: [...edges, edge]})
                return edges.concat(edge)
              }
              return edges
            });
          } else {
            //const openerNodeId = tabs.get(message.newTabBranched.openerTabId)
            const openerNodeId = tabsRef.current.get(message.newTabBranched.openerTabId);
            //console.log("openerNodeId:")
            //console.log(openerNodeId)
            console.log("%cAdded new node from new tab branched", "color: blue");
            const newNodeId = await addNewNode(message.newTabBranched, openerNodeId);
            setEdges((edges) => {
              const edge = {source: `${openerNodeId}`, target: `${newNodeId}`, markerEnd: {type: MarkerType.ArrowClosed}}
              chrome.storage.local.set({edges: [...edges, edge]})
              return edges.concat(edge)
            });
          }
        })();
      }

      if(message.changedTab) {
        (async () => {
          console.log("In vispage, changed tab")
          const tabId = message.changedTab.tabId
          console.log("tabId")
          console.log(tabId);
          const existingNode = await getExistingNode(message.changedTab.url)
          console.log("existingNode");
          console.log(existingNode);
          //const nodeId = tabs.get(tabId);
          const nodeId = tabsRef.current.get(tabId);
          console.log("tabs");
          console.log(tabsRef.current);
          console.log("nodeId");
          console.log(nodeId);
          if(existingNode) {
            //tabs.set(tabId, existingNode.id)
            const currentNodeId = await tabsRef.current.get(message.changedTab.tabId)
            console.log("in changedTab, fetched currentNodeId:")
            console.log(currentNodeId)
            tabsRef.current.set(tabId, existingNode.id)
            setEdges((edges) => {
              const parentEdge = edges.find((edge) => edge.source == existingNode.id && edge.target == currentNodeId);
              if(!parentEdge) {
                const edge = {source: `${currentNodeId}`, target: `${existingNode.id}`, markerEnd: {type: MarkerType.ArrowClosed}}
                chrome.storage.local.set({edges: [...edges, edge]})
                return edges.concat(edge)
              }
              return edges
            });
          } else if(nodeId) {
            console.log("%cAdded new node from changed tab", "color: blue");
            const newNodeId = await addNewNode(message.changedTab, nodeId)
            //tabs.set(tabId, newNodeId)
            tabsRef.current.set(tabId, newNodeId)
            setEdges((edges) => {
              const edge = {source: `${nodeId}`, target: `${newNodeId}`, markerEnd: {type: MarkerType.ArrowClosed}}
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

      if(message.updatedTabInfo) {
        console.log("In vispage, new updated tab queue method")
        console.log(message.updatedTabInfo);
        const data = message.updatedTabInfo.data;
        setNodes((nodes) => {
          console.log("updatedTabInfo nodes:")
          console.log(nodes)
          const existingNode = nodes.find((node) => {
            return node.data != null && node.data.url === message.updatedTabInfo.url
          })
          const nodeId = existingNode.id
          //const nodeId = tabsRef.current.get(message.updatedTabInfo.tabId);
          //return nodes
          const newNodes = nodes.map((node) => {
            if(node.id === `${nodeId}`) {
              node.data = {...node.data, ...data}
            }
            return node
          })
          chrome.storage.local.set({nodes: newNodes})
          chrome.runtime.sendMessage({nextInput: message.updatedTabInfo.url});
          return newNodes
        })
      }

    });
  }, [])

  return (
    <div>
      <div className="topbar">
        <BiMenu onClick={() => setHamburgerOpen(!hamburgerOpen)} className="hamburger-icon"/>
        <img className="logo" src="./images/logo.png"/>
        {logging ?
          <button onClick={() => startStopLogging()}><BiPause className="icon"/>Stop HyperHistory</button> :
          <button onClick={() => startStopLogging()}><BiRightArrow className="icon"/>Start HyperHistory</button>
        }
      </div>
      <div style={{width: width, height: height}}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={onInit}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeContextMenu={onNodeContextMenu}
            onNodesDelete={onNodesDelete}
            fitView
            attributionPosition="top-right"
            nodeTypes={nodeTypes}
          >
            <MiniMap style={minimapStyle} zoomable pannable />
            <Controls/>
            <Background color="#aaa" gap={16} />
            {resetWarningOpen && <ResetWarning
              setResetWarningOpen={setResetWarningOpen}
              resetCanvas={resetCanvas}
              closeHamburger={() => setHamburgerOpen(false)}
            />}
            {hamburgerOpen && <Hamburger
              setNodes={setNodes}
              setEdges={setEdges}
              setResetWarningOpen={setResetWarningOpen}
            />}
          </ReactFlow>
      </div>
    </div>
  );
};

function AppWithProvider() {
  return (
    <ReactFlowProvider>
      <App/>
    </ReactFlowProvider>
  )
}

export default AppWithProvider;