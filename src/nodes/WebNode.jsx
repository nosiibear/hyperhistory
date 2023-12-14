import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

function CustomNode({ id, data }) {
  return (
    <div className="website_node_body">
      <div className="website_node_toprow">
        {data.favIconUrl && <img className="website_node_favicon" src={data.favIconUrl}/>}
        <div className="website_node_title">
          {data.title.length > 50 ? data.title.slice(0, 50) + "..." : data.title}
        </div>
      </div>
      <div className="website_node_url">
        <i><a href={data.url}>{data.url.length > 50 ? data.url.slice(0, 50) + "..." : data.url}</a></i>
      </div>
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
