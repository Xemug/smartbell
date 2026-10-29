const fs = require('fs');
const path = require('path');

// Function to read package.json from node_modules
function getPackageVersion(packageName) {
  try {
    const packagePath = path.join(__dirname, 'node_modules', packageName, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    return 'Not installed';
  }
}

// Check React Router packages
console.log('React Router Versions:');
console.log('react-router:', getPackageVersion('react-router'));
console.log('react-router-dom:', getPackageVersion('react-router-dom'));

// Check React versions
console.log('\nReact Versions:');
console.log('react:', getPackageVersion('react'));
console.log('react-dom:', getPackageVersion('react-dom'));

// Check other key dependencies
console.log('\nOther Key Dependencies:');
console.log('axios:', getPackageVersion('axios'));
console.log('chart.js:', getPackageVersion('chart.js'));
