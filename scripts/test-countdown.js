#!/usr/bin/env node

// Test script to verify countdown calculation
function testCountdown() {
    console.log('🧪 Testing countdown calculation...\n');
    
    // Test case 1: Application submitted 1 hour ago
    const submittedAt1 = new Date(Date.now() - 1 * 60 * 60 * 1000); // 1 hour ago
    const auctionEndTime1 = null;
    
    const endTime1 = auctionEndTime1 ? new Date(auctionEndTime1) : new Date(submittedAt1.getTime() + 48 * 60 * 60 * 1000);
    const now = new Date();
    const timeLeft1 = endTime1 - now;
    const hoursLeft1 = Math.floor(timeLeft1 / (1000 * 60 * 60));
    const minutesLeft1 = Math.floor((timeLeft1 % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log('Test Case 1: Application submitted 1 hour ago');
    console.log(`  Submitted at: ${submittedAt1.toLocaleString()}`);
    console.log(`  Auction end time: ${endTime1.toLocaleString()}`);
    console.log(`  Time left: ${hoursLeft1}h ${minutesLeft1}m`);
    console.log(`  Expected: ~47h 0m\n`);
    
    // Test case 2: Application submitted 23 hours ago
    const submittedAt2 = new Date(Date.now() - 23 * 60 * 60 * 1000); // 23 hours ago
    const auctionEndTime2 = null;
    
    const endTime2 = auctionEndTime2 ? new Date(auctionEndTime2) : new Date(submittedAt2.getTime() + 48 * 60 * 60 * 1000);
    const timeLeft2 = endTime2 - now;
    const hoursLeft2 = Math.floor(timeLeft2 / (1000 * 60 * 60));
    const minutesLeft2 = Math.floor((timeLeft2 % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log('Test Case 2: Application submitted 23 hours ago');
    console.log(`  Submitted at: ${submittedAt2.toLocaleString()}`);
    console.log(`  Auction end time: ${endTime2.toLocaleString()}`);
    console.log(`  Time left: ${hoursLeft2}h ${minutesLeft2}m`);
    console.log(`  Expected: ~25h 0m\n`);
    
    // Test case 3: Application with explicit auction_end_time
    const submittedAt3 = new Date(Date.now() - 10 * 60 * 60 * 1000); // 10 hours ago
    const auctionEndTime3 = new Date(submittedAt3.getTime() + 24 * 60 * 60 * 1000); // 24 hours from submission
    
    const endTime3 = auctionEndTime3 ? new Date(auctionEndTime3) : new Date(submittedAt3.getTime() + 48 * 60 * 60 * 1000);
    const timeLeft3 = endTime3 - now;
    const hoursLeft3 = Math.floor(timeLeft3 / (1000 * 60 * 60));
    const minutesLeft3 = Math.floor((timeLeft3 % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log('Test Case 3: Application with explicit auction_end_time (24 hours)');
    console.log(`  Submitted at: ${submittedAt3.toLocaleString()}`);
    console.log(`  Auction end time: ${endTime3.toLocaleString()}`);
    console.log(`  Time left: ${hoursLeft3}h ${minutesLeft3}m`);
    console.log(`  Expected: ~14h 0m\n`);
    
    // Test case 4: Expired application
    const submittedAt4 = new Date(Date.now() - 50 * 60 * 60 * 1000); // 50 hours ago
    const auctionEndTime4 = null;
    
    const endTime4 = auctionEndTime4 ? new Date(auctionEndTime4) : new Date(submittedAt4.getTime() + 48 * 60 * 60 * 1000);
    const timeLeft4 = endTime4 - now;
    
    console.log('Test Case 4: Expired application (submitted 50 hours ago)');
    console.log(`  Submitted at: ${submittedAt4.toLocaleString()}`);
    console.log(`  Auction end time: ${endTime4.toLocaleString()}`);
    console.log(`  Time left: ${timeLeft4 <= 0 ? 'Expired' : `${Math.floor(timeLeft4 / (1000 * 60 * 60))}h ${Math.floor((timeLeft4 % (1000 * 60 * 60)) / (1000 * 60))}m`}`);
    console.log(`  Expected: Expired\n`);
    
    console.log('✅ Countdown calculation test completed!');
}

testCountdown();
