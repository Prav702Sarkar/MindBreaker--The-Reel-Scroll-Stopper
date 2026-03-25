const BACKEND_URL = 'http://localhost:8000'

let activeSessionStart: string | null = null

chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ MindBreaker Extension Installed")
})

// Listen for telemetry messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SESSION_END') {
    console.log("📨 Session ending:", message.data)
    handleSessionEnd(message.data, sendResponse)
    return true
  }
  
  if (message.type === 'EXTENDED_USAGE_WARNING') {
    console.log("⚠️ Extended usage warning:", message.data)
    // Send warning to active tab's dashboard
    chrome.tabs.query({ url: '*://localhost:3000/*' }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id!, {
          type: 'SHOW_EXTENDED_WARNING',
          data: message.data
        })
      }
    })
    return true
  }
  
  if (message.type === 'RECORD_INTERVENTION') {
    console.log("📨 Received intervention message:", message.data)
    
    // Get user_id from storage
    chrome.storage.local.get(['user_id'], async (result) => {
      const userId = result.user_id
      
      if (!userId) {
        console.warn('⚠️ User ID not found in storage. Cannot send telemetry.')
        sendResponse({ success: false, error: 'No user_id in storage' })
        return
      }
      
      try {
        // Prepare telemetry payload
        const telemetryPayload = {
          user_id: userId,
          platform: message.data.platform,
          scroll_velocity: message.data.scroll_velocity,
          posts_bypassed: message.data.posts_bypassed,
          dwell_time_avg: message.data.dwell_time_avg,
          clicks: message.data.clicks,
        }
        
        console.log('📡 Posting telemetry to backend:', telemetryPayload)
        
        // POST telemetry to backend
        const response = await fetch(`${BACKEND_URL}/api/telemetry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(telemetryPayload),
        })
        
        const data = await response.json()
        
        if (response.ok) {
          console.log('✅ Telemetry sent successfully:', data)
          sendResponse({ success: true, intervention_triggered: data.intervention_triggered, message: data.message })
        } else {
          console.error('❌ Backend returned error:', data)
          sendResponse({ success: false, error: data.detail || 'Backend error' })
        }
      } catch (error) {
        console.error('❌ Error posting telemetry:', error)
        sendResponse({ success: false, error: String(error) })
      }
    })
    
    return true
  }
})

// Handle session end
async function handleSessionEnd(sessionData: any, sendResponse: Function) {
  try {
    chrome.storage.local.get(['user_id'], async (result) => {
      const userId = result.user_id
      
      if (!userId) {
        console.warn('⚠️ User ID not found, cannot end session')
        sendResponse({ success: false, error: 'No user_id' })
        return
      }
      
      try {
        console.log(`📤 Sending session end to backend for ${userId}`)
        
        const response = await fetch(`${BACKEND_URL}/api/session/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            platform: sessionData.platform,
            session_start: sessionData.session_start,
            session_duration_seconds: sessionData.duration_seconds,
          }),
        })
        
        const data = await response.json()
        
        if (response.ok) {
          console.log('✅ Session analysis received:', data)
          
          // Send analysis to dashboard
          chrome.tabs.query({ url: '*://localhost:3000/*' }, (tabs) => {
            if (tabs.length > 0) {
              chrome.tabs.sendMessage(tabs[0].id!, {
                type: 'SESSION_ANALYSIS',
                data: data.analysis
              }, (error) => {
                if (chrome.runtime.lastError) {
                  console.warn('Could not send analysis to dashboard tab')
                }
              })
            }
          })
          
          sendResponse({ success: true, analysis: data.analysis })
        } else {
          console.error('❌ Backend error:', data)
          sendResponse({ success: false, error: data.detail || 'Backend error' })
        }
      } catch (error) {
        console.error('❌ Error ending session:', error)
        sendResponse({ success: false, error: String(error) })
      }
    })
  } catch (error) {
    console.error('❌ Error in handleSessionEnd:', error)
    sendResponse({ success: false, error: String(error) })
  }
}

// Listen for messages from popup to store user_id
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STORE_USER_ID') {
    chrome.storage.local.set({ user_id: message.user_id }, () => {
      console.log('💾 Stored user_id:', message.user_id)
      sendResponse({ success: true })
    })
    return true
  }
})
