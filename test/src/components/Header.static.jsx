import React from "react";

const Header = ({ data }) => {
  return (
    <div
      style={{
        gap: "16px",
        display: "flex",
        padding: "8px 12px",
        background: "white",
        alignItems: "center",
      }}
    >
      <div style={{ flex: "1 0" }}>
        <img
          style={{ width: "auto", height: "100%", maxHeight: "40px" }}
          src={`${data.ASSETS}/images/logo.svg`}
          alt="Logo"
        />
      </div>
      <p style={{ flex: "1 0" }}>header</p>
    </div>
  );
};

export default Header;
