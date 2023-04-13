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

  const redux = options.redux || { store: null, Provider: null };
  let pages = [];

  return {
    name: "reactHydrationPlugin",
    setup: (build) => {
      build.onStart(async () => {
        await removeFile(outDir);
        pages = await getPages(htmlFrom, htmlOut);
        if (assetsOut && assetsFrom) await cp(assetsFrom, assetsOut, { recursive: true });
        if (cssOut && cssFrom) await cp(cssFrom, cssOut, { recursive: true });
      });

      build.onLoad({ filter: /\.static.jsx$/ }, (args) => {
        console.log("react hydration onLoad (.static.jsx)");

        return { loader: "jsx" };
      });

      build.onEnd(async () => {
        const jsPaths = await getFilesPath(jsOut, "js");
        const cssPaths = await getFilesPath(cssOut || cssFrom, "css");

        for (const page of pages) {
          page.content = handleCss(cssPaths, page.path, page.content);
          page.content = handleScripts(jsPaths, page.path, page.content);
          page.content = handleAssets(assetsOut || assetsFrom, page.path, page.content);
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

const getPages = async (htmlFrom, htmlOut) => {
  let pages = [];
  try {
    if (!htmlFrom || !htmlOut) throw new Error(`Must specify html entry & out directory`);
    await cp(htmlFrom, htmlOut, { recursive: true });
    const filesPaths = await getFilesPath(htmlOut, "html");
    pages = await readPages(filesPaths);
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

const readPages = async (filesPaths) => {
  let pages = [];
  try {
    const pagesPromises = filesPaths.map(async (filePath) => {
      return new Promise((resolve, reject) => {
        readFile(filePath, "utf8")
          .then((c) => {
            if (!c) reject(`Can't read file ${filePath}`);
            const content = minify(c, {
              caseSensitive: true,
              collapseWhitespace: true,
              conservativeCollapse: true,
            });
            resolve({ path: filePath, content });
          })
          .catch((e) => reject(e));
      });
    });
    pages = await Promise.all(pagesPromises);
  } catch (e) {
    console.error(`Can't read files`, e.message);
  } finally {
    return pages;
  }
};

/********************************** Replace tags stuff **********************************/

const handleAssets = (assetsPath, htmlPath, content) => {
  const tag = "{assets}";
  const assets = assetsPath ? getRelativePath(assetsPath, htmlPath) : ".";
  return getReplacedContent(content, [assets], tag);
};

const handleScripts = (jsPaths, htmlPath, content) => {
  const tag = "<!-- {scripts} -->";
  const js = jsPaths.map((p) => getRelativePath(p, htmlPath)).map(createScript);
  return getReplacedContent(content, js, tag);
};

const handleCss = (cssPaths, htmlPath, content) => {
  const tag = "<!-- {styles} -->";
  const css = cssPaths.map((p) => getRelativePath(p, htmlPath)).map(createLink);
  return getReplacedContent(content, css, tag);
};

const getReplacedContent = (content, htmlTags, tag) => {
  const startIndex = content.indexOf(tag);
  if (startIndex < 0) return content;
  const endIndex = startIndex + tag.length;
  const beforeTag = content.substring(0, startIndex);
  const afterTag = content.substring(endIndex);
  const html = htmlTags.reduce((prev, val) => `${prev}${val}`, "");
  return `${beforeTag}${html}${afterTag}`;
};

const createScript = (script) => `<script defer async src="${script}"></script>`;
const createLink = (link) => `<link rel="stylesheet" href="${link}">`;

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
