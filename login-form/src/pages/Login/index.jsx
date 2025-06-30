"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "../../components/icons" // Import icons

// Mock user data
const users = [
  {
    id: "admin1",
    password: "admin123",
    role: "admin",
    name: "Admin User",
    email: "admin@example.com",
    status: "active",
  },
  { id: "user1", password: "user123", role: "user", name: "John Doe", email: "john@example.com", status: "active" },
  { id: "user2", password: "user456", role: "user", name: "Jane Smith", email: "jane@example.com", status: "inactive" },
]

function LoginPage() {
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()

    const user = users.find((u) => u.id === userId && u.password === password)

    if (!user) {
      setError("Invalid user ID or password")
      return
    }

    if (user.status === "inactive") {
      setError("Your account is inactive. Please contact admin.")
      return
    }

    // Store user info in localStorage
    localStorage.setItem("currentUser", JSON.stringify(user))

    // Redirect based on role
    if (user.role === "admin") {
      navigate("/admin/overview")
    } else {
      navigate("/user/watchlist")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="card w-full max-w-md">
        <div className="card-header">
          <h2 className="text-2xl font-bold text-center">Trading Platform</h2>
          <p className="text-center text-gray-500">Enter your credentials to sign in</p>
        </div>
        <div className="card-content">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="userId" className="label">
                User ID
              </label>
              <input
                id="userId"
                className="input"
                placeholder="Enter your user ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm font-medium text-red-500">{error}</p>}
            <button type="submit" className="btn btn-primary w-full">
              Sign In
            </button>
          </form>
        </div>
        <div className="card-footer flex flex-col">
          <p className="text-xs text-center text-gray-500 mt-2">
            For demo: Use "admin1/admin123" for admin access or "user1/user123" for user access
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
