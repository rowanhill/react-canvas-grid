// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

const webpack = require('@cypress/webpack-preprocessor');
const { addMatchImageSnapshotPlugin } = require('cypress-image-snapshot/plugin');

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
module.exports = (on, config) => {
  on('file:preprocessor', webpack({
    webpackOptions: require('../../webpack.config'),
  }));

  addMatchImageSnapshotPlugin(on, config);
};