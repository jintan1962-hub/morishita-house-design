const path = require('path');
const fs = require('fs');

const prismaFile = path.resolve('src/lib/prisma.ts');
console.log(`Checking ${prismaFile}...`);
if (fs.existsSync(prismaFile)) {
  console.log("File exists.");
  console.log("Content:\n", fs.readFileSync(prismaFile, 'utf8'));
} else {
  console.log("File NOT found.");
}
