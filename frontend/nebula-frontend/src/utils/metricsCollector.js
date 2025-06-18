/**
 * Prevents retry storms by temporarily stopping requests after failures
 */
class CircuitBreaker {
  constructor(threshold = 5, timeout = 30000, resetTimeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.resetTimeout = resetTimeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
    this.lastFailureTime = 0;
  }
  
  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN. Next attempt in ${Math.ceil((this.nextAttempt - Date.now()) / 1000)}s`);
      }
      this.state = 'HALF_OPEN';
      console.log('🔄 Circuit breaker moving to HALF_OPEN state');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    console.log('✅ Circuit breaker: Request succeeded, resetting failure count');
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    console.warn(`⚠️ Circuit breaker: Failure ${this.failureCount}/${this.threshold}`);
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.error(`🚨 Circuit breaker OPENED! Blocking requests for ${this.timeout/1000}s`);
    }
  }
  
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.nextAttempt,
      timeUntilNextAttempt: Math.max(0, this.nextAttempt - Date.now())
    };
  }
}

/**
 * Metrics Collector with localStorage batching and Redis backend
 * Provides offline resilience and efficient batching
 */
export class MetricsCollector {
  constructor(options = {}) {
    this.options = {
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      endpoint: '/.netlify/functions/analytics',
      storageKey: 'nebula_pending_metrics',
      ...options
    };
    
    this.widgetId = this.generateWidgetId();
    this.flushTimer = null;
    this.isOnline = navigator.onLine;
    
    this.circuitBreaker = new CircuitBreaker(
      5,     // threshold: 5 failures
      30000, // timeout: 30 seconds
      60000  // reset timeout: 60 seconds
    );
    
    this.setupEventListeners();
    
    this.startFlushInterval();
    
    this.flushMetrics();
  }
  
  generateWidgetId() {
    try {
      const domain = window.location.hostname || 'localhost';
      const path = window.location.pathname || '/';
      return `${domain}${path}`.replace(/[^a-zA-Z0-9]/g, '_');
    } catch (e) {
      return 'unknown_widget';
    }
  }
  
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushMetrics();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    window.addEventListener('beforeunload', () => {
      this.flushMetrics(true);
    });
    
    window.addEventListener('pagehide', () => {
      this.flushMetrics(true);
    });
  }
  
  startFlushInterval() {
    this.flushTimer = setInterval(() => {
      this.flushMetrics();
    }, this.options.flushInterval);
  }

  stopFlushInterval() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
  
  track(type, data = {}) {
    try {
      const metric = {
        type,
        timestamp: Date.now(),
        widget_id: this.widgetId,
        url: window.location.href,
        user_agent: navigator.userAgent,
        ...data
      };
      
      const metrics = this.getPendingMetrics();
      metrics.push(metric);
      
      this.savePendingMetrics(metrics);
      
      if (metrics.length >= this.options.batchSize) {
        this.flushMetrics();
      }
      
      window.dispatchEvent(new CustomEvent('nebula:metric', { detail: metric }));
      
    } catch (error) {
      console.error('Failed to track metric:', error);
    }
  }
  
  trackLoad(success = true, loadTime = null) {
    this.track('load', {
      success,
      load_time: loadTime || performance.now()
    });
  }
  
  trackRender(renderTime) {
    this.track('render', {
      render_time: renderTime,
      success: true
    });
  }
  
  trackWalletConnect(success, walletType = null) {
    this.track('wallet_connect', {
      success,
      wallet_type: walletType
    });
  }
  
  trackInteraction(action, success, error = null) {
    this.track('interaction', {
      action, // 'stake', 'claim', 'mine'
      success,
      error: error ? error.message || error : null
    });
  }
  
  trackCustom(eventName, data = {}) {
    this.track('custom', {
      event_name: eventName,
      ...data
    });
  }
  
  getPendingMetrics() {
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to get pending metrics:', e);
      return [];
    }
  }
  
  savePendingMetrics(metrics) {
    try {
      const maxStored = 1000;
      if (metrics.length > maxStored) {
        metrics = metrics.slice(-maxStored);
      }
      
      localStorage.setItem(this.options.storageKey, JSON.stringify(metrics));
    } catch (e) {
      console.error('Failed to save pending metrics:', e);
      this.flushMetrics();
    }
  }

  async flushMetrics(forceSync = false) {
    if (!this.isOnline && !forceSync) {
      return;
    }
    
    const metrics = this.getPendingMetrics();
    if (metrics.length === 0) {
      return;
    }
    
    if (forceSync && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ metrics })], {
        type: 'application/json'
      });
      
      const success = navigator.sendBeacon(this.options.endpoint, blob);
      if (success) {
        localStorage.removeItem(this.options.storageKey);
      }
      return;
    }
    
    try {
      await this.circuitBreaker.call(async () => {
        const response = await fetch(this.options.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ metrics }),
        });
        
        if (response.ok) {
          localStorage.removeItem(this.options.storageKey);
          
          window.dispatchEvent(new CustomEvent('nebula:metrics_flushed', { 
            detail: { count: metrics.length } 
          }));
          
          console.log(`📊 Successfully sent ${metrics.length} metrics`);
        } else {
          if (response.status === 503) {
            console.warn('Analytics backend not configured');
            throw new Error(`Analytics backend not configured: ${response.status}`);
          } else {
            throw new Error(`Failed to send metrics: ${response.status}`);
          }
        }
      });
    } catch (error) {
      if (error.message.includes('Circuit breaker is OPEN')) {
        console.warn('🔒 Metrics sending blocked by circuit breaker:', error.message);
      } else {
        console.error('Failed to flush metrics:', error);
      }
    }
  }
  

  getSummary() {
    const metrics = this.getPendingMetrics();
    return {
      pending_count: metrics.length,
      widget_id: this.widgetId,
      is_online: this.isOnline,
      circuit_breaker: this.circuitBreaker.getState(),
      types: metrics.reduce((acc, m) => {
        acc[m.type] = (acc[m.type] || 0) + 1;
        return acc;
      }, {})
    };
  }
  

  clearPending() {
    localStorage.removeItem(this.options.storageKey);
    window.dispatchEvent(new CustomEvent('nebula:metrics_cleared'));
  }
  

  destroy() {
    this.stopFlushInterval();
    this.flushMetrics();
    
    window.removeEventListener('online', this.setupEventListeners);
    window.removeEventListener('offline', this.setupEventListeners);
    window.removeEventListener('beforeunload', this.setupEventListeners);
    window.removeEventListener('pagehide', this.setupEventListeners);
  }
}

let instance = null;

export function getMetricsCollector(options) {
  if (!instance) {
    instance = new MetricsCollector(options);
  }
  return instance;
}

export default {
  MetricsCollector,
  getMetricsCollector,
}; 