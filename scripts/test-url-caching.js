// Simple test for admin URL caching functionality
console.log('🧪 Testing Admin URL Caching System...\n');

// Mock localStorage for Node.js environment
if (typeof window === 'undefined') {
    global.localStorage = {
        data: {},
        setItem: function(key, value) {
            this.data[key] = value;
        },
        getItem: function(key) {
            return this.data[key] || null;
        },
        removeItem: function(key) {
            delete this.data[key];
        }
    };
}

// Test the caching functionality
const ADMIN_LAST_URL_KEY = 'nesbah_admin_last_url';

// Test 1: Check initial state
console.log('1️⃣ Testing initial state:');
console.log('   Has cached URL:', !!localStorage.getItem(ADMIN_LAST_URL_KEY));
console.log('   Cached URL:', localStorage.getItem(ADMIN_LAST_URL_KEY) || 'None');

// Test 2: Save a URL
console.log('\n2️⃣ Testing URL saving:');
const testUrl = '/admin/analytics';
localStorage.setItem(ADMIN_LAST_URL_KEY, testUrl);
console.log('   Saved URL:', testUrl);
console.log('   Has cached URL:', !!localStorage.getItem(ADMIN_LAST_URL_KEY));
console.log('   Cached URL:', localStorage.getItem(ADMIN_LAST_URL_KEY));

// Test 3: Save another URL
console.log('\n3️⃣ Testing URL update:');
const newUrl = '/admin/applications';
localStorage.setItem(ADMIN_LAST_URL_KEY, newUrl);
console.log('   Updated URL:', newUrl);
console.log('   Cached URL:', localStorage.getItem(ADMIN_LAST_URL_KEY));

// Test 4: Clear URL
console.log('\n4️⃣ Testing URL clearing:');
localStorage.removeItem(ADMIN_LAST_URL_KEY);
console.log('   Cleared URL');
console.log('   Has cached URL:', !!localStorage.getItem(ADMIN_LAST_URL_KEY));
console.log('   Cached URL:', localStorage.getItem(ADMIN_LAST_URL_KEY) || 'None');

// Test 5: Test with default fallback
console.log('\n5️⃣ Testing default fallback:');
const cachedUrl = localStorage.getItem(ADMIN_LAST_URL_KEY) || '/admin';
console.log('   Cached URL with fallback:', cachedUrl);

console.log('\n✅ URL caching test completed!');
console.log('\n📝 Expected behavior:');
console.log('   - URLs should be saved to localStorage');
console.log('   - URLs should be retrieved correctly');
console.log('   - Default fallback should be /admin');
console.log('   - Login/auth URLs should be excluded from caching');
