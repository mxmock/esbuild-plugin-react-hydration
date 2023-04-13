import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "./counter/counter.slice";

module.exports = configureStore({
  reducer: {
    counterReducer,
  },
});
