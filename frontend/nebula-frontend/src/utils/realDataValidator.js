/**
 * Real Data Validator - Ensures analytics system collects live data
 * Replaces all mock/sample data with real-time collection
 */

class RealDataValidator {
  constructor() {
    this.validationResults = {
      loadMetrics: { hasRealData: false, count: 0 },
      renderMetrics: { hasRealData: false, count: 0 },
      walletMetrics: { hasRealData: false, count: 0 },
      interactionMetrics: { hasRealData: false, count: 0 },
      rpcMetrics: { hasRealData: false, count: 0 },
      transactionMetrics: { hasRealData: false, count: 0 },
      errorMetrics: { hasRealData: false, count: 0 }
    };
    
    this.realDataCollectors = new Map();
    this.setupRealDataCollectors();
  }

  setupRealDataCollectors() {
    // === LOAD SUCCESS RATE COLLECTOR ===
    this.realDataCollectors.set('load', {
      collect: () => {
        const loadEvents = [];
        const loadErrors = [];
        
        const startTime = performance.now();
        
        if (document.readyState === 'complete') {
          loadEvents.push({
            type: 'load',
            event_name: 'load_complete',
            timestamp: Date.now(),
            duration: performance.now() - startTime,
            success: true
          });
        }
        
        window.addEventListener('error', (event) => {
          loadErrors.push({
            type: 'load_error',
            event_name: 'load_error',
            timestamp: Date.now(),
            error: event.error,
            success: false
          });
        });
        
        return { loadEvents, loadErrors };
      },
      validate: (data) => {
        return data.loadEvents.length > 0 || data.loadErrors.length > 0;
      }
    });

    // === RENDER TIME COLLECTOR ===
    this.realDataCollectors.set('render', {
      collect: () => {
        const renderEvents = [];
        
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
                renderEvents.push({
                  type: 'render',
                  event_name: 'render_complete',
                  timestamp: Date.now(),
                  render_time: entry.duration,
                  duration: entry.duration,
                  success: true
                });
              }
            }
          });
          
          try {
            observer.observe({ entryTypes: ['measure', 'navigation'] });
          } catch (e) {
            console.warn('PerformanceObserver not fully supported:', e);
          }
        }
        
        const componentMountStart = performance.now();
        setTimeout(() => {
          const mountTime = performance.now() - componentMountStart;
          renderEvents.push({
            type: 'render',
            event_name: 'render_complete',
            timestamp: Date.now(),
            render_time: mountTime,
            duration: mountTime,
            success: true
          });
        }, 100);
        
        return renderEvents;
      },
      validate: (data) => {
        return data.length > 0 && data.some(event => event.render_time > 0);
      }
    });

    // === WALLET CONNECTION COLLECTOR ===
    this.realDataCollectors.set('wallet', {
      collect: () => {
        const walletEvents = [];
        
        const originalConnect = window.ethereum?.request;
        if (originalConnect) {
          window.ethereum.request = async function(args) {
            const startTime = Date.now();
            
            try {
              const result = await originalConnect.call(this, args);
              
              if (args.method === 'eth_requestAccounts') {
                walletEvents.push({
                  type: 'wallet_connect',
                  event_name: 'wallet_connect_detailed',
                  timestamp: Date.now(),
                  duration: Date.now() - startTime,
                  success: true,
                  method: args.method
                });
              }
              
              return result;
            } catch (error) {
              if (args.method === 'eth_requestAccounts') {
                walletEvents.push({
                  type: 'wallet_connect',
                  event_name: 'wallet_connect_detailed',
                  timestamp: Date.now(),
                  duration: Date.now() - startTime,
                  success: false,
                  error: error,
                  method: args.method
                });
              }
              throw error;
            }
          };
        }
        
        return walletEvents;
      },
      validate: (data) => {
        return data.length > 0;
      }
    });

    // === INTERACTION COLLECTOR ===
    this.realDataCollectors.set('interaction', {
      collect: () => {
        const interactionEvents = [];
        
        document.addEventListener('click', (event) => {
          const target = event.target;
          if (target.matches('[data-action]') || target.closest('[data-action]')) {
            const actionElement = target.matches('[data-action]') ? target : target.closest('[data-action]');
            const action = actionElement.getAttribute('data-action');
            
            interactionEvents.push({
              type: 'interaction',
              action: action,
              timestamp: Date.now(),
              element: actionElement.tagName,
              success: true
            });
          }
        });
        
        return interactionEvents;
      },
      validate: (data) => {
        return data.length > 0;
      }
    });

    // === RPC LATENCY COLLECTOR ===
    this.realDataCollectors.set('rpc', {
      collect: () => {
        const rpcEvents = [];
        
        if (window.ethereum) {
          const originalRequest = window.ethereum.request;
          window.ethereum.request = async function(args) {
            const startTime = Date.now();
            
            try {
              const result = await originalRequest.call(this, args);
              const duration = Date.now() - startTime;
              
              rpcEvents.push({
                type: 'custom',
                event_name: 'rpc_detailed',
                timestamp: Date.now(),
                duration: duration,
                method: args.method,
                success: true
              });
              
              return result;
            } catch (error) {
              const duration = Date.now() - startTime;
              
              rpcEvents.push({
                type: 'custom',
                event_name: 'rpc_detailed',
                timestamp: Date.now(),
                duration: duration,
                method: args.method,
                success: false,
                error: error
              });
              
              throw error;
            }
          };
        }
        
        return rpcEvents;
      },
      validate: (data) => {
        return data.length > 0 && data.some(event => event.duration > 0);
      }
    });
  }

  // === REAL DATA VALIDATION METHODS ===
  
  async validateRealDataCollection() {
    console.log('🔍 Validating Real Data Collection...');
    
    const results = {
      totalValidators: this.realDataCollectors.size,
      passedValidators: 0,
      failedValidators: 0,
      details: {}
    };
    
    for (const [type, collector] of this.realDataCollectors) {
      try {
        const data = collector.collect();
        const isValid = collector.validate(data);
        
        results.details[type] = {
          hasRealData: isValid,
          dataCount: Array.isArray(data) ? data.length : Object.keys(data).length,
          sampleData: Array.isArray(data) ? data.slice(0, 2) : data
        };
        
        if (isValid) {
          results.passedValidators++;
          console.log(`✅ ${type}: Real data collection active`);
        } else {
          results.failedValidators++;
          console.log(`❌ ${type}: No real data detected`);
        }
        
      } catch (error) {
        results.failedValidators++;
        results.details[type] = {
          hasRealData: false,
          error: error.message
        };
        console.error(`❌ ${type}: Validation error -`, error);
      }
    }
    
    console.log(`📊 Validation Summary: ${results.passedValidators}/${results.totalValidators} collectors active`);
    return results;
  }

  // === ANALYTICS DATA QUALITY CHECKER ===
  
  async checkAnalyticsDataQuality() {
    try {
      const response = await fetch('/.netlify/functions/analytics?range=1h');
      const data = await response.json();
      
      const quality = {
        hasRealLoadData: data.metrics?.data_quality?.has_real_load_data || false,
        hasRealRenderData: data.metrics?.data_quality?.has_real_render_data || false,
        hasRealWalletData: data.metrics?.data_quality?.has_real_wallet_data || false,
        hasRealInteractionData: data.metrics?.data_quality?.has_real_interaction_data || false,
        hasRealRpcData: data.metrics?.data_quality?.has_real_rpc_data || false,
        totalEvents: data.metrics?.total_events || 0,
        dataFreshness: data.metrics?.data_quality?.data_freshness || 0
      };
      
      const realDataPercentage = Object.values(quality)
        .filter(v => typeof v === 'boolean')
        .reduce((sum, hasReal) => sum + (hasReal ? 1 : 0), 0) / 5 * 100;
      
      console.log(`📈 Analytics Data Quality: ${realDataPercentage.toFixed(1)}% real data`);
      console.log('📋 Data Quality Details:', quality);
      
      return quality;
    } catch (error) {
      console.error('❌ Failed to check analytics data quality:', error);
      return null;
    }
  }

  // === MOCK DATA ELIMINATION CHECKER ===
  
  checkForMockDataElimination() {
    const mockDataIndicators = [
      'sample_data_used',
      '_sample_wallet_data',
      '_sample_interaction_errors',
      '_sample_rpc_data',
      'sampleRenderTimes',
      'Generate sample',
      'Sample data'
    ];
    
    const foundMockData = [];
    
    mockDataIndicators.forEach(indicator => {
      if (window[indicator] || document.body.innerHTML.includes(indicator)) {
        foundMockData.push(indicator);
      }
    });
    
    if (foundMockData.length === 0) {
      console.log('✅ Mock data successfully eliminated');
      return true;
    } else {
      console.warn('⚠️ Mock data indicators still found:', foundMockData);
      return false;
    }
  }

  
  async runComprehensiveValidation() {
    console.log('🚀 Running Comprehensive Real Data Validation...');
    
    const results = {
      timestamp: new Date().toISOString(),
      collectionValidation: await this.validateRealDataCollection(),
      dataQuality: await this.checkAnalyticsDataQuality(),
      mockDataEliminated: this.checkForMockDataElimination(),
      overallScore: 0
    };
    
    const collectionScore = (results.collectionValidation.passedValidators / results.collectionValidation.totalValidators) * 40;
    const qualityScore = results.dataQuality ? 
      (Object.values(results.dataQuality).filter(v => typeof v === 'boolean' && v).length / 5) * 40 : 0;
    const mockEliminationScore = results.mockDataEliminated ? 20 : 0;
    
    results.overallScore = collectionScore + qualityScore + mockEliminationScore;
    
    console.log(`🎯 Overall Real Data Score: ${results.overallScore.toFixed(1)}/100`);
    
    if (results.overallScore >= 80) {
      console.log('🎉 Excellent! Real data collection is working properly');
    } else if (results.overallScore >= 60) {
      console.log('⚠️ Good, but some improvements needed');
    } else {
      console.log('❌ Significant issues with real data collection');
    }
    
    return results;
  }

  
  generateTestData() {
    console.log('🧪 Generating test data for validation...');
    
    const testEvents = [
      { type: 'load', success: true, timestamp: Date.now() },
      { type: 'render', render_time: 250, timestamp: Date.now() },
      { type: 'wallet_connect', success: true, duration: 1200, timestamp: Date.now() },
      { type: 'interaction', action: 'mine', success: true, timestamp: Date.now() },
      { type: 'custom', event_name: 'rpc_detailed', method: 'eth_call', duration: 85, timestamp: Date.now() }
    ];
    
    if (window.enhancedAnalytics) {
      testEvents.forEach(event => {
        window.enhancedAnalytics.track(event.type, event);
      });
      console.log('✅ Test data sent to analytics system');
    } else {
      console.warn('⚠️ Enhanced analytics not available for testing');
    }
    
    return testEvents;
  }
}

const realDataValidator = new RealDataValidator();

export default realDataValidator;

if (process.env.NODE_ENV === 'development') {
  window.realDataValidator = realDataValidator;
  
  setTimeout(() => {
    realDataValidator.runComprehensiveValidation();
  }, 5000);
} 