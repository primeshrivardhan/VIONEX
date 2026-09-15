const React = require('react');
function Component() {
  const [val, setVal] = React.useState(0);
  React.useMemo(() => {
    const xyz = {};
    return xyz;
  }, [xyz, val]);
}
// just to evaluate the script
console.log(Component.toString());
