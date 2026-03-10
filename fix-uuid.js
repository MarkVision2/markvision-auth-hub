const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx}');

let patchCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('.eq("project_id", active.id)')) {
    content = content.replace(/\.eq\("project_id", active\.id\)/g, 
      '.or(`project_id.${active.id === "hq" ? "is.null" : `eq.${active.id}`}`)');
    fs.writeFileSync(file, content);
    console.log('Patched', file);
    patchCount++;
  }
});
console.log('Total patched files:', patchCount);
