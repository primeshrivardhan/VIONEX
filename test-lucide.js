const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { MapPin } = require('lucide-react');

try {
  console.log(ReactDOMServer.renderToString(React.createElement(MapPin)));
} catch (e) {
  console.log(e.message);
  console.log(e.stack);
}
