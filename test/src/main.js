import React from "react";
import store from "./redux/store";
import Dbz from "./components/Dbz";
import { Provider } from "react-redux";
import Header from "./components/Header.static";
import Gallery from "./components/Gallery.static";
import Counter from "./components/Counter.static#provider";
import { hydrateRoot, createRoot } from "react-dom/client";

const main = () => {
  console.log(`environment: ${process?.env?.NODE_ENV ? process.env.NODE_ENV : "not set"}`);
  // inject component by html id - "header"
  injectInHtml("header", Header);
  injectInHtml("gallery", Gallery);
  injectInHtml("dbz", Dbz, null, false);
  injectInHtml("counter", Counter, { Provider, store });
};

const injectInHtml = (id, funcComponent, redux = null, isStatic = true) => {
  // retrieve dom element by id
  const html = document.getElementById(id);
  if (!html) return;
  // retrieve data from html
  const data = getHtmlData(html, id);
  // create react component with Function
  const component = React.createElement(funcComponent, { data });
  // create Provider component if redux stuff given
  const toInject = !redux
    ? component
    : React.createElement(redux.Provider, { store: redux.store }, component);

  handleRoot(html, toInject, isStatic);
};

const getHtmlData = (domEl, id) => {
  // retrieve data with "data-id" - json stringified format
  const json = domEl.getAttribute(`data-${id}`);
  try {
    const data = JSON.parse(json);
    return data;
  } catch (e) {
    console.error(`getHtmlData - cannot parse ${json}:`, e.message);
    return {};
  }
};

const handleRoot = (domEl, component, isStatic = true) => {
  if (isStatic && process?.env?.NODE_ENV === "production") {
    // hydrating dom if component has been rendered before - static
    console.log(`Hydrating root ${domEl.id}...`);
    hydrateRoot(domEl, component);
  } else {
    // render component and inject it in dom dynamicaly - non static
    console.log(`Creating root ${domEl.id}...`);
    createRoot(domEl).render(component);
  }
};

window.addEventListener("load", main);
