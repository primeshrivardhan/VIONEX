const React = require('react');
const ReactDOMServer = require('react-dom/server');

try {
  console.log(ReactDOMServer.renderToString(React.createElement(Map)));
} catch (e) {
  console.log("ERROR:", e.message);
}
