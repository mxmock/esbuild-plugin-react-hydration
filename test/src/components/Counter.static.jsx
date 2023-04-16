import React from "react";
import { useSelector } from "react-redux";

const Counter = () => {
  const { value } = useSelector((store) => store.counterReducer);

  return (
    <p style={{ fontSize: "20px" }}>
      <span>Counter value: </span>
      <span>{value}</span>
    </p>
  );
};

export default Counter;
