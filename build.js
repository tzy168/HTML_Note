const fs = require('fs');
const path = require('path');

const PAGES_DIR = 'pages';
const OUTPUT_FILE = 'index.json';

function scanDir(dir, basePath = '') {
  const items = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  // 先排文件夹，再排文件，均按字母序
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      const children = scanDir(fullPath, relativePath);
      if (children.length > 0) {
        items.push({
          name: entry.name,
          type: 'folder',
          path: relativePath,
          children: children
        });
      }
    } else if (entry.name.endsWith('.html')) {
      items.push({
        name: entry.name.replace(/\.html$/, ''),
        type: 'file',
        path: relativePath
      });
    }
  }

  return items;
}

function build() {
  if (!fs.existsSync(PAGES_DIR)) {
    fs.mkdirSync(PAGES_DIR, { recursive: true });
  }

  const tree = scanDir(PAGES_DIR);

  const output = {
    generatedAt: new Date().toISOString(),
    tree: tree
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Generated ${OUTPUT_FILE} with ${countItems(tree)} items`);
}

function countItems(tree) {
  let count = 0;
  for (const item of tree) {
    count++;
    if (item.children) {
      count += countItems(item.children);
    }
  }
  return count;
}

build();
