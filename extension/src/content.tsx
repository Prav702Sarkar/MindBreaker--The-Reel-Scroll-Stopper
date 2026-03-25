import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Detect platform from URL
function detectPlatform(): string {
  const hostname = window.location.hostname
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'Twitter'
  if (hostname.includes('tiktok.com')) return 'TikTok'
  if (hostname.includes('instagram.com')) return 'Instagram'
  if (hostname.includes('facebook.com')) return 'Facebook'
  if (hostname.includes('youtube.com')) return 'YouTube'
  if (hostname.includes('reddit.com')) return 'Reddit'
  if (hostname.includes('linkedin.com')) return 'LinkedIn'
  return 'Web'
}

// The intervention overlay component
function InterventionOverlay({ onClose }: { onClose: () => void }) {
  const [fade, setFade] = useState(false)
  
  useEffect(() => {
    // progressive grayscale on the body
    document.body.style.transition = "filter 5s ease-in-out"
    document.body.style.filter = "grayscale(100%)"
    setFade(true)
    
    return () => {
      document.body.style.filter = "none"
    }
  }, [])

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(8px)',
      zIndex: 2147483647,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontFamily: 'sans-serif',
      opacity: fade ? 1 : 0, transition: 'opacity 1s ease-in-out'
    }}>
      <div style={{
        background: '#1e293b', padding: '40px', borderRadius: '16px',
        maxWidth: '400px', textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          Mindless scrolling detected
        </h2>
        <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '32px' }}>
          You've been scrolling rapidly. Take a moment to breathe. Is this intentional?
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button 
            onClick={() => window.close()}
            style={{ padding: '12px 24px', background: '#ec4899', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
            Close Tab
          </button>
          <button 
            onClick={onClose}
            style={{ padding: '12px 24px', background: 'transparent', border: '2px solid #475569', borderRadius: '8px', color: '#cbd5e1', fontWeight: 'bold', cursor: 'pointer' }}>
            I want to stay
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== TELEMETRY TRACKING =====
let scrollEvents: number[] = []
let scrollPositions: number[] = [];
let elementClickCount = 0
let postsVisited = 0
let overlayContainer: HTMLDivElement | null = null
let dwellTimeTracker: { [key: number]: number } = {}
let telemetrySessionStart = Date.now()

// Count clicks on the page
document.addEventListener('click', (e: Event) => {
  const target = e.target as HTMLElement
  // Count only relevant content clicks (not UI elements like buttons that aren't post interactions)
  if (target.closest('[role="article"]') || target.closest('[data-testid="tweet"]') || target.closest('.post') || target.closest('[class*="post"]')) {
    elementClickCount++
  }
}, true)

// Calculate dwell time on visible elements
function trackDwellTime() {
  // Simulate dwell time tracking - in real app, track individual post/element visibility
  const now = Date.now()
  if (!dwellTimeTracker['last_update']) {
    dwellTimeTracker['last_update'] = now
    dwellTimeTracker['total_dwell'] = 0
  } else {
    const timeDiff = (now - dwellTimeTracker['last_update']) / 1000 // convert to seconds
    dwellTimeTracker['total_dwell'] = (dwellTimeTracker['total_dwell'] || 0) + Math.min(timeDiff, 5) // cap at 5s per interval
    dwellTimeTracker['last_update'] = now
  }
}

// Track scroll events and collect velocity data
window.addEventListener('scroll', () => {
  const now = Date.now()
  const currentPosition = window.scrollY
  
  scrollEvents.push(now)
  scrollPositions.push(currentPosition)
  
  // Keep only last 10 seconds of events
  const cutoff = now - 10000
  scrollEvents = scrollEvents.filter(t => t > cutoff)
  scrollPositions = scrollPositions.filter((_, i) => scrollEvents[i] ? scrollEvents[i] > cutoff : false)
  
  trackDwellTime()
  
  // If user triggered > 50 scroll events in 10 seconds, classify as doomscrolling
  if (scrollEvents.length > 50) {
    sendTelemetryToBackground()
  }
}, { passive: true })

// Calculate scroll velocity (pixels per second)
function calculateScrollVelocity(): number {
  if (scrollPositions.length < 2) return 0
  
  const lastPos = scrollPositions[scrollPositions.length - 1]
  const firstPos = scrollPositions[0]
  const lastTime = scrollEvents[scrollEvents.length - 1]
  const firstTime = scrollEvents[0]
  
  const distance = Math.abs(lastPos - firstPos)
  const timeMs = lastTime - firstTime
  
  if (timeMs === 0) return 0
  return (distance / (timeMs / 1000)) // pixels per second
}

// Send telemetry data to background script
function sendTelemetryToBackground() {
  const scrollVelocity = calculateScrollVelocity()
  const avgDwellTime = scrollEvents.length > 0 
    ? (dwellTimeTracker['total_dwell'] || 0) / Math.max(scrollEvents.length / 10, 1)
    : 0

  const telemetryData = {
    type: 'RECORD_INTERVENTION',
    data: {
      platform: detectPlatform(),
      scroll_velocity: parseFloat(scrollVelocity.toFixed(2)),
      posts_bypassed: postsVisited,
      dwell_time_avg: parseFloat(avgDwellTime.toFixed(2)),
      clicks: elementClickCount,
      timestamp: new Date().toISOString(),
    }
  }

  console.log('📤 Sending telemetry to background:', telemetryData)
  chrome.runtime.sendMessage(telemetryData, (response: any) => {
    if (chrome.runtime.lastError) {
      console.error('❌ Error sending telemetry:', chrome.runtime.lastError)
    } else {
      console.log('✅ Telemetry sent successfully:', response)
      // Reset counters after sending
      scrollEvents = []
      scrollPositions = []
      elementClickCount = 0
      postsVisited = 0
      dwellTimeTracker = {}
      telemetrySessionStart = Date.now()
    }
  })
}

function triggerIntervention() {
  if (overlayContainer) return // already active
  
  overlayContainer = document.createElement('div')
  overlayContainer.id = 'mindbreaker-overlay'
  document.body.appendChild(overlayContainer)
  
  const root = createRoot(overlayContainer)
  root.render(<InterventionOverlay onClose={() => {
    root.unmount()
    overlayContainer?.remove()
    overlayContainer = null
    // reset tracking
    scrollEvents = []
    scrollPositions = []
    elementClickCount = 0
    postsVisited = 0
    dwellTimeTracker = {}
  }} />)
}

// ===== SESSION TRACKING =====
let sessionStartTime: number | null = null
let sessionActive = false
let thirtyMinuteWarningShown = false

function startSession() {
  if (sessionActive) return
  
  sessionStartTime = Date.now()
  sessionActive = true
  thirtyMinuteWarningShown = false
  console.log(`🟢 Session started at ${new Date().toISOString()}`)
  
  // Start 30-minute warning check (check every minute)
  const warningInterval = setInterval( () => {
    if (!sessionActive) {
      clearInterval(warningInterval)
      return
    }
    
    const elapsedSeconds = (Date.now() - (sessionStartTime || 0)) / 1000
    const elapsedMinutes = elapsedSeconds / 60
    
    // Show warning at 30 minutes
    if (elapsedMinutes >= 30 && !thirtyMinuteWarningShown) {
      thirtyMinuteWarningShown = true
      showExtendedUsageWarning(elapsedSeconds, elapsedMinutes)
    }
  }, 60000) // Check every minute
}

function showExtendedUsageWarning(elapsedSeconds: number, elapsedMinutes: number) {
  console.warn(`⚠️ EXTENDED USAGE WARNING: User has been scrolling for ${elapsedMinutes.toFixed(0)} minutes`)
  
  // Send warning to background script
  chrome.runtime.sendMessage({
    type: 'EXTENDED_USAGE_WARNING',
    data: {
      elapsed_seconds: elapsedSeconds,
      elapsed_minutes: elapsedMinutes,
      platform: detectPlatform()
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending warning:', chrome.runtime.lastError)
    }
  })
}

function endSession() {
  if (!sessionActive || !sessionStartTime) return
  
  sessionActive = false
  const sessionEnd = Date.now()
  const sessionDuration = sessionEnd - sessionStartTime
  const platformName = detectPlatform()
  
  console.log(`🛑 Session ended. Duration: ${(sessionDuration / 1000 / 60).toFixed(1)} minutes`)
  
  // Send session end event to background script
  chrome.runtime.sendMessage({
    type: 'SESSION_END',
    data: {
      session_start: new Date(sessionStartTime).toISOString(),
      session_end: new Date(sessionEnd).toISOString(),
      duration_seconds: Math.floor(sessionDuration / 1000),
      platform: platformName,
      scroll_events_count: scrollEvents.length,
      total_clicks: elementClickCount,
      total_posts_bypassed: postsVisited
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error sending session end:', chrome.runtime.lastError)
    } else {
      console.log('✅ Session end sent to background')
    }
  })
  
  // Reset session data
  scrollEvents = []
  scrollPositions = []
  elementClickCount = 0
  postsVisited = 0
  dwellTimeTracker = {}
  sessionStartTime = null
}

// Start session when page loads
window.addEventListener('load', () => {
  console.log('📄 Page loaded, starting session tracking')
  startSession()
})

// End session when page unloads
window.addEventListener('beforeunload', () => {
  console.log('👋 Page unloading, ending session')
  endSession()
})

// Also end session if tab is hidden for more than 5 minutes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('👁️ Tab hidden, checking session timeout')
    setTimeout(() => {
      if (document.hidden && sessionActive) {
        console.log('⏱️ Tab hidden for >5 minutes, ending session')
        endSession()
      }
    }, 5 * 60 * 1000) // 5 minutes
  } else {
    console.log('👁️ Tab visible again, resuming session')
    if (!sessionActive) {
      startSession()
    }
  }
})

// Listen for user_id from frontend via window message (cross-origin safe)
window.addEventListener('message', (event) => {
  if (event.source !== window) return
  
  if (event.data.type === 'MINDBREAKER_USER_ID') {
    const userId = event.data.userId
    console.log('📥 Received user_id from frontend:', userId)
    
    // Store user_id in extension storage
    chrome.storage.local.set({ user_id: userId }, () => {
      console.log('💾 Stored user_id in extension:', userId)
    })
  }
}, false)
