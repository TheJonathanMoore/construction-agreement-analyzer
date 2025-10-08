'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function Home() {
  const [agreementText, setAgreementText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!agreementText.trim()) {
      setError('Please enter agreement text');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ agreementText }),
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
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Agreement Input</CardTitle>
              <CardDescription>
                Paste your construction agreement text below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
      </div>
    </div>
  );
}
