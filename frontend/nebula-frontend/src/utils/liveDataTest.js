class LiveDataTest {
  constructor() {
    this.testResults = [];
    this.isRunning = false;
  }

  runComprehensiveTests() {
    if (process.env.NODE_ENV !== 'development') {
      console.log('🔍 Live data tests are only available in development mode');
      return;
    }

    if (this.isRunning) {
      console.log('🔍 Live data tests are already running');
      return;
    }

    this.isRunning = true;
    console.log('🔍 Starting comprehensive live data tests...');

    try {
      this.testWalletConnection();
      this.testContractAddresses();
      this.testNetworkDetection();
      this.testAnalyticsSystem();
      
      console.log('✅ Live data tests completed successfully', {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(t => t.passed).length,
        failed: this.testResults.filter(t => !t.passed).length,
        results: this.testResults
      });
    } catch (error) {
      console.error('❌ Live data tests failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  testWalletConnection() {
    const result = {
      test: 'Wallet Connection',
      passed: false,
      details: {}
    };

    try {
      result.details.ethereumAvailable = !!window.ethereum;
      result.details.web3Available = !!window.web3;
      result.details.metaMaskInstalled = !!(window.ethereum && window.ethereum.isMetaMask);
      
      result.passed = result.details.ethereumAvailable;
      result.message = result.passed ? 'Wallet provider detected' : 'No wallet provider found';
    } catch (error) {
      result.message = `Test error: ${error.message}`;
    }

    this.testResults.push(result);
    console.log(`🔍 Wallet Connection Test: ${result.passed ? '✅' : '❌'}`, result);
  }

  testContractAddresses() {
    const result = {
      test: 'Contract Addresses',
      passed: false,
      details: {}
    };

    try {
      const app = document.querySelector('.nebula-app').__vue__;
      if (app && app.contractAddresses) {
        result.details.mainnetAddresses = !!app.contractAddresses.mainnet;
        result.details.sepoliaAddresses = !!app.contractAddresses.sepolia;
        result.details.baseSepolia = !!app.contractAddresses.base_sepolia;
        
        result.passed = result.details.mainnetAddresses && result.details.sepoliaAddresses;
        result.message = 'Contract addresses configuration valid';
      } else {
        result.message = 'Could not access contract addresses';
      }
    } catch (error) {
      result.message = `Test error: ${error.message}`;
    }

    this.testResults.push(result);
    console.log(`🔍 Contract Addresses Test: ${result.passed ? '✅' : '❌'}`, result);
  }

  testNetworkDetection() {
    const result = {
      test: 'Network Detection',
      passed: false,
      details: {}
    };

    try {
      if (window.ethereum) {
        window.ethereum.request({ method: 'eth_chainId' })
          .then(chainId => {
            result.details.currentChainId = chainId;
            result.details.chainIdNumber = parseInt(chainId, 16);
            result.passed = true;
            result.message = `Connected to chain ID: ${result.details.chainIdNumber}`;
            console.log(`🔍 Network Detection Test: ✅`, result);
          })
          .catch(error => {
            result.message = `Chain ID request failed: ${error.message}`;
            console.log(`🔍 Network Detection Test: ❌`, result);
          });
      } else {
        result.message = 'No Ethereum provider available';
        console.log(`🔍 Network Detection Test: ❌`, result);
      }
    } catch (error) {
      result.message = `Test error: ${error.message}`;
      console.log(`🔍 Network Detection Test: ❌`, result);
    }

    this.testResults.push(result);
  }

  testAnalyticsSystem() {
    const result = {
      test: 'Analytics System',
      passed: false,
      details: {}
    };

    try {
      result.details.widgetAnalyticsAvailable = !!window.widgetAnalytics;
      result.details.realDataValidatorAvailable = !!window.realDataValidator;
      
      if (window.widgetAnalytics) {
        result.details.analyticsSource = window.widgetAnalytics.getAnalyticsSource?.();
        result.details.sessionId = window.widgetAnalytics.sessionId;
      }

      result.passed = result.details.widgetAnalyticsAvailable;
      result.message = result.passed ? 'Analytics system operational' : 'Analytics system not available';
    } catch (error) {
      result.message = `Test error: ${error.message}`;
    }

    this.testResults.push(result);
    console.log(`🔍 Analytics System Test: ${result.passed ? '✅' : '❌'}`, result);
  }

  getResults() {
    return this.testResults;
  }

  clearResults() {
    this.testResults = [];
  }
}

const liveDataTest = new LiveDataTest();

export default liveDataTest; 