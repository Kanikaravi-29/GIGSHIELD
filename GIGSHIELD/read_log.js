const fs = require('fs');
try {
  const data = fs.readFileSync('error.log', 'utf16le');
  console.log("UTF16LE:", data);
} catch (e) {
  const data2 = fs.readFileSync('error.log', 'utf8');
  console.log("UTF8:", data2);
}
