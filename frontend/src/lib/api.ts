// API utility functions for fetching data from backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function registerUser(userId: string, email: string, fullName: string) {
  try {
    const url = `${API_URL}/api/auth/register?user_id=${userId}&email=${email}&full_name=${fullName}`
    const response = await fetch(url, { method: 'POST' })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error registering user:', message)
    // Don't throw - registration is non-critical
    return null
  }
}

export async function fetchUserStats(userId: string) {
  try {
    const url = `${API_URL}/api/user/${userId}`
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error fetching user stats:', message)
    throw new Error(`Failed to fetch user stats: ${message}`)
  }
}

export async function fetchWeeklyStats(userId: string) {
  try {
    const url = `${API_URL}/api/stats/weekly/${userId}`
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error fetching weekly stats:', message)
    throw new Error(`Failed to fetch weekly stats: ${message}`)
  }
}

export async function fetchUserProfile(userId: string) {
  try {
    const url = `${API_URL}/api/profile/${userId}`
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error fetching user profile:', message)
    throw new Error(`Failed to fetch user profile: ${message}`)
  }
}

export async function fetchTelemetry(userId: string) {
  try {
    const url = `${API_URL}/api/telemetry/${userId}`
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error fetching telemetry:', message)
    throw new Error(`Failed to fetch telemetry: ${message}`)
  }
}

export function syncUserIdWithExtension(userId: string) {
  // Sync user_id to the MindBreaker extension for telemetry
  if (typeof window === 'undefined') return
  
  try {
    // Try to communicate with extension via window message
    window.postMessage({
      type: 'MINDBREAKER_USER_ID',
      userId: userId
    }, '*')
    console.log('📤 Sent user_id to extension:', userId)
  } catch (error) {
    console.warn('Could not communicate with extension:', error)
  }
}

export async function endSession(userId: string, platform: string, sessionStartISO: string, durationSeconds: number) {
  try {
    const url = `${API_URL}/api/session/end`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        platform: platform,
        session_start: sessionStartISO,
        session_duration_seconds: durationSeconds,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error ending session:', message)
    return null
  }
}

export async function checkExtendedUsageWarning(userId: string, sessionStartISO: string) {
  try {
    const url = `${API_URL}/api/session/check-warning/${userId}?session_start_iso=${encodeURIComponent(sessionStartISO)}`
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error checking extended usage:', message)
    return null
  }
}

export async function getSessionHistory(userId: string, days: number = 7) {
  try {
    const url = `${API_URL}/api/sessions/history/${userId}?days=${days}`
    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Error fetching session history:', message)
    return null
  }
}
