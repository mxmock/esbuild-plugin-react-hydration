import React from "react";
import galleries from "../files/galleries.data.json";

const Dbz = ({ data }) => {
  return (
    <ul>
      {galleries["images/dbz"].map((dbz) => (
        <li key={dbz.name}>
          <img
            decoding="async"
            loading="lazy"
            src={`${data.ASSETS}/${dbz.path}`}
            alt={dbz.name}
          />
        </li>
      ))}
    </ul>
  );
};

export default Dbz;
