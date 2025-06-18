const { Redis } = require('@upstash/redis');

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

function processGraphMetrics(metrics, graphType) {
  const now = Date.now();
  const stats = {
    timestamp: now,
    total_events: metrics.length
  };

  switch (graphType) {
    case 'performance':
      return processPerformanceMetrics(metrics, stats);
    case 'reliability': 
      return processReliabilityMetrics(metrics, stats);
    case 'usage':
      return processUsageMetrics(metrics, stats);
    default:
      return stats;
  }
}

function processPerformanceMetrics(metrics, stats) {
  const loadEvents = metrics.filter(m => m.type === 'load');
  if (loadEvents.length > 0) {
    const successfulLoads = loadEvents.filter(e => e.success === true);
    stats.load_success_rate = (successfulLoads.length / loadEvents.length) * 100;
    stats.total_loads = loadEvents.length;
  } else {
    stats.load_success_rate = 0;
    stats.total_loads = 0;
  }

  const renderEvents = metrics.filter(m => m.type === 'render' && m.duration > 0);
  if (renderEvents.length > 0) {
    const renderTimes = renderEvents.map(e => e.duration).sort((a, b) => a - b);
    
    stats.render_time_p50 = renderTimes[Math.floor(renderTimes.length * 0.5)] || 0;
    stats.render_time_p95 = renderTimes[Math.floor(renderTimes.length * 0.95)] || 0;
    stats.render_time_max = Math.max(...renderTimes);
    stats.render_time_avg = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
  } else {
    stats.render_time_p50 = 0;
    stats.render_time_p95 = 0;
    stats.render_time_max = 0;
    stats.render_time_avg = 0;
  }

  return stats;
}

function processReliabilityMetrics(metrics, stats) {
  const walletEvents = metrics.filter(m => m.type === 'wallet_connect');
  if (walletEvents.length > 0) {
    const successfulConnections = walletEvents.filter(e => e.success === true);
    stats.wallet_connect_success_rate = (successfulConnections.length / walletEvents.length) * 100;
    stats.total_wallet_connections = walletEvents.length;
  } else {
    stats.wallet_connect_success_rate = 0;
    stats.total_wallet_connections = 0;
  }

  const interactionEvents = metrics.filter(m => m.type === 'interaction');
  const interactionErrors = {
    stake: 0,
    claim: 0,
    mine: 0,
    unstake: 0,
    vesting: 0
  };

  interactionEvents.forEach(event => {
    if (event.success === false && event.action) {
      const action = event.action.toLowerCase();
      if (interactionErrors.hasOwnProperty(action)) {
        interactionErrors[action]++;
      }
    }
  });

  stats.interaction_errors = interactionErrors;
  stats.total_interactions = interactionEvents.length;

  return stats;
}

function processUsageMetrics(metrics, stats) {
  const loadEvents = metrics.filter(m => m.type === 'load');
  const walletEvents = metrics.filter(m => m.type === 'wallet_connect');
  const interactionEvents = metrics.filter(m => m.type === 'interaction');
  const uniqueSessions = new Set(metrics.map(m => m.sessionId)).size;

  stats.user_volume = {
    widget_loads: loadEvents.length,
    wallet_connects: walletEvents.length,
    unique_widgets: uniqueSessions,
    total_interactions: interactionEvents.length
  };

  const rpcEvents = metrics.filter(m => m.type === 'rpc' && m.duration > 0);
  if (rpcEvents.length > 0) {
    const rpcTimes = rpcEvents.map(e => e.duration).sort((a, b) => a - b);
    
    stats.rpc_latency_p50 = rpcTimes[Math.floor(rpcTimes.length * 0.5)] || 0;
    stats.rpc_latency_p95 = rpcTimes[Math.floor(rpcTimes.length * 0.95)] || 0;
    stats.rpc_latency_avg = rpcTimes.reduce((a, b) => a + b, 0) / rpcTimes.length;
    stats.total_rpc_calls = rpcEvents.length;
  } else {
    stats.rpc_latency_p50 = 0;
    stats.rpc_latency_p95 = 0;
    stats.rpc_latency_avg = 0;
    stats.total_rpc_calls = 0;
  }

  return stats;
}

function generateTimeseries(metrics, range, graphType) {
  const timeRangeMs = getTimeRange(range);
  const now = Date.now();
  const startTime = now - timeRangeMs;
  
  const bucketSize = getBucketSize(range);
  const bucketCount = Math.ceil(timeRangeMs / bucketSize);
  
  const timeseries = [];
  
  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = startTime + (i * bucketSize);
    const bucketEnd = bucketStart + bucketSize;
    
    const bucketMetrics = metrics.filter(m => 
      m.timestamp >= bucketStart && m.timestamp < bucketEnd
    );
    
    const bucketStats = processGraphMetrics(bucketMetrics, graphType);
    bucketStats.timestamp = bucketStart;
    
    timeseries.push(bucketStats);
  }
  
  return timeseries;
}

function getTimeRange(range) {
  switch (range) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

function getBucketSize(range) {
  switch (range) {
    case '1h': return 5 * 60 * 1000;      // 5 minutes
    case '24h': return 60 * 60 * 1000;    // 1 hour
    case '7d': return 6 * 60 * 60 * 1000; // 6 hours
    case '30d': return 24 * 60 * 60 * 1000; // 1 day
    default: return 60 * 60 * 1000;
  }
}

function decompressMetrics(compressedMetrics) {
  return compressedMetrics.map(metric => {
    if (typeof metric === 'string') {
      try {
        metric = JSON.parse(metric);
      } catch (e) {
        return null;
      }
    }
    
    if (metric.timestamp || metric.type) {
      return metric;
    }
    
    const decompressed = {
      timestamp: metric.t,
      type: metric.ty,
      widget_id: metric.w,
      sessionId: metric.s
    };
    
    if (metric.e) decompressed.event_name = metric.e;
    if (metric.su !== undefined) decompressed.success = metric.su;
    if (metric.d) decompressed.duration = metric.d;
    if (metric.rt) decompressed.render_time = metric.rt;
    if (metric.lt) decompressed.load_time = metric.lt;
    if (metric.er) decompressed.error = metric.er;
    if (metric.v) decompressed.value = metric.v;
    
    return decompressed;
  }).filter(Boolean);
}

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (!redis) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: 'Analytics service not configured'
      }),
    };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const { range = '24h', graph } = queryParams;
    
    const validGraphs = ['performance', 'reliability', 'usage'];
    if (!graph || !validGraphs.includes(graph)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid graph type. Must be: performance, reliability, or usage'
        }),
      };
    }

    const now = Date.now();
    const timeRangeMs = getTimeRange(range);
    const startTime = now - timeRangeMs;

    const rawMetrics = await redis.zrange('metrics:all', startTime, now, { byScore: true });
    const metrics = decompressMetrics(rawMetrics);

    const currentStats = processGraphMetrics(metrics, graph);
    const timeseries = generateTimeseries(metrics, range, graph);

    const response = {
      graph,
      range,
      period: {
        start: new Date(startTime).toISOString(),
        end: new Date(now).toISOString()
      },
      metrics: currentStats,
      timeseries,
      data_quality: {
        total_events: metrics.length,
        has_real_data: metrics.length > 0,
        data_freshness: now
      }
    };

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'X-Graph-Type': graph,
        'X-Data-Points': timeseries.length.toString(),
        'X-Cache': 'MISS'
      },
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Graph analytics error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
    };
  }
}; 