"use client"

import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Activity,
  BarChart3,
  CreditCard,
  DollarSign,
  Eye,
  LineChart,
  LogOut,
  Settings,
  Users,
} from "../components/icons"

function DashboardLayout({ children }) {
  const [user, setUser] = useState(null)
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("currentUser")
    if (!storedUser) {
      navigate("/")
      return
    }

    const userData = JSON.parse(storedUser)
    setUser(userData)

    // Redirect if accessing wrong role's pages
    if (userData.role === "admin" && pathname.startsWith("/user")) {
      navigate("/admin/overview")
    } else if (userData.role === "user" && pathname.startsWith("/admin")) {
      navigate("/user/watchlist")
    }
  }, [pathname, navigate])

  const handleLogout = () => {
    localStorage.removeItem("currentUser")
    navigate("/")
  }

  const adminMenuItems = [
    { title: "Overview", icon: BarChart3, path: "/admin/overview" },
    { title: "User Management", icon: Users, path: "/admin/users" },
    { title: "Watchlist Management", icon: Eye, path: "/admin/watchlist" },
    { title: "Trade Management", icon: LineChart, path: "/admin/trades" },
    { title: "Deposit/Withdraw", icon: DollarSign, path: "/admin/transactions" },
    { title: "Settings", icon: Settings, path: "/admin/settings" },
  ]

  const userMenuItems = [
    { title: "Watchlist", icon: Eye, path: "/user/watchlist" },
    { title: "Trades", icon: Activity, path: "/user/trades" },
    { title: "Portfolio", icon: LineChart, path: "/user/portfolio" },
    { title: "Deposit/Withdraw", icon: CreditCard, path: "/user/transactions" },
    { title: "Settings", icon: Settings, path: "/user/settings" },
  ]

  const menuItems = user?.role === "admin" ? adminMenuItems : userMenuItems

  if (!user) return null

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={`sidebar min-h-screen ${isSidebarOpen ? "w-64" : "w-20"} transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0)}
            </div>
            {isSidebarOpen && (
              <div className="flex flex-col">
                <span className="font-medium">{user.name}</span>
                <span className="text-xs text-gray-500 capitalize">{user.role}</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Menu */}
        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.title}>
                <a
                  href={item.path}
                  className={`flex items-center rounded-md px-3 py-2 text-sm ${
                    pathname === item.path ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {isSidebarOpen && <span>{item.title}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="mt-auto border-t p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5 mr-3" />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>

        {/* Sidebar Toggle */}
        <button
          className="absolute top-4 right-0 translate-x-1/2 bg-white rounded-full border shadow-sm p-1"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${isSidebarOpen ? "rotate-0" : "rotate-180"}`}
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default DashboardLayout
