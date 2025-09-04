const fs = require('fs');
const path = require('path');

// Function to fix malformed withConnection calls
function fixWithConnectionCalls(content) {
    // Fix the pattern: } finally { return result; }, 'task_name');
    let fixed = content.replace(
        /}\s*finally\s*\{\s*return\s+result;\s*\}\s*,\s*'([^']+)'\);/g,
        "}, '$1');"
    );
    
    // Fix the pattern: } finally { return result; }, 'task_name.jsx_route');
    fixed = fixed.replace(
        /}\s*finally\s*\{\s*return\s+result;\s*\}\s*,\s*'([^']+)\.jsx_route'\);/g,
        "}, '$1');"
    );
    
    // Fix the pattern: } finally { return result; }, 'task_name_route');
    fixed = fixed.replace(
        /}\s*finally\s*\{\s*return\s+result;\s*\}\s*,\s*'([^']+)_route'\);/g,
        "}, '$1');"
    );
    
    // Fix the pattern: } finally { return result; }, 'task_name_route.jsx_route');
    fixed = fixed.replace(
        /}\s*finally\s*\{\s*return\s+result;\s*\}\s*,\s*'([^']+)_route\.jsx_route'\);/g,
        "}, '$1');"
    );
    
    return fixed;
}

// Function to process a single file
function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const fixedContent = fixWithConnectionCalls(content);
        
        if (content !== fixedContent) {
            fs.writeFileSync(filePath, fixedContent, 'utf8');
            console.log(`✅ Fixed: ${filePath}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Function to find and process all API route files
function processApiRoutes(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let fixedCount = 0;
    
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
            fixedCount += processApiRoutes(fullPath);
        } else if (file.name.endsWith('.jsx') && file.name.includes('route')) {
            if (processFile(fullPath)) {
                fixedCount++;
            }
        }
    }
    
    return fixedCount;
}

// Main execution
const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
console.log('🔧 Fixing malformed withConnection calls in API route files...');

if (fs.existsSync(apiDir)) {
    const fixedCount = processApiRoutes(apiDir);
    console.log(`\n🎉 Fixed ${fixedCount} files!`);
} else {
    console.log('❌ API directory not found:', apiDir);
}
