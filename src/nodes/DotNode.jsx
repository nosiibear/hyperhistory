import React, { memo } from 'react';

function CustomNode({ id, data }) {
  return (
    <div className="dotnode"></div>
  );
}

export default memo(CustomNode);
