const metroBabelTransformer = require('@expo/metro-config/babel-transformer');

module.exports.transform = async function ({ src, filename, options }) {
  if (filename.endsWith(".md")) {
    // Transform raw markdown content into a standard JS string export
    const code = `module.exports = ${JSON.stringify(src)};`;
    return metroBabelTransformer.transform({ src: code, filename, options });
  }
  return metroBabelTransformer.transform({ src, filename, options });
};
