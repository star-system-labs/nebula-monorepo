#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function createBackwardCompatibility() {
  const widgetDistPath = path.join(__dirname, '..', 'widget-dist');
  
  console.log('🔄 Creating backward compatibility folders...');
  
  try {
    const widgetJsPath = path.join(widgetDistPath, 'widget-js');
    const jsPath = path.join(widgetDistPath, 'js');
    
    if (await fs.pathExists(widgetJsPath)) {
      await fs.copy(widgetJsPath, jsPath);
      console.log('✅ Copied widget-js/ to js/');
    }
    
    const widgetCssPath = path.join(widgetDistPath, 'widget-css');
    const cssPath = path.join(widgetDistPath, 'css');
    
    if (await fs.pathExists(widgetCssPath)) {
      await fs.copy(widgetCssPath, cssPath);
      console.log('✅ Copied widget-css/ to css/');
    }
    
    const nebulaIcoPath = path.join(widgetDistPath, 'nebula.ico');
    const faviconPath = path.join(widgetDistPath, 'favicon.ico');
    
    if (await fs.pathExists(faviconPath) && !(await fs.pathExists(nebulaIcoPath))) {
      await fs.copy(faviconPath, nebulaIcoPath);
      console.log('✅ Created nebula.ico from favicon.ico');
    }
    
    console.log('🎉 Backward compatibility setup complete!');
    
    console.log('\n📁 Final widget-dist structure:');
    const items = await fs.readdir(widgetDistPath);
    for (const item of items.sort()) {
      const itemPath = path.join(widgetDistPath, item);
      const stats = await fs.stat(itemPath);
      if (stats.isDirectory()) {
        const subItems = await fs.readdir(itemPath);
        console.log(`  📂 ${item}/ (${subItems.length} files)`);
      } else {
        console.log(`  📄 ${item}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating backward compatibility:', error);
    process.exit(1);
  }
}

createBackwardCompatibility(); 