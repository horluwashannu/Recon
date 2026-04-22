"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase"

// 🧩 UI Components
import { Sidebar } from "@/components/sidebar"
import { TopBar } from "@/components/top-bar"
import { AnimatedBackground } from "@/components/animated-background"
import { WelcomeModal } from "@/components/welcome-modal"

// 🧮 Modules
import { SmartReconciliation } from "@/components/modules/smart-reconciliation"
import { SystemSettings } from "@/components/modules/system-settings"
import { AdminManagement } from "@/components/modules/admin-management"


export default function DashboardPage() {
  const [activeModule, setActiveModule] = useState("smart-reconciliation")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [userRole, setUserRole] = useState<"admin" | "user">("user")
  const [darkMode, setDarkMode] = useState(true)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  // 🔐 Authentication & Role Setup
  useEffect(() => {
    async function checkAuth() {
      if (!isSupabaseConfigured()) {
        console.log("[SmartBank] Supabase not configured — auto-login as admin for setup.")
        setUserRole("admin")
        setUserId("demo-admin-setup")
        setActiveModule("admin-management")
        setLoading(false)
        return
      }

      const supabase = getSupabase()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setUserId(user.id)

      const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()

      if (error) console.error("[SmartBank] Error fetching user role:", error)
      else if (userData) setUserRole(userData.role as "admin" | "user")

      setLoading(false)
    }

    checkAuth()
  }, [router])

  // 🎛 Module Rendering
  const renderModule = () => {
    switch (activeModule) {
      case "smart-reconciliation":
        return <SmartReconciliation userId={userId} />
      case "system-settings":
        return <SystemSettings />
      case "admin-management":
        return <AdminManagement />
      default:
        return <SmartReconciliation userId={userId} />
    }
  }

  // 🧱 Layout
  return (
    <div className={`relative flex h-screen overflow-hidden ${darkMode ? "dark" : ""}`}>
      <AnimatedBackground darkMode={darkMode} />
      <WelcomeModal />

      <Sidebar
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        userRole={userRole}
      />

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <TopBar
          userRole={userRole}
          setUserRole={setUserRole}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        <main className="flex-1 overflow-y-auto p-6">{renderModule()}</main>
      </div>
    </div>
  )
}
