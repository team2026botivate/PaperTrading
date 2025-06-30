import ApiService from "./api"

// Updated instrument mapping with actual Zerodha instrument tokens
const INSTRUMENT_MAPPING = {
  nse: {
    RELIANCE: "NSE:RELIANCE",
    TCS: "NSE:TCS",
    HDFCBANK: "NSE:HDFCBANK",
    INFY: "NSE:INFY",
    ICICIBANK: "NSE:ICICIBANK",
    WIPRO: "NSE:WIPRO",
    LT: "NSE:LT",
    SBIN: "NSE:SBIN",
    ITC: "NSE:ITC",
    BHARTIARTL: "NSE:BHARTIARTL",
  },
  mcx: {
    GOLD: "MCX:GOLD24",
    SILVER: "MCX:SILVER24",
    COPPER: "MCX:COPPER24",
    CRUDEOIL: "MCX:CRUDEOIL24",
    NATURALGAS: "MCX:NATURALGAS24",
    ZINC: "MCX:ZINC24",
    LEAD: "MCX:LEAD24",
    NICKEL: "MCX:NICKEL24",
  },
}

class ZerodhaService {
  constructor() {
    this.authenticated = false
    this.accessToken = null
    this.checkAuthStatus()
  }

  async checkAuthStatus() {
    try {
      const status = await ApiService.getAuthStatus()
      this.authenticated = status.authenticated
      return status
    } catch (error) {
      console.error("Auth status check failed:", error)
      this.authenticated = false
      return { authenticated: false }
    }
  }

  async getLoginUrl() {
    try {
      const response = await ApiService.getLoginUrl()
      return response.loginUrl
    } catch (error) {
      console.error("Failed to get login URL:", error)
      throw error
    }
  }

  async generateSession(requestToken) {
    try {
      const response = await ApiService.generateSession(requestToken)
      this.accessToken = response.access_token
      this.authenticated = true
      return response
    } catch (error) {
      console.error("Session generation failed:", error)
      throw error
    }
  }

  async getQuotes(instruments) {
    if (!this.authenticated) {
      throw new Error("Not authenticated. Please login first.")
    }

    try {
      return await ApiService.getQuotes(instruments)
    } catch (error) {
      if (error.message.includes("401")) {
        this.authenticated = false
      }
      throw error
    }
  }

  async getLTP(instruments) {
    if (!this.authenticated) {
      throw new Error("Not authenticated. Please login first.")
    }

    try {
      return await ApiService.getLTP(instruments)
    } catch (error) {
      if (error.message.includes("401")) {
        this.authenticated = false
      }
      throw error
    }
  }

  async getInstruments(exchange = null) {
    if (!this.authenticated) {
      throw new Error("Not authenticated. Please login first.")
    }

    try {
      return await ApiService.getInstruments(exchange)
    } catch (error) {
      if (error.message.includes("401")) {
        this.authenticated = false
      }
      throw error
    }
  }

  getInstrumentMapping() {
    return INSTRUMENT_MAPPING
  }

  isAuthenticated() {
    return this.authenticated
  }
}

export default new ZerodhaService()
