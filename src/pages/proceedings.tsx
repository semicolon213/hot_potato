import React from "react";
import GoogleDocEmbed from "../components/ui/GoogleDocEmbed";
import "../styles/pages/proceedings.css";

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