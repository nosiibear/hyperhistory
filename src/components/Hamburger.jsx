import React from 'react';
import { Panel,
  useReactFlow,
  getRectOfNodes,
  getTransformForBounds
} from 'reactflow'
import { BiSave, BiUpload, BiRevision, BiImage} from "react-icons/bi";
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image'
import './../index.css';

function downloadPng(dataUrl) {
  const a = document.createElement('a');
  a.setAttribute('download', 'reactflow.png');
  a.setAttribute('href', dataUrl);
  a.click();
}

const Hamburger = (props) => {
  const { getNodes } = useReactFlow();
  const downloadSession = async () => {
    const retrievedNodes = await chrome.storage.local.get('nodes');
    const retrievedEdges = await chrome.storage.local.get('edges');
    const combined = {nodes: retrievedNodes.nodes, edges: retrievedEdges.edges}
    const combinedJSON = JSON.stringify(combined);
    const file = new Blob([combinedJSON], { type: 'text/plain;charset=utf-8' });
    saveAs(file, 'nodes.txt');
  };

  const uploadSession = async (file) => {
    console.log("UPLOADED FILE:");
    console.log(file)
    const reader = new FileReader();
    reader.onload = function(e) {
      let obj = null;
      try {
        obj = JSON.parse(e.target.result)
      } catch(err) {
        alert("File could not be read. Make sure JSON is formatted correctly.")
      }
      props.setNodes(obj.nodes);
      chrome.storage.local.set({nodes: obj.nodes})
      props.setEdges(obj.edges);
      chrome.storage.local.set({edges: obj.edges})
    }
    reader.readAsText(file);
  }

  const saveImg = () => {
    const imageWidth = /*1920*/7920;
    const imageHeight = /*1080*/4320;
    // we calculate a transform for the nodes so that all nodes are visible
    // we then overwrite the transform of the `.react-flow__viewport` element
    // with the style option of the html-to-image library
    const nodesBounds = getRectOfNodes(getNodes());
    const transform = getTransformForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2);

    toPng(document.querySelector('.react-flow__viewport'), {
      backgroundColor: '#fff',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: imageWidth,
        height: imageHeight,
        transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
      },
    }).then(downloadPng);
  };

  return (
    <Panel className="hamburger-menu" position="top-left">
        <div className="hammenu-option" onClick={downloadSession}>
          <BiSave className="icon"/>Save node graph
        </div>
        <div className="fileUploadParent">
          <input className="fileUpload" type="file" onChange={e=>uploadSession(e.target.files[0])}/>
          <div className="hammenu-option">
            <BiUpload className="icon"/>Load node graph
          </div>
        </div>
        <div id="special" className="hammenu-option" onClick={() => {
          props.setResetWarningOpen(true)
          console.log(props.setResetWarningOpen);
        }}>
          <BiRevision className="icon"/>Reset canvas
        </div>
        <div className="hammenu-option" onClick={saveImg}>
          <BiImage className="icon"/>Export image
        </div>
    </Panel>
  );
}

export default Hamburger;
