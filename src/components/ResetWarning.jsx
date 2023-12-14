import React from 'react';
import { Panel } from 'reactflow'
import { BiRevision } from "react-icons/bi";
import './../index.css';

const ResetWarning = (props) => {
  return (
    <Panel position="bottom-center" className="resetWarning-bg" onClick={() => props.setResetWarningOpen(false)}>
        <div className="resetWarning-body" onClick={(e) => e.stopPropagation()}>
          <p>Are you sure you want to reset the canvas?</p>
        </div>
        <button className="resetWarning-button" onClick={() => {
          props.resetCanvas();
          props.closeHamburger();
        }}>
          <BiRevision className="icon"/>Reset canvas
        </button>
    </Panel>
  );
}

export default ResetWarning;
