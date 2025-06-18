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
  max: 1000,
  ttl: 1000 * 60 * 15,
  allowStale: true,
  updateAgeOnGet: true
});

const rateLimitCache = new LRUCache({
  max: 10000,
  ttl: 1000 * 60 * 60,
});

const requestDedupeCache = new LRUCache({
  max: 500,
  ttl: 1000 * 30,
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
    'POST': 100,
    'GET': 300,
    'timeseries': 50,
    'compare': 50
  };
  
  const limit = limits[endpoint] || limits['GET'];
  
  if (current >= limit) {
    return false;
  }
  
  rateLimitCache.set(key, current + 1);
  return true;
}

function getRequestHash(method, params) {
  return require('crypto')
    .createHash('md5')
    .update(`${method}:${JSON.stringify(params)}`)
    .digest('hex');
}

function compressMetrics(metrics) {
  return metrics.map(metric => {
    const compressed = {
      t: metric.timestamp || Date.now(),
      ty: metric.type,
      w: metric.widget_id,
      s: metric.sessionId
    };
    
    if (metric.event_name) compressed.e = metric.event_name;
    if (metric.success !== undefined) compressed.su = metric.success;
    if (metric.duration) compressed.d = metric.duration;
    if (metric.render_time) compressed.rt = metric.render_time;
    if (metric.load_time) compressed.lt = metric.load_time;
    if (metric.error) compressed.er = metric.error;
    if (metric.value) compressed.v = metric.value;
    
    return compressed;
  });
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

function getTimeRange(range) {
  switch (range) {
    case '1h': return 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

function calculatePercentageChanges(current, previous) {
  const changes = {};
  
  const calculateChange = (currentVal, previousVal) => {
    if (previousVal === 0 && currentVal === 0) return 0;
    if (previousVal === 0) return currentVal > 0 ? 999 : 0;
    return ((currentVal - previousVal) / previousVal) * 100;
  };
  
  changes.load_success_rate = calculateChange(current.load_success_rate || 0, previous.load_success_rate || 0);
  changes.render_time_avg = calculateChange(current.render_time_avg || 0, previous.render_time_avg || 0);
  changes.wallet_connect_success_rate = calculateChange(current.wallet_connect_success_rate || 0, previous.wallet_connect_success_rate || 0);
  changes.total_interactions = calculateChange(current.total_interactions || 0, previous.total_interactions || 0);
  changes.total_events = calculateChange(current.total_events || 0, previous.total_events || 0);
  changes.rpc_latency_avg = calculateChange(current.rpc_latency_avg || 0, previous.rpc_latency_avg || 0);
  
  return changes;
}

async function getLastKnownWalletRate() {
  try {
    if (!redis) {
      console.log('📊 No Redis available for last known rate lookup');
      return null;
    }
    
    const cachedRate = await redis.get('last_known_wallet_rate');
    if (cachedRate) {
      const parsed = JSON.parse(cachedRate);
      console.log('📊 Retrieved last known wallet rate from cache:', parsed);
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.warn('📊 Error retrieving last known wallet rate:', error.message);
    return null;
  }
}

async function storeLastKnownWalletRate(successRate, avgTime = 0) {
  try {
    if (!redis) {
      console.log('📊 No Redis available for storing last known rate');
      return;
    }
    
    const rateData = {
      success_rate: successRate,
      avg_time: avgTime,
      timestamp: Date.now(),
      updated_at: new Date().toISOString()
    };
    
    await redis.setex('last_known_wallet_rate', 30 * 24 * 60 * 60, JSON.stringify(rateData));
    console.log('📊 Stored last known wallet rate:', successRate + '%');
  } catch (error) {
    console.warn('📊 Error storing last known wallet rate:', error.message);
  }
}

async function getLastKnownWidgetLoadRate() {
  try {
    if (!redis) {
      console.log('📊 No Redis available for last known widget load rate lookup');
      return null;
    }
    
    const cachedRate = await redis.get('last_known_widget_load_rate');
    if (cachedRate) {
      const parsed = JSON.parse(cachedRate);
      console.log('📊 Retrieved last known widget load rate from cache:', parsed);
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.warn('📊 Error retrieving last known widget load rate:', error.message);
    return null;
  }
}

async function storeLastKnownWidgetLoadRate(successRate, avgTime = 0) {
  try {
    if (!redis) {
      console.log('📊 No Redis available for storing last known widget load rate');
      return;
    }
    
    const rateData = {
      success_rate: successRate,
      avg_time: avgTime,
      timestamp: Date.now(),
      updated_at: new Date().toISOString()
    };
    
    await redis.setex('last_known_widget_load_rate', 30 * 24 * 60 * 60, JSON.stringify(rateData));
    console.log('📊 Stored last known widget load rate:', successRate + '%');
  } catch (error) {
    console.warn('📊 Error storing last known widget load rate:', error.message);
  }
}

async function getLastKnownRenderTimes() {
  try {
    if (!redis) {
      console.log('📊 RENDER PERSISTENCE: No Redis available for last known render times lookup');
      return null;
    }
    
    const cachedTimes = await redis.get('last_known_render_times');
    if (cachedTimes) {
      const parsed = JSON.parse(cachedTimes);
      console.log('📊 RENDER PERSISTENCE: Retrieved last known render times from cache:', parsed);
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.warn('📊 RENDER PERSISTENCE: Error retrieving last known render times:', error.message);
    return null;
  }
}

async function storeLastKnownRenderTimes(renderMetrics) {
  try {
    if (!redis) {
      console.log('📊 RENDER PERSISTENCE: No Redis available for storing last known render times');
      return;
    }
    
    const renderData = {
      render_time_avg: renderMetrics.render_time_avg || 0,
      render_time_p50: renderMetrics.render_time_p50 || 0,
      render_time_p95: renderMetrics.render_time_p95 || 0,
      render_time_max: renderMetrics.render_time_max || 0,
      render_time_min: renderMetrics.render_time_min || 0,
      render_time_distribution: renderMetrics.render_time_distribution || { fast: 0, medium: 0, slow: 0 },
      timestamp: Date.now(),
      updated_at: new Date().toISOString()
    };
    
    await redis.setex('last_known_render_times', 30 * 24 * 60 * 60, JSON.stringify(renderData));
    console.log('📊 RENDER PERSISTENCE: Stored last known render times:', {
      avg: renderData.render_time_avg + 'ms',
      p50: renderData.render_time_p50 + 'ms',
      p95: renderData.render_time_p95 + 'ms'
    });
  } catch (error) {
    console.warn('📊 RENDER PERSISTENCE: Error storing last known render times:', error.message);
  }
}

async function getRollingWalletEvents(maxEvents = 100) {
  try {
    if (!redis) {
      console.log('📊 No Redis available for rolling wallet events');
      return [];
    }
    
    const rollingEvents = await redis.get('rolling_wallet_events');
    if (rollingEvents) {
      const parsed = JSON.parse(rollingEvents);
      console.log(`📊 Retrieved ${parsed.length} rolling wallet events from cache`);
      return parsed;
    }
    
    return [];
  } catch (error) {
    console.warn('📊 Error retrieving rolling wallet events:', error.message);
    return [];
  }
}

async function updateRollingWalletEvents(newEvents, maxEvents = 100) {
  try {
    if (!redis || newEvents.length === 0) {
      return;
    }
    
    const existingEvents = await getRollingWalletEvents(maxEvents);
    
    const eventsToAdd = newEvents.map(event => {
      let errorType = null;
      
      if (event.error) {
        if (typeof event.error === 'object' && event.error.type && event.error.subtype) {
          if (event.error.type === 'WALLET' && event.error.subtype === 'user_rejected') {
            errorType = 'user_rejected';
          } else if (event.error.type === 'WALLET') {
            errorType = 'technical_error';
          } else {
            errorType = 'technical_error';
          }
          
          console.log('🔍 BACKEND: Enhanced error classification detected', {
            originalError: event.error,
            classifiedAs: errorType,
            confidence: event.error.confidence,
            reason: event.error.reason
          });
        } else {
          const errorMsg = (event.error.message || event.error.toString()).toLowerCase();
          const errorCode = event.error.code || '';
          
          const rejectionCodes = [4001, 4100, -32603, 'ACTION_REJECTED', 'UNAUTHORIZED'];
          const rejectionPatterns = [
            'user rejected', 'user denied', 'user cancelled', 'user canceled',
            'rejected by user', 'denied by user', 'cancelled by user', 'canceled by user',
            'user declined', 'declined by user', 'user aborted', 'aborted by user',
            'popup closed', 'wallet closed', 'permission denied', 'access denied'
          ];
          
          if (rejectionCodes.includes(errorCode) || 
              rejectionCodes.includes(String(errorCode)) ||
              rejectionPatterns.some(pattern => errorMsg.includes(pattern))) {
            errorType = 'user_rejected';
            console.log('✅ BACKEND: User rejection detected via legacy pattern', {
              errorCode,
              errorMessage: errorMsg.substring(0, 100)
            });
          } else {
            errorType = 'technical_error';
            console.log('⚠️ BACKEND: Technical error classified', {
              errorCode,
              errorMessage: errorMsg.substring(0, 100)
            });
          }
        }
      }
      
      return {
        success: event.success === true,
        timestamp: Date.now(),
        error_type: errorType,
        wallet_type: event.walletType || event.wallet_type || 'unknown',
        error_details: event.error ? {
          type: event.error.type || 'unknown',
          subtype: event.error.subtype || 'unknown',
          confidence: event.error.confidence || 'unknown',
          reason: event.error.reason || 'unknown'
        } : null
      };
    });
    
    const allEvents = [...existingEvents, ...eventsToAdd];
    const rollingWindow = allEvents.slice(-maxEvents);
    
    await redis.setex('rolling_wallet_events', 7 * 24 * 60 * 60, JSON.stringify(rollingWindow));
    
    console.log(`📊 ENHANCED ROLLING WALLET EVENTS: Updated window with ${eventsToAdd.length} new events`, {
      totalEvents: rollingWindow.length,
      newUserRejections: eventsToAdd.filter(e => e.error_type === 'user_rejected').length,
      newTechnicalErrors: eventsToAdd.filter(e => e.error_type === 'technical_error').length,
      newSuccesses: eventsToAdd.filter(e => e.success === true).length
    });
    
    return rollingWindow;
  } catch (error) {
    console.warn('📊 ENHANCED ROLLING EVENTS: Error updating rolling wallet events:', error.message);
    return [];
  }
}

function calculateRollingWalletSuccessRate(rollingEvents) {
  if (!rollingEvents || rollingEvents.length === 0) {
    return null;
  }
  
  const totalEvents = rollingEvents.length;
  const successfulEvents = rollingEvents.filter(event => event.success === true).length;
  const userRejections = rollingEvents.filter(event => event.error_type === 'user_rejected').length;
  
  const totalFailures = totalEvents - successfulEvents;
  const technicalFailures = totalFailures - userRejections;

  const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0;
  const userRejectionRate = totalEvents > 0 ? (userRejections / totalEvents) * 100 : 0;
  const technicalFailureRate = totalEvents > 0 ? (technicalFailures / totalEvents) * 100 : 0;
  
  const rates = {
    success_rate: successRate,
    user_rejection_rate: userRejectionRate,
    technical_failure_rate: technicalFailureRate,
    total_events: totalEvents,
  };
  
  console.log(`📊 3-PART-RATE: Rolling wallet rate calculated:`, {
    total_events: rates.total_events,
    success: rates.success_rate.toFixed(1) + '%',
    user_rejection: rates.user_rejection_rate.toFixed(1) + '%',
    technical_failure: rates.technical_failure_rate.toFixed(1) + '%'
  });
  
  return rates;
}

async function getRollingWidgetLoadEvents(maxEvents = 100) {
  try {
    if (!redis) {
      console.log('📊 No Redis available for rolling widget load events');
      return [];
    }
    
    const rollingEvents = await redis.get('rolling_widget_load_events');
    if (rollingEvents) {
      const parsed = JSON.parse(rollingEvents);
      console.log(`📊 Retrieved ${parsed.length} rolling widget load events from cache`);
      return parsed;
    }
    
    return [];
  } catch (error) {
    console.warn('📊 Error retrieving rolling widget load events:', error.message);
    return [];
  }
}

async function updateRollingWidgetLoadEvents(newEvents, maxEvents = 100) {
  try {
    if (!redis || newEvents.length === 0) {
      return;
    }
    
    const existingEvents = await getRollingWidgetLoadEvents(maxEvents);
    
    const eventsToAdd = newEvents.map(event => ({
      success: event.success === true || event.type === 'load' || event.event_name === 'load_complete' || event.event_name === 'widget_load_complete',
      timestamp: Date.now(),
      event_type: event.type || event.event_name || 'unknown',
      error_details: event.error ? (event.error.message || event.error.toString()) : null
    }));
    
    const allEvents = [...existingEvents, ...eventsToAdd];
    const rollingWindow = allEvents.slice(-maxEvents);
    
    await redis.setex('rolling_widget_load_events', 7 * 24 * 60 * 60, JSON.stringify(rollingWindow));
    
    console.log(`📊 Updated rolling widget load events window: ${rollingWindow.length} total events`);
    return rollingWindow;
  } catch (error) {
    console.warn('📊 Error updating rolling widget load events:', error.message);
    return [];
  }
}

function calculateRollingWidgetLoadSuccessRate(rollingEvents) {
  if (rollingEvents.length === 0) {
    return null;
  }
  
  const successfulEvents = rollingEvents.filter(event => event.success === true);
  const successRate = (successfulEvents.length / rollingEvents.length) * 100;
  
  console.log(`📊 Rolling widget load success rate calculated:`, {
    total_events: rollingEvents.length,
    successful_events: successfulEvents.length,
    success_rate: successRate.toFixed(1) + '%'
  });
  
  return {
    success_rate: successRate,
    total_events: rollingEvents.length,
    successful_events: successfulEvents.length
  };
}

async function processMetrics(metrics) {
  const stats = {
    total_events: metrics.length,
    unique_widgets: new Set(metrics.map(m => m.widget_id || m.sessionId)).size,
    timestamp: Date.now()
  };

  // === LOAD SUCCESS RATE ===
  const loadEvents = metrics.filter(m => 
    m.type === 'load' || 
    m.event_name === 'load_complete' || 
    m.event_name === 'widget_load_complete'
  );
  const loadErrors = metrics.filter(m => 
    m.type === 'load_error' || 
    m.event_name === 'load_error_detailed'
  );
  const loadAttempts = metrics.filter(m => 
    m.event_name === 'load_attempt'
  );
  const loadStages = metrics.filter(m => 
    m.event_name === 'load_stage'
  );
  
  const allLoadEvents = [...loadAttempts, ...loadEvents, ...loadErrors];
  
  if (allLoadEvents.length > 0) {
    const rollingEvents = await updateRollingWidgetLoadEvents(allLoadEvents);
    const rollingStats = calculateRollingWidgetLoadSuccessRate(rollingEvents);
    
    if (rollingStats) {
      stats.load_success_rate = rollingStats.success_rate;
      stats.rolling_load_window_size = rollingStats.total_events;
      stats.is_rolling_load_rate = true;
      stats.is_maintained_load_rate = false;
      
      console.log('📊 Using rolling window widget load success rate:', {
        success_rate: rollingStats.success_rate.toFixed(1) + '%',
        window_size: rollingStats.total_events
      });
    } else {
      if (loadAttempts.length > 0) {
        const successfulAttempts = loadAttempts.filter(a => a.success === true);
        const totalAttempts = loadAttempts.length;
        stats.load_success_rate = totalAttempts > 0 
          ? (successfulAttempts.length / totalAttempts) * 100 
          : 0;
      } else {
        const totalLoadAttempts = loadEvents.length + loadErrors.length;
        stats.load_success_rate = totalLoadAttempts > 0 
          ? (loadEvents.length / totalLoadAttempts) * 100 
          : 0;
      }
      stats.is_rolling_load_rate = false;
      stats.is_maintained_load_rate = false;
      
      console.log('📊 Fallback to bucket-only widget load success rate:', stats.load_success_rate.toFixed(1) + '%');
    }
    
    stats.total_loads = allLoadEvents.length;
    stats.load_attempts_tracked = loadAttempts.length;
    stats.load_stages_tracked = loadStages.length;
    
    await storeLastKnownWidgetLoadRate(stats.load_success_rate, 0);
    
  } else {
    const rollingEvents = await getRollingWidgetLoadEvents();
    const rollingStats = calculateRollingWidgetLoadSuccessRate(rollingEvents);
    
    if (rollingStats && rollingStats.total_events > 0) {
      stats.load_success_rate = rollingStats.success_rate;
      stats.rolling_load_window_size = rollingStats.total_events;
      stats.is_rolling_load_rate = true;
      stats.is_maintained_load_rate = true;
      console.log('📊 Maintaining rolling window widget load success rate:', {
        success_rate: rollingStats.success_rate.toFixed(1) + '%',
        window_size: rollingStats.total_events
      });
    } else {
      const hasHistoricalLoadData = await getLastKnownWidgetLoadRate();
      
      if (hasHistoricalLoadData && hasHistoricalLoadData.success_rate !== undefined) {
        stats.load_success_rate = hasHistoricalLoadData.success_rate;
        stats.is_maintained_load_rate = true;
        stats.is_rolling_load_rate = false;
        console.log('📊 Fallback to last known widget load success rate:', hasHistoricalLoadData.success_rate + '%');
      } else {
        stats.load_success_rate = 0;
        stats.is_maintained_load_rate = false;
        stats.is_rolling_load_rate = false;
        console.log('📊 No historical widget load data found, using 0%');
      }
    }
    
    stats.total_loads = 0;
    stats.load_attempts_tracked = 0;
    stats.load_stages_tracked = 0;
  }

  // === WIDGET LOAD SUCCESS RATE (same as load success rate) ===
  stats.widget_load_success_rate = stats.load_success_rate;
  stats.is_maintained_widget_load_rate = stats.is_maintained_load_rate;

  // === RENDER TIME METRICS ===
  const renderEvents = metrics.filter(m => 
    (m.type === 'render' || m.event_name === 'render_complete' || m.event_name === 'widget_render_complete') && 
    (m.render_time || m.duration || m.timing)
  );
  const renderStages = metrics.filter(m => 
    m.event_name === 'render_stage'
  );
  const componentRenders = metrics.filter(m => 
    m.event_name === 'component_render'
  );
  const webVitals = metrics.filter(m => 
    m.event_name && m.event_name.startsWith('web_vital_')
  );
  
  if (renderEvents.length > 0) {
    console.log(`📊 RENDER PROCESSING: Found ${renderEvents.length} render events`);
    const renderTimes = renderEvents
      .map(m => m.render_time || m.duration || m.timing)
      .filter(t => t && t > 0)
      .sort((a, b) => a - b);
    
    console.log(`📊 RENDER TIMES: Extracted ${renderTimes.length} valid render times:`, renderTimes.slice(0, 5));
  
  if (renderTimes.length > 0) {
      stats.render_time_avg = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
  stats.render_time_p50 = renderTimes[Math.floor(renderTimes.length * 0.5)] || 0;
  stats.render_time_p95 = renderTimes[Math.floor(renderTimes.length * 0.95)] || 0;
      stats.render_time_max = Math.max(...renderTimes);
      stats.render_time_min = Math.min(...renderTimes);
      
      stats.render_time_distribution = {
        fast: renderTimes.filter(t => t < 200).length,
        medium: renderTimes.filter(t => t >= 200 && t < 500).length,
        slow: renderTimes.filter(t => t >= 500).length
      };
      
      const renderMetricsToStore = {
        ...stats,
        render_time_distribution: stats.render_time_distribution
      };
      await storeLastKnownRenderTimes(renderMetricsToStore);
      stats.is_maintained_render_times = false;
    }
    
    stats.render_stages_tracked = renderStages.length;
    stats.component_renders_tracked = componentRenders.length;
    
    if (webVitals.length > 0) {
      stats.web_vitals = {};
      
      // LCP (Largest Contentful Paint)
      const lcpMetrics = webVitals.filter(m => m.event_name === 'web_vital_lcp');
      if (lcpMetrics.length > 0) {
        const lcpValues = lcpMetrics.map(m => m.value).filter(v => v > 0);
        stats.web_vitals.lcp = {
          avg: lcpValues.reduce((a, b) => a + b, 0) / lcpValues.length,
          p50: lcpValues.sort((a, b) => a - b)[Math.floor(lcpValues.length * 0.5)] || 0,
          count: lcpValues.length
        };
      }
      
      // FCP (First Contentful Paint)
      const fcpMetrics = webVitals.filter(m => m.event_name === 'web_vital_fcp');
      if (fcpMetrics.length > 0) {
        const fcpValues = fcpMetrics.map(m => m.value).filter(v => v > 0);
        stats.web_vitals.fcp = {
          avg: fcpValues.reduce((a, b) => a + b, 0) / fcpValues.length,
          p50: fcpValues.sort((a, b) => a - b)[Math.floor(fcpValues.length * 0.5)] || 0,
          count: fcpValues.length
        };
      }
      
      // FID (First Input Delay)
      const fidMetrics = webVitals.filter(m => m.event_name === 'web_vital_fid');
      if (fidMetrics.length > 0) {
        const fidValues = fidMetrics.map(m => m.value).filter(v => v >= 0);
        stats.web_vitals.fid = {
          avg: fidValues.reduce((a, b) => a + b, 0) / fidValues.length,
          p50: fidValues.sort((a, b) => a - b)[Math.floor(fidValues.length * 0.5)] || 0,
          count: fidValues.length
        };
      }
      
      // CLS (Cumulative Layout Shift)
      const clsMetrics = webVitals.filter(m => m.event_name === 'web_vital_cls');
      if (clsMetrics.length > 0) {
        const clsValues = clsMetrics.map(m => m.value).filter(v => v >= 0);
        stats.web_vitals.cls = {
          avg: clsValues.reduce((a, b) => a + b, 0) / clsValues.length,
          max: Math.max(...clsValues),
          count: clsValues.length
        };
      }
    }
  } else {
    const hasHistoricalRenderData = await getLastKnownRenderTimes();
    
    if (hasHistoricalRenderData && hasHistoricalRenderData.render_time_p50 > 0) {
      stats.render_time_avg = hasHistoricalRenderData.render_time_avg;
      stats.render_time_p50 = hasHistoricalRenderData.render_time_p50;
      stats.render_time_p95 = hasHistoricalRenderData.render_time_p95;
      stats.render_time_max = hasHistoricalRenderData.render_time_max;
      stats.render_time_min = hasHistoricalRenderData.render_time_min;
      stats.is_maintained_render_times = true;
      console.log('📊 RENDER PERSISTENCE: Maintaining last known render times:', {
        avg: hasHistoricalRenderData.render_time_avg + 'ms',
        p50: hasHistoricalRenderData.render_time_p50 + 'ms',
        p95: hasHistoricalRenderData.render_time_p95 + 'ms'
      });
      
      const totalRenders = hasHistoricalRenderData.render_time_distribution?.total || 100;
      stats.render_time_distribution = hasHistoricalRenderData.render_time_distribution || {
        fast: Math.round(totalRenders * 0.6),   // 60% fast renders
        medium: Math.round(totalRenders * 0.3), // 30% medium renders
        slow: Math.round(totalRenders * 0.1)    // 10% slow renders
      };
    } else {
      stats.render_time_avg = 0;
      stats.render_time_p50 = 0;
      stats.render_time_p95 = 0;
      stats.render_time_max = 0;
      stats.render_time_min = 0;
      stats.render_time_distribution = { fast: 0, medium: 0, slow: 0 };
      stats.is_maintained_render_times = false;
      console.log('📊 RENDER PERSISTENCE: No historical render data found, using 0ms');
    }
    
    stats.render_stages_tracked = 0;
    stats.component_renders_tracked = 0;
  }

  // === WALLET CONNECTION METRICS ===
  const walletEvents = metrics.filter(m => 
    m.type === 'wallet_connect' || 
    m.event_name === 'wallet_connect_detailed'
  );
  
  if (walletEvents.length > 0) {
    const rollingEvents = await updateRollingWalletEvents(walletEvents);
    const rollingStats = calculateRollingWalletSuccessRate(rollingEvents);
    
    if (rollingStats) {
      stats.wallet_success_rate = rollingStats.success_rate;
      stats.wallet_user_rejection_rate = rollingStats.user_rejection_rate;
      stats.wallet_technical_failure_rate = rollingStats.technical_failure_rate;
      stats.rolling_window_size = rollingStats.total_events;
      stats.is_rolling_rate = true;
  } else {
      const successfulConnections = walletEvents.filter(e => e.success === true).length;
      stats.wallet_success_rate = (successfulConnections / walletEvents.length) * 100;
      stats.wallet_user_rejection_rate = 0;
      stats.wallet_technical_failure_rate = 100 - stats.wallet_success_rate;
      stats.is_rolling_rate = false;
    }
    
    stats.wallet_connect_success_rate = stats.wallet_success_rate;
    stats.wallet_connection_success_rate = stats.wallet_success_rate;

    const successfulConnections = walletEvents.filter(e => e.success === true);
    const failedConnections = walletEvents.filter(e => e.success === false);
    
    const walletDataQuality = {
      total_attempts: walletEvents.length,
      successful_attempts: successfulConnections.length,
      failed_attempts: failedConnections.length,
      has_wallet_addresses: successfulConnections.filter(e => e.walletType || e.wallet_type).length,
      has_wallet_types: walletEvents.filter(e => e.walletType || e.wallet_type).length,
      has_error_details: failedConnections.filter(e => e.error).length,
      has_duration_data: walletEvents.filter(e => e.duration || e.connectTime).length
    };
    
    const walletTypeBreakdown = {};
    walletEvents.forEach(event => {
      const walletType = event.walletType || event.wallet_type || 'unknown';
      if (!walletTypeBreakdown[walletType]) {
        walletTypeBreakdown[walletType] = { attempts: 0, successes: 0, failures: 0 };
      }
      walletTypeBreakdown[walletType].attempts++;
      if (event.success === true) {
        walletTypeBreakdown[walletType].successes++;
  } else {
        walletTypeBreakdown[walletType].failures++;
      }
    });
    
    const walletErrorCategories = {};
    failedConnections.forEach(event => {
      let errorType = 'unknown';
      if (event.error && event.error.type) {
        errorType = event.error.type;
      } else if (event.error) {
        const errorMsg = (event.error.message || event.error.toString()).toLowerCase();
        if (errorMsg.includes('user rejected') || errorMsg.includes('user denied')) {
          errorType = 'user_rejected';
        } else if (errorMsg.includes('not found') || errorMsg.includes('not installed')) {
          errorType = 'wallet_not_found';
        } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
          errorType = 'network_error';
        } else if (errorMsg.includes('timeout')) {
          errorType = 'timeout';
        }
      }
      walletErrorCategories[errorType] = (walletErrorCategories[errorType] || 0) + 1;
    });
    
    const connectionTimes = successfulConnections
      .map(e => e.duration || e.connectTime)
      .filter(t => t && t > 0);
    
    if (connectionTimes.length > 0) {
      stats.wallet_connect_avg_time = connectionTimes.reduce((a, b) => a + b, 0) / connectionTimes.length;
    } else {
      stats.wallet_connect_avg_time = 0;
    }
    
    stats.total_wallet_connections = walletEvents.length;
    
    stats.wallet_data_quality = walletDataQuality;
    stats.wallet_type_breakdown = walletTypeBreakdown;
    stats.wallet_error_categories = walletErrorCategories;
    stats.unique_wallets = new Set(successfulConnections.map(e => e.wallet_address || e.walletAddress).filter(Boolean)).size;
    
  } else {
    const rollingEvents = await getRollingWalletEvents();
    const rollingStats = calculateRollingWalletSuccessRate(rollingEvents);
    
    if (rollingStats && rollingStats.total_events > 0) {
      stats.wallet_success_rate = rollingStats.success_rate;
      stats.wallet_user_rejection_rate = rollingStats.user_rejection_rate;
      stats.wallet_technical_failure_rate = rollingStats.technical_failure_rate;
      stats.rolling_window_size = rollingStats.total_events;
      stats.is_rolling_rate = true;
      stats.is_maintained_rate = true;
    } else {
      stats.wallet_success_rate = 100;
      stats.wallet_user_rejection_rate = 0;
      stats.wallet_technical_failure_rate = 0;
      stats.is_maintained_rate = true;
      stats.is_rolling_rate = false;
    }
    
    stats.wallet_connect_success_rate = stats.wallet_success_rate;
    stats.wallet_connection_success_rate = stats.wallet_success_rate;
    
    stats.total_wallet_connections = 0;
    stats.wallet_data_quality = { total_attempts: 0, successful_attempts: 0, failed_attempts: 0 };
    stats.wallet_type_breakdown = {};
    stats.wallet_error_categories = {};
    stats.unique_wallets = 0;
  }

  // === INTERACTION ERRORS BY TYPE ===
  const interactionEvents = metrics.filter(m => 
    m.type === 'interaction' || 
    m.type === 'interaction_detailed'
  );
  
  stats.interaction_errors = {
    mine: interactionEvents.filter(e => e.action === 'mine' && (e.success === false || e.error)).length,
    stake: interactionEvents.filter(e => (e.action === 'stake' || e.action === 'staking') && (e.success === false || e.error)).length,
    claim: interactionEvents.filter(e => e.action === 'claim' && (e.success === false || e.error)).length,
    unstake: interactionEvents.filter(e => e.action === 'unstake' && (e.success === false || e.error)).length,
    vesting: interactionEvents.filter(e => e.action === 'vesting' && (e.success === false || e.error)).length
  };

  // === ERROR CATEGORIZATION ===
  const errorCategories = {};
  interactionEvents
    .filter(e => e.success === false || e.error)
    .forEach(event => {
      let category = 'UNKNOWN';
      
      if (event.errorCategory && event.errorCategory.type) {
        category = event.errorCategory.type;
      } else if (event.error) {
        const errorMsg = (event.error.message || event.error.toString()).toLowerCase();
        if (errorMsg.includes('user rejected') || errorMsg.includes('action_rejected')) {
          category = 'WALLET';
        } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
          category = 'NETWORK';
        } else if (errorMsg.includes('revert') || errorMsg.includes('gas')) {
          category = 'CONTRACT';
        } else if (errorMsg.includes('rpc')) {
          category = 'RPC';
        }
      }
      
      errorCategories[category] = (errorCategories[category] || 0) + 1;
    });
  
  stats.error_categories = errorCategories;

  // === RPC LATENCY METRICS ===
  const rpcEvents = metrics.filter(m => 
    (m.type === 'custom' && (m.event_name === 'rpc_call' || m.event_name === 'rpc_detailed')) ||
    (m.type === 'rpc')
  );
  
  if (rpcEvents.length > 0) {
    const rpcTimes = rpcEvents
      .map(m => m.duration)
      .filter(t => t && t > 0)
      .sort((a, b) => a - b);
  
  if (rpcTimes.length > 0) {
      stats.rpc_latency_avg = rpcTimes.reduce((a, b) => a + b, 0) / rpcTimes.length;
    stats.rpc_latency_p50 = rpcTimes[Math.floor(rpcTimes.length * 0.5)] || 0;
    stats.rpc_latency_p95 = rpcTimes[Math.floor(rpcTimes.length * 0.95)] || 0;
      stats.rpc_latency_max = Math.max(...rpcTimes);
      stats.rpc_latency_min = Math.min(...rpcTimes);
    }
    
    const successfulRpc = rpcEvents.filter(e => e.success !== false).length;
    stats.rpc_success_rate = (successfulRpc / rpcEvents.length) * 100;
    
    const methodBreakdown = {};
    rpcEvents.forEach(event => {
      const method = event.method || 'unknown';
      if (!methodBreakdown[method]) {
        methodBreakdown[method] = { count: 0, totalDuration: 0, errors: 0 };
      }
      methodBreakdown[method].count++;
      if (event.duration) methodBreakdown[method].totalDuration += event.duration;
      if (event.success === false) methodBreakdown[method].errors++;
    });
    
    stats.rpc_method_breakdown = Object.entries(methodBreakdown).map(([method, data]) => ({
      method,
      count: data.count,
      avgDuration: data.count > 0 ? data.totalDuration / data.count : 0,
      errorRate: data.count > 0 ? (data.errors / data.count) * 100 : 0
    }));
  } else {
    stats.rpc_latency_avg = 0;
    stats.rpc_latency_p50 = 0;
    stats.rpc_latency_p95 = 0;
    stats.rpc_latency_max = 0;
    stats.rpc_latency_min = 0;
    stats.rpc_success_rate = 0;
    stats.rpc_method_breakdown = [];
  }

  // === USER VOLUME METRICS ===
  const processUserVolumeMetrics = (metrics) => {
    const uniqueSessions = new Set();
    const userSessions = metrics.filter(m => 
      m.type === 'custom' && 
      (m.event_name === 'widget_init' || m.event_name === 'health_check_init')
    );
    
    const walletConnectEvents = metrics.filter(m => 
      m.type === 'wallet_connect' || 
      m.event_name === 'wallet_connect_detailed'
    );
    
    const userInteractions = metrics.filter(m => 
      m.type === 'interaction' || 
      m.type === 'interaction_detailed'
    );
    
    userSessions.forEach(session => {
      if (session.sessionId) uniqueSessions.add(session.sessionId);
      if (session.widget_id) uniqueSessions.add(session.widget_id);
    });
    
    const engagementMetrics = {
      total_sessions: uniqueSessions.size,
      widget_loads: userSessions.length,
      wallet_connects: walletConnectEvents.length,
      successful_wallet_connects: walletConnectEvents.filter(e => e.success === true).length,
      total_interactions: userInteractions.length,
      successful_interactions: userInteractions.filter(e => e.success !== false).length,
      unique_users: uniqueSessions.size
    };
    
    engagementMetrics.wallet_connect_rate = engagementMetrics.widget_loads > 0 
      ? (engagementMetrics.wallet_connects / engagementMetrics.widget_loads) * 100 
      : 0;
      
    engagementMetrics.interaction_rate = engagementMetrics.successful_wallet_connects > 0 
      ? (engagementMetrics.total_interactions / engagementMetrics.successful_wallet_connects) * 100 
      : 0;
    
    return engagementMetrics;
  };
  
  const userVolumeData = processUserVolumeMetrics(metrics);
  
  stats.user_volume = {
    widget_loads: userVolumeData.widget_loads,
    wallet_connects: userVolumeData.wallet_connects,
    unique_widgets: userVolumeData.unique_users,
    total_interactions: userVolumeData.total_interactions,
    conversion_rates: {
      wallet_connect_rate: userVolumeData.wallet_connect_rate,
      interaction_rate: userVolumeData.interaction_rate
    }
  };
  
  stats.unique_sessions = userVolumeData.total_sessions;

  const processCDNMetrics = (metrics) => {
    const cdnEvents = metrics.filter(m => 
      m.type === 'cdn_performance_timeseries' ||
      m.event_name === 'cdn_performance_timeseries'
    );

    if (cdnEvents.length === 0) {
      return {
        availability: null,
        response_time: null,
        cache_hit_rate: null,
        error_count: null,
        sample_count: 0
      };
    }

    const availability = cdnEvents.map(e => 
      e.availability || e.value?.availability || (e.value && typeof e.value === 'object' ? e.value.availability : null)
    ).filter(val => val !== null && val !== undefined);
    
    const responseTimes = cdnEvents.map(e => 
      e.responseTime || e.response_time || e.value?.responseTime || e.value?.response_time || 
      (e.value && typeof e.value === 'object' ? e.value.responseTime : null)
    ).filter(val => val !== null && val !== undefined);
    
    const cacheHitRates = cdnEvents.map(e => 
      e.cacheHitRate || e.cache_hit_rate || e.value?.cacheHitRate || e.value?.cache_hit_rate ||
      (e.value && typeof e.value === 'object' ? e.value.cacheHitRate : null)
    ).filter(val => val !== null && val !== undefined);
    
    const errorCounts = cdnEvents.map(e => 
      e.errorCount || e.error_count || e.value?.errorCount || e.value?.error_count ||
      (e.value && typeof e.value === 'object' ? e.value.errorCount : 0) || 0
    );

    console.log('📊 CDN metrics processing', {
      total_events: cdnEvents.length,
      availability_values: availability.length,
      response_time_values: responseTimes.length,
      cache_hit_values: cacheHitRates.length,
      sample_availability: availability.slice(0, 3),
      sample_response_times: responseTimes.slice(0, 3),
      sample_cache_hits: cacheHitRates.slice(0, 3)
    });

    return {
      availability: availability.length > 0 ? Math.round(availability.reduce((a, b) => a + b, 0) / availability.length) : null,
      response_time: responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : null,
      cache_hit_rate: cacheHitRates.length > 0 ? Math.round(cacheHitRates.reduce((a, b) => a + b, 0) / cacheHitRates.length) : null,
      error_count: errorCounts.reduce((a, b) => a + b, 0),
      sample_count: cdnEvents.length
    };
  };

  const cdnMetrics = processCDNMetrics(metrics);
  stats.cdn_performance = cdnMetrics;

  // === TRANSACTION METRICS ===
  const transactionEvents = metrics.filter(m => 
    m.type === 'transaction' || 
    m.event_name === 'transaction_detailed' ||
    (m.type === 'interaction' && m.txHash)
  );
  
  if (transactionEvents.length > 0) {
    const successfulTxs = transactionEvents.filter(e => e.status === 'success' || e.success === true);
    stats.transaction_success_rate = (successfulTxs.length / transactionEvents.length) * 100;
    stats.total_transactions = transactionEvents.length;
    
    const gasUsages = transactionEvents
      .map(e => parseInt(e.gasUsed))
      .filter(g => g && g > 0);
    
    if (gasUsages.length > 0) {
      stats.avg_gas_used = gasUsages.reduce((a, b) => a + b, 0) / gasUsages.length;
      stats.max_gas_used = Math.max(...gasUsages);
      stats.min_gas_used = Math.min(...gasUsages);
    }
  } else {
    stats.transaction_success_rate = 0;
    stats.total_transactions = 0;
    stats.avg_gas_used = 0;
    stats.max_gas_used = 0;
    stats.min_gas_used = 0;
  }

  // === SESSION METRICS ===
  const sessionEvents = metrics.filter(m => 
    m.type === 'custom' && m.event_name === 'session_summary'
  );
  
  if (sessionEvents.length > 0) {
    const sessionData = sessionEvents.map(e => e.sessionMetrics || e.session).filter(Boolean);
    
    if (sessionData.length > 0) {
      const totalInteractions = sessionData.reduce((sum, s) => sum + (s.interactions || 0), 0);
      const totalErrors = sessionData.reduce((sum, s) => sum + (s.errors || 0), 0);
      const totalRpcCalls = sessionData.reduce((sum, s) => sum + (s.rpcCalls || 0), 0);
      
      stats.avg_interactions_per_session = sessionData.length > 0 ? totalInteractions / sessionData.length : 0;
      stats.avg_errors_per_session = sessionData.length > 0 ? totalErrors / sessionData.length : 0;
      stats.avg_rpc_calls_per_session = sessionData.length > 0 ? totalRpcCalls / sessionData.length : 0;
    }
  }

  // === PERFORMANCE METRICS ===
  const performanceEvents = metrics.filter(m => 
    m.type === 'custom' && 
    (m.event_name === 'page_load_performance' || m.event_name === 'resource_load')
  );
  
  if (performanceEvents.length > 0) {
    const loadTimes = performanceEvents
      .filter(e => e.loadTime || e.duration)
      .map(e => e.loadTime || e.duration)
      .filter(t => t > 0);
    
    if (loadTimes.length > 0) {
      stats.avg_page_load_time = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
      stats.max_page_load_time = Math.max(...loadTimes);
      stats.min_page_load_time = Math.min(...loadTimes);
    }
  }

  stats.data_quality = {
    has_real_load_data: loadEvents.length > 0,
    has_real_render_data: renderEvents.length > 0,
    has_real_wallet_data: walletEvents.length > 0,
    has_real_interaction_data: interactionEvents.length > 0,
    has_real_rpc_data: rpcEvents.length > 0,
    total_events: metrics.length,
    data_freshness: Date.now()
  };

  return stats;
}

function calculateOptimalBucketSize(metrics, timeRange) {
  const totalDuration = getTimeRange(timeRange);
  const dataPoints = metrics.length;
  const targetBuckets = timeRange === '1h' ? 12 : 
                       timeRange === '24h' ? 24 : 
                       timeRange === '7d' ? 28 : 30;
  
  console.log(`📊 ROLLBACK ADAPTIVE BUCKETING: Calculating for ${timeRange}`, {
    totalDuration,
    dataPoints,
    targetBuckets
  });
  
  if (dataPoints < targetBuckets * 0.5) {
    const bucketSize = Math.ceil(totalDuration / Math.max(dataPoints, 6));
    console.log(`📊 SPARSE DATA: Using larger buckets (${bucketSize}ms)`);
    return bucketSize;
  } else if (dataPoints > targetBuckets * 2) {
    const bucketSize = Math.floor(totalDuration / (targetBuckets * 1.5));
    console.log(`📊 DENSE DATA: Using smaller buckets (${bucketSize}ms)`);
    return bucketSize;
  }
  
  const bucketSize = Math.floor(totalDuration / targetBuckets);
  console.log(`📊 NORMAL DATA: Using standard buckets (${bucketSize}ms)`);
  return bucketSize;
}

function interpolateMissingData(timeSeries, bucketSize, timeRange) {
  if (timeSeries.length === 0) return [];
  
  const interpolated = [];
  const sortedData = timeSeries.sort((a, b) => a.timestamp - b.timestamp);
  
  console.log(`📊 INTERPOLATION: Processing ${sortedData.length} data points`);
  
  for (let i = 0; i < sortedData.length - 1; i++) {
    interpolated.push(sortedData[i]);
    
    const current = sortedData[i];
    const next = sortedData[i + 1];
    const gap = next.timestamp - current.timestamp;
    
    if (gap > bucketSize * 2) {
      const steps = Math.floor(gap / bucketSize);
      console.log(`📊 FILLING GAP: ${gap}ms gap with ${steps} interpolated points`);
      
      for (let step = 1; step < steps; step++) {
        const ratio = step / steps;
        const interpolatedPoint = {
          timestamp: current.timestamp + (step * bucketSize),
          load_success_rate: interpolateValue(current.load_success_rate, next.load_success_rate, ratio),
          render_time_p50: interpolateValue(current.render_time_p50, next.render_time_p50, ratio),
          render_time_p95: interpolateValue(current.render_time_p95, next.render_time_p95, ratio),
          render_time_max: interpolateValue(current.render_time_max, next.render_time_max, ratio),
          wallet_connect_success_rate: interpolateValue(current.wallet_connect_success_rate, next.wallet_connect_success_rate, ratio),
          rpc_latency_p50: interpolateValue(current.rpc_latency_p50, next.rpc_latency_p50, ratio),
          rpc_latency_p95: interpolateValue(current.rpc_latency_p95, next.rpc_latency_p95, ratio),
          total_events: Math.round(interpolateValue(current.total_events, next.total_events, ratio)),
          unique_widgets: Math.round(interpolateValue(current.unique_widgets, next.unique_widgets, ratio)),
          user_volume: {
            widget_loads: Math.round(interpolateValue(current.user_volume?.widget_loads || 0, next.user_volume?.widget_loads || 0, ratio)),
            wallet_connects: Math.round(interpolateValue(current.user_volume?.wallet_connects || 0, next.user_volume?.wallet_connects || 0, ratio)),
            unique_widgets: Math.round(interpolateValue(current.user_volume?.unique_widgets || 0, next.user_volume?.unique_widgets || 0, ratio)),
            total_interactions: Math.round(interpolateValue(current.user_volume?.total_interactions || 0, next.user_volume?.total_interactions || 0, ratio))
          },
          interaction_errors: {
            mine: Math.round(interpolateValue(current.interaction_errors?.mine || 0, next.interaction_errors?.mine || 0, ratio)),
            stake: Math.round(interpolateValue(current.interaction_errors?.stake || 0, next.interaction_errors?.stake || 0, ratio)),
            claim: Math.round(interpolateValue(current.interaction_errors?.claim || 0, next.interaction_errors?.claim || 0, ratio))
          },
          _interpolated: true,
          _interpolation_ratio: ratio
        };
        interpolated.push(interpolatedPoint);
      }
    }
  }
  
  if (sortedData.length > 0) {
    interpolated.push(sortedData[sortedData.length - 1]);
  }
  
  console.log(`📊 INTERPOLATION COMPLETE: ${interpolated.length} total points (${interpolated.filter(p => p._interpolated).length} interpolated)`);
  return interpolated;
}

function interpolateValue(start, end, ratio) {
  if (start === undefined || start === null) start = 0;
  if (end === undefined || end === null) end = 0;
  return start + (end - start) * ratio;
}

function calculateDataQuality(originalMetrics, processedTimeSeries) {
  const totalPoints = processedTimeSeries.length;
  const interpolatedPoints = processedTimeSeries.filter(p => p._interpolated).length;
  const realPoints = totalPoints - interpolatedPoints;
  
  const quality = {
    total_points: totalPoints,
    real_points: realPoints,
    interpolated_points: interpolatedPoints,
    interpolation_rate: totalPoints > 0 ? (interpolatedPoints / totalPoints) * 100 : 0,
    data_density: originalMetrics.length > 0 ? (realPoints / originalMetrics.length) * 100 : 0,
    quality_score: totalPoints > 0 ? Math.max(0, 100 - (interpolatedPoints / totalPoints) * 50) : 0
  };
  
  console.log('📊 DATA QUALITY METRICS:', quality);
  return quality;
}

async function processTimeSeriesAdaptive(metrics, range) {
  console.log(`📊 ADAPTIVE PROCESSING: Starting for ${range} with ${metrics.length} metrics`);
  
  const bucketSize = calculateOptimalBucketSize(metrics, range);
  const buckets = groupMetricsByAdaptiveBuckets(metrics, bucketSize);
  const timeSeries = await processBucketsToTimeSeries(buckets);
  const interpolatedSeries = interpolateMissingData(timeSeries, bucketSize, range);
  const dataQuality = calculateDataQuality(metrics, interpolatedSeries);
  
  return {
    timeseries: interpolatedSeries,
    bucketSize,
    dataQuality,
    metadata: {
      original_metrics_count: metrics.length,
      buckets_created: Object.keys(buckets).length,
      final_points: interpolatedSeries.length,
      processing_method: 'adaptive'
    }
  };
}

function groupMetricsByAdaptiveBuckets(metrics, bucketSize) {
  const buckets = {};
  
  metrics.forEach(metric => {
    const bucketTime = Math.floor(metric.timestamp / bucketSize) * bucketSize;
    if (!buckets[bucketTime]) {
      buckets[bucketTime] = [];
    }
    buckets[bucketTime].push(metric);
  });
  
  console.log(`📊 ROLLBACK BUCKETING: Created ${Object.keys(buckets).length} buckets with size ${bucketSize}ms`);
  return buckets;
}

async function processBucketsToTimeSeries(buckets) {
  const entries = Object.entries(buckets).sort(([a], [b]) => a - b);
  const results = [];
  
  let cumulativeWalletEvents = [];
  let cumulativeWidgetLoadEvents = [];
  let lastKnownRenderTimes = null;

  console.log(`📊 REFACTOR: Starting true rolling timeseries calculation for ${entries.length} buckets.`);

  for (const [timestamp, metrics] of entries) {
    const processed = await processMetrics(metrics);

    const walletEventsInBucket = metrics
      .filter(m => m.type === 'wallet_connect' || m.event_name === 'wallet_connect_detailed')
      .map(event => {
        let errorType = null;
        
        if (event.error) {
          if (typeof event.error === 'object' && event.error.type && event.error.subtype) {
            if (event.error.type === 'WALLET' && event.error.subtype === 'user_rejected') {
              errorType = 'user_rejected';
            } else if (event.error.type === 'WALLET') {
              errorType = 'technical_error';
            } else {
              errorType = 'technical_error';
            }
            
            console.log('🔍 TIMESERIES: Enhanced error classification detected', {
              originalError: event.error,
              classifiedAs: errorType,
              confidence: event.error.confidence,
              reason: event.error.reason
            });
          } else {
            const errorMsg = (event.error.message || event.error.toString()).toLowerCase();
            const errorCode = event.error.code || '';
            
            const rejectionCodes = [4001, 4100, -32603, 'ACTION_REJECTED', 'UNAUTHORIZED'];
            const rejectionPatterns = [
              'user rejected', 'user denied', 'user cancelled', 'user canceled',
              'rejected by user', 'denied by user', 'cancelled by user', 'canceled by user',
              'user declined', 'declined by user', 'user aborted', 'aborted by user',
              'popup closed', 'wallet closed', 'permission denied', 'access denied',
              'user refused', 'connection refused', 'request refused'
            ];
            
            if (rejectionCodes.includes(errorCode) || 
                rejectionCodes.includes(String(errorCode)) ||
                rejectionPatterns.some(pattern => errorMsg.includes(pattern))) {
              errorType = 'user_rejected';
              console.log('✅ TIMESERIES: User rejection detected via enhanced pattern', {
                errorCode,
                errorMessage: errorMsg.substring(0, 100)
              });
            } else {
              errorType = 'technical_error';
              console.log('⚠️ TIMESERIES: Technical error classified', {
                errorCode,
                errorMessage: errorMsg.substring(0, 100)
              });
            }
          }
        }
        
        return {
          success: event.success === true,
          error_type: errorType,
          wallet_type: event.walletType || event.wallet_type || 'unknown'
        };
      });
    
    if (walletEventsInBucket.length > 0) {
      cumulativeWalletEvents.push(...walletEventsInBucket);
      if (cumulativeWalletEvents.length > 100) {
        cumulativeWalletEvents = cumulativeWalletEvents.slice(-100);
      }
    }
    
    const walletRollingStats = calculateRollingWalletSuccessRate(cumulativeWalletEvents);
    if (walletRollingStats) {
      processed.wallet_success_rate = walletRollingStats.success_rate;
      processed.wallet_user_rejection_rate = walletRollingStats.user_rejection_rate;
      processed.wallet_technical_failure_rate = walletRollingStats.technical_failure_rate;
      processed.is_rolling_rate = true;
      processed.is_maintained_rate = walletEventsInBucket.length === 0;
      processed.rolling_window_size = cumulativeWalletEvents.length;
    } else {
      processed.wallet_success_rate = 100;
      processed.wallet_user_rejection_rate = 0;
      processed.wallet_technical_failure_rate = 0;
      processed.is_maintained_rate = true;
    }

    const loadEventsInBucket = metrics
      .filter(m => m.type === 'load' || m.event_name === 'load_complete' || m.event_name === 'widget_load_complete' || m.type === 'load_error' || m.event_name === 'load_error_detailed' || m.event_name === 'load_attempt')
      .map(event => ({ 
          success: event.success === true || event.type === 'load' || event.event_name === 'load_complete' || event.event_name === 'widget_load_complete'
      }));

    if (loadEventsInBucket.length > 0) {
      cumulativeWidgetLoadEvents.push(...loadEventsInBucket);
       if (cumulativeWidgetLoadEvents.length > 100) {
        cumulativeWidgetLoadEvents = cumulativeWidgetLoadEvents.slice(-100);
      }
    }

    const loadRollingStats = calculateRollingWidgetLoadSuccessRate(cumulativeWidgetLoadEvents);
    if (loadRollingStats) {
      processed.load_success_rate = loadRollingStats.success_rate;
      processed.widget_load_success_rate = loadRollingStats.success_rate;
      processed.is_rolling_load_rate = true;
      processed.is_maintained_load_rate = loadEventsInBucket.length === 0;
      processed.is_maintained_widget_load_rate = loadEventsInBucket.length === 0;
      processed.rolling_load_window_size = cumulativeWidgetLoadEvents.length;
    } else {
        processed.load_success_rate = 100;
        processed.widget_load_success_rate = 100;
        processed.is_maintained_load_rate = true;
        processed.is_maintained_widget_load_rate = true;
    }

    const renderEvents = metrics.filter(m => 
      (m.type === 'render' || m.event_name === 'render_complete' || m.event_name === 'widget_render_complete') && 
      (m.render_time || m.duration || m.timing)
    );
    
    if (renderEvents.length > 0) {
      lastKnownRenderTimes = {
        render_time_avg: processed.render_time_avg,
        render_time_p50: processed.render_time_p50,
        render_time_p95: processed.render_time_p95,
        render_time_max: processed.render_time_max,
        render_time_min: processed.render_time_min
      };
      processed.is_maintained_render_times = false;
    } else if (lastKnownRenderTimes !== null) {
      processed.render_time_avg = lastKnownRenderTimes.render_time_avg;
      processed.render_time_p50 = lastKnownRenderTimes.render_time_p50;
      processed.render_time_p95 = lastKnownRenderTimes.render_time_p95;
      processed.render_time_max = lastKnownRenderTimes.render_time_max;
      processed.render_time_min = lastKnownRenderTimes.render_time_min;
      processed.is_maintained_render_times = true;
    }
    
    results.push({
      timestamp: parseInt(timestamp),
      ...processed,
      _bucket_size: metrics.length
    });
  }
  
  return results;
}

exports.handler = async (event, context) => {
  console.log('Analytics request:', event.httpMethod, event.path, event.queryStringParameters);
  
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
        error: 'Analytics service not configured. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.',
      }),
    };
  }

  const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
  const queryParams = event.queryStringParameters || {};
  const { endpoint } = queryParams;
  
  const rateLimitEndpoint = event.httpMethod === 'POST' ? 'POST' : 
                           endpoint === 'timeseries' ? 'timeseries' :
                           endpoint === 'compare' ? 'compare' : 'GET';
  
  if (!checkRateLimit(clientIP, rateLimitEndpoint)) {
    return {
      statusCode: 429,
      headers: {
        ...headers,
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '0',
        'Retry-After': '3600'
      },
      body: JSON.stringify({
        error: 'Rate limit exceeded. Please try again later.',
        limit: rateLimitEndpoint,
        retryAfter: 3600
      }),
    };
  }

  if (event.httpMethod === 'GET') {
    const requestHash = getRequestHash('GET', queryParams);
    const cachedResponse = requestDedupeCache.get(requestHash);
    if (cachedResponse) {
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'X-Cache': 'DEDUP-HIT',
          'X-Request-Hash': requestHash
        },
        body: JSON.stringify(cachedResponse),
      };
    }
  }

  try {
    if (event.httpMethod === 'POST' && event.path.includes('/analytics')) {
      const { metrics } = JSON.parse(event.body);
      
      if (!Array.isArray(metrics) || metrics.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid metrics data' }),
        };
      }

      const compressedMetrics = compressMetrics(metrics);
      
      const batchSize = 50;
      const batches = [];
      for (let i = 0; i < compressedMetrics.length; i += batchSize) {
        batches.push(compressedMetrics.slice(i, i + batchSize));
      }

      const pipeline = redis.pipeline();
      const now = Date.now();
      let totalStored = 0;
      
      const batch = batches[0] || [];

      batch.forEach((metric, index) => {
        const timestamp = metric.t || (now + index);
        const metricWithTimestamp = {
          ...metric,
          t: timestamp,
          st: now 
        };
        
        pipeline.zadd('metrics:all', { score: timestamp, member: JSON.stringify(metricWithTimestamp) });
        
        const dayKey = new Date(timestamp).toISOString().split('T')[0];
        pipeline.zadd(`metrics:day:${dayKey}`, { score: timestamp, member: JSON.stringify(metricWithTimestamp) });
        
        totalStored++;
      });

      const dayKey = new Date().toISOString().split('T')[0];
      pipeline.expire(`metrics:day:${dayKey}`, 30 * 24 * 60 * 60);

      await pipeline.exec();

      cache.clear();

      return {
        statusCode: 200,
        headers: {
          ...headers,
          'X-Compression': 'enabled',
          'X-Batch-Size': batchSize.toString(),
          'X-Stored-Count': totalStored.toString()
        },
        body: JSON.stringify({ 
          success: true, 
          stored: totalStored,
          compressed: true,
          originalSize: metrics.length,
          timestamp: now
        }),
      };
    }

    const queryParams = event.queryStringParameters || {};
    const { range = '24h', endpoint, comparison } = queryParams;
    
    const isComparisonRequest = endpoint === 'compare' || comparison === 'true' || comparison === true;
    const isTimeseriesRequest = endpoint === 'timeseries';

    if (isComparisonRequest) {
      const cacheKey = `compare:${range}`;
      
      const cached = null;
        if (cached) {
          return {
            statusCode: 200,
            headers: {
              ...headers,
              'X-Cache': 'HIT',
            },
            body: JSON.stringify(cached),
          };
        }

        const now = Date.now();
        const timeRangeMs = getTimeRange(range);
        const currentStart = now - timeRangeMs;
        const previousStart = currentStart - timeRangeMs;
        const previousEnd = currentStart;

      const currentRawMetrics = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/zrangebyscore/metrics:all/${currentStart}/${now}`, {
        headers: {
          'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
        }
      }).then(r => r.json()).then(r => r.result || []);
      const currentMetrics = decompressMetrics(currentRawMetrics);

      const previousRawMetrics = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/zrangebyscore/metrics:all/${previousStart}/${previousEnd}`, {
        headers: {
          'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
        }
      }).then(r => r.json()).then(r => r.result || []);
      
      const previousMetrics = decompressMetrics(previousRawMetrics);

        const currentStats = await processMetrics(currentMetrics);
        const previousStats = await processMetrics(previousMetrics);

        const response = {
          range,
          currentPeriod: {
            start: new Date(currentStart).toISOString(),
            end: new Date(now).toISOString(),
          },
          previousPeriod: {
            start: new Date(previousStart).toISOString(),
            end: new Date(previousEnd).toISOString(),
          },
          current: {
            metrics: currentStats
          },
          previous: {
            metrics: previousStats
          },
          currentMetrics: currentStats,
          previousMetrics: previousStats,
          comparison: calculatePercentageChanges(currentStats, previousStats)
        };

        cache.set(cacheKey, response);
      
      if (event.httpMethod === 'GET') {
        const requestHash = getRequestHash('GET', queryParams);
        requestDedupeCache.set(requestHash, response);
      }

        return {
          statusCode: 200,
          headers: {
            ...headers,
            'X-Cache': 'MISS',
          'X-Compression': 'enabled',
          'X-Metrics-Count': `${currentMetrics.length}+${previousMetrics.length}`
          },
          body: JSON.stringify(response),
        };
      }
      
    if (isTimeseriesRequest) {
        const cacheKey = `timeseries:${range}`;
        
        const cached = cache.get(cacheKey);
        if (cached) {
          return {
            statusCode: 200,
            headers: {
              ...headers,
              'X-Cache': 'HIT',
            },
            body: JSON.stringify(cached),
          };
        }

        const now = Date.now();
        const since = now - getTimeRange(range);
        
      const rawMetrics = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/zrangebyscore/metrics:all/${since}/${now}`, {
        headers: {
          'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
        }
      }).then(r => r.json()).then(r => r.result || []);
      const metrics = decompressMetrics(rawMetrics);

      console.log(`📊 TIMESERIES REQUEST: Processing ${metrics.length} metrics for ${range}`);
      
      console.log('📊 Timeseries Debug Info', {
        range,
        since: new Date(since).toISOString(),
        now: new Date(now).toISOString(),
        rawMetricsCount: rawMetrics.length,
        decompressedMetricsCount: metrics.length,
        sampleMetrics: metrics.slice(0, 3).map(m => ({
          type: m.type,
          event_name: m.event_name,
          timestamp: m.timestamp,
          success: m.success
        }))
      });
      
      const adaptiveResult = await processTimeSeriesAdaptive(metrics, range);
      
      console.log('📊 Adaptive Result Debug', {
        timeseriesLength: adaptiveResult.timeseries.length,
        sampleTimeseries: adaptiveResult.timeseries.slice(0, 2),
        dataQuality: adaptiveResult.dataQuality,
        bucketSize: adaptiveResult.bucketSize,
        originalMetricsCount: metrics.length,
        timeRange: range,
        since: new Date(since).toISOString(),
        now: new Date(now).toISOString()
      });
      
      if (adaptiveResult.timeseries.length === 0) {
        console.log('⚠️ Empty timeseries detected, creating synthetic data points from aggregate');
        
        const aggregateStats = await processMetrics(metrics);
        
        const points = range === '1h' ? 12 : range === '24h' ? 24 : range === '7d' ? 7 : 30;
        const timeStep = getTimeRange(range) / points;
        
        const syntheticTimeseries = [];
        for (let i = 0; i < points; i++) {
          const timestamp = since + (i * timeStep);
          syntheticTimeseries.push({
            timestamp,
            wallet_success_rate: aggregateStats.wallet_success_rate || 100,
            wallet_user_rejection_rate: aggregateStats.wallet_user_rejection_rate || 0,
            wallet_technical_failure_rate: aggregateStats.wallet_technical_failure_rate || 0,
            load_success_rate: aggregateStats.load_success_rate || 100,
            render_time_p50: aggregateStats.render_time_p50 || 0,
            render_time_p95: aggregateStats.render_time_p95 || 0,
            render_time_max: aggregateStats.render_time_max || 0,
            rpc_latency_p50: aggregateStats.rpc_latency_p50 || 0,
            rpc_latency_p95: aggregateStats.rpc_latency_p95 || 0,
            is_rolling_rate: aggregateStats.is_rolling_rate || false,
            is_maintained_rate: aggregateStats.is_maintained_rate || false,
            rolling_window_size: aggregateStats.rolling_window_size || 0,
            _synthetic: true
          });
        }
        
        adaptiveResult.timeseries = syntheticTimeseries;
        adaptiveResult.dataQuality.synthetic_points = points;
        adaptiveResult.dataQuality.quality_score = 50;
        
        console.log('✅ Created synthetic timeseries', {
          syntheticPoints: points,
          samplePoint: syntheticTimeseries[0],
          aggregateStats: {
            wallet_success_rate: aggregateStats.wallet_success_rate,
            wallet_user_rejection_rate: aggregateStats.wallet_user_rejection_rate,
            wallet_technical_failure_rate: aggregateStats.wallet_technical_failure_rate
          }
        });
      }

        const response = {
          range,
          period: {
            start: new Date(since).toISOString(),
            end: new Date(now).toISOString(),
          },
        timeseries: adaptiveResult.timeseries,
        metadata: {
          ...adaptiveResult.metadata,
          bucketSize: adaptiveResult.bucketSize,
          dataQuality: adaptiveResult.dataQuality,
          processing_timestamp: Date.now()
        }
        };

        cache.set(cacheKey, response);
      
      const requestHash = getRequestHash('GET', queryParams);
      requestDedupeCache.set(requestHash, response);

      console.log(`📊 TIMESERIES RESPONSE: ${adaptiveResult.timeseries.length} points, quality score: ${adaptiveResult.dataQuality.quality_score}%`);

        return {
          statusCode: 200,
          headers: {
            ...headers,
            'X-Cache': 'MISS',
          'X-Data-Quality': adaptiveResult.dataQuality.quality_score.toString(),
          'X-Interpolation-Rate': adaptiveResult.dataQuality.interpolation_rate.toString(),
          'X-Compression': 'enabled',
          'X-Raw-Metrics': rawMetrics.length.toString()
          },
          body: JSON.stringify(response),
        };
      }
      
      const cacheKey = `aggregate:${range}`;
      
      const cached = cache.get(cacheKey);
      if (cached) {
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'X-Cache': 'HIT',
          },
          body: JSON.stringify(cached),
        };
      }

      const now = Date.now();
      const since = now - getTimeRange(range);

    const rawMetrics = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/zrangebyscore/metrics:all/${since}/${now}`, {
      headers: {
        'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`
      }
    }).then(r => r.json()).then(r => r.result || []);
      const metrics = decompressMetrics(rawMetrics);

      console.log('📊 Analytics API Debug Info', {
        range,
        since: new Date(since).toISOString(),
        now: new Date(now).toISOString(),
        rawMetricsCount: rawMetrics.length,
        decompressedMetricsCount: metrics.length,
        sampleRawMetric: rawMetrics[0] || 'none',
        sampleDecompressedMetric: metrics[0] || 'none'
      });

      const stats = await processMetrics(metrics);
      
      console.log('📊 Processed Stats Debug', {
        statsKeys: Object.keys(stats),
        totalEvents: stats.total_events || 0,
        loadSuccessRate: stats.load_success_rate || 0,
        walletConnectRate: stats.wallet_connect_success_rate || 0,
        hasRealData: (stats.total_events || 0) > 0
      });

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
      },
      };

      cache.set(cacheKey, response);

      return {
        statusCode: 200,
      headers,
        body: JSON.stringify(response),
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