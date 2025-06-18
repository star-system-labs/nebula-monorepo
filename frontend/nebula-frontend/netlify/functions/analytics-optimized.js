const { Redis } = require('@upstash/redis');
const { LRUCache } = require('lru-cache');

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5,
});

const rateLimitCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 15,
});

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

function checkRateLimit(ip, endpoint) {
  const key = `${ip}:${endpoint}`;
  const current = rateLimitCache.get(key) || 0;
  
  const limits = {
    'POST': 60,
    'GET': 120,
  };
  
  const limit = limits[endpoint] || limits['GET'];
  
  if (current >= limit) {
    return false;
  }
  
  rateLimitCache.set(key, current + 1);
  return true;
}

function getTimeRange(range) {
  switch (range) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}

function compressMetrics(metrics) {
  return metrics.map(metric => {
    const compressed = {
      t: metric.timestamp || Date.now(),
      ty: metric.type,
      s: metric.success,
    };
    
    if (metric.duration) compressed.d = metric.duration;
    if (metric.render_time) compressed.rt = metric.render_time;
    if (metric.error) compressed.e = metric.error.substring(0, 50);
    
    return compressed;
  });
}

async function processMetrics(metrics) {
  const stats = {
    total_events: metrics.length,
    timestamp: Date.now()
  };

  const loadEvents = metrics.filter(m => m.type === 'load');
  if (loadEvents.length > 0) {
    const successful = loadEvents.filter(m => m.success === true).length;
    stats.load_success_rate = (successful / loadEvents.length) * 100;
  } else {
    stats.load_success_rate = 100;
  }

  const walletEvents = metrics.filter(m => m.type === 'wallet_connect');
  if (walletEvents.length > 0) {
    const successful = walletEvents.filter(m => m.success === true).length;
    stats.wallet_connect_success_rate = (successful / walletEvents.length) * 100;
  } else {
    stats.wallet_connect_success_rate = 100;
  }

  const renderEvents = metrics.filter(m => m.type === 'render' && m.render_time);
  if (renderEvents.length > 0) {
    const times = renderEvents.map(m => m.render_time).sort((a, b) => a - b);
    stats.render_time_avg = times.reduce((a, b) => a + b, 0) / times.length;
    stats.render_time_p50 = times[Math.floor(times.length * 0.5)] || 0;
    stats.render_time_p95 = times[Math.floor(times.length * 0.95)] || 0;
  } else {
    stats.render_time_avg = 0;
    stats.render_time_p50 = 0;
    stats.render_time_p95 = 0;
  }

  return stats;
}

async function cleanupOldData() {
  if (!redis) return;
  
  try {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);
    
    await redis.zremrangebyscore('metrics:current', 0, oneDayAgo);
    
    const dayKeysToCheck = [];
    for (let i = 2; i <= 7; i++) {
      const oldDate = new Date(now - (i * 24 * 60 * 60 * 1000));
      const dayKey = oldDate.toISOString().split('T')[0];
      dayKeysToCheck.push(`metrics:day:${dayKey}`);
    }
    
    if (dayKeysToCheck.length > 0) {
      await redis.del(...dayKeysToCheck);
    }
    
    console.log('🧹 CLEANUP: Removed old data from Redis');
  } catch (error) {
    console.warn('⚠️ CLEANUP ERROR:', error.message);
  }
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const ip = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    const endpoint = event.httpMethod;
    
    if (!checkRateLimit(ip, endpoint)) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({ error: 'Rate limit exceeded' }),
      };
    }

    if (event.httpMethod === 'POST') {
      if (!redis) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({ error: 'Redis not available' }),
        };
      }

      const { metrics } = JSON.parse(event.body);
      if (!metrics || !Array.isArray(metrics)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid metrics data' }),
        };
      }

      const limitedMetrics = metrics.slice(0, 50);
      const compressedMetrics = compressMetrics(limitedMetrics);
      
      const now = Date.now();
      const dayKey = new Date(now).toISOString().split('T')[0];

      const pipeline = redis.pipeline();
      
      compressedMetrics.forEach(metric => {
        const timestamp = metric.t;
        pipeline.zadd('metrics:current', { score: timestamp, member: JSON.stringify(metric) });
        pipeline.zadd(`metrics:day:${dayKey}`, { score: timestamp, member: JSON.stringify(metric) });
      });
      
      pipeline.expire(`metrics:day:${dayKey}`, 2 * 24 * 60 * 60); // 2 days
      pipeline.expire('metrics:current', 24 * 60 * 60); // 24 hours
      
      await pipeline.exec();

      if (Math.random() < 0.05) {
        cleanupOldData();
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          status: 'success',
          received: compressedMetrics.length,
          limited_from: metrics.length
        }),
      };
    }

    if (event.httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const range = queryParams.range || '1h';
      
      if (!['1h', '24h'].includes(range)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Invalid range. Only 1h and 24h supported.',
            supported_ranges: ['1h', '24h']
          }),
        };
      }

      const cacheKey = `aggregate:${range}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        return {
          statusCode: 200,
          headers: { ...headers, 'X-Cache': 'HIT' },
          body: JSON.stringify(cached),
        };
      }

      if (!redis) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({ error: 'Redis not available' }),
        };
      }

      const now = Date.now();
      const since = now - getTimeRange(range);

      const rawMetrics = await redis.zrangebyscore('metrics:current', since, now);
      
      const metrics = rawMetrics.map(m => {
        try {
          const parsed = JSON.parse(m);
          return {
            timestamp: parsed.t,
            type: parsed.ty,
            success: parsed.s,
            duration: parsed.d,
            render_time: parsed.rt,
            error: parsed.e
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      const stats = await processMetrics(metrics);

      const response = {
        range,
        period: {
          start: new Date(since).toISOString(),
          end: new Date(now).toISOString(),
        },
        metrics: stats,
        meta: {
          total_raw_events: metrics.length,
          cache_status: 'MISS',
          generated_at: new Date().toISOString(),
          optimization_level: 'aggressive'
        },
      };

      cache.set(cacheKey, response);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };

  } catch (error) {
    console.error('Analytics error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
}; 