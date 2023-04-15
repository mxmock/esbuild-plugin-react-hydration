const path = require("path");
const React = require("react");
const fs = require("node:fs/promises");
const htmlMinifier = require("html-minifier");
const ReactDOMServer = require("react-dom/server");

const { minify } = htmlMinifier;
const { renderToString } = ReactDOMServer;
const { readFile, writeFile, cp, readdir, rm } = fs;

const CURRENT_DIR = process.cwd();

const stringIsFilled = (s) => typeof s === "string" && s.length > 0;
const checkPath = (path) => (stringIsFilled(path) ? `${CURRENT_DIR}${path}` : null);
const setPath = (path, outDir) => (stringIsFilled(path) ? `${outDir}${path}` : null);

module.exports = (options = {}) => {
  const outDir = checkPath(options.outDir);
  if (!outDir) throw new Error(`Must specify out directory`);

  const cssFrom = checkPath(options.cssFrom);
  const htmlFrom = checkPath(options.htmlFrom);
  const assetsFrom = checkPath(options.assetsFrom);

  const jsOut = setPath(options.jsOut, outDir);
  const cssOut = setPath(options.cssOut, outDir);
  const htmlOut = setPath(options.htmlOut, outDir);
  const assetsOut = setPath(options.assetsOut, outDir);

  const galleries = !!options.galleries?.length ? options.galleries : null;

  const redux = options.redux || { store: null, Provider: null };
  let pages = [];

  return {
    name: "reactHydrationPlugin",
    setup: (build) => {
      build.onStart(async () => {
        await removeFile(outDir);
        const assetsPath = assetsOut || assetsFrom;
        pages = await getPages(htmlFrom, htmlOut, assetsPath);

        if (assetsOut && assetsFrom) await cp(assetsFrom, assetsOut, { recursive: true });
        if (cssOut && cssFrom) await cp(cssFrom, cssOut, { recursive: true });
        if (assetsPath && galleries) await setGalleriesJson(galleries, assetsPath);
      });

      build.onLoad({ filter: /\.static.jsx$/ }, (args) => {
        const componentPath = args.path;

        const id = getIdFromFile(componentPath);
        const attrId = `id="${id}">`;
        const attrData = `data-${id}=`;

        for (const page of pages) {
          let { content, path } = page;
          if (!content.includes(attrId)) continue;
          const opt = {
            redux,
            attrId,
            content,
            attrData,
            componentPath,
            suffix: args.suffix,
          };
          page.content = getUpdatedPages(opt);
          console.log("Component:", id);
          console.log("Injected in:", path);
          console.log("-------------------------------------------");
          console.log("-------------------------------------------");
        }

        return { loader: "jsx" };
      });

      build.onEnd(async () => {
        const jsPaths = await getFilesPath(jsOut, "js");
        const cssPaths = await getFilesPath(cssOut || cssFrom, "css");

        for (const page of pages) {
          page.content = handleCss(cssPaths, page.path, page.content);
          page.content = handleScripts(jsPaths, page.path, page.content);
          await writeFile(page.path, page.content);
        }
      });
    },
  };
};

const removeFile = async (path) => {
  try {
    await rm(path, { recursive: true, force: true });
  } catch (e) {
    logError(`removeFile : ${e.message}`);
  }
};

/********************************** Handle paths and pages **********************************/

const getPages = async (htmlFrom, htmlOut, assetsPath) => {
  let pages = [];
  try {
    if (!htmlFrom || !htmlOut) throw new Error(`Must specify html entry & out directory`);
    await cp(htmlFrom, htmlOut, { recursive: true });
    const filesPaths = await getFilesPath(htmlOut, "html");
    pages = await readPages(filesPaths, assetsPath);
  } catch (e) {
    console.error(`getPages - Can't get html outputs paths:`, e.message);
  } finally {
    return pages;
  }
};

const getFilesPath = async (dir, ext) => {
  if (!dir) return [];
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFilesPath(res, ext) : res;
    })
  );
  return Array.prototype.concat(...files).filter((p) => p.includes(`.${ext}`));
};

const readPages = async (filesPaths, assetsPath) => {
  let pages = [];
  try {
    const pagesPromises = filesPaths.map(async (filePath) => {
      return new Promise((resolve, reject) => {
        readFile(filePath, "utf8")
          .then((c) => {
            if (!c) reject(`readPages - cannot read file at path ${filePath}`);
            const minified = minify(c, {
              caseSensitive: true,
              collapseWhitespace: true,
              conservativeCollapse: true,
            });
            const content = handleAssets(assetsPath, filePath, minified);
            resolve({ path: filePath, content });
          })
          .catch((e) => reject(e));
      });
    });
    pages = await Promise.all(pagesPromises);
  } catch (e) {
    console.error(`readPages - cannot read files`, e.message);
  } finally {
    return pages;
  }
};

/********************************** Replace tags stuff **********************************/

const handleScripts = (jsPaths, htmlPath, content) => {
  const tag = "<!-- {scripts} -->";
  const js = jsPaths.map((p) => getRelativePath(p, htmlPath)).map(createScript);
  const html = js.reduce((prev, val) => `${prev}${val}`, "");
  return replaceTagWithValue(content, tag, html);
};

const handleCss = (cssPaths, htmlPath, content) => {
  const tag = "<!-- {styles} -->";
  const css = cssPaths.map((p) => getRelativePath(p, htmlPath)).map(createLink);
  const html = css.reduce((prev, val) => `${prev}${val}`, "");
  return replaceTagWithValue(content, tag, html);
};

const handleAssets = (assetsPath, htmlPath, content) => {
  const tag = "{assets}";
  const path = assetsPath ? getRelativePath(assetsPath, htmlPath) : ".";
  return replaceAssets(content, path, tag);
};

const replaceAssets = (content, path, tag) => {
  let updated = content;
  while (updated.includes(tag)) {
    updated = replaceTagWithValue(updated, tag, path);
  }
  return updated;
};

const replaceTagWithValue = (content, tag, value) => {
  const startIndex = content.indexOf(tag);
  if (startIndex < 0) return content;
  const endIndex = startIndex + tag.length;
  const beforeTag = content.substring(0, startIndex);
  const afterTag = content.substring(endIndex);
  return `${beforeTag}${value}${afterTag}`;
};

const createLink = (link) => `<link rel="stylesheet" href="${link}">`;
const createScript = (script) => `<script defer async src="${script}"></script>`;

/********************************** Relative paths stuff **********************************/

const getRelativePath = (linkPath, htmlPath) => {
  const htmlAfterRoot = getPathAfterRoot(htmlPath, linkPath);
  const relativeDots = getRelativeDots(htmlAfterRoot.length);
  const linkAfterRoot = getPathAfterRoot(linkPath, htmlPath);
  return [relativeDots, ...linkAfterRoot].join("/");
};

const getPathAfterRoot = (path1, path2) => {
  const pathArr1 = path1.split("/");
  const pathArr2 = path2.split("/");
  return pathArr1.reduce((prev, p1, i) => (pathArr2[i] === p1 ? [...prev] : [...prev, p1]), []);
};

const getRelativeDots = (pathLength) => {
  const length = pathLength - 1;
  if (length === 0) return ".";
  let relativePath = "";
  for (let i = 0; i < length; i++) {
    relativePath += "../";
  }
  return relativePath.slice(0, -1);
};

/********************************** Inject react html stuff **********************************/

const getIdFromFile = (filePath) => {
  const fileName = path.basename(filePath, path.extname(filePath));
  const name = fileName.substring(0, fileName.indexOf(".static"));
  return `${name.slice(0, 1).toLowerCase()}${name.slice(1)}`;
};

const getUpdatedPages = (opt) => {
  const { content, attrData, attrId, componentPath, suffix, redux } = opt;
  const idLocation = content.indexOf(attrId);
  if (idLocation < 0) return content;
  const data = getComponentData(content, idLocation, attrData);
  const html = getComponentHtml(componentPath, data, suffix, redux);
  return getInjectedHtml(html, content, idLocation, attrId.length);
};

const getComponentData = (content, idLocation, attrData) => {
  if (!content.includes(attrData)) return {};
  const dataStartAt = content.indexOf(attrData) + attrData.length + 1;
  const dataEndAt = idLocation - 2;
  const data = content.substring(dataStartAt, dataEndAt);
  try {
    const parsed = JSON.parse(data);
    console.log(`${attrData}`, parsed);
    return parsed;
  } catch (e) {
    console.error(`getComponentData - cannot parse ${data} from html:`, e.message);
    return {};
  }
};

const getComponentHtml = (path, data, suffix, redux) => {
  let Component = require(path);
  if (Component.default) Component = Component.default;
  const reactComponent = React.createElement(Component, { data });
  try {
    if (!suffix.includes("provider")) return renderToString(reactComponent);
    if (!redux.store || !redux.Provider)
      throw new Error(`You must provide a store and Provider for ${path}`);
    const { store, Provider } = redux;
    return renderToString(React.createElement(Provider, { store }, reactComponent));
  } catch (e) {
    console.error(`getComponenHtml - cannot renderToString:`, e.message);
    return "";
  }
};

const getInjectedHtml = (component, page, idLocation, idSize) => {
  const beforeId = page.substring(0, idLocation + idSize);
  const afterId = page.substring(idLocation + idSize);
  return `${beforeId}${component}${afterId}`;
};

/********************************** Galleries stuff **********************************/

const setGalleriesJson = async (galleries, assetsPath) => {
  const galleryObj = await galleries.reduce(async (prevPromise, current) => {
    const prev = await prevPromise;
    const gallery = await getGallery(current, assetsPath);
    return { ...prev, [current]: gallery };
  }, Promise.resolve({}));

  await writeData(assetsPath, "galleries", JSON.stringify(galleryObj));
};

const getGallery = async (gallery, assetsPath) => {
  try {
    const filesPaths = await readdir(`${assetsPath}/${gallery}`);
    return filesPaths.map((path) => ({
      name: getFileNameFromPath(path),
      path: `${gallery}/${path}`,
    }));
  } catch (e) {
    console.error(`getGallery - cannot get files from ${gallery}:`, e.message);
    return [];
  }
};

const getFileNameFromPath = (path) => {
  const filename = path.split("/").find((el, i, arr) => i === arr.length - 1);
  return filename
    .split(".")
    .filter((el, i, arr) => i !== arr.length - 1)
    .join(".");
};

const writeData = async (saveIn, fileName, data) => {
  try {
    const dest = `${saveIn}/${fileName || "galleries"}.data.json`;
    await writeFile(dest, data);
  } catch (e) {
    console.error(`writeData - cannot write data ${fileName}:`, e.message);
  }
};
