import { GoogleGenAI } from '@google/genai';
import { warehouseStore } from './store.ts';

export interface AIInsightResponse {
  query: string;
  observation: string;
  reason: string;
  recommendation: string;
  expectedImpact: string;
  explainabilityPoints: string[];
  suggestedActionType?: string;
  suggestedActionPayload?: any;
  isAiGenerated: boolean;
}

export async function askWarehouseCopilot(userQuery: string): Promise<AIInsightResponse> {
  const kpis = warehouseStore.getKPIs();
  const health = warehouseStore.getWarehouseHealth();
  const bottlenecks = warehouseStore.getBottlenecks();
  const conflicts = warehouseStore.getAllocationConflicts();
  const stockouts = warehouseStore.getStockoutPredictions();
  const delayedOrders = warehouseStore.orders.filter(o => o.isDelayed || o.delayMinutes > 0).slice(0, 5);

  const contextData = {
    warehouseHealth: health.overallScore,
    healthStatus: health.status,
    kpis,
    openExceptions: warehouseStore.exceptions.filter(e => e.status !== 'RESOLVED').length,
    activeBottlenecks: bottlenecks.map(b => `${b.location} (${b.stage}): ${b.issue}`),
    stockConflictsCount: conflicts.length,
    topStockoutRisks: stockouts.slice(0, 4).map(s => `${s.sku} (${s.productName}): Stock ${s.currentStock}, demand ${s.dailyDemand}/day`),
    sampleDelayedOrders: delayedOrders.map(o => `${o.orderNumber} (${o.customer}, Priority: ${o.priority}, Delay: ${o.delayMinutes}m)`)
  };

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemPrompt = `You are the Smart Warehouse Operations & Order Fulfillment Intelligence Copilot.
You analyze real-time warehouse data and provide clear, decisive, and explainable operational recommendations.
Always format your response as strict JSON matching this structure:
{
  "observation": "Direct, factual statement of what is happening in the warehouse right now.",
  "reason": "Root cause explanation based on inventory, station queues, SLAs, or carrier deadlines.",
  "recommendation": "Step-by-step decisive action for the operations team.",
  "expectedImpact": "Quantifiable expected outcome (e.g. saves 3 orders from missing SLA, boosts fulfillment from 88% to 94%).",
  "explainabilityPoints": [
    "Why decision point 1",
    "Why decision point 2",
    "Why decision point 3"
  ]
}
Current Warehouse Context: ${JSON.stringify(contextData)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Warehouse Manager Question: "${userQuery}"`,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const rawText = response.text || '';
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          query: userQuery,
          observation: parsed.observation || 'Operational data scanned across warehouse zones.',
          reason: parsed.reason || 'SLA thresholds and station queues analyzed.',
          recommendation: parsed.recommendation || 'Prioritize urgent picks and rebalance packing stations.',
          expectedImpact: parsed.expectedImpact || 'Improves fulfillment throughput by up to 15%.',
          explainabilityPoints: parsed.explainabilityPoints || [
            'Prioritizes critical SLA orders nearing carrier cutoff',
            'Balances station load to prevent downstream bottlenecks',
            'Prevents stockout cascading across dependent consignments'
          ],
          isAiGenerated: true
        };
      }
    } catch (err) {
      console.warn('Gemini API call returned error, switching to deterministic decision engine fallback:', err);
    }
  }

  // Deterministic Decision Engine Fallback
  return generateDeterministicFallbackInsight(userQuery, contextData, bottlenecks, conflicts, stockouts, delayedOrders);
}

function generateDeterministicFallbackInsight(
  query: string,
  context: any,
  bottlenecks: any[],
  conflicts: any[],
  stockouts: any[],
  delayedOrders: any[]
): AIInsightResponse {
  const q = query.toLowerCase();

  if (q.includes('first') || q.includes('priorit') || q.includes('process first')) {
    return {
      query,
      observation: `Currently ${delayedOrders.length} orders are delayed, with #ORD-1042 and #ORD-1001 holding CRITICAL priority scores (>90/100).`,
      reason: 'Delivery windows are under 4 hours for VIP accounts (NextGen EV Systems and Apex Robotics) with high consignment values.',
      recommendation: 'Fast-track picking and packing for ORD-1042 and ORD-1001 immediately. Reassign picker Rahul Sharma to priority wave 1.',
      expectedImpact: 'Prevents 2 immediate contract SLA penalties ($1,200 potential penalty avoidance) and stabilizes on-time fulfillment.',
      explainabilityPoints: [
        'ORD-1042 delivery cutoff is in 3.5 hours',
        'ORD-1001 contains high-demand LiDAR items with partial stock ready',
        'Both customers are VIP tier with zero SLA penalty tolerance',
        'S-Shape picking path already generated to save 2.4 minutes walking distance'
      ],
      suggestedActionType: 'FAST_TRACK_ORDERS',
      isAiGenerated: false
    };
  }

  if (q.includes('stockout') || q.includes('inventory') || q.includes('running low')) {
    const topShort = stockouts[0] || { sku: 'SKU-ELEC-102', productName: 'Optical LiDAR Sensor', currentStock: 7, dailyDemand: 6 };
    return {
      query,
      observation: `${topShort.sku} (${topShort.productName}) has only ${topShort.currentStock} units in stock against a daily demand of ${topShort.dailyDemand} units/day.`,
      reason: 'Simultaneous high-priority allocations for robotics assembly orders depleted standard warehouse safety stock buffers.',
      recommendation: `Issue an automated Emergency Purchase Order for ${topShort.recommendedQuantity || 50} units from primary supplier. Activate smart allocation rules for remaining units.`,
      expectedImpact: 'Prevents stockout in 1.2 days and protects 6 scheduled downstream assembly orders from cancellation.',
      explainabilityPoints: [
        `Net available stock (${topShort.currentStock}) has breached safety stock threshold`,
        'Lead time from Nexus Tech Global is 4 days',
        'Historical demand velocity shows a rising 15% week-over-week trend',
        'Alternative SKU-ELEC-101B available for non-critical consignments'
      ],
      suggestedActionType: 'TRIGGER_REORDER',
      isAiGenerated: false
    };
  }

  if (q.includes('bottleneck') || q.includes('where is the biggest')) {
    const primaryBottle = bottlenecks[0] || {
      location: 'Packing Station 03',
      issue: 'Average packing time is 6.8 min (+42% over baseline)',
      ordersDelayedCount: 12
    };
    return {
      query,
      observation: `The primary warehouse bottleneck is located at ${primaryBottle.location}, causing ${primaryBottle.ordersDelayedCount} queued orders.`,
      reason: 'Station 03 is handling heavy multi-item packages with single-worker staffing while Station 02 & 05 are currently underutilized (<65%).',
      recommendation: 'Execute 1-click station load rebalancing to move 2 orders to Station 02 and 2 orders to Station 05.',
      expectedImpact: 'Clears queue delay in 18 minutes and reduces average packing turnaround time from 6.8m to 3.4m.',
      explainabilityPoints: [
        'Station 03 utilization is at 98% (overloaded threshold is 85%)',
        'Station 02 and Station 05 have 0 active waiting orders',
        'Conveyor cross-routing requires only 30 seconds to divert parcels'
      ],
      suggestedActionType: 'REBALANCE_PACKING',
      isAiGenerated: false
    };
  }

  if (q.includes('why') && q.includes('delay')) {
    return {
      query,
      observation: '12 orders are experiencing fulfillment delays across the picking and packing stages.',
      reason: 'A short-pick event at Bin A-15 (Missing RFID scanners) stalled order #ORD-1054, while Station 03 conveyor queue added 28m latency.',
      recommendation: '1) Approve partial-ship resolution for ORD-1054 in Exception Center. 2) Rebalance Packing Station 03 queues to Station 01 & 02.',
      expectedImpact: 'Reduces total delayed order count from 12 down to 4 within 30 minutes (66% improvement).',
      explainabilityPoints: [
        'Exception resolution unblocks carrier dispatch manifest immediately',
        'Station rebalancing removes the physical conveyor choke point',
        'High-priority wave picking clears backlog in Aisle B'
      ],
      suggestedActionType: 'AUTO_RESOLVE_EXCEPTIONS',
      isAiGenerated: false
    };
  }

  // Default: General warehouse manager briefing
  return {
    query,
    observation: `Warehouse Health Score is currently at ${context.warehouseHealth}/100 (${context.healthStatus}). Order fulfillment rate is 94% with ${context.kpis.pendingOrders} pending orders.`,
    reason: 'Operational throughput is strong, but inventory conflicts on SKU-ELEC-102 and packing latency at Station 03 require attention.',
    recommendation: '1. Execute recommended stock allocation in Allocation Center. 2. Rebalance Packing Station 03. 3. Resolve open missing-item exception on ORD-1054.',
    expectedImpact: 'Elevates Warehouse Health Score from 87 to 95 and brings fulfillment rate to 98.5%.',
    explainabilityPoints: [
      'Smart allocation satisfies 100% of VIP order SLAs',
      'Load balancing recovers 25 minutes of packing queue delay',
      'Safety stock reorders ensure uninterrupted weekend fulfillment runs'
    ],
    suggestedActionType: 'EXECUTE_ALL_RECOMMENDATIONS',
    isAiGenerated: false
  };
}
