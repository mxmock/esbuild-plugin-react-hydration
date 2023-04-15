import React from "react";
import galleries from "../files/galleries.data.json";

const Gallery = ({ data }) => {
  return (
    <ul>
      {galleries.cars.map((car) => (
        <li key={car.name}>
          <img
            decoding="async"
            loading="lazy"
            src={`${data.ASSETS}/${car.path}`}
            alt={car.name}
          />
        </li>
      ))}
    </ul>
  );
};

export default Gallery;
