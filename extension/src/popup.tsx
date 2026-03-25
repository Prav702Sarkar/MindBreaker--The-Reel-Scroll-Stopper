import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrainCircuit, Copy, Check } from 'lucide-react'

function Popup() {
  const [userId, setUserId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load user_id from storage on popup open
    chrome.storage.local.get(['user_id'], (result) => {
      setUserId(result.user_id || null)
      setLoading(false)
    })
  }, [])

  const handleCopyUserId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenDashboard = () => {
    chrome.tabs.create({ url: 'http://localhost:3000/dashboard' })
  }

  return (
    <div className="w-80 p-4 bg-slate-900 text-white">
      <div className="flex items-center justify-center mb-4">
        <BrainCircuit className="w-12 h-12 text-emerald-500 mr-2" />
        <h1 className="text-xl font-bold">MindBreaker</h1>
      </div>
      
      <p className="text-sm text-slate-400 mb-4 text-center">
        Monitoring scroll velocity to prevent doomscrolling.
      </p>
      
      {/* Status Section */}
      <div className="w-full bg-slate-800 rounded-lg p-4 mb-4">
        <div className="text-xs text-slate-400 font-medium mb-1">Extension Status</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-emerald-400">Active & Tracking</span>
        </div>
      </div>

      {/* User ID Section */}
      <div className="w-full bg-slate-800 rounded-lg p-4 mb-4">
        <div className="text-xs text-slate-400 font-medium mb-2">Logged-in User</div>
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : userId ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 truncate">
              <p className="text-sm font-mono text-emerald-400 truncate">{userId.substring(0, 12)}...</p>
            </div>
            <button
              onClick={handleCopyUserId}
              className="p-2 hover:bg-slate-700 rounded transition-colors"
              title="Copy user ID"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            ⚠️ Not logged in. Log in on the dashboard to sync.
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleOpenDashboard}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 transition-colors rounded-lg text-sm font-medium"
        >
          Open Dashboard
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 p-2 bg-slate-800 rounded text-xs text-slate-400 text-center">
        <div className="text-xs mb-1">📊 Extension Communication: Ready</div>
        <div className="text-xs">Check console for telemetry logs</div>
      </div>
    </div>
  )
}

const root = createRoot(document.getElementById('root')!)
root.render(<Popup />)
