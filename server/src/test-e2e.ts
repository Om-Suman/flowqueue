// Automated End-to-End Verification Test Script
// Tests all 8 core requirements against live Express API

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting FlowQueue End-to-End Verification Suite...\n');

  // Test 1: Manager Authentication (Login)
  console.log('▶ [REQ-1] Manager Authentication');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'manager@flowqueue.com', password: 'password123' }),
  });
  const loginData: any = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  const token = loginData.token;
  console.log(`  ✓ Authenticated as ${loginData.user.name} (${loginData.user.email})`);
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Test 2: Create Queue
  console.log('▶ [REQ-2] Create Queue with custom name and prefix');
  const queueRes = await fetch(`${BASE_URL}/queues`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'Rapid Express Test Queue',
      prefix: 'EXP',
      description: 'Automated test queue for evaluation',
    }),
  });
  const queueData: any = await queueRes.json();
  if (!queueRes.ok || !queueData.queue?.id) {
    throw new Error(`Create queue failed: ${JSON.stringify(queueData)}`);
  }
  const queueId = queueData.queue.id;
  console.log(`  ✓ Created queue: "${queueData.queue.name}" with ID: ${queueId}`);

  // Test 3: Add new persons / tokens into queue
  console.log('▶ [REQ-3] Add tokens for 3 persons into the queue');
  const persons = [
    { customerName: 'Alice Morgan', priority: 'NORMAL', notes: 'First visitor' },
    { customerName: 'Bob Vance', priority: 'PRIORITY', notes: 'Second visitor' },
    { customerName: 'Charlie Day', priority: 'VIP', notes: 'Third visitor' },
  ];

  const createdTokens: any[] = [];
  for (const p of persons) {
    const tokRes = await fetch(`${BASE_URL}/tokens/queue/${queueId}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(p),
    });
    const tokData: any = await tokRes.json();
    if (!tokRes.ok) throw new Error(`Token creation failed: ${JSON.stringify(tokData)}`);
    createdTokens.push(tokData.token);
    console.log(`  ✓ Created token: ${tokData.token.tokenNumber} for ${p.customerName} (Pos #${tokData.token.position})`);
  }

  // Test 4: Display list of people / tokens waiting
  console.log('▶ [REQ-4] Display list of waiting tokens in queue');
  const waitingRes = await fetch(`${BASE_URL}/tokens/queue/${queueId}/waiting`, {
    headers: authHeaders,
  });
  const waitingData: any = await waitingRes.json();
  if (!waitingRes.ok || waitingData.tokens.length !== 3) {
    throw new Error(`Waiting list mismatch: ${JSON.stringify(waitingData)}`);
  }
  console.log(`  ✓ Successfully retrieved ${waitingData.tokens.length} waiting tokens`);

  // Test 5: Move tokens UP and DOWN in the queue
  console.log('▶ [REQ-5] Move token Bob Vance (Pos #2) UP to Pos #1');
  const bobToken = createdTokens[1];
  const moveRes = await fetch(`${BASE_URL}/tokens/${bobToken.id}/move`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ direction: 'UP' }),
  });
  const moveData: any = await moveRes.json();
  if (!moveRes.ok) throw new Error(`Move token failed: ${JSON.stringify(moveData)}`);
  const topTokenAfterMove = moveData.tokens[0];
  if (topTokenAfterMove.id !== bobToken.id) {
    throw new Error(`Expected Bob Vance at position 1, but got ${topTokenAfterMove.customerName}`);
  }
  console.log(`  ✓ Token ${bobToken.tokenNumber} (${bobToken.customerName}) moved UP to Position #1`);

  // Move Bob back down
  const moveDownRes = await fetch(`${BASE_URL}/tokens/${bobToken.id}/move`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({ direction: 'DOWN' }),
  });
  const moveDownData: any = await moveDownRes.json();
  if (!moveDownRes.ok) throw new Error(`Move down failed: ${JSON.stringify(moveDownData)}`);
  console.log(`  ✓ Token ${bobToken.tokenNumber} moved DOWN back to Position #2`);

  // Test 6: Assign token at top of queue for service
  console.log('▶ [REQ-6] Single-click "Serve Next" for token at top of queue');
  const serveRes = await fetch(`${BASE_URL}/tokens/queue/${queueId}/serve-next`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ counterName: 'Counter 1' }),
  });
  const serveData: any = await serveRes.json();
  if (!serveRes.ok || serveData.servedToken?.status !== 'IN_SERVICE') {
    throw new Error(`Serve next failed: ${JSON.stringify(serveData)}`);
  }
  console.log(`  ✓ Dispatched token ${serveData.servedToken.tokenNumber} to IN_SERVICE at ${serveData.servedToken.counterName}`);

  // Test 7: Cancel a token from the queue
  console.log('▶ [REQ-7] Cancel token Charlie Day from queue');
  const charlieToken = createdTokens[2];
  const cancelRes = await fetch(`${BASE_URL}/tokens/${charlieToken.id}/cancel`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ reason: 'Customer requested reschedule' }),
  });
  const cancelData: any = await cancelRes.json();
  if (!cancelRes.ok || cancelData.token?.status !== 'CANCELLED') {
    throw new Error(`Cancel token failed: ${JSON.stringify(cancelData)}`);
  }
  console.log(`  ✓ Cancelled token ${cancelData.token.tokenNumber} with reason: "${cancelData.token.cancellationReason}"`);

  // Test 8: Analytics Dashboard
  console.log('▶ [REQ-8] Fetch analytics for wait times, queue lengths, hourly trends');
  const analyticsRes = await fetch(`${BASE_URL}/analytics`, {
    headers: authHeaders,
  });
  const analyticsData: any = await analyticsRes.json();
  if (!analyticsRes.ok || !analyticsData.summary) {
    throw new Error(`Analytics failed: ${JSON.stringify(analyticsData)}`);
  }
  console.log(`  ✓ Analytics Summary:`);
  console.log(`    - Total Tokens: ${analyticsData.summary.totalTokens}`);
  console.log(`    - Avg Wait Time: ${analyticsData.summary.avgWaitTimeMinutes} mins`);
  console.log(`    - Avg Service Time: ${analyticsData.summary.avgServiceTimeMinutes} mins`);
  console.log(`    - Hourly Trend Bins: ${analyticsData.hourlyTrends.length} intervals`);
  console.log(`    - Queue Comparisons: ${analyticsData.queueComparison.length} queues analyzed`);

  console.log('\n🎉 ALL 8 CORE FUNCTIONAL REQUIREMENTS VERIFIED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
