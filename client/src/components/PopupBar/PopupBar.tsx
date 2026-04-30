import React from "react";
import "./PopupBar.css";
import { PopupVariant } from "../../context/popupContext";

interface IProp {
  msg: string;
  type?: PopupVariant;
  
  leaving?:boolean
}

const PopupBar: React.FC<IProp> = ({ msg, type,leaving }) => {
  

  const getIcon = () => {
    switch (type) {
      case "SUCCESS":
        return <i className="bi bi-check-circle-fill"></i>;
      case "ERROR":
        return <i className="bi bi-x-circle-fill"></i>;
      case "WARNING":
        return <i className="bi bi-exclamation-triangle-fill"></i>;
      default:
        return <i className="bi bi-info-circle-fill"></i>;
    }
  };

  return (
    <div className={`popup-bar ${type?.toLocaleLowerCase()} ${leaving ? "slide-out" : "slide-in"}`}>
      {getIcon()} <span>{msg}</span>
    </div>
  );
};

export default PopupBar;
