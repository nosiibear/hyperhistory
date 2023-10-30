import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

function CustomNode({ id, data }) {
  return (
    <>
      <div className="website_node_title">
        Title
      </div>
      <div className="website_node_url">
        Url
      </div>
      <div className="website_node_output_handle">
        <Handle type="source" position={Position.Right} id={handleId} />
      </div>
    </>
  );
}

export default memo(CustomNode);
