import React from "react";
import GoogleDocEmbed from "../components/GoogleDocEmbed";
import "./proceedings.css";

const Proceedings: React.FC = () => {
  return (
    <div className="proceedings-layout">
      <div className="form-wrapper">
          <GoogleDocEmbed />
      </div>
    </div>
  );
};

export default Proceedings;