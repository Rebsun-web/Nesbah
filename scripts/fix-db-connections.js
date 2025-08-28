const fs = require('fs');
const path = require('path');

// Function to recursively find all .jsx files
function findJsxFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            findJsxFiles(filePath, fileList);
        } else if (file.endsWith('.jsx')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Function to replace pool.connect() with pool.connectWithRetry()
function fixDbConnections(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Replace pool.connect() with pool.connectWithRetry()
        const originalContent = content;
        content = content.replace(/pool\.connect\(\)/g, 'pool.connectWithRetry()');
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            modified = true;
            console.log(`✅ Fixed: ${filePath}`);
        }
        
        return modified;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Main execution
console.log('🔧 Fixing database connections across all API routes...\n');

const srcDir = path.join(__dirname, '..', 'src');
const jsxFiles = findJsxFiles(srcDir);

console.log(`Found ${jsxFiles.length} .jsx files to process\n`);

let fixedCount = 0;
let errorCount = 0;

jsxFiles.forEach(filePath => {
    try {
        const modified = fixDbConnections(filePath);
        if (modified) {
            fixedCount++;
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        errorCount++;
    }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Files fixed: ${fixedCount}`);
console.log(`❌ Errors: ${errorCount}`);
console.log(`📁 Total files processed: ${jsxFiles.length}`);

if (fixedCount > 0) {
    console.log(`\n🎉 Successfully updated ${fixedCount} files to use pool.connectWithRetry()`);
    console.log(`This should resolve connection pool exhaustion issues.`);
} else {
    console.log(`\nℹ️  No files needed updating - all routes already use connectWithRetry()`);
}
