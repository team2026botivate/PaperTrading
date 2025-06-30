import { Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/Login"
import AdminLayout from "./layouts/AdminLayout"
import UserLayout from "./layouts/UserLayout"

// Admin Pages
import AdminOverview from "./pages/admin/Overview"
import AdminUsers from "./pages/admin/Users"
import AdminWatchlist from "./pages/admin/Watchlist"
import AdminTrades from "./pages/admin/Trades"
import AdminTransactions from "./pages/admin/Transactions"
import AdminSettings from "./pages/admin/Settings"

// User Pages
import UserWatchlist from "./pages/user/Watchlist"
import UserTrades from "./pages/user/Trades"
import UserPortfolio from "./pages/user/Portfolio"
import UserTransactions from "./pages/user/Transactions"
import UserSettings from "./pages/user/Settings"

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/overview" replace />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="watchlist" element={<AdminWatchlist />} />
        <Route path="trades" element={<AdminTrades />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* User Routes */}
      <Route path="/user" element={<UserLayout />}>
        <Route index element={<Navigate to="/user/watchlist" replace />} />
        <Route path="watchlist" element={<UserWatchlist />} />
        <Route path="trades" element={<UserTrades />} />
        <Route path="portfolio" element={<UserPortfolio />} />
        <Route path="transactions" element={<UserTransactions />} />
        <Route path="settings" element={<UserSettings />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
