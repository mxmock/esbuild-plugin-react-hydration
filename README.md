# esbuild-plugin-react-hydration

An esbuild plugin to generate react components html and insert it in an existing html file.

## Features

- Parse any react component with `.static.jsx` suffix into html
- Retrieve from a specified directory all html files
- Inject the component's html into html files which has an id corresponding with component's name
- Copy updated html files in specified out directory
- Can pass props to component from html file
- Can use redux to share a store by using the Provider component

## Before installation

You must have `esbuild@^0.17.3`, `React@^18.2.0` and `ReactDOM@^18.2.0` installed.

## Installation

Install the plugin with npm

```bash
  npm i esbuild-plugin-react-hydration
```

## Usage

Begin by adding the plugin to `esbuild` config:

```js
// esbuild.mjs

import * as esbuild from "esbuild";
import { Provider } from "react-redux";
import myStore from "./src/redux/store.js";
import reactHydrationPlugin from "esbuild-plugin-react-hydration";

const result = await esbuild.build({
  entryPoints: ["src/index.js"],
  bundle: true,
  minify: true,
  outdir: "build",
  plugins: [
    reactHydrationPlugin({
      outDir: "build/pages_w_react",
      pages: "src/pages",
      redux: {
        store: myStore,
        Provider: Provider,
      },
    }),
  ],
});
```

- `outDir`: where the html files will be copied
- `pages`: where retrieve html files
- `redux`: a litteral object containing the store that you want to share and the Provider from the `react-redux` library _(this option is not required)_

Then, create a config file for babel. This is with the help of babel that we can "transform" a react component into html from a `.jsx` file.

```json
// babel.config.json

{
  "presets": ["@babel/preset-env", "@babel/preset-react"]
}
```

Now, in a main js file, you have to link the html generated and the dynamic code from a react component.

```js
// index.js

import { hydrateRoot } from "react-dom/client";
import Header from "./components/Header.static";

const header = document.getElementById("header");
if (header) {
  hydrateRoot(header, <Header />);
}
```

## Build

To build a static version of your project, run:

```bash
  npx babel-node esbuild.mjs
```

## Rules

- Name react components files that you want to inject with the ".static.jsx" suffix. _(ex: Header.static.jsx)_
- The `id` corresponding in html file must be the name of the component in camelCase. _(MyComponent.static.jsx ===> `<div id="myComponent"></div>`)_
- You must declare the `id` attribute as the last attribute of the html element.

## With props to add

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

Retrieve data from html in your main jsx file:

```js
// index.js

import { hydrateRoot } from "react-dom/client";
import MyComponent from "./components/MyComponent.static";

const component = document.getElementById("myComponent");
if (component) {
  const json = component.getAttribute("data-myComponent");
  const data = JSON.parse(json);
  hydrateRoot(component, <MyComponent data={data} />);
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
- Then, import the store and the Provider in your main jsx file to inject the store in the components you want.

```js
// index.js

import { Provider } from "react-redux";
import myStore from "./redux/store.js";
import { hydrateRoot } from "react-dom/client";
import Header from "./components/Header.static#provider";

const header = document.getElementById("header");
if (header) {
  hydrateRoot(
    header,
    <Provider store={myStore}>
      <Header />
    </Provider>
  );
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

[esbuild-plugin-copy-html](https://github.com/mxmock/esbuild-plugin-copy-html)

[esbuild-plugin-save-server-data](https://github.com/mxmock/esbuild-plugin-save-server-data)

[esbuild-plugin-css-opti](https://github.com/mxmock/esbuild-plugin-css-opti)

## License

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
