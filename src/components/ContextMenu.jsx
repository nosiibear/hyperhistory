import React from 'react';
import { Panel,
  useReactFlow,
  getRectOfNodes,
  getTransformForBounds
} from 'reactflow'
import './../index.css';

const ContextMenu = (props) => {
  return (
    <Panel className="context-menu" position="top-left">
        <div className="context-option">
          Context
        </div>
    </Panel>
  );
}

export default ContextMenu;
