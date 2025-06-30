"use client"

import { useState } from "react"
import { ArrowDown, ArrowUp, Search } from "../../components/icons"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../../components/ui/Select"

// Mock trade data
const trades = [
  {
    id: 1,
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
    shareName: "SILVER",
    type: "SELL",
    quantity: 15,
    entryPrice: 29.75,
    exitPrice: null,
    status: "PENDING",
    pnl: 0,
    buyingDate: "2023-04-19 09:30:00",
    sellingDate: null,
  },
  {
    id: 5,
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

function UserTrades() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const pendingTrades = trades.filter((trade) => trade.status === "PENDING")
  const activeTrades = trades.filter((trade) => trade.status === "ACTIVE")
  const closedTrades = trades.filter((trade) => trade.status === "CLOSED")

  const filteredTrades = (status) => {
    return trades
      .filter((trade) => trade.status === status)
      .filter((trade) => {
        const matchesSearch = trade.shareName.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = typeFilter === "all" || trade.type.toLowerCase() === typeFilter.toLowerCase()
        return matchesSearch && matchesType
      })
  }

  const totalProfit = trades.reduce((sum, trade) => sum + (trade.pnl > 0 ? trade.pnl : 0), 0)
  const totalLoss = trades.reduce((sum, trade) => sum + (trade.pnl < 0 ? Math.abs(trade.pnl) : 0), 0)
  const netPnL = totalProfit - totalLoss

  const handleClosePosition = (id) => {
    // In a real app, this would close the position
    console.log(`Close position for trade ${id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trades</h1>
        <p className="text-gray-500">Manage your trading positions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="card-title text-sm font-medium">Active Positions</h3>
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold">{activeTrades.length}</div>
            <p className="text-xs text-gray-500">Open trades</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="card-title text-sm font-medium">Pending Orders</h3>
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold">{pendingTrades.length}</div>
            <p className="text-xs text-gray-500">Awaiting execution</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="card-title text-sm font-medium">Total Profit</h3>
            <ArrowUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="card-content">
            <div className="text-2xl font-bold text-emerald-500">${totalProfit.toFixed(2)}</div>
            <p className="text-xs text-gray-500">From all trades</p>
          </div>
        </div>
        <div className="card">
          <div className="card-header flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="card-title text-sm font-medium">Net P&L</h3>
            {netPnL >= 0 ? (
              <ArrowUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="card-content">
            <div className={`text-2xl font-bold ${netPnL >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              ${Math.abs(netPnL).toFixed(2)}
            </div>
            <p className="text-xs text-gray-500">Overall performance</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              placeholder="Search by stock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full sm:w-[250px]"
            />
          </div>
          <div className="flex gap-2">
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

        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">Active Trades</TabsTrigger>
            <TabsTrigger value="pending">Pending Orders</TabsTrigger>
            <TabsTrigger value="closed">Closed Trades</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Active Trades</h3>
                <p className="card-description">Your currently open trading positions</p>
              </div>
              <div className="card-content">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Stock</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Entry Price</th>
                        <th>Current P&L</th>
                        <th>Entry Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades("ACTIVE").length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center">
                            No active trades found
                          </td>
                        </tr>
                      ) : (
                        filteredTrades("ACTIVE").map((trade) => (
                          <tr key={trade.id}>
                            <td className="font-medium">{trade.shareName}</td>
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
                            <td className={trade.pnl >= 0 ? "text-emerald-500" : "text-red-500"}>
                              {trade.pnl >= 0 ? "+" : ""}
                              {trade.pnl.toFixed(2)}
                            </td>
                            <td>{trade.buyingDate}</td>
                            <td>
                              <button
                                className="btn btn-outline btn-sm h-8 text-xs"
                                onClick={() => handleClosePosition(trade.id)}
                              >
                                Close Position
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="pending">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Pending Orders</h3>
                <p className="card-description">Orders waiting to be executed</p>
              </div>
              <div className="card-content">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Stock</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Order Price</th>
                        <th>Order Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades("PENDING").length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center">
                            No pending orders found
                          </td>
                        </tr>
                      ) : (
                        filteredTrades("PENDING").map((trade) => (
                          <tr key={trade.id}>
                            <td className="font-medium">{trade.shareName}</td>
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
                            <td>{trade.buyingDate}</td>
                            <td>
                              <button className="btn btn-outline btn-sm h-8 text-xs text-red-500 border-red-200 hover:bg-red-50">
                                Cancel Order
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="closed">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Closed Trades</h3>
                <p className="card-description">Your trading history</p>
              </div>
              <div className="card-content">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Stock</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Entry Price</th>
                        <th>Exit Price</th>
                        <th>P&L</th>
                        <th>Entry Date</th>
                        <th>Exit Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTrades("CLOSED").length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center">
                            No closed trades found
                          </td>
                        </tr>
                      ) : (
                        filteredTrades("CLOSED").map((trade) => (
                          <tr key={trade.id}>
                            <td className="font-medium">{trade.shareName}</td>
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
                            <td>${trade.exitPrice?.toFixed(2)}</td>
                            <td className={trade.pnl >= 0 ? "text-emerald-500" : "text-red-500"}>
                              {trade.pnl >= 0 ? "+" : ""}
                              {trade.pnl.toFixed(2)}
                            </td>
                            <td>{trade.buyingDate}</td>
                            <td>{trade.sellingDate}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default UserTrades
