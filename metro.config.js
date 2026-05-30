const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Push 'md' to allow treating markdown files as standard source files in Metro
config.resolver.sourceExts.push('md');

// Push 'mid' and 'midi' to allow bundling MIDI files as static assets
config.resolver.assetExts.push('mid');
config.resolver.assetExts.push('midi');

// Route all file transformations through our custom transformer
config.transformer.babelTransformerPath = require.resolve('./metro.transformer.js');

module.exports = config;
