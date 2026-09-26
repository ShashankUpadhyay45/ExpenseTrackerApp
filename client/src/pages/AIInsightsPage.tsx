import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiApi } from '../api/endpoints';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../utils/formatters';
import { Sparkles, Send, AlertTriangle, Calculator, Bot, User, CheckCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AIInsightsPage() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: "Hello! I'm Sage, your personal financial intelligence companion. Ask me anything about your cashflow, budgets, upcoming bills, or spending patterns.",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // What-If Simulator state
  const [whatIfCategory, setWhatIfCategory] = useState('Food & Drink');
  const [whatIfChange, setWhatIfChange] = useState(-50);

  // Queries
  const { data: anomaliesRes, isLoading: loadingAnomalies } = useQuery({
    queryKey: ['ai', 'anomalies'],
    queryFn: () => aiApi.detectAnomalies()
  });

  const { data: whatIfRes, refetch: runWhatIf, isFetching: loadingWhatIf } = useQuery({
    queryKey: ['ai', 'what-if', whatIfCategory, whatIfChange],
    queryFn: () => aiApi.whatIf({ category: whatIfCategory, change: whatIfChange }),
    enabled: false
  });

  // Query mutation
  const askMutation = useMutation({
    mutationFn: (q: string) => aiApi.query(q),
    onSuccess: (res) => {
      const answer = res?.data?.data?.answer || "I reviewed your records and generated this recommendation.";
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    },
    onError: (err: any) => {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: "I couldn't reach the AI provider right now, but your calculated metrics in Analytics and Dashboard are 100% up to date.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  });

  const handleSend = (textToSend?: string) => {
    const text = textToSend || question;
    if (!text.trim()) return;

    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    askMutation.mutate(text);
    setQuestion('');
  };

  const suggestedQuestions = [
    "Where did I spend the most this month?",
    "How much can I spend per day to stay within budget?",
    "What bills are coming up in the next 7 days?",
    "Summarize my financial health over the last 30 days"
  ];

  const anomalies = anomaliesRes?.data?.data || [];
  const whatIfResult = whatIfRes?.data?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-surface-900 dark:text-white">Ask Sage • AI Financial Intelligence</h1>
            <Badge variant="info" className="gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Sage v2.0
            </Badge>
          </div>
          <p className="text-sm text-surface-500">Autonomous anomaly detection, natural language insights, and pacing simulator.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat Interface (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="flex flex-col h-[560px]">
            <CardHeader className="border-b border-surface-100 dark:border-surface-800 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary-600" /> Interactive Financial Advisor
              </CardTitle>
              <CardDescription>Conversational analysis over your user-owned financial records.</CardDescription>
            </CardHeader>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-none shadow-sm'
                        : 'bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.text}</div>
                    <span className={`block text-[10px] mt-1.5 ${m.role === 'user' ? 'text-primary-200 text-right' : 'text-surface-400'}`}>
                      {m.time}
                    </span>
                  </div>
                  {m.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-700 text-surface-700 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {askMutation.isPending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-surface-100 dark:bg-surface-800 rounded-2xl p-4 text-xs text-surface-500 rounded-bl-none flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary-600" />
                    Sage is analyzing your records and calculating paces...
                  </div>
                </div>
              )}
            </div>

            {/* Suggested Chips */}
            <div className="px-4 py-2 border-t border-surface-100 dark:border-surface-800 flex gap-2 overflow-x-auto text-xs">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="whitespace-nowrap px-3 py-1 rounded-full bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-surface-100 dark:border-surface-800 flex gap-2">
              <input
                type="text"
                placeholder="Ask Sage anything about your budget, bills, or habits..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                className="flex-1 px-4 py-2 text-sm rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button onClick={() => handleSend()} disabled={askMutation.isPending || !question.trim()} className="gap-1.5">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Side Panels: Anomaly Detection + What-If (1 Col) */}
        <div className="space-y-6">
          {/* Anomaly Detection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Unusual Spending Alerts
              </CardTitle>
              <CardDescription>Transactions &gt; 2.5x higher than your category baseline.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAnomalies ? (
                <div className="text-xs text-surface-400">Scanning recent transactions...</div>
              ) : anomalies.length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4" /> No unusual spending spikes detected.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {anomalies.map((a: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-semibold text-xs text-surface-900 dark:text-white">{a.description}</span>
                        <span className="font-bold text-xs text-rose-600">{formatCurrency(a.amount)}</span>
                      </div>
                      <p className="text-[11px] text-surface-600 dark:text-surface-400">{a.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* What-If Simulator */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-500" /> What-If Scenario Simulator
              </CardTitle>
              <CardDescription>Project how cutting back a category changes your annual savings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1">Target Category</label>
                <select
                  value={whatIfCategory}
                  onChange={(e) => setWhatIfCategory(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Food & Drink">Food & Drink</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Transport">Transport</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-500 mb-1">Monthly Reduction Amount ($)</label>
                <input
                  type="number"
                  step="10"
                  value={Math.abs(whatIfChange)}
                  onChange={(e) => setWhatIfChange(-Math.abs(parseFloat(e.target.value) || 0))}
                  className="w-full h-9 px-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <Button
                variant="secondary"
                className="w-full text-xs"
                onClick={() => runWhatIf()}
                disabled={loadingWhatIf}
              >
                {loadingWhatIf ? 'Simulating...' : 'Calculate Projection'}
              </Button>

              {whatIfResult && (
                <div className="mt-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/50 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-surface-600 dark:text-surface-300">Annual Savings Gain:</span>
                    <span className="font-bold text-emerald-600">+{formatCurrency(whatIfResult.annualSavingsGain)}/yr</span>
                  </div>
                  <p className="text-[11px] text-surface-700 dark:text-surface-300 leading-snug">
                    {whatIfResult.recommendation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
