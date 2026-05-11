const processShim = {
  browser: true,
  env: {},
  argv: [],
  version: "",
  versions: {},
  platform: "browser",
  cwd() {
    return "/";
  },
  nextTick(callback, ...args) {
    Promise.resolve().then(() => callback(...args));
  }
};

module.exports = processShim;
module.exports.default = processShim;
