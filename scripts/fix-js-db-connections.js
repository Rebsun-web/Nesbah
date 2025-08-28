const fs = require('fs');
const path = require('path');

// Function to recursively find all .js files (excluding node_modules and scripts)
function findJsFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'scripts') {
            findJsFiles(filePath, fileList);
        } else if (file.endsWith('.js') && !file.includes('fix-db-connections')) {
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
console.log('🔧 Fixing database connections in .js files...\n');

const srcDir = path.join(__dirname, '..', 'src');
const jsFiles = findJsFiles(srcDir);

console.log(`Found ${jsFiles.length} .js files to process\n`);

let fixedCount = 0;
let errorCount = 0;

jsFiles.forEach(filePath => {
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
console.log(`📁 Total files processed: ${jsFiles.length}`);

if (fixedCount > 0) {
    console.log(`\n🎉 Successfully updated ${fixedCount} .js files to use pool.connectWithRetry()`);
    console.log(`This should resolve connection pool exhaustion issues in library files.`);
} else {
    console.log(`\nℹ️  No .js files needed updating - all library files already use connectWithRetry()`);
}
