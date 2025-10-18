'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type AppMode = 'job-summary' | 'scope-builder';

export default function Home() {
  const [appMode, setAppMode] = useState<AppMode>('job-summary');
  const [file, setFile] = useState<File | null>(null);
  const [agreementText, setAgreementText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleAnalyze = async () => {
    if (inputMode === 'file' && !file) {
      setError('Please upload a PDF file');
      return;
    }

    if (inputMode === 'text' && !agreementText.trim()) {
      setError('Please enter agreement text');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const formData = new FormData();

      if (inputMode === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('text', agreementText);
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze agreement');
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Construction Agreement Analyzer
          </h1>
          <p className="text-muted-foreground">
            AI-powered analysis for exteriors company agreements
          </p>

          <div className="flex gap-3 mt-6">
            <Button
              variant={appMode === 'job-summary' ? 'default' : 'outline'}
              onClick={() => setAppMode('job-summary')}
              size="lg"
            >
              Job Summary Generator
            </Button>
            <Button
              variant={appMode === 'scope-builder' ? 'default' : 'outline'}
              onClick={() => setAppMode('scope-builder')}
              size="lg"
            >
              Scope Builder
            </Button>
          </div>
        </header>

        {appMode === 'job-summary' ? (
          <JobSummaryView
            inputMode={inputMode}
            setInputMode={setInputMode}
            file={file}
            handleFileChange={handleFileChange}
            agreementText={agreementText}
            setAgreementText={setAgreementText}
            error={error}
            loading={loading}
            handleAnalyze={handleAnalyze}
            analysis={analysis}
            handleCopy={handleCopy}
          />
        ) : (
          <ScopeBuilderView />
        )}
      </div>
    </div>
  );
}

function JobSummaryView({
  inputMode,
  setInputMode,
  file,
  handleFileChange,
  agreementText,
  setAgreementText,
  error,
  loading,
  handleAnalyze,
  analysis,
  handleCopy,
}: {
  inputMode: 'file' | 'text';
  setInputMode: (mode: 'file' | 'text') => void;
  file: File | null;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  agreementText: string;
  setAgreementText: (text: string) => void;
  error: string;
  loading: boolean;
  handleAnalyze: () => void;
  analysis: string;
  handleCopy: () => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
            <CardHeader>
              <CardTitle>Agreement Input</CardTitle>
              <CardDescription>
                Upload a PDF or paste your construction agreement text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  variant={inputMode === 'file' ? 'default' : 'outline'}
                  onClick={() => setInputMode('file')}
                  size="sm"
                >
                  Upload PDF
                </Button>
                <Button
                  variant={inputMode === 'text' ? 'default' : 'outline'}
                  onClick={() => setInputMode('text')}
                  size="sm"
                >
                  Paste Text
                </Button>
              </div>

              {inputMode === 'file' ? (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload PDF</Label>
                  <Input
                    id="file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="agreement">Agreement Text</Label>
                  <Textarea
                    id="agreement"
                    placeholder="Paste your construction agreement here..."
                    value={agreementText}
                    onChange={(e) => setAgreementText(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
              )}

              {error && (
                <div className="text-sm text-destructive">
                  {error}
                </div>
              )}
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Analyzing...' : 'Analyze Agreement'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Summary</CardTitle>
              <CardDescription>
                AI-generated structured summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis ? (
                <>
                  <div className="relative">
                    <pre className="min-h-[400px] p-4 bg-muted rounded-md overflow-auto text-sm whitespace-pre-wrap">
                      {analysis}
                    </pre>
                  </div>
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="w-full"
                  >
                    Copy to Clipboard
                  </Button>
                </>
              ) : (
                <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed rounded-md">
                  <p className="text-muted-foreground text-center">
                    {loading
                      ? 'Analyzing agreement...'
                      : 'Your analysis will appear here'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
  );
}

interface LineItem {
  id: string;
  quantity: string;
  description: string;
  rcv: number;
  checked: boolean;
  notes: string;
}

interface SupplementItem {
  id: string;
  title: string;
  quantity: string;
  amount: number;
}

interface Trade {
  id: string;
  name: string;
  checked: boolean;
  supplements: SupplementItem[];
  lineItems: LineItem[];
}

function ScopeBuilderView() {
  const [file, setFile] = useState<File | null>(null);
  const [insuranceText, setInsuranceText] = useState('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [expandedSupplements, setExpandedSupplements] = useState<Set<string>>(new Set());
  const [deductible, setDeductible] = useState<number>(0);

  // Load saved data on mount
  useEffect(() => {
    const storedData = sessionStorage.getItem('scopeData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.trades && Array.isArray(parsed.trades)) {
          setTrades(parsed.trades);
          setDeductible(parsed.deductible || 0);
        }
      } catch (e) {
        console.error('Error loading saved scope data:', e);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleParse = async () => {
    if (inputMode === 'file' && !file) {
      setError('Please upload a PDF file');
      return;
    }

    if (inputMode === 'text' && !insuranceText.trim()) {
      setError('Please enter insurance document text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();

      if (inputMode === 'file' && file) {
        formData.append('file', file);
      } else {
        formData.append('text', insuranceText);
      }

      const response = await fetch('/api/parse-scope', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse insurance document');
      }

      setTrades(data.trades);
      // Save immediately after parsing
      sessionStorage.setItem('scopeData', JSON.stringify({ trades: data.trades, deductible }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setTrades([]);
      setDeductible(0);
      setFile(null);
      setInsuranceText('');
      setError('');
      sessionStorage.removeItem('scopeData');
    }
  };

  const toggleTrade = (tradeId: string) => {
    setTrades((prevTrades) =>
      prevTrades.map((trade) => {
        if (trade.id === tradeId) {
          const newChecked = !trade.checked;
          return {
            ...trade,
            checked: newChecked,
            lineItems: trade.lineItems.map((item) => ({
              ...item,
              checked: newChecked,
            })),
          };
        }
        return trade;
      })
    );
  };

  const toggleLineItem = (tradeId: string, itemId: string) => {
    setTrades((prevTrades) =>
      prevTrades.map((trade) => {
        if (trade.id === tradeId) {
          const updatedLineItems = trade.lineItems.map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          );
          const allChecked = updatedLineItems.every((item) => item.checked);
          const noneChecked = updatedLineItems.every((item) => !item.checked);
          return {
            ...trade,
            lineItems: updatedLineItems,
            checked: allChecked || (!noneChecked && trade.checked),
          };
        }
        return trade;
      })
    );
  };

  const addSupplement = (tradeId: string) => {
    setTrades((prevTrades) =>
      prevTrades.map((trade) => {
        if (trade.id === tradeId) {
          return {
            ...trade,
            supplements: [
              ...trade.supplements,
              {
                id: `supp-${Date.now()}`,
                title: '',
                quantity: '',
                amount: 0,
              },
            ],
          };
        }
        return trade;
      })
    );
  };

  const updateSupplement = (
    tradeId: string,
    suppId: string,
    field: 'title' | 'quantity' | 'amount',
    value: string | number
  ) => {
    setTrades((prevTrades) =>
      prevTrades.map((trade) => {
        if (trade.id === tradeId) {
          return {
            ...trade,
            supplements: trade.supplements.map((supp) =>
              supp.id === suppId ? { ...supp, [field]: value } : supp
            ),
          };
        }
        return trade;
      })
    );
  };

  const removeSupplement = (tradeId: string, suppId: string) => {
    setTrades((prevTrades) =>
      prevTrades.map((trade) => {
        if (trade.id === tradeId) {
          return {
            ...trade,
            supplements: trade.supplements.filter((supp) => supp.id !== suppId),
          };
        }
        return trade;
      })
    );
  };

  const updateNotes = (tradeId: string, itemId: string, notes: string) => {
    setTrades((prevTrades) =>
      prevTrades.map((trade) => {
        if (trade.id === tradeId) {
          return {
            ...trade,
            lineItems: trade.lineItems.map((item) =>
              item.id === itemId ? { ...item, notes } : item
            ),
          };
        }
        return trade;
      })
    );
  };

  const toggleNoteExpanded = (itemId: string) => {
    setExpandedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSupplementExpanded = (tradeId: string) => {
    setExpandedSupplements((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  const calculateTotals = () => {
    let totalRcv = 0;
    let totalSupplements = 0;
    const tradeTotals: { [key: string]: number } = {};

    trades.forEach((trade) => {
      let tradeTotal = 0;
      trade.lineItems.forEach((item) => {
        if (item.checked) {
          tradeTotal += item.rcv;
        }
      });

      // Add supplement amounts
      const supplementTotal = trade.supplements.reduce((sum, supp) => sum + supp.amount, 0);
      tradeTotal += supplementTotal;

      tradeTotals[trade.name] = tradeTotal;
      totalRcv += tradeTotal;
      totalSupplements += supplementTotal;
    });

    return { totalRcv, tradeTotals, totalSupplements };
  };

  const { totalRcv, tradeTotals, totalSupplements } = calculateTotals();

  // Auto-save whenever trades or deductible changes
  useEffect(() => {
    if (trades.length > 0) {
      sessionStorage.setItem('scopeData', JSON.stringify({ trades, deductible }));
    }
  }, [trades, deductible]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Insurance Document Input</CardTitle>
          <CardDescription>
            Upload a PDF or paste your insurance document for scope breakdown
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={inputMode === 'file' ? 'default' : 'outline'}
              onClick={() => setInputMode('file')}
              size="sm"
            >
              Upload PDF
            </Button>
            <Button
              variant={inputMode === 'text' ? 'default' : 'outline'}
              onClick={() => setInputMode('text')}
              size="sm"
            >
              Paste Text
            </Button>
          </div>

          {inputMode === 'file' ? (
            <div className="space-y-2">
              <Label htmlFor="insurance-file">Upload PDF</Label>
              <Input
                id="insurance-file"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="insurance-text">Insurance Document Text</Label>
              <Textarea
                id="insurance-text"
                placeholder="Paste your insurance document here..."
                value={insuranceText}
                onChange={(e) => setInsuranceText(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}
          <Button
            onClick={handleParse}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Parsing...' : 'Parse Document'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Scope Breakdown</CardTitle>
              <CardDescription>
                Select trades and line items to include
              </CardDescription>
            </div>
            {trades.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {trades.length > 0 ? (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Please verify:</strong> Review all line items below to ensure completeness.
                  You can manually add any missing items as supplements.
                </p>
              </div>
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {trades.map((trade) => (
                  <div key={trade.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={trade.checked}
                        onChange={() => toggleTrade(trade.id)}
                        className="w-5 h-5 cursor-pointer"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{trade.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {trade.lineItems.length} line item{trade.lineItems.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total: ${tradeTotals[trade.name]?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>

                    <div className="ml-8 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Supplements</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSupplementExpanded(trade.id)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedSupplements.has(trade.id) ? '−' : '+'}
                        </Button>
                      </div>

                      {expandedSupplements.has(trade.id) && (
                        <div className="space-y-3 mt-2">
                          {trade.supplements.map((supp) => (
                            <div key={supp.id} className="border rounded p-3 bg-yellow-50 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-yellow-800">SUPPLEMENT</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSupplement(trade.id, supp.id)}
                                  className="h-6 w-6 p-0 text-red-600"
                                >
                                  ×
                                </Button>
                              </div>
                              <Input
                                placeholder="Title/Description"
                                value={supp.title}
                                onChange={(e) =>
                                  updateSupplement(trade.id, supp.id, 'title', e.target.value)
                                }
                                className="text-sm"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Quantity (e.g., 10 LF)"
                                  value={supp.quantity}
                                  onChange={(e) =>
                                    updateSupplement(trade.id, supp.id, 'quantity', e.target.value)
                                  }
                                  className="text-sm"
                                />
                                <Input
                                  type="number"
                                  placeholder="Amount ($)"
                                  value={supp.amount || ''}
                                  onChange={(e) =>
                                    updateSupplement(
                                      trade.id,
                                      supp.id,
                                      'amount',
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addSupplement(trade.id)}
                            className="w-full"
                          >
                            + Add Another Supplement
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="ml-8 space-y-3">
                      {trade.lineItems.map((item) => (
                        <div key={item.id} className="space-y-2">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => toggleLineItem(trade.id, item.id)}
                              className="w-4 h-4 cursor-pointer mt-1"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  <span className="text-sm font-medium">{item.quantity}</span>
                                  <span className="text-sm ml-2">{item.description}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
                                    ${item.rcv.toLocaleString()}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleNoteExpanded(item.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    {expandedNotes.has(item.id) ? '−' : '+'}
                                  </Button>
                                </div>
                              </div>
                              {expandedNotes.has(item.id) && (
                                <Textarea
                                  placeholder="Add notes..."
                                  value={item.notes}
                                  onChange={(e) =>
                                    updateNotes(trade.id, item.id, e.target.value)
                                  }
                                  className="text-xs min-h-[60px]"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Supplements:</span>
                  <span className="text-sm font-mono">${totalSupplements.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total RCV:</span>
                  <span>${totalRcv.toLocaleString()}</span>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label htmlFor="deductible" className="text-sm">
                    Deductible
                  </Label>
                  <Input
                    id="deductible"
                    type="number"
                    value={deductible || ''}
                    onChange={(e) => setDeductible(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-lg">
                    <span>Insurance Will Pay:</span>
                    <span className="font-mono">${(totalRcv - deductible).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span>Homeowner Pays:</span>
                    <span className="font-mono">${deductible.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    // Store trades and deductible in sessionStorage and navigate
                    sessionStorage.setItem('scopeData', JSON.stringify({ trades, deductible }));
                    window.location.href = '/finalize';
                  }}
                  className="w-full"
                  size="lg"
                >
                  Finalize & Sign
                </Button>
              </div>
            </>
          ) : (
            <div className="min-h-[400px] flex items-center justify-center border-2 border-dashed rounded-md">
              <p className="text-muted-foreground text-center">
                {loading
                  ? 'Parsing insurance document...'
                  : 'Your scope breakdown will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
