const main = () => {
  console.log(`environement: ${process?.env?.NODE_ENV ? process.env.NODE_ENV : "development"}`);
};

window.addEventListener("load", main);
