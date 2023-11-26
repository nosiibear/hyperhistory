import React from 'react';
import {BiSave, BiUpload, BiImport, BiImage} from "react-icons/bi";
import './../index.css';

const Hamburger = (props) => {
  //<div className="hammenu-option"><BiImport className="icon"/>Export node graph</div>
  return (
    <div className="hamburger-menu">
      <div className="hammenu-option" onClick={props.download}><BiSave className="icon"/>Save node graph</div>
      <div className="hammenu-option"><BiUpload className="icon"/>Load node graph</div>
      <div className="hammenu-option" onClick={props.saveImg}><BiImage className="icon"/>Export image</div>
    </div>
  );
}

export default Hamburger;
