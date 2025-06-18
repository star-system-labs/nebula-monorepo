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
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (!redis) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: 'Redis not configured',
      }),
    };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const { limit = '20', range = '1h' } = queryParams;
    
    const now = Date.now();
    const timeRangeMs = range === '1h' ? 60 * 60 * 1000 :
                       range === '24h' ? 24 * 60 * 60 * 1000 :
                       range === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                       24 * 60 * 60 * 1000;
    const since = now - timeRangeMs;

    const rawMetrics = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/zrevrangebyscore/metrics:all/${now}/${since}/LIMIT/0/${limit}`, {
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
      }
    }).then(r => r.json()).then(r => r.result || []);

    const events = rawMetrics.map(m => {
      try {
        return typeof m === 'string' ? JSON.parse(m) : m;
      } catch (e) {
        return { error: 'Failed to parse', raw: m };
      }
    });

    const eventAnalysis = {
      total_events: events.length,
      event_types: {},
      event_names: {},
      has_load_events: false,
      has_render_events: false,
      has_wallet_events: false,
      sample_events: events.slice(0, 5)
    };

    events.forEach(event => {
      const type = event.type || 'unknown';
      eventAnalysis.event_types[type] = (eventAnalysis.event_types[type] || 0) + 1;
      
      const eventName = event.event_name || 'none';
      eventAnalysis.event_names[eventName] = (eventAnalysis.event_names[eventName] || 0) + 1;
      
      if (type === 'load' || eventName === 'load_complete' || eventName === 'widget_load_complete') {
        eventAnalysis.has_load_events = true;
      }
      if (type === 'render' || eventName === 'render_complete' || eventName === 'widget_render_complete') {
        eventAnalysis.has_render_events = true;
      }
      if (type === 'wallet_connect' || eventName === 'wallet_connect_detailed') {
        eventAnalysis.has_wallet_events = true;
      }
    });

    const diagnosis = {
      issue: 'unknown',
      recommendation: 'unknown'
    };

    if (eventAnalysis.total_events === 0) {
      diagnosis.issue = 'No events being collected at all';
      diagnosis.recommendation = 'Check if widget analytics is initialized and sending events';
    } else if (!eventAnalysis.has_load_events && !eventAnalysis.has_render_events) {
      diagnosis.issue = 'Events are being collected but no load/render events found';
      diagnosis.recommendation = 'Check if trackLoadComplete() and trackRenderComplete() are being called';
    } else {
      diagnosis.issue = 'Load/render events exist but not being processed correctly';
      diagnosis.recommendation = 'Check processMetrics() function in analytics.js';
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'X-Debug-Mode': 'enabled',
        'X-Events-Analyzed': eventAnalysis.total_events.toString()
      },
      body: JSON.stringify({
        range,
        period: {
          start: new Date(since).toISOString(),
          end: new Date(now).toISOString(),
        },
        analysis: eventAnalysis,
        diagnosis,
        raw_events: events
      }, null, 2),
    };

  } catch (error) {
    console.error('Debug events error:', error);
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