"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Trash, RefreshCw, LogIn, AlertCircle } from "../../components/icons"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/Dialog"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../../components/ui/Select"
import ZerodhaService from "../../services/zerodhaService"

function AdminWatchlist() {
  const [mcxWatchlist, setMcxWatchlist] = useState([])
  const [nseWatchlist, setNseWatchlist] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddStockOpen, setIsAddStockOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)

  const [newStock, setNewStock] = useState({
    symbol: "",
    name: "",
    price: 0,
    change: 0,
    openPrice: 0,
    type: "mcx",
  })

  // Initialize default stocks
  const initializeStocks = useCallback(() => {
    const defaultMcxStocks = [
      { id: 1, symbol: "GOLD", name: "Gold", price: 0, change: 0, openPrice: 0, volume: 0 },
      { id: 2, symbol: "SILVER", name: "Silver", price: 0, change: 0, openPrice: 0, volume: 0 },
      { id: 3, symbol: "COPPER", name: "Copper", price: 0, change: 0, openPrice: 0, volume: 0 },
      { id: 4, symbol: "CRUDEOIL", name: "Crude Oil", price: 0, change: 0, openPrice: 0, volume: 0 },
      { id: 5, symbol: "NATURALGAS", name: "Natural Gas", price: 0, change: 0, openPrice: 0, volume: 0 },
    ]

    const defaultNseStocks = [
      { id: 1, symbol: "RELIANCE", name: "Reliance Industries", price: 0, change: 0, openPrice: 0, volume: 0 },
      { id: 2, symbol: "TCS", name: "Tata Consultancy Services", price: 0, change: 0, openPrice: 0, volume: 0 },
      { id: 3, symbol: "HDFCBANK", name: "HDFC Bank", price: 0, change: 0, openPrice: 0, volume: 0 },
      { id: 4, symbol: "INFY", name: "Infosys", price: 0, change: 0, openPrice: 0, volume: 0 },
      { id: 5, symbol: "ICICIBANK", name: "ICICI Bank", price: 0, change: 0, openPrice: 0, volume: 0 },
    ]

    setMcxWatchlist(defaultMcxStocks)
    setNseWatchlist(defaultNseStocks)
  }, [])

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const status = await ZerodhaService.checkAuthStatus()
      setAuthenticated(status.authenticated)
      return status.authenticated
    } catch (error) {
      console.error("Auth check failed:", error)
      setAuthenticated(false)
      return false
    }
  }, [])

  // Handle Zerodha login
  const handleLogin = async () => {
    setAuthLoading(true)
    setError(null)

    try {
      const loginUrl = await ZerodhaService.getLoginUrl()

      // Open login URL in a new window
      const loginWindow = window.open(loginUrl, "zerodha-login", "width=600,height=700")

      // Listen for the callback
      const checkClosed = setInterval(() => {
        if (loginWindow.closed) {
          clearInterval(checkClosed)
          // Prompt user for request token (in a real app, you'd handle this via callback URL)
          const requestToken = prompt("Please enter the request token from the callback URL:")
          if (requestToken) {
            handleCallback(requestToken)
          }
          setAuthLoading(false)
        }
      }, 1000)
    } catch (error) {
      console.error("Login failed:", error)
      setError(error.message)
      setAuthLoading(false)
    }
  }

  // Handle callback with request token
  const handleCallback = async (requestToken) => {
    try {
      await ZerodhaService.generateSession(requestToken)
      setAuthenticated(true)
      setError(null)
      // Start fetching data
      fetchLiveData()
    } catch (error) {
      console.error("Session generation failed:", error)
      setError(error.message)
    }
  }

  // Fetch live data from Zerodha via backend
  const fetchLiveData = useCallback(async () => {
    if (!authenticated) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const instrumentMapping = ZerodhaService.getInstrumentMapping()

      // Prepare instruments array for API call
      const allInstruments = [
        ...mcxWatchlist.map((stock) => instrumentMapping.mcx[stock.symbol]).filter(Boolean),
        ...nseWatchlist.map((stock) => instrumentMapping.nse[stock.symbol]).filter(Boolean),
      ]

      if (allInstruments.length === 0) {
        setLoading(false)
        return
      }

      // Fetch quotes from backend
      const quotes = await ZerodhaService.getQuotes(allInstruments)

      // Update MCX stocks with live data
      setMcxWatchlist((prevStocks) =>
        prevStocks.map((stock) => {
          const instrument = instrumentMapping.mcx[stock.symbol]
          const quote = quotes[instrument]

          if (quote) {
            const currentPrice = quote.last_price || quote.ltp || 0
            const openPrice = quote.ohlc?.open || 0
            const change = openPrice > 0 ? ((currentPrice - openPrice) / openPrice) * 100 : 0
            const volume = quote.volume || 0

            return {
              ...stock,
              price: currentPrice,
              openPrice: openPrice,
              change: change,
              volume: volume,
            }
          }
          return stock
        }),
      )

      // Update NSE stocks with live data
      setNseWatchlist((prevStocks) =>
        prevStocks.map((stock) => {
          const instrument = instrumentMapping.nse[stock.symbol]
          const quote = quotes[instrument]

          if (quote) {
            const currentPrice = quote.last_price || quote.ltp || 0
            const openPrice = quote.ohlc?.open || 0
            const change = openPrice > 0 ? ((currentPrice - openPrice) / openPrice) * 100 : 0
            const volume = quote.volume || 0

            return {
              ...stock,
              price: currentPrice,
              openPrice: openPrice,
              change: change,
              volume: volume,
            }
          }
          return stock
        }),
      )

      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error fetching live data:", err)
      setError(err.message || "Failed to fetch live data")

      // If authentication error, reset auth status
      if (err.message.includes("authenticated") || err.message.includes("401")) {
        setAuthenticated(false)
      }
    } finally {
      setLoading(false)
    }
  }, [authenticated, mcxWatchlist, nseWatchlist])

  // Initialize on component mount
  useEffect(() => {
    initializeStocks()
    checkAuth()
  }, [initializeStocks, checkAuth])

  // Set up auto-refresh every 10 seconds when authenticated
  useEffect(() => {
    if (!authenticated) return

    const interval = setInterval(() => {
      if (!loading) {
        fetchLiveData()
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [fetchLiveData, loading, authenticated])

  const filteredMcxStocks = mcxWatchlist.filter(
    (stock) =>
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredNseStocks = nseWatchlist.filter(
    (stock) =>
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddStock = () => {
    const id =
      newStock.type === "mcx"
        ? Math.max(...mcxWatchlist.map((s) => s.id), 0) + 1
        : Math.max(...nseWatchlist.map((s) => s.id), 0) + 1

    const stockToAdd = { ...newStock, id, volume: 0 }

    if (newStock.type === "mcx") {
      setMcxWatchlist([...mcxWatchlist, stockToAdd])
    } else {
      setNseWatchlist([...nseWatchlist, stockToAdd])
    }

    setNewStock({
      symbol: "",
      name: "",
      price: 0,
      change: 0,
      openPrice: 0,
      type: "mcx",
    })

    setIsAddStockOpen(false)
  }

  const handleDeleteStock = (id, type) => {
    if (type === "mcx") {
      setMcxWatchlist(mcxWatchlist.filter((stock) => stock.id !== id))
    } else {
      setNseWatchlist(nseWatchlist.filter((stock) => stock.id !== id))
    }
  }

  const formatCurrency = (price, type) => {
    return type === "mcx" ? `₹${price.toFixed(2)}` : `₹${price.toFixed(2)}`
  }

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`
    }
    return volume.toString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Watchlist Management</h1>
          <p className="text-gray-500">Manage stocks with live data from Zerodha</p>
          {lastUpdated && <p className="text-sm text-gray-400">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
        </div>
        <div className="flex gap-2">
          {!authenticated ? (
            <button className="btn btn-primary" onClick={handleLogin} disabled={authLoading}>
              <LogIn className="mr-2 h-4 w-4" />
              {authLoading ? "Connecting..." : "Login to Zerodha"}
            </button>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={fetchLiveData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
                <DialogTrigger asChild>
                  <button className="btn btn-primary">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Stock
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Stock</DialogTitle>
                    <DialogDescription>Add a new stock to the watchlist.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="type" className="label text-right">
                        Type
                      </label>
                      <Select
                        value={newStock.type}
                        onValueChange={(value) => setNewStock({ ...newStock, type: value })}
                      >
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcx">MCX</SelectItem>
                          <SelectItem value="nse">NSE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="symbol" className="label text-right">
                        Symbol
                      </label>
                      <input
                        id="symbol"
                        value={newStock.symbol}
                        onChange={(e) => setNewStock({ ...newStock, symbol: e.target.value })}
                        className="input col-span-3"
                        placeholder="e.g., GOLD, RELIANCE"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="name" className="label text-right">
                        Name
                      </label>
                      <input
                        id="name"
                        value={newStock.name}
                        onChange={(e) => setNewStock({ ...newStock, name: e.target.value })}
                        className="input col-span-3"
                        placeholder="Full company/commodity name"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <button type="button" className="btn btn-primary" onClick={handleAddStock}>
                      Add Stock
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          <div>
            <strong>Error:</strong> {error}
            {!authenticated && <p className="text-sm mt-1">Please login to Zerodha to fetch live data.</p>}
          </div>
        </div>
      )}

      {!authenticated && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>
            <strong>Note:</strong> You need to login to Zerodha to see live market data. Click the "Login to Zerodha"
            button above.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <input
            placeholder="Search stocks by name or symbol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input max-w-sm"
          />
        </div>

        <Tabs defaultValue="mcx" className="w-full">
          <TabsList>
            <TabsTrigger value="mcx">MCX Commodities</TabsTrigger>
            <TabsTrigger value="nse">NSE Stocks</TabsTrigger>
          </TabsList>
          <TabsContent value="mcx">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">MCX Commodities - Live Data</h3>
                <p className="card-description">Live commodities prices from MCX</p>
              </div>
              <div className="card-content">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th>Opening Price</th>
                        <th>Current Price</th>
                        <th>Change</th>
                        <th>Volume</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMcxStocks.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center">
                            No stocks found
                          </td>
                        </tr>
                      ) : (
                        filteredMcxStocks.map((stock) => (
                          <tr key={stock.id}>
                            <td className="font-medium">{stock.symbol}</td>
                            <td>{stock.name}</td>
                            <td>{formatCurrency(stock.openPrice, "mcx")}</td>
                            <td className="font-semibold">{formatCurrency(stock.price, "mcx")}</td>
                            <td className={stock.change >= 0 ? "text-emerald-500" : "text-red-500"}>
                              {stock.change >= 0 ? "+" : ""}
                              {stock.change.toFixed(2)}%
                            </td>
                            <td>{formatVolume(stock.volume)}</td>
                            <td>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleDeleteStock(stock.id, "mcx")}
                              >
                                <Trash className="h-4 w-4" />
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
          <TabsContent value="nse">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">NSE Stocks - Live Data</h3>
                <p className="card-description">Live stock market prices from NSE</p>
              </div>
              <div className="card-content">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Symbol</th>
                        <th>Name</th>
                        <th>Opening Price</th>
                        <th>Current Price</th>
                        <th>Change</th>
                        <th>Volume</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredNseStocks.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center">
                            No stocks found
                          </td>
                        </tr>
                      ) : (
                        filteredNseStocks.map((stock) => (
                          <tr key={stock.id}>
                            <td className="font-medium">{stock.symbol}</td>
                            <td>{stock.name}</td>
                            <td>{formatCurrency(stock.openPrice, "nse")}</td>
                            <td className="font-semibold">{formatCurrency(stock.price, "nse")}</td>
                            <td className={stock.change >= 0 ? "text-emerald-500" : "text-red-500"}>
                              {stock.change >= 0 ? "+" : ""}
                              {stock.change.toFixed(2)}%
                            </td>
                            <td>{formatVolume(stock.volume)}</td>
                            <td>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleDeleteStock(stock.id, "nse")}
                              >
                                <Trash className="h-4 w-4" />
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
        </tabs>
      </div>
    </div>
  )
}

export default AdminWatchlist
