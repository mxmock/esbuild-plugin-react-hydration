# esbuild-plugin-react-hydration

An esbuild plugin to generate react components html and insert it in an existing html file.

## Features

- Parse any react component with `.static.jsx` suffix into html
- Retrieve all html files from a specified directory
- Inject the component's html into a main html file which has an id corresponding with component's name
- Get a new minified html file from it
- Can pass props to component from html file
- Can use redux to share a store by using the Provider component
- Use specials tags in html for auto inject scripts, css and assets
- Generate a json file representing multiple files from assets (Array of objects with name & path of each file)

## Before installation

You must have `esbuild@^0.17.3`, `React@^18.2.0` and `ReactDOM@^18.2.0` installed.

## Installation

Install the plugin with npm

```bash
  npm i esbuild-plugin-react-hydration
```

## Usage

Begin by adding the plugin to `esbuild` config:

### Example for dev

```js
// esbuild.mjs

import * as esbuild from "esbuild";
import { Provider } from "react-redux";
import store from "./src/redux/store.js";
import reactHydrationPlugin from "../index.min.js";

const SRC = "test/src";
const OUT = "test/dev";
const REDUX = { store, Provider };

const ctx = await esbuild.context({
  entryPoints: [`${SRC}/main.js`],
  bundle: true,
  plugins: [
    reactHydrationPlugin({
      redux: REDUX,

      cssFrom: `/${SRC}/styles`,
      htmlFrom: `/${SRC}/pages`,
      assetsFrom: `/${SRC}/files`,

      outDir: `/${OUT}`,
      jsOut: "/js", // => /${OUT}/js => /test/dev/js
      htmlOut: "/", // => /${OUT}/   => /test/dev/

      galleries: ["cars", "images/dbz"],
    }),
  ],
  outdir: `${OUT}/js`, // must be the same as jsOut option
});

await ctx.watch();
```

### Example for prod

```js
import * as esbuild from "esbuild";
import { Provider } from "react-redux";
import store from "./src/redux/store.js";
import { writeFile } from "node:fs/promises";
import reactHydrationPlugin from "../index.min.js";

const SRC = "test/src";
const OUT = "test/prod";
const REDUX = { store, Provider };

const TIME_LOG = `Build time`;

console.time(TIME_LOG);
const result = await esbuild.build({
  entryPoints: [`${SRC}/main.js`],
  bundle: true,
  minify: true,
  plugins: [
    reactHydrationPlugin({
      redux: REDUX,

      cssFrom: `/${SRC}/styles`,
      htmlFrom: `/${SRC}/pages`,
      assetsFrom: `/${SRC}/files`,

      outDir: `/${OUT}`,
      jsOut: "/js", // => /${OUT}/js => /test/prod/js
      htmlOut: "/", // => /${OUT}/   => /test/prod/
      cssOut: "/css",
      assetsOut: "/assets",

      galleries: ["cars", "images/dbz"],
    }),
  ],
  outdir: `${OUT}/js`, // must be the same as jsOut option
  metafile: true,
  legalComments: "none",
  pure: ["console"],
});
console.timeEnd(TIME_LOG);

await writeFile("meta.json", JSON.stringify(result.metafile));
```

### Babel config

Then, create a config file for babel. This is with the help of babel that we can "transform" a react component into html from a `.jsx` file.

```json
// babel.config.json

{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}
```

### Entry point config

Now, in a main js file, you have to link the html generated and the dynamic code from a react component.

```js
// index.js

import React from "react";
import { hydrateRoot } from "react-dom/client";
import Header from "./components/Header.static";

const header = document.getElementById("header");
if (header) {
  hydrateRoot(header, React.createElement(Header));
}
```

## Build

To build a static version of your project, run:

```bash
  npx babel-node esbuild.mjs
```

## Rules

- Name react components files that you want to inject and hydrate with the ".static.jsx" suffix. _(ex: Header.static.jsx)_
- The `id` corresponding in html file must be the name of the component in camelCase. _(MyComponent.static.jsx ===> `<div id="myComponent"></div>`)_
- You must declare the `id` attribute as the last attribute of the html element.
- In your html files, add `<!-- {scripts} -->` where you want inject your js, `<!-- {styles} -->` where you want inject your css and `{assets}` everywhere you have a relative path to your assets folder

```html
<head>
  <!-- {styles} -->
</head>
<body>
  <img
    src="{assets}/images/myPicture.png"
    alt="logo"
  />

  <!-- {scripts} -->
</body>
```

## With props to add

### In html file

If you want to pass some props to a component injected in html, you can do it by adding a data attribute.

```html
<div
  data-myComponent='{"someData":3242, "someOtherData":"My data"}'
  id="myComponent"
></div>
```

- The format of the attribute is `data-COMPONENT_ID`.
- The format of the value must be a litteral object stringified.
- The `data` attribute must be placed just before the `id` attribute.

### In js file

Retrieve data from html in your main js file:

```js
// index.js

import { hydrateRoot } from "react-dom/client";
import MyComponent from "./components/MyComponent.static";

const component = document.getElementById("myComponent");
if (component) {
  const json = component.getAttribute("data-myComponent");
  const data = JSON.parse(json);
  hydrateRoot(component, React.createElement(MyComponent, { data }) />);
}
```

You can now retrieve data via props in your component.

```js
const MyComponent = ({ data }) => {
  return <p>{data.someOtherData}</p>;
};
```

## With Redux

If you want to share a store between differents components injected in different place, or not, you can do it.

- First, add the redux object option in the esbuild config like seen in the Usage section.
- Then, import the store and the Provider in your main js file to inject the store in the components you want.

```js
// index.js

import { Provider } from "react-redux";
import myStore from "./redux/store.js";
import { hydrateRoot } from "react-dom/client";
import Header from "./components/Header.static#provider";

const header = document.getElementById("header");
if (header) {
  const component = React.createElement(Header);
  hydrateRoot(header, React.createElement(Provider, { store: myStore }, component));
}
```

That's all ! And you can do it for every component you want.

**!! To work correctly you must add the suffix `#provider` in the import of the component which need the store !!**

---

---

## 🚀 About Me

I'm just a javascript and light weight app lover

## 🛠 Skills

Javascript, ReactJS, NodeJS, Redux, Angular, NextJS, Esbuild, Postgres, MongoDB, Wordpress...

## Related

Here are some related projects

[esbuild-plugin-save-server-data](https://github.com/mxmock/esbuild-plugin-save-server-data)

[esbuild-plugin-css-opti](https://github.com/mxmock/esbuild-plugin-css-opti)

## License

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
