"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Search } from "../../components/icons"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../../components/ui/Select"

// Mock trade data
const trades = [
  {
    id: 1,
    userId: "user1",
    userName: "John Doe",
    shareName: "RELIANCE",
    type: "BUY",
    quantity: 10,
    entryPrice: 2550.75,
    exitPrice: 2567.8,
    status: "CLOSED",
    pnl: 170.5,
    buyingDate: "2023-04-15 10:30:45",
    sellingDate: "2023-04-16 14:20:30",
  },
  {
    id: 2,
    userId: "user2",
    userName: "Jane Smith",
    shareName: "TCS",
    type: "SELL",
    quantity: 5,
    entryPrice: 3470.25,
    exitPrice: 3456.7,
    status: "CLOSED",
    pnl: 67.75,
    buyingDate: "2023-04-16 09:45:12",
    sellingDate: "2023-04-17 11:30:20",
  },
  {
    id: 3,
    userId: "user1",
    userName: "John Doe",
    shareName: "GOLD",
    type: "BUY",
    quantity: 2,
    entryPrice: 2330.5,
    exitPrice: null,
    status: "ACTIVE",
    pnl: 30.34,
    buyingDate: "2023-04-18 13:15:30",
    sellingDate: null,
  },
  {
    id: 4,
    userId: "user3",
    userName: "Mike Johnson",
    shareName: "SILVER",
    type: "SELL",
    quantity: 15,
    entryPrice: 29.75,
    exitPrice: 28.92,
    status: "CLOSED",
    pnl: 12.45,
    buyingDate: "2023-04-17 10:20:15",
    sellingDate: "2023-04-19 15:45:30",
  },
  {
    id: 5,
    userId: "user2",
    userName: "Jane Smith",
    shareName: "HDFCBANK",
    type: "BUY",
    quantity: 8,
    entryPrice: 1670.25,
    exitPrice: null,
    status: "ACTIVE",
    pnl: 69.2,
    buyingDate: "2023-04-19 11:30:45",
    sellingDate: null,
  },
]

function AdminTrades() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredTrades = trades.filter((trade) => {
    const matchesSearch =
      trade.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.shareName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || trade.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesType = typeFilter === "all" || trade.type.toLowerCase() === typeFilter.toLowerCase()

    return matchesSearch && matchesStatus && matchesType
  })

  const activeTrades = trades.filter((trade) => trade.status === "ACTIVE")
  const closedTrades = trades.filter((trade) => trade.status === "CLOSED")

  const totalProfit = closedTrades.reduce((sum, trade) => sum + (trade.pnl > 0 ? trade.pnl : 0), 0)
  const totalLoss = closedTrades.reduce((sum, trade) => sum + (trade.pnl < 0 ? Math.abs(trade.pnl) : 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trade Management</h1>
        <p className="text-gray-500">Monitor and manage user trading activities</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="card-title text-sm font-medium">Total Trades</h3>
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold">{trades.length}</div>
            <p className="text-xs text-gray-500">All time</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="card-title text-sm font-medium">Active Trades</h3>
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold">{activeTrades.length}</div>
            <p className="text-xs text-gray-500">Currently open positions</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="card-title text-sm font-medium">Total Profit</h3>
            <ArrowUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold text-emerald-500">${totalProfit.toFixed(2)}</div>
            <p className="text-xs text-gray-500">From closed trades</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="card-title text-sm font-medium">Total Loss</h3>
            <ArrowDown className="h-4 w-4 text-red-500" />
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold text-red-500">${totalLoss.toFixed(2)}</div>
            <p className="text-xs text-gray-500">From closed trades</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              placeholder="Search by user or stock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full sm:w-[250px]"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buy">Buy</SelectItem>
                <SelectItem value="sell">Sell</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Serial No.</th>
                <th>User ID</th>
                <th>User Name</th>
                <th>Share Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>Status</th>
                <th>P&L</th>
                <th>Buying Date/Time</th>
                <th>Selling Date/Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center">
                    No trades found
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade, index) => (
                  <tr key={trade.id}>
                    <td>{index + 1}</td>
                    <td>{trade.userId}</td>
                    <td className="font-medium">{trade.userName}</td>
                    <td>{trade.shareName}</td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trade.type === "BUY" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {trade.type}
                      </span>
                    </td>
                    <td>{trade.quantity}</td>
                    <td>${trade.entryPrice.toFixed(2)}</td>
                    <td>{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "-"}</td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          trade.status === "ACTIVE" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {trade.status}
                      </span>
                    </td>
                    <td className={trade.pnl >= 0 ? "text-emerald-500" : "text-red-500"}>
                      {trade.pnl >= 0 ? "+" : ""}
                      {trade.pnl.toFixed(2)}
                    </td>
                    <td>{trade.buyingDate}</td>
                    <td>{trade.sellingDate || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminTrades
