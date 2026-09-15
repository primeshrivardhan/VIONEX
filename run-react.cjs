const fs = require('fs');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const LocationMapping = require('./out-loc.cjs').default;

try {
  ReactDOMServer.renderToString(React.createElement(LocationMapping, {
    language: "en",
    dealers: [],
  }));
} catch (e) {
  console.log("CAUGHT ERROR:", e.message);
  console.log(e.stack);
}
