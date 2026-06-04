module.exports = ({ config }) => {
  return {
    ...config,
    version: require('./package.json').version,
  };
};
