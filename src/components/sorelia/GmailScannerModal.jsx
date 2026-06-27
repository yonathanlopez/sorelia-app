import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, Loader2, Mail, Sparkles, X } from 'lucide-react';

const CONNECTOR_ID = '6a3f1d5883dab3778fd3485c';

const SCAN_STEPS = [
  { key: 'reading', label: 'Reading your emails...' },
  { key: 'contacts', label: 'Found contacts', stat: 'contacts', emoji: '👥' },
  { key: 'trips', label: 'Found trips', stat: 'trips', emoji: '✈️' },
  { key: 'birthdays', label: 'Found birthdays', stat: 'birthdays', emoji: '🎂' },
  { key: 'events', label: 'Found upcoming events', stat: 'events', emoji: '📅' },
  { key: 'flights', label: 'Found flight confirmations', stat: 'flights', emoji: '🛫' },
  { key: 'building', label: 'Building your memories...', emoji: '✨' },
];

export default function GmailScannerModal({ onClose, onComplete }) {
  const [phase, setPhase] = useState('idle'); // idle | connecting | scanning | done | error
  const [connected, setConnected] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Check if already connected
  useEffect(() => {
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      await base44.functions.invoke('gmailScanner', {});
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }

  async function handleConnect() {
    setPhase('connecting');
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, '_blank');
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setConnected(true);
        startScan();
      }
    }, 500);
  }

  async function startScan() {
    setPhase('scanning');
    setCurrentStep(0);

    // Animate steps while scanning
    let stepIdx = 0;
    const stepTimer = setInterval(() => {
      stepIdx++;
      setCurrentStep(stepIdx);
      if (stepIdx >= SCAN_STEPS.length - 1) clearInterval(stepTimer);
    }, 900);

    try {
      const res = await base44.functions.invoke('gmailScanner', {});
      clearInterval(stepTimer);
      setCurrentStep(SCAN_STEPS.length);
      setStats(res.data?.stats || {});
      setPhase('done');
    } catch (e) {
      clearInterval(stepTimer);
      setErrorMsg(e.message || 'Something went wrong scanning your Gmail.');
      setPhase('error');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-6 pb-10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Connect Gmail</h2>
              <p className="text-xs text-gray-500">Sorelia will scan and remember your life</p>
            </div>
          </div>
          {phase === 'idle' && (
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* IDLE: not yet connected */}
        {phase === 'idle' && (
          <div>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Sorelia will scan your inbox and automatically extract memories — contacts, trips, birthdays, and more. Nothing is stored except what matters.
            </p>
            <div className="space-y-2.5 mb-6">
              {['👥 Find your important contacts', '✈️ Discover trips & travel plans', '🎂 Capture birthdays & anniversaries', '📅 Surface upcoming events'].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleConnect}
              className="w-full py-3.5 bg-violet-600 text-white rounded-2xl font-semibold text-sm hover:bg-violet-700 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Connect Gmail
            </button>
          </div>
        )}

        {/* CONNECTING */}
        {phase === 'connecting' && (
          <div className="text-center py-8">
            <Loader2 className="w-10 h-10 animate-spin text-violet-600 mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-700">Opening Google sign-in...</p>
            <p className="text-xs text-gray-400 mt-1">Complete the sign-in in the popup window</p>
          </div>
        )}

        {/* SCANNING */}
        {phase === 'scanning' && (
          <div className="py-4">
            <div className="flex items-center gap-2 mb-6">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              <p className="text-sm font-medium text-violet-700">Building your life...</p>
            </div>
            <div className="space-y-3">
              {SCAN_STEPS.map((step, i) => {
                const done = i < currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.key} className={`flex items-center gap-3 transition-all duration-500 ${active ? 'opacity-100' : done ? 'opacity-100' : 'opacity-30'}`}>
                    {done ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : active ? (
                      <Loader2 className="w-5 h-5 animate-spin text-violet-500 flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${done ? 'text-emerald-700 font-medium' : active ? 'text-violet-700 font-medium' : 'text-gray-400'}`}>
                      {step.emoji && done && step.stat ? `${step.emoji} ${step.label}` : step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DONE */}
        {phase === 'done' && stats && (
          <div className="py-2">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Your life is ready ✨</h3>
              <p className="text-sm text-gray-500 mt-1">Sorelia has learned a lot about you</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: 'Contacts', value: stats.contacts, emoji: '👥' },
                { label: 'Trips', value: stats.trips, emoji: '✈️' },
                { label: 'Birthdays', value: stats.birthdays, emoji: '🎂' },
                { label: 'Events', value: stats.events, emoji: '📅' },
              ].map(item => (
                <div key={item.label} className="bg-gray-50 rounded-2xl p-3 text-center">
                  <p className="text-xl mb-0.5">{item.emoji}</p>
                  <p className="text-xl font-bold text-gray-900">{item.value || 0}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
            <button
              onClick={onComplete}
              className="w-full py-3.5 bg-violet-600 text-white rounded-2xl font-semibold text-sm hover:bg-violet-700 transition-colors"
            >
              See my memories →
            </button>
          </div>
        )}

        {/* ERROR */}
        {phase === 'error' && (
          <div className="text-center py-6">
            <p className="text-sm text-red-600 mb-4">{errorMsg}</p>
            <button
              onClick={() => setPhase('idle')}
              className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}