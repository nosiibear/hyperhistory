import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

function CustomNode({ id, data, }) {
  const onChange = useCallback((evt) => {
    console.log("updated text:")
    console.log(evt.target.value);
    console.log("setNodes", data.setNodes)
    data.setNodes((nodes) => {
      console.log("inside annotateNode, nodes:", nodes)
      const newNodes = nodes.map((node) => {
        console.log("id search")
        if(node.id === `${id}`) {
          node.data.text = evt.target.value
        }
        return node
      })
      return newNodes
    })
  }, []);
  //return (
  //  <div className="annotate_node_body">
  //      <input id="text" name="text" onChange={onChange} className="nodrag" />
  //  </div>
  //);
  return (
    <div className="annotate_node_body">
    <NodeResizer className="node_resize_control" minWidth={150} minHeight={100}/>
        <textarea className="text_area nodrag" name="text" onChange={onChange}>{data.text}</textarea>
    </div>
  );
}

export default memo(CustomNode);
