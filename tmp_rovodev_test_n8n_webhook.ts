/**
 * Test Script for n8n Webhook Integration
 * Tests the LuxeFinds social media publishing webhook
 * 
 * Usage: npx ts-node tmp_rovodev_test_n8n_webhook.ts
 */

import fetch from 'node-fetch';

// Configuration from .env
const config = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002',
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL || '',
  n8nApiKey: process.env.N8N_API_KEY || '',
  callbackSecret: process.env.LUXEFINDS_CALLBACK_SECRET || '',
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  log('\n' + '='.repeat(60), colors.cyan);
  log(title, colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);
}

async function testConfiguration() {
  logSection('1. Testing Configuration');

  const issues = [];

  if (!config.n8nWebhookUrl) {
    issues.push('N8N_WEBHOOK_URL is not set');
  } else {
    log(`✓ N8N_WEBHOOK_URL: ${config.n8nWebhookUrl}`, colors.green);
  }

  if (!config.n8nApiKey) {
    issues.push('N8N_API_KEY is not set');
  } else {
    log(`✓ N8N_API_KEY: ${config.n8nApiKey.substring(0, 20)}...`, colors.green);
  }

  if (!config.callbackSecret) {
    issues.push('LUXEFINDS_CALLBACK_SECRET is not set');
  } else {
    log(`✓ LUXEFINDS_CALLBACK_SECRET: ${config.callbackSecret.substring(0, 30)}...`, colors.green);
  }

  if (!config.appUrl) {
    issues.push('NEXT_PUBLIC_APP_URL is not set');
  } else {
    log(`✓ NEXT_PUBLIC_APP_URL: ${config.appUrl}`, colors.green);
  }

  if (issues.length > 0) {
    log('\n❌ Configuration Issues:', colors.red);
    issues.forEach(issue => log(`  - ${issue}`, colors.red));
    return false;
  }

  log('\n✓ All configuration values are set', colors.green);
  return true;
}

async function testWebhookEndpoint() {
  logSection('2. Testing Webhook Endpoint');

  // Create a test payload
  const testPayload = {
    productId: 'test-product-123',
    productName: 'Test Hermès Birkin Bag',
    description: 'A test luxury handbag for webhook verification',
    price: 12500,
    currency: 'USD',
    imageUrl: 'https://via.placeholder.com/600x400?text=Luxury+Bag',
    images: ['https://via.placeholder.com/600x400?text=View1', 'https://via.placeholder.com/600x400?text=View2'],
    category: 'Handbags',
    platforms: ['facebook', 'instagram'],
    callbackUrl: `${config.appUrl}/api/webhooks/n8n/callback`,
    socialMediaPostIds: [
      { platform: 'facebook', id: 'test-fb-post-id' },
      { platform: 'instagram', id: 'test-ig-post-id' },
    ],
  };

  log('Test Payload:', colors.blue);
  log(JSON.stringify(testPayload, null, 2), colors.blue);

  try {
    log('\n📤 Sending request to n8n webhook...', colors.yellow);

    const response = await fetch(config.n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.n8nApiKey}`,
      },
      body: JSON.stringify(testPayload),
    } as any);

    log(`Response Status: ${response.status} ${response.statusText}`, colors.blue);

    const responseText = await response.text();
    
    if (responseText) {
      try {
        const responseJson = JSON.parse(responseText);
        log('\n✓ Response (JSON):', colors.green);
        log(JSON.stringify(responseJson, null, 2), colors.green);
      } catch {
        log('\nResponse (Text):', colors.blue);
        log(responseText, colors.blue);
      }
    }

    if (response.status === 200 || response.status === 201 || response.status === 202) {
      log('\n✓ Webhook accepted successfully!', colors.green);
      return true;
    } else if (response.status === 400) {
      log('\n⚠ Bad request - check payload format', colors.yellow);
      return false;
    } else if (response.status === 401) {
      log('\n❌ Unauthorized - check N8N_API_KEY', colors.red);
      return false;
    } else if (response.status === 404) {
      log('\n❌ Webhook URL not found - check N8N_WEBHOOK_URL', colors.red);
      return false;
    } else {
      log(`\n⚠ Unexpected status code: ${response.status}`, colors.yellow);
      return false;
    }
  } catch (error) {
    log(`\n❌ Request failed:`, colors.red);
    log(error instanceof Error ? error.message : String(error), colors.red);
    return false;
  }
}

async function testCallbackEndpoint() {
  logSection('3. Testing Callback Endpoint');

  const testCallbackPayload = {
    socialMediaPostId: 'test-fb-post-id',
    platform: 'facebook',
    status: 'published',
    postUrl: 'https://facebook.com/posts/123456789',
    metadata: {
      postId: '123456789',
      timestamp: new Date().toISOString(),
    },
  };

  log('Test Callback Payload:', colors.blue);
  log(JSON.stringify(testCallbackPayload, null, 2), colors.blue);

  try {
    log('\n📤 Sending callback request to LuxeFinds...', colors.yellow);

    const callbackUrl = `${config.appUrl}/api/webhooks/n8n/callback`;
    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.callbackSecret}`,
      },
      body: JSON.stringify(testCallbackPayload),
    } as any);

    log(`Response Status: ${response.status} ${response.statusText}`, colors.blue);

    const responseText = await response.text();
    
    if (responseText) {
      try {
        const responseJson = JSON.parse(responseText);
        log('\n✓ Response (JSON):', colors.green);
        log(JSON.stringify(responseJson, null, 2), colors.green);
      } catch {
        log('\nResponse (Text):', colors.blue);
        log(responseText, colors.blue);
      }
    }

    if (response.status === 200 || response.status === 201) {
      log('\n✓ Callback received successfully!', colors.green);
      return true;
    } else if (response.status === 401) {
      log('\n❌ Unauthorized - check LUXEFINDS_CALLBACK_SECRET', colors.red);
      return false;
    } else if (response.status === 404) {
      log('\n⚠ Callback endpoint not found - is LuxeFinds running?', colors.yellow);
      return false;
    } else {
      log(`\n⚠ Unexpected status code: ${response.status}`, colors.yellow);
      return false;
    }
  } catch (error) {
    log(`\n⚠ Request failed (this is OK if LuxeFinds isn't running yet):`, colors.yellow);
    log(error instanceof Error ? error.message : String(error), colors.yellow);
    return false;
  }
}

async function testPublishAction() {
  logSection('4. Testing Publish Server Action');

  try {
    log('\n📤 Testing /api/webhooks/n8n/publish endpoint...', colors.yellow);

    const publishUrl = `${config.appUrl}/api/webhooks/n8n/publish`;
    const testPayload = {
      productId: 'test-product-456',
      platforms: ['twitter', 'pinterest'],
    };

    log('Test Payload:', colors.blue);
    log(JSON.stringify(testPayload, null, 2), colors.blue);

    const response = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    } as any);

    log(`\nResponse Status: ${response.status} ${response.statusText}`, colors.blue);

    const responseText = await response.text();
    
    if (responseText) {
      try {
        const responseJson = JSON.parse(responseText);
        log('\n✓ Response (JSON):', colors.green);
        log(JSON.stringify(responseJson, null, 2), colors.green);
      } catch {
        log('\nResponse (Text):', colors.blue);
        log(responseText, colors.blue);
      }
    }

    if (response.status === 200 || response.status === 201) {
      log('\n✓ Publish endpoint working!', colors.green);
      return true;
    } else if (response.status === 404) {
      log('\n⚠ Is LuxeFinds server running on port 9002?', colors.yellow);
      return false;
    } else {
      log(`\n⚠ Unexpected status code: ${response.status}`, colors.yellow);
      return false;
    }
  } catch (error) {
    log(`\n⚠ Request failed (this is OK if LuxeFinds isn't running yet):`, colors.yellow);
    log(error instanceof Error ? error.message : String(error), colors.yellow);
    return false;
  }
}

async function main() {
  log('\n🚀 n8n Webhook Integration Test Suite\n', colors.cyan);

  const configOk = await testConfiguration();
  
  if (!configOk) {
    log('\n❌ Configuration check failed. Please set all required environment variables.', colors.red);
    process.exit(1);
  }

  const webhookOk = await testWebhookEndpoint();
  const callbackOk = await testCallbackEndpoint();
  const publishOk = await testPublishAction();

  logSection('📊 Test Results Summary');

  const results = [
    { name: 'Configuration', status: configOk },
    { name: 'n8n Webhook Endpoint', status: webhookOk },
    { name: 'Callback Endpoint', status: callbackOk },
    { name: 'Publish Endpoint', status: publishOk },
  ];

  results.forEach(result => {
    const status = result.status ? '✓' : '⚠';
    const color = result.status ? colors.green : colors.yellow;
    log(`${status} ${result.name}`, color);
  });

  const allPassed = results.every(r => r.status);

  logSection('🎯 Next Steps');

  if (allPassed) {
    log('✓ All tests passed! Your n8n integration is ready.', colors.green);
    log('\nNext steps:', colors.cyan);
    log('1. Set up n8n workflow (see n8n.md for details)', colors.cyan);
    log('2. Configure social media platform credentials in n8n', colors.cyan);
    log('3. Go to /admin/products and click "Share to Social" button', colors.cyan);
  } else {
    log('⚠ Some tests may have failed. Check the errors above.', colors.yellow);
    log('\nPossible issues:', colors.cyan);
    log('- LuxeFinds server not running (start with: npm run dev)', colors.cyan);
    log('- n8n webhook URL not accessible', colors.cyan);
    log('- Invalid API key or callback secret', colors.cyan);
    log('- Database not initialized (run: npx prisma migrate dev)', colors.cyan);
  }

  log('\n' + '='.repeat(60) + '\n', colors.cyan);
}

main().catch(error => {
  log(`\n❌ Test suite error:`, colors.red);
  log(error instanceof Error ? error.message : String(error), colors.red);
  process.exit(1);
});
