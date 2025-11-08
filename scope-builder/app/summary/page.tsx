'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface LineItem {
  id: string;
  quantity: string;
  description: string;
  rcv: number;
  acv?: number;
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

interface SignatureData {
  contractorName: string;
  homeownerName: string;
  homeownerEmail: string;
  signatureDate: string;
}

export default function SummaryPage() {
  const router = useRouter();
  const printableRef = useRef<HTMLDivElement>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [deductible, setDeductible] = useState<number>(0);
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [workNotDoing, setWorkNotDoing] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showTradePartners, setShowTradePartners] = useState(false);
  const [selectedPartners, setSelectedPartners] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [claimNumber, setClaimNumber] = useState<string>('');
  const [claimAdjuster, setClaimAdjuster] = useState<{ name: string; email: string }>({ name: '', email: '' });

  // Load data from session storage
  useEffect(() => {
    const storedData = sessionStorage.getItem('scopeData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.trades && Array.isArray(parsed.trades)) {
          setTrades(parsed.trades);
          setDeductible(parsed.deductible || 0);
          setSignature(parsed.signature || null);
          setWorkNotDoing(parsed.workNotDoing || '');
          setClaimNumber(parsed.claimNumber || '');
          setClaimAdjuster(parsed.claimAdjuster || { name: '', email: '' });
        }
      } catch (e) {
        console.error('Error loading scope data:', e);
        router.push('/upload');
      }
    } else {
      router.push('/upload');
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const calculateTotals = () => {
    let totalRcv = 0;
    let totalAcv = 0;
    let totalSupplements = 0;
    const tradeTotals: { [key: string]: { rcv: number; acv: number } } = {};

    trades.forEach((trade) => {
      let tradeRcv = 0;
      let tradeAcv = 0;
      trade.lineItems.forEach((item) => {
        if (item.checked) {
          tradeRcv += item.rcv;
          if (item.acv) {
            tradeAcv += item.acv;
          }
        }
      });

      const supplementTotal = trade.supplements.reduce((sum, supp) => sum + supp.amount, 0);
      tradeRcv += supplementTotal;
      tradeAcv += supplementTotal;

      tradeTotals[trade.name] = { rcv: tradeRcv, acv: tradeAcv };
      totalRcv += tradeRcv;
      totalAcv += tradeAcv;
      totalSupplements += supplementTotal;
    });

    return { totalRcv, totalAcv, tradeTotals, totalSupplements };
  };

  const { totalRcv, totalAcv, tradeTotals, totalSupplements } = calculateTotals();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printableRef.current) return;

    try {
      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save('scope-summary.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const handleStartOver = () => {
    sessionStorage.removeItem('scopeData');
    router.push('/upload');
  };

  const handleSendEmail = async () => {
    try {
      setSending(true);

      // Generate the PDF for attachment
      if (!printableRef.current) {
        alert('Failed to generate document');
        return;
      }

      const canvas = await (await import('html2canvas')).default(printableRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const jsPDF = (await import('jspdf')).default;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      const pdfData = pdf.output('dataurlstring');

      // Build email recipients
      const recipients = [];
      if (signature?.homeownerEmail) {
        recipients.push(signature.homeownerEmail);
      }
      // Note: In production, you would have a sales rep email from your system
      // For now, we'll just send to homeowner and adjuster
      if (claimAdjuster.email) {
        recipients.push(claimAdjuster.email);
      }

      if (recipients.length === 0) {
        alert('No email addresses available. Please ensure homeowner email is filled in.');
        return;
      }

      // Build email content
      const emailHtml = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .header { background-color: #f5f5f5; padding: 20px; border-bottom: 2px solid #007bff; }
              .content { padding: 20px; }
              .section { margin-bottom: 20px; }
              .footer { background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; }
              .signature { margin-top: 20px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Scope of Work Summary</h1>
            </div>
            <div class="content">
              <div class="section">
                <h2>Document Details</h2>
                ${claimNumber ? `<p><strong>Claim #:</strong> ${claimNumber}</p>` : ''}
                ${signature?.homeownerName ? `<p><strong>Homeowner:</strong> ${signature.homeownerName}</p>` : ''}
                ${signature?.contractorName ? `<p><strong>Contractor:</strong> ${signature.contractorName}</p>` : ''}
                ${signature?.signatureDate ? `<p><strong>Date:</strong> ${signature.signatureDate}</p>` : ''}
                ${claimAdjuster.name ? `<p><strong>Claim Adjuster:</strong> ${claimAdjuster.name}</p>` : ''}
              </div>
              <div class="section">
                <p>Please find the complete scope of work document attached. This document has been electronically signed and represents the agreed-upon scope of work for this claim.</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </body>
        </html>
      `;

      // Send email
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipients,
          subject: `Scope of Work Summary - Claim #${claimNumber || 'N/A'}`,
          html: emailHtml,
          attachments: [
            {
              filename: 'scope-summary.pdf',
              content: pdfData.replace(/^data:application\/pdf;base64,/, ''),
              contentType: 'application/pdf',
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      alert('Email sent successfully to all recipients');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const togglePartnerSelection = (partnerId: string) => {
    const newSelected = new Set(selectedPartners);
    if (newSelected.has(partnerId)) {
      newSelected.delete(partnerId);
    } else {
      newSelected.add(partnerId);
    }
    setSelectedPartners(newSelected);
  };

  const handleShareWithPartners = () => {
    if (selectedPartners.size === 0) {
      alert('Please select at least one trade partner');
      return;
    }

    const selectedPartnerNames = Array.from(selectedPartners)
      .map((partnerId) => {
        for (const partner of Object.values(tradePartnerDirectory)) {
          if (partner.id === partnerId) {
            return partner.name;
          }
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');

    // Prepare sharing data
    const sharingData = {
      homeownerName: signature?.homeownerName || 'Homeowner',
      homeownerEmail: signature?.homeownerEmail || '',
      contractorName: signature?.contractorName || 'Contractor',
      selectedPartners: Array.from(selectedPartners),
      workNotDoingItems: tradesWithWorkNotDoing.flatMap((trade) =>
        trade.lineItems
          .filter((item) => !item.checked)
          .map((item) => ({
            trade: trade.name,
            description: item.description,
            quantity: item.quantity,
          }))
      ),
    };

    // Log sharing data (in production, send to backend API)
    console.log('Sharing with trade partners:', sharingData);
    alert(
      `Information shared with: ${selectedPartnerNames}\n\nThey will be contacted about the work not doing items.`
    );

    setShowTradePartners(false);
    setSelectedPartners(new Set());
  };

  // Get trades that have unchecked items (work not doing)
  const tradesWithWorkNotDoing = trades.filter(
    (trade) => trade.lineItems.some((item) => !item.checked)
  );

  // Trade partner directory with keyword matching
  const tradePartnerDirectory: Record<
    string,
    {
      id: string;
      name: string;
      logo: string;
      rating: number;
      synopsis: string;
      keywords: string[]; // Keywords to match against trade names
    }
  > = {
    siding: {
      id: 'siding',
      name: 'Expert Siding Solutions',
      logo: '🏢',
      rating: 4.9,
      synopsis:
        'Professional siding installation and repair with 20+ years of experience. Specializing in fiber cement, vinyl, and composite materials.',
      keywords: ['siding', 'fascia', 'soffit', 'trim'],
    },
    windows: {
      id: 'windows',
      name: 'Premium Window Co.',
      logo: '🪟',
      rating: 4.8,
      synopsis:
        'High-quality window replacement and installation. Energy-efficient options available. Free estimates and consultation.',
      keywords: ['windows', 'doors', 'window', 'door', 'glass'],
    },
    painting: {
      id: 'painting',
      name: 'Elite Painting Services',
      logo: '🎨',
      rating: 4.9,
      synopsis:
        'Interior and exterior painting with eco-friendly paints. Meticulous prep work and attention to detail guaranteed.',
      keywords: ['painting', 'paint', 'interior', 'exterior'],
    },
    hvac: {
      id: 'hvac',
      name: 'Climate Control HVAC',
      logo: '❄️',
      rating: 4.7,
      synopsis:
        'Full HVAC services including installation, repair, and maintenance. 24/7 emergency support available.',
      keywords: ['hvac', 'heating', 'cooling', 'air conditioning', 'ac', 'furnace'],
    },
    'garage-doors': {
      id: 'garage-doors',
      name: 'Garage Door Pros',
      logo: '🚪',
      rating: 4.8,
      synopsis:
        'Garage door installation, repair, and wraps. Custom designs and modern automation options.',
      keywords: ['garage', 'door', 'garage doors', 'garage door wrap', 'wrap'],
    },
    decks: {
      id: 'decks',
      name: 'Deck Masters Construction',
      logo: '🏗️',
      rating: 4.9,
      synopsis:
        'Custom deck building and restoration. Pressure treated, composite, and hardwood options available.',
      keywords: ['deck', 'decking', 'framing', 'outdoor living'],
    },
    fencing: {
      id: 'fencing',
      name: 'Fence Experts LLC',
      logo: '🚧',
      rating: 4.8,
      synopsis:
        'Wood, vinyl, and chain-link fence installation. Repair and maintenance services also available.',
      keywords: ['fence', 'fencing', 'gate'],
    },
  };

  // Get relevant trade partners based on unchecked items
  const getRelevantPartners = () => {
    const relevantPartners = new Set<string>();

    tradesWithWorkNotDoing.forEach((trade) => {
      const tradeName = trade.name.toLowerCase();
      Object.entries(tradePartnerDirectory).forEach(([key, partner]) => {
        const matches = partner.keywords.some(
          (keyword) =>
            tradeName.includes(keyword) || keyword.includes(tradeName.split(' ')[0])
        );
        if (matches) {
          relevantPartners.add(key);
        }
      });
    });

    return Array.from(relevantPartners);
  };

  const relevantPartnerKeys = getRelevantPartners();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Control buttons (hidden from print) */}
        <div className="mb-6 flex gap-2 flex-wrap print:hidden">
          <Button onClick={handlePrint} variant="default" size="lg">
            🖨️ Print
          </Button>
          <Button onClick={handleDownloadPDF} variant="default" size="lg">
            📥 Download PDF
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={sending}
            variant="default"
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            {sending ? '📧 Sending...' : '📧 Send to Recipients'}
          </Button>
          <Button onClick={handleStartOver} variant="outline" size="lg">
            ↺ Start Over
          </Button>
        </div>

        {/* Printable content */}
        <div ref={printableRef} className="bg-white p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center border-b pb-6">
              <h1 className="text-3xl font-bold mb-2">Scope of Work Summary</h1>
              <p className="text-gray-600">Insurance Claim Documentation</p>
            </div>

            {/* Signature info */}
            {signature && (
              <div className="grid grid-cols-2 gap-6 border p-4 rounded-lg bg-gray-50">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Prepared by:</p>
                  <p className="text-lg font-semibold">{signature.contractorName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Property Owner/Insured:</p>
                  <p className="text-lg font-semibold">{signature.homeownerName}</p>
                  {signature.homeownerEmail && (
                    <p className="text-sm text-gray-700">Email: {signature.homeownerEmail}</p>
                  )}
                  <p className="text-sm text-gray-700">Date: {signature.signatureDate}</p>
                </div>
              </div>
            )}

            {/* Scope breakdown by trade */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Scope of Work</h2>

              {trades.map((trade) => {
                const hasCheckedItems = trade.lineItems.some((item) => item.checked);
                const hasSupplements = trade.supplements.length > 0;

                if (!hasCheckedItems && !hasSupplements) return null;

                return (
                  <div key={trade.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="text-xl font-semibold">{trade.name}</h3>
                      <div className="flex gap-4 text-lg font-mono">
                        <span>RCV: ${tradeTotals[trade.name]?.rcv.toLocaleString() || 0}</span>
                        {tradeTotals[trade.name]?.acv > 0 && (
                          <span>ACV: ${tradeTotals[trade.name]?.acv.toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    {/* Line items - Checked items only */}
                    {trade.lineItems.filter((item) => item.checked).length > 0 && (
                      <div className="space-y-2">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="text-left p-2 font-semibold">Ref</th>
                              <th className="text-left p-2 font-semibold">Quantity</th>
                              <th className="text-left p-2 font-semibold">Description</th>
                              <th className="text-right p-2 font-semibold">RCV</th>
                              <th className="text-right p-2 font-semibold">ACV</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trade.lineItems
                              .filter((item) => item.checked)
                              .map((item) => (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                  <td className="p-2 font-mono text-xs text-muted-foreground">{item.id}</td>
                                  <td className="p-2 font-mono text-gray-700">{item.quantity}</td>
                                  <td className="p-2">{item.description}</td>
                                  <td className="p-2 text-right font-mono">
                                    ${item.rcv.toLocaleString()}
                                  </td>
                                  <td className="p-2 text-right font-mono">
                                    {item.acv ? `$${item.acv.toLocaleString()}` : '—'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {trade.lineItems.some((item) => item.checked && item.notes) && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs font-semibold text-yellow-800 mb-1">Notes:</p>
                            {trade.lineItems
                              .filter((item) => item.checked && item.notes)
                              .map((item) => (
                                <p key={item.id} className="text-xs text-yellow-900 mb-1">
                                  {item.description}: {item.notes}
                                </p>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Unchecked line items - Work Not Doing for this trade */}
                    {trade.lineItems.filter((item) => !item.checked).length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-red-200">
                        <div className="text-xs font-semibold text-red-700 mb-2">Work Not Doing:</div>
                        <table className="w-full text-sm">
                          <thead className="bg-red-50 border-b">
                            <tr>
                              <th className="text-left p-2 font-semibold text-xs">Ref</th>
                              <th className="text-left p-2 font-semibold text-xs">Quantity</th>
                              <th className="text-left p-2 font-semibold text-xs">Description</th>
                              <th className="text-right p-2 font-semibold text-xs">RCV</th>
                              <th className="text-right p-2 font-semibold text-xs">ACV</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trade.lineItems
                              .filter((item) => !item.checked)
                              .map((item) => (
                                <tr key={item.id} className="border-b bg-red-50 opacity-60">
                                  <td className="p-2 font-mono text-xs text-muted-foreground">{item.id}</td>
                                  <td className="p-2 font-mono text-gray-700">{item.quantity}</td>
                                  <td className="p-2">{item.description}</td>
                                  <td className="p-2 text-right font-mono">
                                    ${item.rcv.toLocaleString()}
                                  </td>
                                  <td className="p-2 text-right font-mono">
                                    {item.acv ? `$${item.acv.toLocaleString()}` : '—'}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Supplements */}
                    {trade.supplements.length > 0 && (
                      <div className="space-y-2 pt-3 border-t">
                        <p className="text-sm font-semibold text-yellow-800">Supplements:</p>
                        <table className="w-full text-sm">
                          <thead className="bg-yellow-50 border-b">
                            <tr>
                              <th className="text-left p-2 font-semibold text-xs">Quantity</th>
                              <th className="text-left p-2 font-semibold text-xs">Description</th>
                              <th className="text-right p-2 font-semibold text-xs">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trade.supplements.map((supp) => (
                              <tr key={supp.id} className="border-b bg-yellow-50">
                                <td className="p-2 font-mono text-gray-700">{supp.quantity}</td>
                                <td className="p-2">{supp.title}</td>
                                <td className="p-2 text-right font-mono">
                                  ${supp.amount.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Work Not Doing section */}
            {workNotDoing && (
              <div className="border-2 border-red-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-2">Work Not Included</h2>
                    <p className="text-sm whitespace-pre-wrap">{workNotDoing}</p>
                  </div>
                  {tradesWithWorkNotDoing.length > 0 && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        onClick={() => setShowTradePartners(true)}
                        variant="outline"
                        size="sm"
                        className="whitespace-nowrap"
                      >
                        View Trade Partners
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trade Partners Modal - Directory View */}
            {showTradePartners && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
                <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
                  <CardHeader className="flex-shrink-0 border-b pb-6">
                    <div className="flex justify-between items-start gap-6">
                      <div>
                        <CardTitle className="text-2xl mb-2">Trusted Trade Partners</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          Share your information with specialists who can help with the work we won't be doing.
                        </CardDescription>
                      </div>
                      <button
                        onClick={() => setShowTradePartners(false)}
                        className="text-2xl text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 flex-1 overflow-y-auto">
                    {/* Trade Partner Grid */}
                    <div className="grid grid-cols-3 gap-6">
                      {relevantPartnerKeys.map((partnerKey) => {
                        const partner = tradePartnerDirectory[partnerKey];
                        // Find the corresponding trade(s) for this partner
                        const matchingTrades = tradesWithWorkNotDoing.filter((trade) => {
                          const tradeName = trade.name.toLowerCase();
                          return partner.keywords.some(
                            (keyword) =>
                              tradeName.includes(keyword) ||
                              keyword.includes(tradeName.split(' ')[0])
                          );
                        });

                        if (matchingTrades.length === 0) return null;

                        return (
                          <div
                            key={partner.id}
                            className="border rounded-lg p-4 space-y-3 hover:shadow-lg transition-shadow cursor-pointer"
                            onClick={() => togglePartnerSelection(partner.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="text-5xl">{partner.logo}</div>
                              <input
                                type="checkbox"
                                checked={selectedPartners.has(partner.id)}
                                onChange={() => togglePartnerSelection(partner.id)}
                                className="w-5 h-5 cursor-pointer mt-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            <div className="space-y-2">
                              <h3 className="font-semibold text-sm leading-tight">
                                {partner.name}
                              </h3>

                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span className="text-sm font-medium">
                                  {partner.rating}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Google Rating
                                </span>
                              </div>

                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {partner.synopsis}
                              </p>

                              <div className="pt-2 border-t space-y-2">
                                <p className="text-xs font-semibold text-foreground">
                                  Can help with:
                                </p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                  {matchingTrades
                                    .flatMap((t) =>
                                      t.lineItems
                                        .filter((item) => !item.checked)
                                        .map((item) => ({
                                          description: item.description,
                                          trade: t.name,
                                        }))
                                    )
                                    .slice(0, 3)
                                    .map((item, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="text-gray-400 flex-shrink-0 mt-0.5">•</span>
                                        <span className="leading-snug">
                                          {item.description.length > 50
                                            ? item.description.substring(0, 50) + '...'
                                            : item.description}
                                        </span>
                                      </li>
                                    ))}
                                </ul>
                                {matchingTrades
                                  .flatMap((t) =>
                                    t.lineItems.filter((item) => !item.checked)
                                  )
                                  .length > 3 && (
                                  <p className="text-xs text-blue-600 font-medium pt-1">
                                    +
                                    {matchingTrades
                                      .flatMap((t) =>
                                        t.lineItems.filter((item) => !item.checked)
                                      )
                                      .length - 3}{' '}
                                    more items
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Contact Information Section */}
                    <div className="border-t pt-6">
                      <p className="text-sm font-semibold mb-3">
                        Your Contact Information
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                        <p>
                          <span className="font-semibold">Homeowner:</span>{' '}
                          {signature?.homeownerName || 'Not provided'}
                        </p>
                        {signature?.homeownerEmail && (
                          <p>
                            <span className="font-semibold">Email:</span>{' '}
                            {signature.homeownerEmail}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">Our Contractor:</span>{' '}
                          {signature?.contractorName || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </CardContent>

                  {/* Action Buttons - Fixed at bottom */}
                  <div className="flex gap-2 p-6 border-t flex-shrink-0">
                    <Button
                      onClick={() => setShowTradePartners(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleShareWithPartners}
                      disabled={selectedPartners.size === 0}
                      className="flex-1"
                    >
                      Share with {selectedPartners.size > 0 ? selectedPartners.size : ''}{' '}
                      {selectedPartners.size === 1 ? 'Partner' : 'Partners'}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Financial summary */}
            <div className="border-t pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Supplements:</span>
                  <span className="font-mono font-semibold">
                    ${totalSupplements.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold border-t pt-3">
                  <span>Total Replacement Cost Value (RCV):</span>
                  <span className="font-mono">${totalRcv.toLocaleString()}</span>
                </div>
                {totalAcv > 0 && (
                  <>
                    <div className="flex justify-between items-center text-xl font-bold">
                      <span>Total Actual Cash Value (ACV):</span>
                      <span className="font-mono">${totalAcv.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-bold text-orange-600">
                      <span>Depreciation:</span>
                      <span className="font-mono">${(totalRcv - totalAcv).toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center">
                  <span>Deductible:</span>
                  <span className="font-mono">${deductible.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold p-3 rounded border">
                  <span>Insurance Will Pay:</span>
                  <span className="font-mono">
                    ${Math.max(0, totalRcv - deductible).toLocaleString()}
                    <span className="text-sm font-normal ml-2">+ Approved Supplements</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold p-3 rounded border">
                  <span>Homeowner Responsibility:</span>
                  <span className="font-mono">${deductible.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-6 text-center text-xs text-gray-600">
              <p className="mb-2">
                This document serves as a formal scope of work agreement for the insurance claim.
              </p>
              <p>
                Generated by Scope Builder | {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
