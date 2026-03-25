'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Bell, Shield, User, Mail, Phone, MapPin, Calendar } from "lucide-react"
import { ModeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

export default function SettingsPage() {
  const { user } = useUser()
  
  if (!user) {
    return (
      <div className="flex-1 space-y-6 p-8 md:p-10 pt-8 w-full max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8">You need to be logged in to access settings.</p>
          <Link href="/login">
            <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-8 md:p-10 pt-8 w-full max-w-7xl mx-auto">
      <div className="flex items-center justify-between space-y-2 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Settings</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your profile, preferences and account security.</p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>

      {/* Profile Section */}
      <ProfileSettingsCard />

      {/* Notification Settings */}
      <NotificationSettingsCard />

      {/* Security Settings */}
      <SecuritySettingsCard />

      {/* Preferences Settings */}
      <PreferenceSettingsCard />
    </div>
  )
}

// Profile Settings Component
function ProfileSettingsCard() {
  const { user } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    phone: user?.phoneNumbers?.[0]?.phoneNumber || '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      if (user) {
        await user.update({
          firstName: formData.firstName,
          lastName: formData.lastName,
        })
        setIsEditing(false)
        alert('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    }
  }

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-900 dark:text-white">Profile Information</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
                Update your personal details
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className={"  text-white rounded-lg text-xs"}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                <Mail className="inline w-3 h-3 mr-1" /> Email (Read-only)
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                <Phone className="inline w-3 h-3 mr-1" /> Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                placeholder="Enter phone number"
              />
            </div>
            <Button
              onClick={handleSave}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Full Name</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {formData.firstName} {formData.lastName}
              </p>
            </div>
            <div className="pb-3 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3" /> Email
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{formData.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3" /> Phone
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {formData.phone || 'Not provided'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Notification Settings Component
function NotificationSettingsCard() {
  const [notifications, setNotifications] = useState({
    interventions: true,
    weeklyReports: true,
    marketing: false,
  })

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-cyan-50 dark:bg-cyan-500/10 rounded-full flex items-center justify-center">
            <Bell className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <CardTitle className="text-lg text-slate-900 dark:text-white">Notifications</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
              Control how you receive alerts
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {[
          { key: 'interventions' as const, label: 'Intervention Alerts', desc: 'Get notified when mindless scrolling is detected' },
          { key: 'weeklyReports' as const, label: 'Weekly Reports', desc: 'Receive weekly summaries of your progress' },
          { key: 'marketing' as const, label: 'Marketing Emails', desc: 'News and updates about MindBreaker' },
        ].map(({ key, label, desc }) => (
          <label key={key} className="flex items-start gap-3 pb-3 border-b border-slate-200 dark:border-slate-700 last:pb-0 last:border-b-0 cursor-pointer">
            <input
              type="checkbox"
              checked={notifications[key]}
              onChange={() => handleToggle(key)}
              className="w-4 h-4 rounded mt-1"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          </label>
        ))}
      </CardContent>
    </Card>
  )
}

// Security Settings Component
function SecuritySettingsCard() {
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-lg text-slate-900 dark:text-white">Security</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
              Keep your account secure
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Two-Factor Authentication</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Add an extra layer of security</p>
          </div>
          <Button size="sm" variant="outline" className="rounded-lg text-xs">
            Enable
          </Button>
        </div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Change Password</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Update your password regularly</p>
          </div>
          <Button size="sm" variant="outline" className="rounded-lg text-xs">
            Update
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Active Sessions</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Manage connected devices</p>
          </div>
          <Button size="sm" variant="outline" className="rounded-lg text-xs">
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Preference Settings Component
function PreferenceSettingsCard() {
  const [preferences, setPreferences] = useState({
    theme: 'dark' as 'light' | 'dark',
    sensitivity: 'normal' as 'low' | 'normal' | 'high',
  })

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center">
            <Settings className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-lg text-slate-900 dark:text-white">Preferences</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400 text-sm">
              Customize your experience
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
          <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">Intervention Sensitivity</label>
          <select
            value={preferences.sensitivity}
            onChange={(e) => setPreferences(prev => ({ ...prev, sensitivity: e.target.value as any }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
          >
            <option value="low">Low - Fewer alerts, more permissive</option>
            <option value="normal">Normal - Balanced detection</option>
            <option value="high">High - More alerts, stricter</option>
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Adjust how sensitive the system is to mindless scrolling patterns.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">Data Collection</label>
          <label className="flex items-center gap-3 pb-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Collect anonymized usage data for improvements</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
            <span className="text-sm text-slate-600 dark:text-slate-400">Allow performance analytics</span>
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
