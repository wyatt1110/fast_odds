const fs = require('fs');
const path = require('path');

// Source path for track codes list
const sourcePath = '/Users/mileswigy/Desktop/Well Oiled Machine/Track-codes-list.json';

// Destination path within the project
const destPath = path.join(__dirname, 'Track-codes-list.json');

// Copy the file
try {
  console.log(`Copying track codes from ${sourcePath} to ${destPath}`);
  fs.copyFileSync(sourcePath, destPath);
  console.log('Track codes copied successfully');
} catch (error) {
  console.error('Error copying track codes file:', error);
} 