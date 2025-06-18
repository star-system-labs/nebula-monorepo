const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function clearAnalyticsData() {
  console.log('🧹 Starting Redis Analytics Data Cleanup...');
  
  try {
    console.log('\n📊 Scanning for analytics keys...');
    const allKeys = await redis.keys('*');
    
    console.log(`Found ${allKeys.length} total keys in Redis`);
    
    const analyticsKeys = allKeys.filter(key => 
      key.startsWith('metrics:') || 
      key.includes('wallet') || 
      key.includes('render') || 
      key.includes('rolling')
    );
    
    console.log(`Found ${analyticsKeys.length} analytics-related keys:`);
    analyticsKeys.forEach(key => console.log(`  - ${key}`));
    
    console.log('\n📏 Checking data sizes...');
    for (const key of analyticsKeys.slice(0, 5)) {
      try {
        const type = await redis.type(key);
        let size = 0;
        
        if (type === 'zset') {
          size = await redis.zcard(key);
          console.log(`  ${key} (${type}): ${size} items`);
        } else if (type === 'string') {
          const data = await redis.get(key);
          size = JSON.stringify(data).length;
          console.log(`  ${key} (${type}): ${size} bytes`);
        }
      } catch (e) {
        console.log(`  ${key}: Error checking size - ${e.message}`);
      }
    }
    
    console.log('\n🗑️  Clearing analytics data...');
    
    if (analyticsKeys.length > 0) {
      const batchSize = 10;
      for (let i = 0; i < analyticsKeys.length; i += batchSize) {
        const batch = analyticsKeys.slice(i, i + batchSize);
        await redis.del(...batch);
        console.log(`  Deleted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(analyticsKeys.length/batchSize)}`);
      }
    }
    
    console.log('\n🧹 Clearing additional patterns...');
    
    try {
      await redis.del('metrics:all');
      console.log('  Cleared metrics:all');
    } catch (e) {
      console.log('  metrics:all not found or already cleared');
    }
    
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      const dayKey = `metrics:day:${date.toISOString().split('T')[0]}`;
      try {
        await redis.del(dayKey);
      } catch (e) {
      }
    }
    console.log('  Cleared daily metric buckets (last 30 days)');
    
    console.log('\n✅ Verifying cleanup...');
    const remainingKeys = await redis.keys('*');
    const remainingAnalytics = remainingKeys.filter(key => 
      key.startsWith('metrics:') || 
      key.includes('wallet') || 
      key.includes('render') || 
      key.includes('rolling')
    );
    
    console.log(`Total keys remaining: ${remainingKeys.length}`);
    console.log(`Analytics keys remaining: ${remainingAnalytics.length}`);
    
    if (remainingAnalytics.length > 0) {
      console.log('Remaining analytics keys:');
      remainingAnalytics.forEach(key => console.log(`  - ${key}`));
    }
    
    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy the optimized analytics API (analytics-optimized.js)');
    console.log('2. Update your frontend to use only 1hr and 24hr ranges');
    console.log('3. Monitor Redis usage for the next 24-48 hours');
    console.log('4. Expected usage should be < 1GB daily with optimized version');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.error('Stack trace:', error.stack);
  }
}

async function estimateCurrentUsage() {
  console.log('📊 Estimating current Redis usage...');
  
  try {
    const allKeys = await redis.keys('*');
    let totalEstimatedSize = 0;
    let analyticsSize = 0;
    
    for (const key of allKeys) {
      try {
        const type = await redis.type(key);
        let keySize = 0;
        
        if (type === 'zset') {
          const count = await redis.zcard(key);
          keySize = count * 100;
        } else if (type === 'string') {
          const data = await redis.get(key);
          keySize = JSON.stringify(data).length;
        } else if (type === 'list') {
          const count = await redis.llen(key);
          keySize = count * 50;
        }
        
        totalEstimatedSize += keySize;
        
        if (key.startsWith('metrics:') || key.includes('wallet') || key.includes('render')) {
          analyticsSize += keySize;
        }
        
      } catch (e) {
        console.log(`Warning: Could not estimate size for ${key}`);
      }
    }
    
    console.log(`\nEstimated Usage:`);
    console.log(`  Total keys: ${allKeys.length}`);
    console.log(`  Total estimated size: ${(totalEstimatedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Analytics data size: ${(analyticsSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Analytics percentage: ${((analyticsSize / totalEstimatedSize) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('Error estimating usage:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--estimate-only')) {
    await estimateCurrentUsage();
    return;
  }
  
  if (args.includes('--help')) {
    console.log('Redis Analytics Cleanup Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/redis-cleanup.js           # Full cleanup');
    console.log('  node scripts/redis-cleanup.js --estimate-only  # Just estimate usage');
    console.log('  node scripts/redis-cleanup.js --help    # Show this help');
    console.log('');
    console.log('Environment variables required:');
    console.log('  UPSTASH_REDIS_REST_URL');
    console.log('  UPSTASH_REDIS_REST_TOKEN');
    return;
  }
  
  console.log('⚠️  WARNING: This will delete ALL analytics data from Redis!');
  console.log('Make sure you have backups if needed.');
  console.log('');
  
  await estimateCurrentUsage();
  
  console.log('\nProceeding with cleanup in 5 seconds...');
  console.log('Press Ctrl+C to cancel');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  await clearAnalyticsData();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { clearAnalyticsData, estimateCurrentUsage }; 