import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

function CustomNode({ id, data }) {
  return (
    <div className="website_node_body">
      <img className="website_node_img" src={data.imgUrl}/>
      <div className="website_node_input_handle">
        <Handle type="target" position={Position.Left} id={0} />
      </div>
    </div>
  );
}

export default memo(CustomNode);
