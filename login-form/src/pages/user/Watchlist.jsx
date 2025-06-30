"use client"

import { useState } from "react"
import { Plus, Search, Trash } from "../../components/icons"
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

// Mock stock data
const availableMcxStocks = [
  { id: 1, symbol: "GOLD", name: "Gold", price: 2345.67, change: 12.5, openPrice: 2333.17 },
  { id: 2, symbol: "SILVER", name: "Silver", price: 28.92, change: -0.45, openPrice: 29.37 },
  { id: 3, symbol: "COPPER", name: "Copper", price: 4.56, change: 0.23, openPrice: 4.33 },
  { id: 4, symbol: "CRUDEOIL", name: "Crude Oil", price: 78.45, change: -1.2, openPrice: 79.65 },
  { id: 5, symbol: "NATURALGAS", name: "Natural Gas", price: 2.34, change: 0.05, openPrice: 2.29 },
]

const availableNseStocks = [
  { id: 1, symbol: "RELIANCE", name: "Reliance Industries", price: 2567.8, change: 23.45, openPrice: 2544.35 },
  { id: 2, symbol: "TCS", name: "Tata Consultancy Services", price: 3456.7, change: -12.3, openPrice: 3469.0 },
  { id: 3, symbol: "HDFCBANK", name: "HDFC Bank", price: 1678.9, change: 5.6, openPrice: 1673.3 },
  { id: 4, symbol: "INFY", name: "Infosys", price: 1456.78, change: -8.9, openPrice: 1465.68 },
  { id: 5, symbol: "ICICIBANK", name: "ICICI Bank", price: 945.67, change: 3.45, openPrice: 942.22 },
]

function UserWatchlist() {
  const [mcxWatchlist, setMcxWatchlist] = useState([])
  const [nseWatchlist, setNseWatchlist] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddStockOpen, setIsAddStockOpen] = useState(false)
  const [selectedType, setSelectedType] = useState("mcx")
  const [selectedStock, setSelectedStock] = useState("")

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

  const availableStocksForSelection =
    selectedType === "mcx"
      ? availableMcxStocks.filter((s) => !mcxWatchlist.some((w) => w.id === s.id))
      : availableNseStocks.filter((s) => !nseWatchlist.some((w) => w.id === s.id))

  const handleAddStock = () => {
    if (!selectedStock) return

    const stockId = Number.parseInt(selectedStock)
    const stockToAdd =
      selectedType === "mcx"
        ? availableMcxStocks.find((s) => s.id === stockId)
        : availableNseStocks.find((s) => s.id === stockId)

    if (!stockToAdd) return

    if (selectedType === "mcx") {
      setMcxWatchlist([...mcxWatchlist, stockToAdd])
    } else {
      setNseWatchlist([...nseWatchlist, stockToAdd])
    }

    setSelectedStock("")
    setIsAddStockOpen(false)
  }

  const handleRemoveStock = (id, type) => {
    if (type === "mcx") {
      setMcxWatchlist(mcxWatchlist.filter((stock) => stock.id !== id))
    } else {
      setNseWatchlist(nseWatchlist.filter((stock) => stock.id !== id))
    }
  }

  const handleBuySell = (stock) => {
    // In a real app, this would open a buy/sell dialog
    console.log(`Buy/Sell ${stock.symbol}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Watchlist</h1>
          <p className="text-gray-500">Monitor stocks and make trades</p>
        </div>
        <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
          <DialogTrigger asChild>
            <button className="btn btn-primary">
              <Plus className="mr-2 h-4 w-4" />
              Add to Watchlist
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add to Watchlist</DialogTitle>
              <DialogDescription>Add a stock to your watchlist to track its performance.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="type" className="label text-right">
                  Market Type
                </label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => {
                    setSelectedType(value)
                    setSelectedStock("")
                  }}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcx">MCX Future</SelectItem>
                    <SelectItem value="nse">NSE Future</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="stock" className="label text-right">
                  Stock
                </label>
                <Select value={selectedStock} onValueChange={setSelectedStock}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStocksForSelection.map((stock) => (
                      <SelectItem key={stock.id} value={stock.id.toString()}>
                        {stock.symbol} - {stock.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <button type="button" className="btn btn-primary" onClick={handleAddStock}>
                Add to Watchlist
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

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
            <TabsTrigger value="mcx">MCX Future</TabsTrigger>
            <TabsTrigger value="nse">NSE Future</TabsTrigger>
          </TabsList>
          <TabsContent value="mcx">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">MCX Future Stocks</h3>
                <p className="card-description">Commodities and futures in your watchlist</p>
              </div>
              <div className="card-content">
                {mcxWatchlist.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No stocks in your watchlist</p>
                    <button className="btn btn-outline mt-4" onClick={() => setIsAddStockOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Stocks
                    </button>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Name</th>
                          <th>Opening Price</th>
                          <th>Current Price</th>
                          <th>Change</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMcxStocks.map((stock) => (
                          <tr key={stock.id}>
                            <td className="font-medium">{stock.symbol}</td>
                            <td>{stock.name}</td>
                            <td>${stock.openPrice.toFixed(2)}</td>
                            <td>${stock.price.toFixed(2)}</td>
                            <td className={stock.change >= 0 ? "text-emerald-500" : "text-red-500"}>
                              {stock.change >= 0 ? "+" : ""}
                              {stock.change.toFixed(2)}%
                            </td>
                            <td>
                              <div className="flex space-x-2">
                                <button
                                  className="btn btn-outline btn-sm h-8 text-xs"
                                  onClick={() => handleBuySell(stock)}
                                >
                                  Trade
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleRemoveStock(stock.id, "mcx")}
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="nse">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">NSE Future Stocks</h3>
                <p className="card-description">Stock market futures in your watchlist</p>
              </div>
              <div className="card-content">
                {nseWatchlist.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No stocks in your watchlist</p>
                    <button className="btn btn-outline mt-4" onClick={() => setIsAddStockOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Stocks
                    </button>
                  </div>
                ) : (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Symbol</th>
                          <th>Name</th>
                          <th>Opening Price</th>
                          <th>Current Price</th>
                          <th>Change</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredNseStocks.map((stock) => (
                          <tr key={stock.id}>
                            <td className="font-medium">{stock.symbol}</td>
                            <td>{stock.name}</td>
                            <td>₹{stock.openPrice.toFixed(2)}</td>
                            <td>₹{stock.price.toFixed(2)}</td>
                            <td className={stock.change >= 0 ? "text-emerald-500" : "text-red-500"}>
                              {stock.change >= 0 ? "+" : ""}
                              {stock.change.toFixed(2)}%
                            </td>
                            <td>
                              <div className="flex space-x-2">
                                <button
                                  className="btn btn-outline btn-sm h-8 text-xs"
                                  onClick={() => handleBuySell(stock)}
                                >
                                  Trade
                                </button>
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleRemoveStock(stock.id, "nse")}
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default UserWatchlist
