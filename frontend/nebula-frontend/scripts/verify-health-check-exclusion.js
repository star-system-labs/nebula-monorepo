const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying health-check.html exclusion...');

const distHealthCheck = path.join(__dirname, '..', 'dist', 'health-check.html');
const widgetDistHealthCheck = path.join(__dirname, '..', 'widget-dist', 'health-check.html');

if (fs.existsSync(distHealthCheck)) {
  console.error('❌ ERROR: health-check.html found in dist/ (should be widget-only)');
  process.exit(1);
} else {
  console.log('✅ PASS: health-check.html correctly excluded from dist/');
}

if (fs.existsSync(widgetDistHealthCheck)) {
  console.log('✅ PASS: health-check.html correctly present in widget-dist/');
} else {
  console.warn('⚠️  WARNING: health-check.html missing from widget-dist/');
}

console.log('🎉 Health-check exclusion verification complete!'); 