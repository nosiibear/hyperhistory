import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

function CustomNode({ id, data }) {
  return (
    <div className="website_node_body">
      <a href={data.url}>
        <img className="website_node_img" src={data.url}/>
      </a>
      <div className="website_node_input_handle">
        <Handle type="target" position={Position.Left} id={0} />
      </div>
      <div className="website_node_output_handle">
        <Handle type="source" position={Position.Right} id={1} />
      </div>
    </div>
  );
}

export default memo(CustomNode);
