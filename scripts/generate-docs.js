/**
 * @file Generate Markdown API documentation using jsdoc-to-markdown.
 * @author zevinDev
 *
 * Usage: node scripts/generate-docs.js
 */

const fs = require('fs');
const path = require('path');
const jsdoc2md = require('jsdoc-to-markdown');

/**
 * Generates Markdown documentation for all JS files in src/ and writes to docs/API.md.
 * @async
 * @throws {Error} If generation or writing fails
 */
async function generateDocs() {
  try {
    const srcDir = path.resolve(__dirname, '../src');
    const docsDir = path.resolve(__dirname, '../');
    const outputFile = path.join(docsDir, 'DOCUMENTATION.md');

    // Find all .js files in src/ (non-recursive for simplicity)
    const files = fs.readdirSync(srcDir)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(srcDir, file));

    // Add core/ and utils/ subdirectories
    const subdirs = ['core', 'utils'];
    for (const sub of subdirs) {
      const subPath = path.join(srcDir, sub);
      if (fs.existsSync(subPath)) {
        const subFiles = fs.readdirSync(subPath)
          .filter(f => f.endsWith('.js'))
          .map(f => path.join(subPath, f));
        files.push(...subFiles);
      }
    }

    if (!files.length) {
      throw new Error('No JS files found in src/.');
    }

    // Ensure docs/ directory exists
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir);
    }

    // Generate markdown
    const md = await jsdoc2md.render({ files });
    fs.writeFileSync(outputFile, md);
    console.log(`✅ Documentation generated at ${outputFile}`);
  } catch (err) {
    console.error('❌ Failed to generate documentation:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  generateDocs();
}
