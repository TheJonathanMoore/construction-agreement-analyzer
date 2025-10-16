'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

export default function FinalizePage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [signature, setSignature] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('scopeData');
    if (storedData) {
      setTrades(JSON.parse(storedData));
    }
  }, []);

  const workToDo = trades.filter((trade) =>
    trade.checked && trade.lineItems.some((item) => item.checked)
  );

  const workNotDoing = trades.filter((trade) =>
    trade.lineItems.some((item) => !item.checked)
  );

  const supplements = trades.filter((trade) => trade.supplements.length > 0);

  const calculateTotal = () => {
    let total = 0;
    workToDo.forEach((trade) => {
      trade.lineItems.forEach((item) => {
        if (item.checked) {
          total += item.rcv;
        }
      });
      // Add all supplement amounts
      trade.supplements.forEach((supp) => {
        total += supp.amount;
      });
    });
    return total;
  };

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignature('');
    }
  };

  const handleSubmit = () => {
    // Here you would typically save to a database or send to an API
    alert('Scope agreement signed successfully!');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Final Scope Agreement</h1>
          <Button variant="outline" onClick={() => window.history.back()}>
            ← Back to Edit
          </Button>
        </div>

        {/* Work to Complete */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Work to Complete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {workToDo.map((trade) => (
              <div key={trade.id} className="space-y-2">
                <h3 className="font-semibold text-lg">{trade.name}</h3>
                <div className="ml-4 space-y-1">
                  {trade.lineItems
                    .filter((item) => item.checked)
                    .map((item) => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-medium">{item.quantity}</span>
                            <span className="text-sm ml-2">{item.description}</span>
                          </div>
                          <span className="text-sm font-mono">${item.rcv.toLocaleString()}</span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground italic ml-4">
                            Note: {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  {trade.supplements.map((supp) => (
                    <div key={supp.id} className="pt-2 border-t bg-yellow-50 p-2 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-semibold text-yellow-800">SUPPLEMENT: </span>
                          <span className="text-sm font-medium">{supp.quantity}</span>
                          <span className="text-sm ml-2">{supp.title}</span>
                        </div>
                        <span className="text-sm font-mono">${supp.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Work Not Doing */}
        {workNotDoing.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>🚫 Work Not Included</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {workNotDoing.map((trade) => {
                const excludedItems = trade.lineItems.filter((item) => !item.checked);
                if (excludedItems.length === 0) return null;

                return (
                  <div key={trade.id} className="space-y-2">
                    <h3 className="font-semibold">{trade.name}</h3>
                    <div className="ml-4 space-y-1">
                      {excludedItems.map((item) => (
                        <div key={item.id} className="text-sm text-muted-foreground">
                          • {item.quantity} {item.description}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Pending Supplements */}
        {supplements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>📋 Pending Supplements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {supplements.map((trade) => (
                <div key={trade.id} className="space-y-2">
                  <h4 className="font-semibold text-sm">{trade.name}</h4>
                  <div className="ml-4 space-y-1">
                    {trade.supplements.map((supp) => (
                      <div key={supp.id} className="flex justify-between items-start text-sm">
                        <div>
                          <span className="font-medium">{supp.quantity}</span>
                          <span className="ml-2">{supp.title}</span>
                        </div>
                        <span className="font-mono">${supp.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Total */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-2xl font-bold">
              <span>Total Contract Value:</span>
              <span>${calculateTotal().toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Full Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Signature</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                >
                  Clear
                </Button>
              </div>
              <div className="border-2 border-dashed rounded-lg p-2 bg-white">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full touch-none cursor-crosshair"
                  style={{ touchAction: 'none' }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sign above using your mouse or touch screen
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!signature || !customerName}
              className="w-full"
              size="lg"
            >
              Submit Signed Agreement
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
