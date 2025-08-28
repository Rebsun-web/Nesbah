// Browser test script for admin authentication
// Run this in the browser console on any admin page

console.log('🧪 Testing Admin Authentication in Browser...\n');

// Test 1: Check current localStorage
console.log('1️⃣ Current localStorage state:');
const adminUser = localStorage.getItem('adminUser');
console.log('   Admin user:', adminUser ? 'Found' : 'None');
console.log('   Current pathname:', window.location.pathname);

// Test 2: Test authentication state
console.log('\n2️⃣ Testing authentication state:');
if (typeof window !== 'undefined') {
    console.log('   Browser environment detected');
    
    // Test admin user storage
    const testUser = { email: 'test@admin.com', role: 'admin' };
    localStorage.setItem('adminUser', JSON.stringify(testUser));
    console.log('   Saved test admin user');
    
    const retrieved = localStorage.getItem('adminUser');
    console.log('   Retrieved admin user:', retrieved ? 'Found' : 'None');
    
    // Clear test
    localStorage.removeItem('adminUser');
    console.log('   Cleared test admin user');
}

// Test 3: Check if AdminAuthContext is available
console.log('\n3️⃣ Checking AdminAuthContext availability:');
if (typeof window !== 'undefined' && window.__NEXT_DATA__) {
    console.log('   Next.js app detected');
} else {
    console.log('   Not in Next.js app context');
}

console.log('\n✅ Admin authentication test completed!');
console.log('\n📝 To test in the actual app:');
console.log('   1. Navigate to admin pages');
console.log('   2. Check browser console for authentication messages');
console.log('   3. Check localStorage in DevTools → Application');
console.log('   4. Log out and log back in to test authentication flow');
