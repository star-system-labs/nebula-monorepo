// Enhanced Widget Analytics - Comprehensive analytics system for Nebula Widget
import { getMetricsCollector } from './metricsCollector';

const RPC_CATEGORIES = {
  READ: ['eth_call', 'eth_getBalance', 'eth_getCode', 'eth_getStorageAt', 'eth_blockNumber'],
  WRITE: ['eth_sendTransaction', 'eth_sendRawTransaction'],
  WALLET: ['eth_requestAccounts', 'eth_accounts', 'wallet_requestPermissions'],
  NETWORK: ['eth_chainId', 'net_version', 'eth_getBlockByNumber'],
  GAS: ['eth_estimateGas', 'eth_gasPrice', 'eth_feeHistory'],
  OTHER: []
};

const ERROR_TYPES = {
  WALLET: ['user rejected', 'user denied', 'action_rejected', 'unauthorized', 'user cancelled', 'user canceled', 'cancelled by user', 'canceled by user', 'rejected by user', 'declined by user', 'user declined', 'aborted by user', 'user aborted', 'permission denied', 'access denied', 'wallet closed', 'popup closed', 'user refused', 'connection refused', 'request refused'],
  NETWORK: ['network error', 'timeout', 'connection', 'fetch', 'cors', 'network changed'],
  CONTRACT: ['revert', 'execution reverted', 'gas', 'out of gas', 'insufficient funds'],
  RPC: ['rpc error', 'internal error', 'method not found', 'invalid params'],
  TRANSACTION: ['transaction failed', 'nonce', 'replacement transaction', 'already known'],
  VALIDATION: ['invalid', 'missing', 'required', 'format', 'length']
};

class EnhancedWidgetAnalytics {
  constructor() {
    const analyticsEndpoint = this.getAnalyticsEndpoint();
    this.collector = getMetricsCollector({
      endpoint: analyticsEndpoint,
      batchSize: 50,
      flushInterval: 30000, // 30s
    });
    
    console.log('🔧: Widget analytics initialized with endpoint:', analyticsEndpoint);
    
    this.sessionId = this.generateSessionId();
    this.loadStartTime = performance.now();
    
    this.loadAttemptId = null;
    this.renderSessionId = this.generateSessionId();
    this.loadStages = new Map();
    this.renderStages = new Map();
    this.componentRenderTimes = new Map();
    
    this.rpcInterceptor = null;
    this.performanceObserver = null;
    this.errorCounts = new Map();
    this.rpcLatencies = new Map();
    this.userJourney = [];
    this.sessionMetrics = {
      startTime: Date.now(),
      interactions: 0,
      errors: 0,
      rpcCalls: 0,
      walletConnections: 0,
      loadAttempts: 0,
      renderStages: 0
    };
    
    this.widgetCircuitBreaker = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
      threshold: 3,
      timeout: 60000, // 1 min
      
      canExecute() {
        if (!this.isOpen) return true;
        
        if (Date.now() - this.lastFailure > this.timeout) {
          console.log('🔄 Widget circuit breaker: Attempting to close after timeout');
          this.isOpen = false;
          this.failures = 0;
          return true;
        }
        
        return false;
      },
      
      recordSuccess() {
        this.failures = 0;
        this.isOpen = false;
      },
      
      recordFailure() {
        this.failures++;
        this.lastFailure = Date.now();
        
        if (this.failures >= this.threshold) {
          this.isOpen = true;
          console.warn(`🚨 Widget circuit breaker: OPENED after ${this.failures} failures. Next attempt in ${this.timeout/1000}s`);
        }
      }
    };
    
    this.initializeInterceptors();
    this.initializePerformanceMonitoring();
    this.trackPageVisibility();
    
    this.initializeLoadTracking();
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getAnalyticsSource() {
    const isHealthCheckPage = window.location.pathname.includes('health-check') || 
                             window.location.href.includes('health-check');
    
    if (isHealthCheckPage) {
      return 'health-check-embedded-widget';
    } else if (window.location.origin.includes('starsystemlabs.com')) {
      return 'main-site-widget';
    } else {
      return 'external-embedded-widget';
    }
  }

  getAnalyticsEndpoint() {
    // Always use the widget domain for analytics
    const widgetDomain = 'https://widget.starsystemlabs.com';
    const endpoint = `${widgetDomain}/.netlify/functions/analytics`;
    
    console.log('🔧: Analytics endpoint determined', {
      currentDomain: window.location.origin,
      widgetDomain,
      endpoint,
      isEmbedded: window.location.origin !== widgetDomain
    });
    
    return endpoint;
  }

  initializeLoadTracking() {
    this.loadAttemptId = this.generateSessionId();
    this.sessionMetrics.loadAttempts++;
    
    this.trackLoadAttempt(null, 'initiated');
    
    if (performance.navigation) {
      this.trackNavigationTiming();
    }
  }

  trackLoadAttempt(success = null, stage = 'unknown', error = null) {
    const attemptData = {
      success,
      stage,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      loadAttemptId: this.loadAttemptId
    };
    
    if (error) {
      attemptData.errorCategory = this.categorizeError(error);
    }
    
    this.collector.track('load', {
      success,
      stage,
      error: error ? this.categorizeError(error) : null,
      sessionId: this.sessionId,
      loadAttemptId: this.loadAttemptId
    });
    
    console.log(`📊 LOAD ATTEMPT (HYBRID): ${stage} - ${success !== null ? (success ? 'SUCCESS' : 'FAILED') : 'IN_PROGRESS'}`);
  }

  trackLoadStage(stage, success, timing, details = {}) {
    const criticalStages = ['complete', 'failed'];
    
    const stageData = {
      stage,
      success,
      timing: Math.round(timing),
      loadAttemptId: this.loadAttemptId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      ...details
    };
    
    this.loadStages.set(stage, stageData);
    
    if (criticalStages.includes(stage)) {
      this.collector.track('load', {
        success,
        duration: timing,
        load_time: timing,
        stage,
        sessionId: this.sessionId,
        loadAttemptId: this.loadAttemptId
      });
      
      console.log(`📊 LOAD STAGE: ${stage} - ${timing}ms - ${success ? 'SUCCESS' : 'FAILED'} - Type: load`);
    } else {
      console.log(`📊 LOAD STAGE: ${stage} - ${timing}ms - ${success ? 'SUCCESS' : 'FAILED'} - SKIPPED (bandwidth optimization)`);
    }
  }

  trackNavigationTiming() {
    if (!performance.timing) return;
    
    const timing = performance.timing;
    const navigationStart = timing.navigationStart;
    
    const timingBreakdown = {
      dns_lookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcp_connect: timing.connectEnd - timing.connectStart,
      ssl_handshake: timing.secureConnectionStart > 0 ? timing.connectEnd - timing.secureConnectionStart : 0,
      request_time: timing.responseStart - timing.requestStart,
      response_time: timing.responseEnd - timing.responseStart,
      dom_processing: timing.domContentLoadedEventStart - timing.responseEnd,
      load_complete: timing.loadEventEnd - timing.loadEventStart,
      total_load_time: timing.loadEventEnd - navigationStart,
      loadAttemptId: this.loadAttemptId,
      sessionId: this.sessionId
    };
    
    this.safeCollectorCall('trackCustom', 'navigation_timing', timingBreakdown);
    
    this.trackLoadStage('dns', timingBreakdown.dns_lookup >= 0, timingBreakdown.dns_lookup);
    this.trackLoadStage('tcp', timingBreakdown.tcp_connect >= 0, timingBreakdown.tcp_connect);
    this.trackLoadStage('request', timingBreakdown.request_time >= 0, timingBreakdown.request_time);
    this.trackLoadStage('response', timingBreakdown.response_time >= 0, timingBreakdown.response_time);
    this.trackLoadStage('dom', timingBreakdown.dom_processing >= 0, timingBreakdown.dom_processing);
    
    console.log('📊 NAVIGATION TIMING: Detailed breakdown tracked', timingBreakdown);
  }

  trackRenderStage(stage, timing, componentName = null) {
    const criticalStages = ['complete'];
    
    const stageData = {
      stage,
      timing: Math.round(timing),
      componentName,
      renderSessionId: this.renderSessionId,
      sessionId: this.sessionId,
      timestamp: Date.now()
    };
    
    this.renderStages.set(`${stage}_${componentName || 'global'}`, stageData);
    
    if (criticalStages.includes(stage)) {
      this.collector.track('render', {
        duration: timing,
        render_time: timing,
        stage,
        componentName,
        sessionId: this.sessionId,
        renderSessionId: this.renderSessionId
      });
      
      console.log(`📊 RENDER STAGE: ${stage} - ${timing}ms - ${componentName || 'global'} - Type: render`);
    } else {
      console.log(`📊 RENDER STAGE: ${stage} - ${timing}ms - ${componentName || 'global'} - SKIPPED (bandwidth optimization)`);
    }
  }

  trackComponentRender(componentName, renderTime) {
    this.componentRenderTimes.set(componentName, renderTime);
    
    if (renderTime > 50) {
      this.collector.track('render', {
        duration: renderTime,
        render_time: renderTime,
        componentName,
        sessionId: this.sessionId,
        type: 'component_render'
      });
      
      console.log(`📊 COMPONENT RENDER: ${componentName} - ${renderTime}ms - Type: render`);
    } else {
      console.log(`📊 COMPONENT RENDER: ${componentName} - ${renderTime}ms - SKIPPED (< 50ms threshold)`);
    }
  }

  hashProps(props) {
    try {
      return btoa(JSON.stringify(Object.keys(props).sort())).substring(0, 16);
    } catch (e) {
      return 'hash_error';
    }
  }

  initializeInterceptors() {
    console.log('🔧: Initializing enhanced RPC interceptors...');
    
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log('✅: Ethereum provider detected, setting up interceptor');
      this.interceptEthereumProvider();
    } else {
      console.log('⏳: No ethereum provider yet, setting up listeners');
    }
    
    window.addEventListener('ethereum#initialized', () => {
      console.log('🔔: ethereum#initialized event fired');
      this.interceptEthereumProvider();
    });
    
    window.addEventListener('eip6963:announceProvider', () => {
      console.log('🔔: eip6963:announceProvider event fired');
      this.interceptEthereumProvider();
    });
    
    let checkCount = 0;
    const providerCheck = setInterval(() => {
      checkCount++;
      if (window.ethereum && !this.rpcInterceptor) {
        console.log(`🔔: Ethereum provider detected on check #${checkCount}`);
        this.interceptEthereumProvider();
        clearInterval(providerCheck);
      } else if (checkCount >= 10) {
        console.log('⏹️: Stopped checking for ethereum provider after 10 attempts');
        clearInterval(providerCheck);
      }
    }, 1000);
  }

  interceptEthereumProvider() {
    if (!window.ethereum) {
      console.warn('⚠️: No ethereum provider available for interception');
      return;
    }
    
    if (this.rpcInterceptor) {
      console.log('ℹ️: RPC interceptor already initialized');
      return;
    }
    
    const originalRequest = window.ethereum.request;
    if (!originalRequest) {
      console.warn('⚠️: Ethereum provider has no request method');
      return;
    }
    
    const self = this;
    
    window.ethereum.request = async function(args) {
      const startTime = performance.now();
      const method = args.method;
      const category = self.categorizeRPCMethod(method);
      
      console.log(`🌐: RPC Call intercepted: ${method} (${category})`);
      
      try {
        const result = await originalRequest.call(this, args);
        const duration = performance.now() - startTime;
        
        self.trackRPC(method, duration, true, category);
        
        console.log(`✅: RPC Success: ${method} - ${Math.round(duration)}ms`);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        
        self.trackRPC(method, duration, false, category, error);
        
        console.log(`❌: RPC Failed: ${method} - ${Math.round(duration)}ms - ${error.message}`);
        throw error;
      }
    };
    
    this.rpcInterceptor = true;
    console.log('✅: Enhanced RPC interceptor successfully initialized');
    
    this.testRPCInterceptor();
  }

  async testRPCInterceptor() {
    try {
      console.log('🧪: Testing RPC interceptor...');
      
      if (window.ethereum && window.ethereum.request) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log(`✅: RPC interceptor test successful - Chain ID: ${chainId}`);
      }
    } catch (error) {
      console.log(`ℹ️: RPC interceptor test completed (expected if no wallet connected): ${error.message}`);
    }
  }

  initializePerformanceMonitoring() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        this.setupNavigationObserver();
        this.setupPaintObserver();
        this.setupLayoutShiftObserver();
        this.setupResourceObserver();
        
        this.initializeWebVitals();
        
        console.log('✅: Enhanced Performance Monitoring initialized');
      } catch (error) {
        console.warn('Performance Observer setup failed:', error);
      }
    }
  }

  setupNavigationObserver() {
    console.log('📊: Navigation performance tracking disabled for bandwidth optimization');
    return;
  }

  setupPaintObserver() {
    console.log('📊: Paint timing tracking disabled for bandwidth optimization');
    return;
  }

  setupLayoutShiftObserver() {
    console.log('📊: Layout shift tracking disabled for bandwidth optimization');
    return;
  }

  setupResourceObserver() {
    console.log('📊: Resource performance tracking disabled for bandwidth optimization');
    return;
  }

  trackNavigationPerformance(entry) {
    const timing = {
      dns_lookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcp_connect: entry.connectEnd - entry.connectStart,
      ssl_handshake: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
      request_time: entry.responseStart - entry.requestStart,
      response_time: entry.responseEnd - entry.responseStart,
      dom_processing: entry.domContentLoadedEventStart - entry.responseEnd,
      load_complete: entry.loadEventEnd - entry.loadEventStart,
      total_load_time: entry.loadEventEnd - entry.navigationStart,
      transfer_size: entry.transferSize || 0,
      encoded_body_size: entry.encodedBodySize || 0,
      decoded_body_size: entry.decodedBodySize || 0,
      sessionId: this.sessionId,
      loadAttemptId: this.loadAttemptId
    };

    this.safeCollectorCall('trackCustom', 'navigation_performance', timing);
    
    this.trackLoadStage('dns', timing.dns_lookup >= 0, timing.dns_lookup, { type: 'navigation_api' });
    this.trackLoadStage('tcp', timing.tcp_connect >= 0, timing.tcp_connect, { type: 'navigation_api' });
    this.trackLoadStage('ssl', timing.ssl_handshake >= 0, timing.ssl_handshake, { type: 'navigation_api' });
    this.trackLoadStage('request', timing.request_time >= 0, timing.request_time, { type: 'navigation_api' });
    this.trackLoadStage('response', timing.response_time >= 0, timing.response_time, { type: 'navigation_api' });
    
    console.log('📊 NAVIGATION PERFORMANCE: Enhanced timing tracked', timing);
  }

  trackPaintTiming(entry) {
    const paintData = {
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      sessionId: this.sessionId,
      renderSessionId: this.renderSessionId
    };

    this.safeCollectorCall('trackCustom', 'paint_timing', paintData);
    
    const stage = entry.name === 'first-paint' ? 'first_paint' : 'first_contentful_paint';
    this.trackRenderStage(stage, entry.startTime);
    
    console.log(`📊 PAINT TIMING: ${entry.name} - ${entry.startTime}ms`, paintData);
  }

  trackLayoutShift(entry) {
    const shiftData = {
      value: entry.value,
      hadRecentInput: entry.hadRecentInput,
      lastInputTime: entry.lastInputTime,
      sources: entry.sources ? entry.sources.length : 0,
      sessionId: this.sessionId,
      renderSessionId: this.renderSessionId
    };

    this.safeCollectorCall('trackCustom', 'layout_shift', shiftData);
    
    console.log(`📊 LAYOUT SHIFT: ${entry.value} - Recent input: ${entry.hadRecentInput}`, shiftData);
  }

  trackResourcePerformance(entry) {
    const resourceData = {
      name: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize || 0,
      encodedBodySize: entry.encodedBodySize || 0,
      decodedBodySize: entry.decodedBodySize || 0,
      initiatorType: entry.initiatorType,
      nextHopProtocol: entry.nextHopProtocol || 'unknown',
      renderBlockingStatus: entry.renderBlockingStatus || 'unknown',
      sessionId: this.sessionId,
      loadAttemptId: this.loadAttemptId
    };

    this.safeCollectorCall('trackCustom', 'resource_performance', resourceData);
    
    console.log(`📊 RESOURCE PERFORMANCE: ${entry.name} - ${entry.duration}ms`, resourceData);
  }

  initializeWebVitals() {
    console.log('📊: Web Vitals tracking disabled for bandwidth optimization');
    return;
  }

  observeLCP() {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        const lcpData = {
          value: lastEntry.startTime,
          rating: this.rateLCP(lastEntry.startTime),
          element: lastEntry.element?.tagName || 'unknown',
          url: lastEntry.url || window.location.href,
          sessionId: this.sessionId,
          renderSessionId: this.renderSessionId
        };
        
        this.safeCollectorCall('trackCustom', 'web_vital_lcp', lcpData);
        this.trackRenderStage('largest_contentful_paint', lastEntry.startTime);
        
        console.log(`📊 WEB VITAL LCP: ${lastEntry.startTime}ms - ${lcpData.rating}`, lcpData);
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP observer setup failed:', error);
    }
  }

  observeFID() {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidData = {
            value: entry.processingStart - entry.startTime,
            rating: this.rateFID(entry.processingStart - entry.startTime),
            eventType: entry.name,
            sessionId: this.sessionId
          };
          
          this.safeCollectorCall('trackCustom', 'web_vital_fid', fidData);
          
          console.log(`📊 WEB VITAL FID: ${fidData.value}ms - ${fidData.rating}`, fidData);
        }
      });
      
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID observer setup failed:', error);
    }
  }

  observeCLS() {
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries = [];
    
    try {
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
            
            if (sessionValue && entry.startTime - lastSessionEntry.startTime < 1000 && entry.startTime - firstSessionEntry.startTime < 5000) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }
            
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              
              const clsData = {
                value: clsValue,
                rating: this.rateCLS(clsValue),
                sessionId: this.sessionId,
                renderSessionId: this.renderSessionId
              };
              
              this.safeCollectorCall('trackCustom', 'web_vital_cls', clsData);
              
              console.log(`📊 WEB VITAL CLS: ${clsValue} - ${clsData.rating}`, clsData);
            }
          }
        }
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS observer setup failed:', error);
    }
  }

  observeFCP() {
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            const fcpData = {
              value: entry.startTime,
              rating: this.rateFCP(entry.startTime),
              sessionId: this.sessionId,
              renderSessionId: this.renderSessionId
            };
            
            this.safeCollectorCall('trackCustom', 'web_vital_fcp', fcpData);
            
            console.log(`📊 WEB VITAL FCP: ${entry.startTime}ms - ${fcpData.rating}`, fcpData);
          }
        }
      });
      
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('FCP observer setup failed:', error);
    }
  }

  rateLCP(value) {
    return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
  }

  rateFID(value) {
    return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
  }

  rateCLS(value) {
    return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
  }

  rateFCP(value) {
    return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
  }

  categorizeRPCMethod(method) {
    for (const [category, methods] of Object.entries(RPC_CATEGORIES)) {
      if (methods.includes(method)) {
        return category;
      }
    }
    return 'OTHER';
  }

  categorizeError(error) {
    const errorMessage = (error.message || error.toString()).toLowerCase();
    const errorCode = error.code || error.reason || '';
    const errorName = error.name ? error.name.toLowerCase() : '';
    
    console.log('🔍 ENHANCED ERROR CLASSIFICATION:', {
      message: errorMessage,
      code: errorCode,
      name: errorName,
      fullError: error
    });
    
    const userRejectionCodes = [
      4001,    // Standard EIP-1193 user rejection
      4100,    // Unauthorized - sometimes used for rejections
      -32603,  // Internal error (sometimes used for rejections)
      'ACTION_REJECTED',
      'UNAUTHORIZED',
      'USER_REJECTED',
      'REJECTED_BY_USER'
    ];
    
    if (userRejectionCodes.includes(errorCode) || 
        userRejectionCodes.includes(String(errorCode)) ||
        userRejectionCodes.includes(errorCode?.toString())) {
      console.log('✅ USER REJECTION DETECTED - Error Code:', errorCode);
      return { 
        type: 'WALLET', 
        subtype: 'user_rejected', 
        code: errorCode,
        confidence: 'high',
        reason: 'error_code_match'
      };
    }
    
    const userRejectionNames = ['usererror', 'rejectionerror', 'cancellederror', 'aborterror'];
    if (userRejectionNames.some(name => errorName.includes(name))) {
      console.log('✅ USER REJECTION DETECTED - Error Name:', errorName);
      return { 
        type: 'WALLET', 
        subtype: 'user_rejected', 
        name: errorName,
        confidence: 'high',
        reason: 'error_name_match'
      };
    }
    
    // Direct wallet rejection patterns (high confidence)
    const directRejectionPatterns = [
      'user rejected', 'user denied', 'user cancelled', 'user canceled',
      'rejected by user', 'denied by user', 'cancelled by user', 'canceled by user',
      'user declined', 'declined by user', 'user aborted', 'aborted by user',
      'user refused', 'refused by user', 'permission denied by user',
      'access denied by user', 'request denied by user'
    ];
    
    for (const pattern of directRejectionPatterns) {
      if (errorMessage.includes(pattern)) {
        console.log('✅ USER REJECTION DETECTED - Direct Pattern:', pattern);
        return { 
          type: 'WALLET', 
          subtype: 'user_rejected', 
          pattern: pattern,
          confidence: 'high',
          reason: 'direct_pattern_match'
        };
      }
    }
    
    // Indirect wallet rejection patterns (medium confidence)
    const indirectRejectionPatterns = [
      'popup closed', 'wallet closed', 'connection refused', 'request refused',
      'permission denied', 'access denied', 'unauthorized access', 
      'authentication failed', 'signing cancelled', 'signing canceled'
    ];
    
    for (const pattern of indirectRejectionPatterns) {
      if (errorMessage.includes(pattern)) {
        console.log('✅ USER REJECTION DETECTED - Indirect Pattern:', pattern);
        return { 
          type: 'WALLET', 
          subtype: 'user_rejected', 
          pattern: pattern,
          confidence: 'medium',
          reason: 'indirect_pattern_match'
        };
      }
    }
    
    for (const [category, keywords] of Object.entries(ERROR_TYPES)) {
      if (category === 'WALLET') continue;
      
      for (const keyword of keywords) {
        if (errorMessage.includes(keyword)) {
          console.log(`📊 ERROR CLASSIFIED - Category: ${category}, Keyword: ${keyword}`);
          return { 
            type: category, 
            subtype: keyword, 
            message: errorMessage.substring(0, 100),
            confidence: 'medium',
            reason: 'keyword_match'
          };
        }
      }
    }
    
    if (errorMessage.includes('wallet') || errorMessage.includes('metamask') || 
        errorMessage.includes('ethereum') || errorMessage.includes('web3')) {
      console.log('⚠️ WALLET ERROR - No clear rejection pattern, classifying as technical');
      return { 
        type: 'WALLET', 
        subtype: 'technical_error', 
        message: errorMessage.substring(0, 100),
        confidence: 'low',
        reason: 'wallet_context_fallback'
      };
    }
    
    // Ultimate fallback
    console.log('❓ UNKNOWN ERROR TYPE:', errorMessage.substring(0, 100));
    return { 
      type: 'UNKNOWN', 
      subtype: 'uncategorized', 
      message: errorMessage.substring(0, 100),
      confidence: 'none',
      reason: 'no_match_found'
    };
  }

  // === CORE TRACKING METHODS ===

  trackLoadComplete() {
    const loadTime = performance.now() - this.loadStartTime;
    
    this.trackLoadAttempt(true, 'complete');
    this.trackLoadStage('complete', true, loadTime, { 
      totalLoadTime: loadTime,
      loadSuccess: true 
    });
    
    const loadEventData = {
      success: true,
      duration: Math.round(loadTime),
      load_time: Math.round(loadTime),
      sessionId: this.sessionId,
      loadAttemptId: this.loadAttemptId,
      stage: 'complete',
      source: this.getAnalyticsSource(),
      timestamp: Date.now()
    };
    
    this.collector.trackLoad(true, Math.round(loadTime));
    this.collector.track('load', loadEventData);
    
    console.log(`✅: LOAD COMPLETE - ${Math.round(loadTime)}ms - Success: true - Source: ${loadEventData.source}`);
  }

  trackLoadError(error) {
    const errorCategory = this.categorizeError(error);
    const loadTime = performance.now() - this.loadStartTime;
    
    this.trackLoadAttempt(false, 'failed', error);
    this.trackLoadStage('failed', false, loadTime, { 
      error: errorCategory,
      partialLoadTime: loadTime 
    });
    
    this.safeCollectorCall('trackLoad', false);
    this.safeCollectorCall('trackCustom', 'load_error_detailed', { 
      errorCategory,
      sessionId: this.sessionId,
      loadAttemptId: this.loadAttemptId,
      loadTime
    });
    
    console.error(`❌ LOAD FAILED: ${loadTime}ms - Attempt: ${this.loadAttemptId}`, {
      error: errorCategory,
      loadTime
    });
  }

  trackWalletConnect(success, walletType = null, error = null) {
    this.sessionMetrics.walletConnections++;
    
    const walletEventData = {
      success,
        walletType,
      error: error ? this.categorizeError(error) : null,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      connectTime: performance.now() - this.loadStartTime,
      source: this.getAnalyticsSource()
    };
    
    console.log(`🔗: WALLET CONNECT - ${success ? 'SUCCESS' : 'FAILED'} - ${walletType || 'unknown'} - Source: ${walletEventData.source}`, {
      eventType: 'wallet_connect',
      eventData: walletEventData,
      collectorEndpoint: this.collector.options?.endpoint,
      circuitBreakerState: this.widgetCircuitBreaker.isOpen,
      sessionMetrics: this.sessionMetrics
    });
    
    try {
      this.collector.track('wallet_connect', walletEventData);
      console.log(`✅: WALLET CONNECT EVENT SENT SUCCESSFULLY - Source: ${walletEventData.source}`);
    } catch (error) {
      console.error(`❌: WALLET CONNECT EVENT FAILED:`, error);
    }
  }

  trackInteraction(action, success, details = {}) {
    console.log(`🔧: Tracking interaction - ${action} - ${success ? 'SUCCESS' : 'FAILED'}`);
    
    this.sessionMetrics.interactions++;
    if (!success) this.sessionMetrics.errors++;
    
    let errorCategory = null;
    if (!success && details.error) {
      errorCategory = this.categorizeError(details.error);
      
      const errorKey = `${errorCategory.type}_${errorCategory.subtype}`;
      this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
      
      console.log(`📊: Error categorized as ${errorCategory.type}_${errorCategory.subtype}`);
    }
    
    const interactionEventData = {
      action: action || 'unknown',
      success: Boolean(success),
      error: errorCategory,
      duration: details.duration || null,
      amount: details.amount || null,
      txHash: details.txHash || null,
      gasUsed: details.gasUsed || null,
      blockNumber: details.blockNumber || null,
      slotIndex: details.slotIndex || null,
      vestingPeriod: details.vestingPeriod || null,
      token: details.token || null,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      source: this.getAnalyticsSource()
    };
    
    if (!this.validateInteractionData(interactionEventData)) {
      console.error('❌: Invalid interaction data, skipping track');
      return;
    }
    
    try {
      this.collector.track('interaction', interactionEventData);
      console.log(`✅: Interaction event sent successfully - ${action}`);
      
      if (typeof window !== 'undefined' && window.fn && window.fn.trackCustom && window.fn !== this.collector) {
        window.fn.trackCustom('interaction_cross_validation', {
          action,
          success,
          timestamp: Date.now(),
          source: 'main_app_widget'
        });
        console.log(`📊: Cross-validation event sent to health-check analytics`);
      }
      
    } catch (error) {
      console.error(`❌: Failed to send interaction event:`, error);
      
      this.retryInteractionTracking(action, success, error);
    }
    
    console.log(`⚡: INTERACTION TRACKED - ${action} - ${success ? 'SUCCESS' : 'FAILED'}`, {
      eventType: 'interaction',
      eventData: interactionEventData,
      collectorEndpoint: this.collector.options?.endpoint,
      sessionMetrics: this.sessionMetrics
    });
  }

  validateInteractionData(data) {
    if (!data.action || typeof data.action !== 'string') {
      console.error('❌: Invalid interaction action:', data.action);
      return false;
    }
    
    if (typeof data.success !== 'boolean') {
      console.error('❌: Invalid interaction success value:', data.success);
      return false;
    }
    
    if (!data.sessionId) {
      console.error('❌: Missing sessionId in interaction data');
      return false;
    }
    
    return true;
  }

  retryInteractionTracking(action, success, originalError) {
    console.log(`🔄: Retrying interaction tracking for ${action}`);
    
    try {
      const simplifiedData = {
        action,
        success: Boolean(success),
        sessionId: this.sessionId,
        timestamp: Date.now(),
        retry: true,
        originalError: originalError?.message || 'Unknown error'
      };
      
      this.collector.track('interaction', simplifiedData);
      console.log(`✅: Interaction retry successful - ${action}`);
    } catch (retryError) {
      console.error(`❌: Interaction retry also failed:`, retryError);
    }
  }

  trackRPC(method, duration, success, category = null, error = null) {
    this.sessionMetrics.rpcCalls++;
    
    if (!this.rpcLatencies.has(method)) {
      this.rpcLatencies.set(method, []);
    }
    this.rpcLatencies.get(method).push(duration);
    
    const rpcEventData = {
      method,
      duration: Math.round(duration),
      success,
      category: category || this.categorizeRPCMethod(method),
      error: error ? this.categorizeError(error) : null,
      sessionId: this.sessionId,
      source: this.getAnalyticsSource(),
      timestamp: Date.now()
    };
    
    this.collector.track('rpc', rpcEventData);
    
    console.log(`🌐: RPC - ${method} - ${Math.round(duration)}ms - ${success ? 'SUCCESS' : 'FAILED'} - Source: ${rpcEventData.source}`);
  }

  trackTransaction(type, txHash, status, gasUsed = null) {
    const transactionData = {
      type,
      txHash,
      status,
      gasUsed,
      sessionId: this.sessionId,
      timestamp: Date.now()
    };
    
    this.collector.track('transaction', transactionData);
    
    console.log(`💰 TRANSACTION: ${type} - ${status} - ${txHash?.substring(0, 10)}...`);
  }

  trackRenderComplete() {
    const renderTime = performance.now() - this.loadStartTime;
    
    this.trackRenderStage('complete', renderTime);
    
    const renderEventData = {
      success: true,
      duration: Math.round(renderTime),
      render_time: Math.round(renderTime),
      sessionId: this.sessionId,
      renderSessionId: this.renderSessionId,
      componentCount: this.componentRenderTimes.size,
      stage: 'complete',
      source: this.getAnalyticsSource(),
      timestamp: Date.now()
    };
    
    this.collector.trackRender(Math.round(renderTime));
    this.collector.track('render', renderEventData);
    
    console.log(`✅: RENDER COMPLETE - ${Math.round(renderTime)}ms - Success: true - Source: ${renderEventData.source}`);
  }

  trackCustom(eventName, data = {}) {
    this.collector.track('custom', {
      event_name: eventName,
      ...data,
      sessionId: this.sessionId,
      timestamp: Date.now()
    });
    
    console.log(`🎯 CUSTOM EVENT ${eventName}`);
  }

  // === PERFORMANCE TRACKING ===

  trackPageLoad(entry) {
    const loadMetrics = {
      loadTime: entry.loadEventEnd - entry.loadEventStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      firstPaint: entry.responseEnd - entry.requestStart,
      transferSize: entry.transferSize || 0,
      timestamp: Date.now(),
      sessionId: this.sessionId
    };
    
    this.safeCollectorCall('trackCustom', 'page_load_performance', loadMetrics);
  }

  trackResourceLoad(entry) {
    if (entry.name.includes('widget') || entry.name.includes('nebula')) {
      const resourceMetrics = {
        name: entry.name,
        duration: entry.duration,
        transferSize: entry.transferSize || 0,
        type: entry.initiatorType,
        timestamp: Date.now(),
        sessionId: this.sessionId
      };
      
      this.safeCollectorCall('trackCustom', 'resource_load', resourceMetrics);
    }
  }

  trackPageVisibility() {
    let hiddenTime = null;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        hiddenTime = Date.now();
        this.safeCollectorCall('trackCustom', 'page_hidden', {
          sessionId: this.sessionId
        });
      } else if (hiddenTime) {
        const awayDuration = Date.now() - hiddenTime;
        this.safeCollectorCall('trackCustom', 'page_visible', {
          awayDuration,
          sessionId: this.sessionId
        });
        hiddenTime = null;
      }
    });
  }

  // === UTIL METHODS ===

  async timeOperation(operationName, operation) {
    const startTime = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      this.trackRPC(operationName, duration, true);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.trackRPC(operationName, duration, false);
      throw error;
    }
  }

  // === ANALYTICS SUMMARY ===

  getAnalyticsSummary() {
    const rpcStats = this.calculateRPCStats();
    const errorStats = this.calculateErrorStats();
    
    return {
      session: this.sessionMetrics,
      rpcStats,
      errorStats,
      userJourney: this.userJourney.slice(-10), // Last 10
      baseCollector: this.collector.getSummary()
    };
  }

  calculateRPCStats() {
    const stats = {};
    
    for (const [method, latencies] of this.rpcLatencies.entries()) {
      const sorted = latencies.sort((a, b) => a - b);
      stats[method] = {
        count: latencies.length,
        avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
        p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
        p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
        min: Math.min(...latencies),
        max: Math.max(...latencies)
      };
    }
    
    return stats;
  }

  calculateErrorStats() {
    const stats = {};
    let total = 0;
    
    for (const [errorType, count] of this.errorCounts.entries()) {
      stats[errorType] = count;
      total += count;
    }
    
    return { breakdown: stats, total };
  }

  getMetricsSummary() {
    return this.getAnalyticsSummary();
  }

  async flush() {
    const summary = this.getAnalyticsSummary();
    
    this.safeCollectorCall('trackCustom', 'session_summary', summary);
    
    return this.safeCollectorCall('flushMetrics');
  }

  clearPending() {
    this.collector.clearPending();
  }

  async safeCollectorCall(method, ...args) {
    if (!this.widgetCircuitBreaker.canExecute()) {
      console.warn('🚫 Widget circuit breaker: Call blocked');
      return;
    }
    
    try {
      const result = await this.collector[method](...args);
      this.widgetCircuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      this.widgetCircuitBreaker.recordFailure();
      console.warn(`🚨 Widget analytics call failed: ${method}`, error.message);
      throw error;
    }
  }
}

const enhancedWidgetAnalytics = new EnhancedWidgetAnalytics();

export { EnhancedWidgetAnalytics };
export default enhancedWidgetAnalytics; 