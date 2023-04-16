import React from "react";
import store from "../redux/store";
import { decrement, increment } from "../redux/counter/counter.slice";

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
      {data.showCounter && (
        <div className="counter-btns">
          <button
            type="button"
            onClick={() => handleCounterChange(1)}
          >
            Increment
          </button>
          <button
            type="button"
            onClick={() => handleCounterChange(-1)}
          >
            Decrement
          </button>
        </div>
      )}
    </div>
  );
};

const dispatch = store.dispatch;

const handleCounterChange = (value) => {
  value < 0 ? dispatch(decrement()) : dispatch(increment());
};

export default Header;
