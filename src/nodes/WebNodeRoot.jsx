import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

function CustomNode({ id, data }) {
  return (
    <div className="website_node_body">
      <div className="website_node_title">
        <b>{data.title.length > 50 ? data.title.slice(0, 50) + "..." : data.title}</b>
      </div>
      <div className="website_node_url">
        <i><a href={data.url}>{data.url.length > 50 ? data.url.slice(0, 50) + "..." : data.url}</a></i>
      </div>
      <div className="website_node_output_handle">
        <Handle type="source" position={Position.Right} id={0} />
      </div>
    </div>
  );
}

export default memo(CustomNode);
