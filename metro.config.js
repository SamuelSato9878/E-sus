// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Suporte ao expo-sqlite na web (https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#web-setup).
config.resolver.assetExts.push('wasm');

// Headers COEP/COOP necessários para o SharedArrayBuffer usado pelo SQLite na web.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
