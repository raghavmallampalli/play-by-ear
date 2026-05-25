const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Push 'md' to allow treating markdown files as standard source files in Metro
config.resolver.sourceExts.push('md');

// Route all file transformations through our custom transformer
config.transformer.babelTransformerPath = require.resolve('./metro.transformer.js');

module.exports = config;
