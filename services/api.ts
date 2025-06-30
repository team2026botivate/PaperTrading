const API_BASE_URL = "http://localhost:30021/api"

class ApiService {
  private accessToken: string | null = null

  setAccessToken(token: string) {
    this.accessToken = token
    localStorage.setItem("zerodha_access_token", token)
  }

  getAccessToken() {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem("zerodha_access_token")
    }
    return this.accessToken
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    const token = this.getAccessToken()
    if (token && config.headers) {
      ;(config.headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Authentication methods
  async getLoginUrl() {
    return this.request("/auth/login-url")
  }

  async generateSession(requestToken: string) {
    return this.request("/auth/session", {
      method: "POST",
      body: JSON.stringify({ request_token: requestToken }),
    })
  }

  async getAuthStatus() {
    return this.request("/auth/status")
  }

  async getProfile() {
    return this.request("/profile")
  }

  // Market data methods
  async getQuotes(instruments: string[]) {
    return this.request("/quotes", {
      method: "POST",
      body: JSON.stringify({ instruments }),
    })
  }

  async getLTP(instruments: string[]) {
    return this.request("/ltp", {
      method: "POST",
      body: JSON.stringify({ instruments }),
    })
  }

  async getInstruments(exchange?: string) {
    const endpoint = exchange ? `/instruments/${exchange}` : "/instruments"
    return this.request(endpoint)
  }

  // Health check
  async healthCheck() {
    return this.request("/health")
  }
}

export default new ApiService()
