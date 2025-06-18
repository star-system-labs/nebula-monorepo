# Local Redis Setup for Analytics Testing

## Option 1: Docker Redis Setup (Recommended)

### 1. Start Redis with Docker

```bash
# Pull and run Redis in a container
docker run -d \
  --name nebula-redis-local \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --appendonly yes

# Verify it's running
docker ps
```

### 2. Test Redis Connection

```bash
# Connect to Redis CLI
docker exec -it nebula-redis-local redis-cli

# Inside Redis CLI, test basic commands:
# SET test "hello world"
# GET test
# exit
```

## Option 2: Native Redis Installation

### MacOS (using Homebrew)
```bash
brew install redis
brew services start redis
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Environment Setup

### 1. Create Local Environment File

Create a `.env.local` file in your `nebula-frontend` directory:

```env
# For local Redis (Docker)
UPSTASH_REDIS_REST_URL=http://localhost:8080
UPSTASH_REDIS_REST_TOKEN=local_token

# Or for direct Redis connection
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

### 2. Install Redis REST Server (for Upstash compatibility)

Since the analytics API uses Upstash REST API, we need a REST wrapper:

```bash
# In nebula-frontend directory
npm install --save-dev redis-rest-server
```

Create a `scripts/redis-rest-server.js`:

```javascript
const express = require('express');
const Redis = require('ioredis');
const app = express();
const redis = new Redis('redis://localhost:6379');

app.use(express.json());

// Upstash-compatible REST endpoints
// Example
app.post('/zadd/:key', async (req, res) => {
  const { key } = req.params;
  const { score, member } = req.body;
  try {
    const result = await redis.zadd(key, score, member);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/zrangebyscore/:key/:min/:max', async (req, res) => {
  const { key, min, max } = req.params;
  try {
    const result = await redis.zrangebyscore(key, min, max);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/del/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const result = await redis.del(key);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/keys/:pattern', async (req, res) => {
  const { pattern } = req.params;
  try {
    const result = await redis.keys(pattern);
    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Redis REST server running on port ${PORT}`);
});
```

### 3. Start the Local Stack

```bash
# Terminal 1: Start Redis
docker run -d --name nebula-redis-local -p 6379:6379 redis:7-alpine

# Terminal 2: Start Redis REST server
cd frontend/nebula-frontend
node scripts/redis-rest-server.js

# Terminal 3: Start your analytics function locally
netlify dev
```

## Testing the Analytics API

### 1. Test Basic Functionality

```bash
# Test POST (add metrics)
curl -X POST http://localhost:8888/.netlify/functions/analytics-optimized \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": [
      {
        "type": "load",
        "success": true,
        "timestamp": '$(date +%s)000',
        "duration": 150
      }
    ]
  }'

# Test GET (retrieve analytics)
curl "http://localhost:8888/.netlify/functions/analytics-optimized?range=1h"
```

### 2. Load Testing Script

Create `scripts/load-test.js`:

```javascript
const fetch = require('node-fetch');

async function generateMetrics() {
  const metrics = [];
  const now = Date.now();
  
  for (let i = 0; i < 100; i++) {
    metrics.push({
      type: Math.random() > 0.5 ? 'load' : 'wallet_connect',
      success: Math.random() > 0.1,
      timestamp: now - (i * 60000),
      duration: Math.floor(Math.random() * 500) + 50,
      render_time: Math.floor(Math.random() * 300) + 100
    });
  }
  
  return metrics;
}

async function testLoad() {
  console.log('🧪 Starting load test...');
  
  for (let batch = 0; batch < 10; batch++) {
    const metrics = await generateMetrics();
    
    try {
      const response = await fetch('http://localhost:8888/.netlify/functions/analytics-optimized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics })
      });
      
      if (response.ok) {
        console.log(`✅ Batch ${batch + 1} sent successfully`);
      } else {
        console.log(`❌ Batch ${batch + 1} failed:`, await response.text());
      }
    } catch (error) {
      console.log(`❌ Batch ${batch + 1} error:`, error.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Testing data retrieval...');
  try {
    const response = await fetch('http://localhost:8888/.netlify/functions/analytics-optimized?range=1h');
    const data = await response.json();
    console.log('✅ Data retrieved:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ Retrieval error:', error.message);
  }
}

testLoad().catch(console.error);
```

### 3. Monitor Redis Usage

```bash
# Monitor Redis memory usage
docker exec -it nebula-redis-local redis-cli INFO memory

# Monitor key count
docker exec -it nebula-redis-local redis-cli DBSIZE

# Watch real-time commands
docker exec -it nebula-redis-local redis-cli MONITOR
```

## Expected Local Test Results

With the optimized version, you should see:

### Memory Usage
- **Before optimization**: 60KB+ per metric event
- **After optimization**: <1KB per metric event
- **Expected local usage**: <10MB for 1000 test events

### Performance
- **API Response Time**: <200ms for aggregated data
- **Storage Operations**: <50ms per batch
- **Memory Growth**: Linear, with automatic cleanup

### Data Cleanup
- **Automatic TTL**: Data expires after 24-48 hours
- **Periodic Cleanup**: 5% chance per request
- **Manual Cleanup**: Use the redis-cleanup.js script

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```bash
   # Check if Redis is running
   docker ps
   # Restart if needed
   docker restart nebula-redis-local
   ```

2. **REST Server Not Working**
   ```bash
   # Check if REST server is running on port 8080
   curl http://localhost:8080/health
   ```

3. **Function Errors**
   ```bash
   # Check netlify function logs
   netlify dev --verbose
   ```

### Debug Commands

```bash
# Check all Redis keys
docker exec -it nebula-redis-local redis-cli KEYS "*"

# Check specific key content
docker exec -it nebula-redis-local redis-cli ZRANGE metrics:current 0 -1

# Clear all data
docker exec -it nebula-redis-local redis-cli FLUSHALL
```