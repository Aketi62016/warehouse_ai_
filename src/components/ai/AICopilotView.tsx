import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface AIInsight {
  query: string;
  observation: string;
  reason: string;
  recommendation: string;
  expectedImpact: string;
  explainabilityPoints: string[];
  suggestedActionType?: string;
  isAiGenerated: boolean;
}

interface Props {
  onAskAI: (query: string) => Promise<AIInsight>;
  onNavigate: (view: any) => void;
}

export const AICopilotView: React.FC<Props> = ({ onAskAI, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<AIInsight[]>([
    {
      query: 'What should the warehouse manager do now?',
      observation: 'Warehouse Health Score is currently at 87/100 (Good). Order fulfillment rate is 94% with 10 pending orders.',
      reason: 'Operational throughput is strong, but inventory conflicts on SKU-ELEC-102 and packing latency at Station 03 require attention.',
      recommendation: '1. Execute recommended stock allocation in Allocation Center. 2. Rebalance Packing Station 03 conveyor lines. 3. Resolve open missing-item exception on ORD-1054.',
      expectedImpact: 'Elevates Warehouse Health Score from 87 to 95 and brings fulfillment rate to 98.5%.',
      explainabilityPoints: [
        'Smart allocation satisfies 100% of VIP order SLAs',
        'Load balancing recovers 25 minutes of packing queue delay',
        'Safety stock reorders ensure uninterrupted weekend fulfillment runs'
      ],
      isAiGenerated: true
    }
  ]);

  const presetQuestions = [
    'Which orders should we process first?',
    'Which products are at risk of stockout?',
    'Why are orders being delayed?',
    'Where is the biggest bottleneck?',
    'Which inventory should be allocated first?',
    'What should the warehouse manager do now?',
    'How can we improve today\'s fulfillment rate?'
  ];

  const handleAsk = async (userQ: string) => {
    if (!userQ.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const insight = await onAskAI(userQ);
      setConversation(prev => [insight, ...prev]);
      setQuery('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="view-ai-copilot" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              AI Decision Intelligence
            </span>
            <span className="text-xs text-slate-400">Gemini 3.7 Flash Model</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Warehouse AI Operations Copilot</h1>
          <p className="text-xs text-slate-500">
            Real-time conversational intelligence for order prioritization, constraint analysis, and decision explanations.
          </p>
        </div>
      </div>

      {/* Preset Questions Strip */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Suggested Operational Queries (Click to Ask)
        </span>
        <div className="flex flex-wrap gap-2">
          {presetQuestions.map(q => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-all cursor-pointer text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Query Input Box */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAsk(query);
          }}
          className="flex items-center gap-3"
        >
          <div className="relative flex-1">
            <Bot className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-ai-copilot-query"
              type="text"
              placeholder="Ask any warehouse operational question (e.g. 'Why is Station 03 overloaded and how do we fix it?')..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium outline-hidden focus:border-purple-400"
            />
          </div>
          <button
            id="btn-ask-ai-copilot"
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Analyzing...' : 'Ask Copilot'}</span>
          </button>
        </form>
      </div>

      {/* AI Insights Conversation Feed */}
      <div className="space-y-6">
        {(conversation || []).map((insight, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-6 border border-purple-200/80 shadow-xs space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            {/* User Question */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                  Q
                </span>
                <span>"{insight.query}"</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                {insight.isAiGenerated ? 'Gemini 3.7 Flash' : 'Decision Engine Logic'}
              </span>
            </div>

            {/* Structured AI Response Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* 1. Observation */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  1. Current Situation / Observation
                </span>
                <p className="text-slate-800 font-medium leading-relaxed">{insight.observation}</p>
              </div>

              {/* 2. Reason */}
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  2. Root Cause / Underlying Reason
                </span>
                <p className="text-amber-950 font-medium leading-relaxed">{insight.reason}</p>
              </div>

              {/* 3. Recommendation */}
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 block">
                  3. Recommended Action Plan
                </span>
                <p className="text-purple-950 font-semibold leading-relaxed">{insight.recommendation}</p>
              </div>

              {/* 4. Expected Impact */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  4. Expected Operational Impact
                </span>
                <p className="text-emerald-950 font-semibold leading-relaxed">{insight.expectedImpact}</p>
              </div>
            </div>

            {/* Explainability Breakdown Points */}
            {insight.explainabilityPoints && insight.explainabilityPoints.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Why this decision was made (Explainable Factors):
                </span>
                <ul className="space-y-1">
                  {(insight.explainabilityPoints || []).map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2 text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
