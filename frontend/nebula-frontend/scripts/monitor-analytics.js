#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

const ANALYTICS_URL = 'https://widget.starsystemlabs.com/.netlify/functions/analytics';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function monitorBandwidth() {
  console.log('🔍 BANDWIDTH MONITORING');
  console.log('========================');
  
  const ranges = ['1h', '24h', '7d'];
  let totalBytes = 0;
  
  for (const range of ranges) {
    try {
      const response = await makeRequest(`${ANALYTICS_URL}?range=${range}`);
      const responseSize = Buffer.byteLength(response.body, 'utf8');
      totalBytes += responseSize;
      
      console.log(`📊 ${range} range: ${responseSize} bytes (${(responseSize/1024).toFixed(2)} KB)`);
      console.log(`   Headers: ${JSON.stringify(response.headers, null, 2)}`);
      
      const optimizationHeaders = Object.keys(response.headers).filter(h => 
        h.toLowerCase().startsWith('x-') || h.toLowerCase().includes('cache')
      );
      
      if (optimizationHeaders.length > 0) {
        console.log(`   ✅ Optimization headers: ${optimizationHeaders.join(', ')}`);
      } else {
        console.log(`   ⚠️  No optimization headers found`);
      }
      
    } catch (error) {
      console.error(`❌ Error fetching ${range}:`, error.message);
    }
  }
  
  console.log(`\n📈 Total bandwidth for test: ${totalBytes} bytes (${(totalBytes/1024).toFixed(2)} KB)`);
  console.log(`📈 Estimated daily usage: ${((totalBytes * 24) / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📈 Estimated monthly usage: ${((totalBytes * 24 * 30) / 1024 / 1024 / 1024).toFixed(2)} GB`);
}

async function testRateLimit() {
  console.log('\n🚦 RATE LIMITING TEST');
  console.log('=====================');
  
  const requests = [];
  const maxRequests = 10;
  
  console.log(`Sending ${maxRequests} rapid requests...`);
  
  for (let i = 0; i < maxRequests; i++) {
    requests.push(
      makeRequest(`${ANALYTICS_URL}?range=1h&test=${i}`)
        .then(response => ({
          request: i + 1,
          status: response.statusCode,
          rateLimitHeaders: {
            limit: response.headers['x-ratelimit-limit'],
            remaining: response.headers['x-ratelimit-remaining'],
            retryAfter: response.headers['retry-after']
          }
        }))
        .catch(error => ({
          request: i + 1,
          error: error.message
        }))
    );
  }
  
  const results = await Promise.all(requests);
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ Request ${result.request}: ERROR - ${result.error}`);
    } else if (result.status === 429) {
      console.log(`🚫 Request ${result.request}: RATE LIMITED (${result.status})`);
      console.log(`   Rate limit info:`, result.rateLimitHeaders);
    } else {
      console.log(`✅ Request ${result.request}: SUCCESS (${result.status})`);
    }
  });
  
  const rateLimited = results.filter(r => r.status === 429).length;
  const successful = results.filter(r => r.status === 200).length;
  
  console.log(`\n📊 Rate limiting results:`);
  console.log(`   Successful: ${successful}/${maxRequests}`);
  console.log(`   Rate limited: ${rateLimited}/${maxRequests}`);
  console.log(`   Rate limiting ${rateLimited > 0 ? '✅ WORKING' : '⚠️  NOT DETECTED'}`);
}

async function verifyData() {
  console.log('\n🔍 DATA VERIFICATION');
  console.log('====================');
  
  try {
    const aggregateResponse = await makeRequest(`${ANALYTICS_URL}?range=1h`);
    const aggregateData = JSON.parse(aggregateResponse.body);
    
    console.log('📊 Aggregate Data:');
    console.log(`   Total events: ${aggregateData.metrics?.total_events || 0}`);
    console.log(`   Load success rate: ${aggregateData.metrics?.load_success_rate || 0}%`);
    console.log(`   Render time p50: ${aggregateData.metrics?.render_time_p50 || 0}ms`);
    console.log(`   Render time p95: ${aggregateData.metrics?.render_time_p95 || 0}ms`);
    
    const dataQuality = aggregateData.metrics?.data_quality || {};
    console.log('\n🔍 Data Quality Flags:');
    console.log(`   Has real load data: ${dataQuality.has_real_load_data ? '✅' : '❌'}`);
    console.log(`   Has real render data: ${dataQuality.has_real_render_data ? '✅' : '❌'}`);
    console.log(`   Has real wallet data: ${dataQuality.has_real_wallet_data ? '✅' : '❌'}`);
    console.log(`   Has real interaction data: ${dataQuality.has_real_interaction_data ? '✅' : '❌'}`);
    console.log(`   Has real RPC data: ${dataQuality.has_real_rpc_data ? '✅' : '❌'}`);
    
    const timeseriesResponse = await makeRequest(`${ANALYTICS_URL}?range=1h&endpoint=timeseries`);
    const timeseriesData = JSON.parse(timeseriesResponse.body);
    
    console.log('\n📈 Timeseries Data:');
    console.log(`   Data points: ${timeseriesData.timeseries?.length || 0}`);
    
    if (timeseriesData.timeseries && timeseriesData.timeseries.length > 0) {
      const firstPoint = timeseriesData.timeseries[0];
      console.log(`   First point load success: ${firstPoint.load_success_rate || 0}%`);
      console.log(`   First point render p50: ${firstPoint.render_time_p50 || 0}ms`);
      console.log(`   First point total events: ${firstPoint.total_events || 0}`);
    }
    
    const hasRealData = dataQuality.has_real_load_data || dataQuality.has_real_render_data;
    const totalEvents = aggregateData.metrics?.total_events || 0;
    
    console.log('\n🎯 CONCLUSION:');
    if (!hasRealData && totalEvents > 0) {
      console.log('❌ DATA IS NOT REAL - Events are being collected but not classified as load/render events');
      console.log('   This means the widget analytics integration needs to be fixed');
    } else if (hasRealData) {
      console.log('✅ DATA IS REAL - Load and render events are being properly tracked');
    } else {
      console.log('⚠️  NO DATA - No events are being collected at all');
    }
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }
}

async function analyzeEventTypes() {
  console.log('\n🔬 EVENT TYPE ANALYSIS');
  console.log('======================');
  
  try {

    console.log('📝 This analysis would require access to raw event data');
    console.log('   Consider adding a debug endpoint to see what event types are being stored');
    
  } catch (error) {
    console.error('❌ Error analyzing events:', error.message);
  }
}

async function runMonitoring() {
  console.log('🚀 NEBULA ANALYTICS MONITORING TOOL');
  console.log('===================================');
  console.log(`Started at: ${new Date().toISOString()}\n`);
  
  await monitorBandwidth();
  await testRateLimit();
  await verifyData();
  await analyzeEventTypes();
  
  console.log('\n✅ Monitoring complete!');
  console.log(`Finished at: ${new Date().toISOString()}`);
}

if (require.main === module) {
  runMonitoring().catch(console.error);
}

module.exports = {
  monitorBandwidth,
  testRateLimit,
  verifyData,
  analyzeEventTypes,
  runMonitoring
}; 