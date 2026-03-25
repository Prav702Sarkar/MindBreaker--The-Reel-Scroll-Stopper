'use client';

import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Link2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export function ExtensionIntegration() {
  const { user } = useUser();
  const [isLinked, setIsLinked] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ready' | 'linked'>('idle');

  const handleStartExtension = () => {
    // Generate a connection code
    const connectionCode = `MB-${user?.id?.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(connectionCode);
    
    setStatus('ready');
    setTimeout(() => {
      alert(`Connection code copied: ${connectionCode}\n\nPaste this in your extension setup.`);
    }, 100);
  };

  const handleLinkBrowser = () => {
    setIsLinked(true);
    setStatus('linked');
    // In real implementation, this would communicate with the browser extension
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-indigo-500/10 dark:to-cyan-500/10 border-indigo-200 dark:border-indigo-500/30 shadow-md rounded-xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Browser Extension
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
              Monitor your browsing habits
            </CardDescription>
          </div>
          {isLinked && (
            <div className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30 flex items-center gap-1 text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Step 1: Download Extension */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white">Download Extension</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Get the MindBreaker extension from Chrome Web Store</p>
              <a
                href="https://chrome.google.com/webstore"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Open Chrome Web Store →
              </a>
            </div>
          </div>
        </div>

        {/* Step 2: Start Extension */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white">Start Extension</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Generate your connection code</p>
              <Button
                onClick={handleStartExtension}
                size="sm"
                className={`text-xs ${
                  status === 'ready' || status === 'linked'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                } text-white`}
              >
                <Link2 className="w-3 h-3 mr-1" />
                {status === 'idle' ? 'Get Connection Code' : '✓ Code Copied'}
              </Button>
            </div>
          </div>
        </div>

        {/* Step 3: Link Browser */}
        {status !== 'idle' && (
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-semibold">
                3
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">Link Your Browser</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">Activate monitoring in your browser</p>
                <Button
                  onClick={handleLinkBrowser}
                  size="sm"
                  disabled={isLinked}
                  className={`text-xs ${
                    isLinked
                      ? 'bg-green-600 hover:bg-green-700 cursor-not-allowed'
                      : 'bg-cyan-600 hover:bg-cyan-700'
                  } text-white`}
                >
                  {isLinked ? '✓ Browser Linked' : 'Link Browser'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {isLinked && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-300">Extension Active</p>
                <p className="text-xs text-green-800 dark:text-green-400 mt-1">
                  Your browser is now monitored. Real-time interventions will appear when doomscrolling is detected.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-blue-900 dark:text-blue-300">Privacy First</p>
              <p className="text-xs text-blue-800 dark:text-blue-400 mt-1">
                All data is encrypted and only shared with your account. No personal browsing data is stored.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
