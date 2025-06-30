const express = require("express");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
const fs = require('fs');
require("dotenv").config();
const { findAvailablePort } = require("./utils/portHandler");

const app = express()
const PORT = 3000
const cookieParser = require('cookie-parser');

// Cache for OHLC data (5 minutes)
const ohlcCache = new Map();
const OHLC_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for quote data (30 seconds)
const quoteCache = new Map();
const QUOTE_CACHE_DURATION = 30 * 1000; // 30 seconds


// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Zerodha API configuration
const ZERODHA_API_KEY = process.env.ZERODHA_API_KEY || "2uvuc0xnk4tn8nrg";
const ZERODHA_API_SECRET = process.env.ZERODHA_API_SECRET || "gt57ia1a1ypo69zk2e1xzhp2s09kxexv";
const ZERODHA_BASE_URL = "https://api.kite.trade";

// Global variables
let accessToken = null;
let userProfile = null;

// JSON instruments configuration
const INSTRUMENTS_JSON_PATH = path.join(__dirname, 'data', 'instruments.json');
let jsonInstrumentsCache = [];
let jsonCacheMetadata = null;

// Fallback instruments (if JSON not available)
const fallbackInstruments = [
  // Popular NSE stocks
  { key: "NSE:RELIANCE", tradingsymbol: "RELIANCE", name: "Reliance Industries Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "RELIANCE - Reliance Industries Limited", exchange_display: "NSE" },
  { key: "NSE:TCS", tradingsymbol: "TCS", name: "Tata Consultancy Services Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "TCS - Tata Consultancy Services Limited", exchange_display: "NSE" },
  { key: "NSE:HDFCBANK", tradingsymbol: "HDFCBANK", name: "HDFC Bank Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "HDFCBANK - HDFC Bank Limited", exchange_display: "NSE" },
  { key: "NSE:INFY", tradingsymbol: "INFY", name: "Infosys Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "INFY - Infosys Limited", exchange_display: "NSE" },
  { key: "NSE:ICICIBANK", tradingsymbol: "ICICIBANK", name: "ICICI Bank Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "ICICIBANK - ICICI Bank Limited", exchange_display: "NSE" },
  { key: "NSE:SBIN", tradingsymbol: "SBIN", name: "State Bank of India", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "SBIN - State Bank of India", exchange_display: "NSE" },
  { key: "NSE:SBICARD", tradingsymbol: "SBICARD", name: "SBI Cards and Payment Services Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "SBICARD - SBI Cards and Payment Services Limited", exchange_display: "NSE" },
  { key: "NSE:SBILIFE", tradingsymbol: "SBILIFE", name: "SBI Life Insurance Company Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "SBILIFE - SBI Life Insurance Company Limited", exchange_display: "NSE" },
  { key: "NSE:BHARTIARTL", tradingsymbol: "BHARTIARTL", name: "Bharti Airtel Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "BHARTIARTL - Bharti Airtel Limited", exchange_display: "NSE" },
  { key: "NSE:KOTAKBANK", tradingsymbol: "KOTAKBANK", name: "Kotak Mahindra Bank Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "KOTAKBANK - Kotak Mahindra Bank Limited", exchange_display: "NSE" },
  { key: "NSE:LT", tradingsymbol: "LT", name: "Larsen & Toubro Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "LT - Larsen & Toubro Limited", exchange_display: "NSE" },
  { key: "NSE:ASIANPAINT", tradingsymbol: "ASIANPAINT", name: "Asian Paints Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "ASIANPAINT - Asian Paints Limited", exchange_display: "NSE" },
  { key: "NSE:MARUTI", tradingsymbol: "MARUTI", name: "Maruti Suzuki India Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "MARUTI - Maruti Suzuki India Limited", exchange_display: "NSE" },
  { key: "NSE:TITAN", tradingsymbol: "TITAN", name: "Titan Company Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "TITAN - Titan Company Limited", exchange_display: "NSE" },
  { key: "NSE:NESTLEIND", tradingsymbol: "NESTLEIND", name: "Nestle India Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "NESTLEIND - Nestle India Limited", exchange_display: "NSE" },
  { key: "NSE:WIPRO", tradingsymbol: "WIPRO", name: "Wipro Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "WIPRO - Wipro Limited", exchange_display: "NSE" },
  { key: "NSE:ULTRACEMCO", tradingsymbol: "ULTRACEMCO", name: "UltraTech Cement Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "ULTRACEMCO - UltraTech Cement Limited", exchange_display: "NSE" },
  { key: "NSE:ONGC", tradingsymbol: "ONGC", name: "Oil & Natural Gas Corporation Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "ONGC - Oil & Natural Gas Corporation Limited", exchange_display: "NSE" },
  { key: "NSE:TECHM", tradingsymbol: "TECHM", name: "Tech Mahindra Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "TECHM - Tech Mahindra Limited", exchange_display: "NSE" },
  { key: "NSE:SUNPHARMA", tradingsymbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries Limited", exchange: "NSE", instrument_type: "EQ", segment: "EQ", display_name: "SUNPHARMA - Sun Pharmaceutical Industries Limited", exchange_display: "NSE" },
  
  // MCX Commodities
  { key: "MCX:GOLD", tradingsymbol: "GOLD", name: "Gold", exchange: "MCX", instrument_type: "FUT", segment: "COM", display_name: "GOLD - Gold Futures", exchange_display: "MCX" },
  { key: "MCX:GOLDM", tradingsymbol: "GOLDM", name: "Gold Mini", exchange: "MCX", instrument_type: "FUT", segment: "COM", display_name: "GOLDM - Gold Mini Futures", exchange_display: "MCX" },
  { key: "MCX:SILVER", tradingsymbol: "SILVER", name: "Silver", exchange: "MCX", instrument_type: "FUT", segment: "COM", display_name: "SILVER - Silver Futures", exchange_display: "MCX" },
  { key: "MCX:SILVERM", tradingsymbol: "SILVERM", name: "Silver Mini", exchange: "MCX", instrument_type: "FUT", segment: "COM", display_name: "SILVERM - Silver Mini Futures", exchange_display: "MCX" },
  { key: "MCX:CRUDE", tradingsymbol: "CRUDE", name: "Crude Oil", exchange: "MCX", instrument_type: "FUT", segment: "COM", display_name: "CRUDE - Crude Oil Futures", exchange_display: "MCX" },
  { key: "MCX:NATURALGAS", tradingsymbol: "NATURALGAS", name: "Natural Gas", exchange: "MCX", instrument_type: "FUT", segment: "COM", display_name: "NATURALGAS - Natural Gas Futures", exchange_display: "MCX" },
  { key: "MCX:COPPER", tradingsymbol: "COPPER", name: "Copper", exchange: "MCX", instrument_type: "FUT", segment: "COM", display_name: "COPPER - Copper Futures", exchange_display: "MCX" },
  { key: "MCX:ZINC", tradingsymbol: "ZINC", name: "Zinc", exchange: "MCX", instrument_type: "FUT", segment: "COM", display_name: "ZINC - Zinc Futures", exchange_display: "MCX" },
];

// Utility functions

// Helper function to validate instruments
const validateInstruments = (instruments) => {
  if (!Array.isArray(instruments) || instruments.length === 0) {
    throw new Error('Instruments must be a non-empty array');
  }
  
  if (instruments.length > 200) {
    throw new Error('Maximum 200 instruments allowed per request');
  }
  
  return instruments.filter(inst => inst && typeof inst === 'string');
};

// Helper function to format instrument key
const formatInstrumentKey = (instrument) => {
  // Handle both "NSE:RELIANCE" and "256265" formats
  if (instrument.includes(':')) {
    return instrument;
  }
  // If it's just a token, we need to map it - this would require instrument master
  return instrument;
};

// Helper function to check cache
const getCachedData = (cache, key, duration) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < duration) {
    return cached.data;
  }
  return null;
};

// Helper function to set cache
const setCachedData = (cache, key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

function generateChecksum(apiKey, requestToken, apiSecret) {
  const data = apiKey + requestToken + apiSecret
  return crypto.createHash("sha256").update(data).digest("hex")
}

function getAccessTokenFromRequest(req) {
  // First check if there's a global access token
  if (accessToken) {
    return accessToken;
  }
  
  // Then check session cookie
  if (req.cookies.zerodha_session) {
    try {
      const session = JSON.parse(req.cookies.zerodha_session);
      if (new Date(session.expires_at) > new Date()) {
        return session.access_token;
      }
    } catch (err) {
      console.error('Session parsing error:', err);
    }
  }
  
  return null;
}
// Add this endpoint to manually trigger JSON loading
app.post("/api/debug/force-load-json", (req, res) => {
  console.log('[FORCE-LOAD] Attempting to load JSON...');
  console.log('[FORCE-LOAD] JSON Path:', INSTRUMENTS_JSON_PATH);
  console.log('[FORCE-LOAD] File exists:', fs.existsSync(INSTRUMENTS_JSON_PATH));
  
  const success = loadInstrumentsFromJSON();
  
  res.json({
    success: success,
    jsonPath: INSTRUMENTS_JSON_PATH,
    fileExists: fs.existsSync(INSTRUMENTS_JSON_PATH),
    cacheLength: jsonInstrumentsCache.length,
    logs: 'Check server console for detailed logs'
  });
});
// Add this debug endpoint to your server.js
app.get("/api/debug/json-file", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  
  res.json({
    jsonPath: INSTRUMENTS_JSON_PATH,
    fileExists: fs.existsSync(INSTRUMENTS_JSON_PATH),
    currentDir: __dirname,
    dataDir: path.join(__dirname, 'data'),
    dataDirExists: fs.existsSync(path.join(__dirname, 'data')),
    filesInData: fs.existsSync(path.join(__dirname, 'data')) ? 
      fs.readdirSync(path.join(__dirname, 'data')) : [],
    jsonCacheLength: jsonInstrumentsCache.length,
    fallbackLength: fallbackInstruments.length
  });
});
// Load instruments from JSON file
// Update the loadInstrumentsFromJSON function with more logging
function loadInstrumentsFromJSON() {
  try {
    console.log('[JSON] Starting JSON load process...');
    console.log('[JSON] Looking for file at:', INSTRUMENTS_JSON_PATH);
    console.log('[JSON] File exists check:', fs.existsSync(INSTRUMENTS_JSON_PATH));
    
    if (!fs.existsSync(INSTRUMENTS_JSON_PATH)) {
      console.log(`[JSON] ❌ Instruments file not found: ${INSTRUMENTS_JSON_PATH}`);
      return false;
    }

    console.log('[JSON] ✅ File found, reading content...');
    const jsonData = JSON.parse(fs.readFileSync(INSTRUMENTS_JSON_PATH, 'utf8'));
    console.log('[JSON] JSON parsed successfully, checking structure...');
    
    if (jsonData.instruments && Array.isArray(jsonData.instruments)) {
      jsonInstrumentsCache = jsonData.instruments;
      jsonCacheMetadata = jsonData.metadata;
      
      console.log(`[JSON] ✅ Successfully loaded ${jsonInstrumentsCache.length} instruments from JSON`);
      console.log(`[JSON] Last updated: ${jsonCacheMetadata?.lastUpdated}`);
      console.log(`[JSON] NSE: ${jsonCacheMetadata?.nseCount}, MCX: ${jsonCacheMetadata?.mcxCount}`);
      
      return true;
    } else {
      console.error('[JSON] ❌ Invalid JSON structure - missing instruments array');
      console.error('[JSON] Available keys:', Object.keys(jsonData));
      return false;
    }
    
  } catch (error) {
    console.error('[JSON] ❌ Error loading instruments from JSON:', error.message);
    console.error('[JSON] Full error:', error);
    return false;
  }
}

// Get instruments (priority: JSON > fallback)
function getInstruments() {
  if (jsonInstrumentsCache.length > 0) {
    return jsonInstrumentsCache;
  }
  return fallbackInstruments;
}

function getDataSource() {
  if (jsonInstrumentsCache.length > 0) return 'json_file';
  return 'fallback_data';
}

// Initialize instruments on startup
function initializeInstruments() {
  console.log('[INIT] Initializing instruments...');
  
  const jsonLoaded = loadInstrumentsFromJSON();
  
  if (jsonLoaded) {
    console.log('[INIT] ✅ Using JSON-based instruments');
  } else {
    console.log('[INIT] ⚠️  JSON not available, using fallback instruments');
  }
}

// Routes
app.get("/api", (req, res) => {
  res.json({
    message: "Zerodha Trading API Server",
    status: "Running",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        "GET /api/auth/login-url": "Get Zerodha login URL",
        "GET /api/zerodha/callback": "OAuth callback handler (automatic token capture)",
        "POST /api/auth/session": "Generate session with request token (manual flow)",
        "GET /api/auth/status": "Check authentication status",
        "POST /api/auth/logout": "Logout and clear session"
      },
      market: {
        "POST /api/quote": "Get live quotes for instruments",
        "POST /api/ltp": "Get Last Traded Price for instruments",
        "GET /api/search": "Search instruments by name or symbol",
        "POST /api/ohlc": "Get OHLC data for instruments"
      },
      instruments: {
        "GET /api/instruments/status": "Get instruments cache status",
        "POST /api/instruments/reload-json": "Reload instruments from JSON file"
      },
      user: {
        "GET /api/profile": "Get user profile",
        "GET /api/margins": "Get user margins"
      },
      system: {
        "GET /api/health": "Health check endpoint"
      }
    },
    config: {
      apiKey: ZERODHA_API_KEY ? `${ZERODHA_API_KEY.substring(0, 8)}...` : "Not configured",
      authenticated: !!accessToken,
      port: PORT,
      instrumentsCount: getInstruments().length,
      dataSource: getDataSource()
    }
  })
})

// Auth endpoints
app.get("/api/auth/login-url", (req, res) => {
  if (!ZERODHA_API_KEY) {
    return res.status(400).json({ error: "Zerodha API key not configured" })
  }

  const loginUrl = `https://kite.trade/connect/login?api_key=${ZERODHA_API_KEY}`
  res.json({
    loginUrl,
    apiKey: ZERODHA_API_KEY,
    message: "Visit this URL to authenticate with Zerodha",
  })
})
app.get("/api/debug/instruments", (req, res) => {
  const instruments = getInstruments();
  
  res.json({
    totalCount: instruments.length,
    dataSource: getDataSource(),
    firstInstrument: instruments[0],
    sampleInstruments: instruments.slice(0, 5),
    fieldNames: instruments[0] ? Object.keys(instruments[0]) : [],
    sbiTest: instruments.filter(i => 
      (i.tradingsymbol || '').toLowerCase().includes('sbi')
    ).slice(0, 3)
  });
});
// Zerodha callback endpoint
app.get("/api/zerodha/callback", async (req, res) => {
  try {
    const requestToken = req.query.request_token;
    
    if (!requestToken) {
      return res.status(400).send(`
        <html>
          <script>
            window.opener.postMessage('zerodha_login_failed:Missing request token', '*');
          </script>
          <body>
            <h2>Authentication Failed</h2>
            <p>Missing request token</p>
          </body>
        </html>
      `);
    }

    const checksum = generateChecksum(ZERODHA_API_KEY, requestToken, ZERODHA_API_SECRET);
    const payload = {
      api_key: ZERODHA_API_KEY.trim(),
      request_token: requestToken.trim(),
      checksum: checksum,
    };

    const response = await axios.post(`${ZERODHA_BASE_URL}/session/token`, payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Kite-Version": "3",
      },
      transformRequest: [
        (data) => {
          return Object.keys(data)
            .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
            .join('&');
        },
      ],
    });
    
    accessToken = response.data.data.access_token;
    userProfile = {
      user_id: response.data.data.user_id,
      user_name: response.data.data.user_name,
      user_shortname: response.data.data.user_shortname,
      email: response.data.data.email,
      user_type: response.data.data.user_type,
      broker: response.data.data.broker,
    };

    const sessionData = {
      access_token: response.data.data.access_token,
      user: userProfile,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    res.cookie('zerodha_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.send(`
      <html>
        <script>
          window.opener.postMessage('zerodha_login_success', '*');
          setTimeout(() => window.close(), 1000);
        </script>
        <body>
          <div style="text-align:center;padding:20px;">
            <h2>Authentication Successful!</h2>
            <p>You may now close this window.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Callback error:", error.response?.data || error.message);
    
    const errorDetails = error.response?.data?.error || error.message;
    const errorMessage = errorDetails || "Authentication failed";
    
    res.send(`
      <html>
        <script>
          window.opener.postMessage('zerodha_login_failed:${errorMessage}', '*');
        </script>
        <body>
          <div style="text-align:center;padding:20px;color:red;">
            <h2>Authentication Failed</h2>
            <p>${errorMessage}</p>
          </div>
        </body>
      </html>
    `);
  }
});

app.post("/api/auth/session", async (req, res) => {
  try {
    const { request_token } = req.body;

    console.log("Received request:", { request_token, body: req.body });

    if (!request_token) {
      return res.status(400).json({ error: "Request token is required" });
    }

    if (!ZERODHA_API_KEY || !ZERODHA_API_SECRET) {
      return res.status(400).json({ error: "Zerodha API credentials not configured" });
    }

    // Handle test tokens
    if (request_token === 'test123') {
      console.log('Test token detected, returning mock response');
      
      accessToken = 'test_access_token';
      userProfile = {
        user_id: 'TEST123',
        user_name: 'Test User',
        user_shortname: 'Test',
        email: 'test@example.com',
        user_type: 'individual',
        broker: 'ZERODHA'
      };
      
      return res.json({
        success: true,
        access_token: 'test_access_token',
        user: userProfile,
        message: "Test authentication successful",
      });
    }

    const checksum = generateChecksum(ZERODHA_API_KEY, request_token, ZERODHA_API_SECRET);

    const payload = {
      api_key: ZERODHA_API_KEY.trim(),
      request_token: request_token.trim(),
      checksum: checksum,
    };

    console.log("Making request to Zerodha with payload:", { 
      api_key: payload.api_key, 
      request_token: payload.request_token,
      checksum: payload.checksum.substring(0, 10) + '...' 
    });

    const response = await axios.post(`${ZERODHA_BASE_URL}/session/token`, payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Kite-Version": "3",
      },
      transformRequest: [
        (data) => {
          return Object.keys(data)
            .map((key) => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
            .join("&");
        },
      ],
    });

    console.log("Zerodha response received:", response.data);

    accessToken = response.data.data.access_token;
    userProfile = {
      user_id: response.data.data.user_id,
      user_name: response.data.data.user_name,
      user_shortname: response.data.data.user_shortname,
      email: response.data.data.email,
      user_type: response.data.data.user_type,
      broker: response.data.data.broker,
    };

    const sessionData = {
      access_token: response.data.data.access_token,
      user: userProfile,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };

    res.cookie('zerodha_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      access_token: sessionData.access_token,
      user: sessionData.user,
      message: "Authentication successful",
    });

  } catch (error) {
    console.error("Session generation error:", error.response?.data || error.message);
    
    res.status(500).json({
      error: "Failed to generate session",
      details: error.response?.data || error.message,
      debug: {
        hasApiKey: !!ZERODHA_API_KEY,
        hasApiSecret: !!ZERODHA_API_SECRET,
        requestToken: req.body.request_token ? 'present' : 'missing'
      }
    });
  }
});

app.get("/api/auth/status", (req, res) => {
  try {
    const currentAccessToken = getAccessTokenFromRequest(req);
    
    if (currentAccessToken) {
      if (userProfile) {
        return res.json({
          authenticated: true,
          access_token: currentAccessToken,
          user: userProfile
        });
      }
      
      if (req.cookies.zerodha_session) {
        const session = JSON.parse(req.cookies.zerodha_session);
        if (new Date(session.expires_at) > new Date()) {
          return res.json({
            authenticated: true,
            access_token: session.access_token,
            user: session.user
          });
        }
      }
      
      return res.json({
        authenticated: true,
        access_token: currentAccessToken,
        user: null
      });
    }
    
    res.json({ authenticated: false });
    
  } catch (err) {
    console.error('Status check error:', err);
    res.json({ authenticated: false });
  }
});

app.post("/api/auth/logout", (req, res) => {
  accessToken = null;
  userProfile = null;
  res.clearCookie('zerodha_session');
  res.json({ success: true, message: "Logged out successfully" });
});

// Market data endpoints
app.post('/api/quote', async (req, res) => {
  try {
    const currentAccessToken = getAccessTokenFromRequest(req);

    if (!currentAccessToken) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated. Please login first."
      });
    }

    const { instruments } = req.body;
    console.log("Quote request received:", {
      instruments,
      accessToken: currentAccessToken ? "present" : "missing"
    });

    if (!instruments || !Array.isArray(instruments)) {
      return res.status(400).json({
        success: false,
        error: "Instruments array is required"
      });
    }

    const validInstruments = instruments.filter(
      instrument => instrument && typeof instrument === 'string' && instrument.trim().length > 0
    );

    // Cache check
    const cacheKey = validInstruments.sort().join(',');
    const cachedQuote = getCachedData(quoteCache, cacheKey, QUOTE_CACHE_DURATION);

    if (cachedQuote) {
      return res.json({
        success: true,
        data: cachedQuote,
        cached: true
      });
    }

    const params = new URLSearchParams();
    validInstruments.forEach(symbol => params.append("i", symbol));

    console.log(`Fetching quote data for ${validInstruments.length} instruments:`, validInstruments.join(','));

    const response = await axios.get(`${ZERODHA_BASE_URL}/quote?${params.toString()}`, {
      headers: {
        Authorization: `token ${ZERODHA_API_KEY}:${currentAccessToken}`,
        "X-Kite-Version": "3",
      },
      timeout: 10000,
    });

    console.log("Zerodha Quote response received");
    const quoteData = response.data.data;
    const processedData = {};

    Object.keys(quoteData).forEach(key => {
      const quote = quoteData[key];

      processedData[key] = {
        last_price: quote.last_price,
        last_quantity: quote.last_quantity,
        average_price: quote.average_price,

        ohlc: {
          open: quote.ohlc?.open || quote.last_price,
          high: quote.ohlc?.high || quote.last_price,
          low: quote.ohlc?.low || quote.last_price,
          close: quote.ohlc?.close || quote.last_price
        },

        day_high: quote.ohlc?.high,
        day_low: quote.ohlc?.low,
        day_open: quote.ohlc?.open,
        previous_close: quote.ohlc?.close,

        net_change: quote.net_change || (quote.last_price - (quote.ohlc?.close || quote.last_price)),
        change: quote.net_change || (quote.last_price - (quote.ohlc?.close || quote.last_price)),
        change_percent: quote.net_change && quote.ohlc?.close ?
          ((quote.net_change / quote.ohlc.close) * 100) : 0,

        volume: quote.volume || 0,
        day_volume: quote.volume || 0,
        volume_traded: quote.volume_traded || quote.volume || 0,
        turnover: quote.turnover || 0,

        depth: quote.depth || { buy: [], sell: [] },

        upper_circuit: quote.upper_circuit_limit,
        lower_circuit: quote.lower_circuit_limit,

        instrument_token: quote.instrument_token,
        tradingsymbol: quote.tradingsymbol,
        exchange: quote.exchange,

        last_trade_time: quote.last_trade_time,
        exchange_timestamp: quote.exchange_timestamp,

        buy_quantity: quote.buy_quantity,
        sell_quantity: quote.sell_quantity,
        oi: quote.oi,
        oi_day_high: quote.oi_day_high,
        oi_day_low: quote.oi_day_low
      };
    });

    setCachedData(quoteCache, cacheKey, processedData);

    res.json({
      success: true,
      data: processedData,
      count: Object.keys(processedData).length,
      cached: false
    });

  } catch (error) {
    console.error('Quote API error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    const status = error.response?.status;

    if (status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired access token'
      });
    }

    if (status === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      });
    }

    res.status(500).json({
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to fetch quote data',
      debug: {
        hasAccessToken: !!getAccessTokenFromRequest(req),
        apiKey: ZERODHA_API_KEY ? `${ZERODHA_API_KEY.substring(0, 8)}...` : "missing",
        instruments: req.body.instruments,
      }
    });
  }
});


// 2. OHLC API - Historical reference data
app.post('/api/ohlc', async (req, res) => {
  try {
    const currentAccessToken = getAccessTokenFromRequest(req);
    
    if (!currentAccessToken) {
      return res.status(401).json({ 
        success: false,
        error: "Not authenticated. Please login first." 
      });
    }

    const { instruments } = req.body;
    console.log("OHLC request received:", { instruments, accessToken: currentAccessToken ? "present" : "missing" });

    if (!instruments || !Array.isArray(instruments)) {
      return res.status(400).json({ 
        success: false,
        error: "Instruments array is required" 
      });
    }

    const validInstruments = instruments.filter(
      inst => inst && typeof inst === 'string' && inst.trim().length > 0
    );

    // Cache check
    const cacheKey = validInstruments.sort().join(',');
    const cachedOHLC = getCachedData(ohlcCache, cacheKey, OHLC_CACHE_DURATION);
    
    if (cachedOHLC) {
      return res.json({
        success: true,
        data: cachedOHLC,
        cached: true
      });
    }

    // Use URLSearchParams to build query like Postman
    const params = new URLSearchParams();
    validInstruments.forEach(symbol => params.append("i", symbol));

    const response = await axios.get(`${ZERODHA_BASE_URL}/quote/ohlc?${params.toString()}`, {
      headers: {
        Authorization: `token ${ZERODHA_API_KEY}:${currentAccessToken}`,
        "X-Kite-Version": "3",
      },
      timeout: 10000,
    });

    const ohlcData = response.data.data;
    const processedData = {};

    Object.keys(ohlcData).forEach(key => {
      const ohlc = ohlcData[key];
      processedData[key] = {
        ohlc: {
          open: ohlc.ohlc?.open || ohlc.last_price,
          high: ohlc.ohlc?.high || ohlc.last_price,
          low: ohlc.ohlc?.low || ohlc.last_price,
          close: ohlc.ohlc?.close || ohlc.last_price
        },
        previous_close: ohlc.ohlc?.close,
        day_open: ohlc.ohlc?.open,
        day_high: ohlc.ohlc?.high,
        day_low: ohlc.ohlc?.low,
        last_price: ohlc.last_price,
        net_change: ohlc.last_price - (ohlc.ohlc?.close || ohlc.last_price),
        change_percent: ohlc.ohlc?.close ? 
          (((ohlc.last_price - ohlc.ohlc.close) / ohlc.ohlc.close) * 100) : 0,
        instrument_token: ohlc.instrument_token,
        tradingsymbol: ohlc.tradingsymbol,
        exchange: ohlc.exchange,
        volume: ohlc.volume || 0,
        last_trade_time: ohlc.last_trade_time,
        upper_circuit: ohlc.upper_circuit_limit,
        lower_circuit: ohlc.lower_circuit_limit
      };
    });

    setCachedData(ohlcCache, cacheKey, processedData);

    res.json({
      success: true,
      data: processedData,
      count: Object.keys(processedData).length,
      cached: false
    });

  } catch (error) {
    console.error("OHLC API error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    const isAuthError = error.response?.status === 401;

    res.status(isAuthError ? 401 : 500).json({
      success: false,
      error: isAuthError ? "Invalid or expired access token" :
        error.response?.data?.message || error.message || "Failed to fetch OHLC data",
      debug: {
        hasAccessToken: !!getAccessTokenFromRequest(req),
        instruments: req.body.instruments,
      }
    });
  }
});


app.post("/api/ltp", async (req, res) => {
  try {
    const currentAccessToken = getAccessTokenFromRequest(req);
    
    if (!currentAccessToken) {
      return res.status(401).json({ error: "Not authenticated. Please login first." })
    }

    const { instruments } = req.body
    console.log("LTP request received:", { instruments, accessToken: currentAccessToken ? "present" : "missing" })

    if (!instruments || !Array.isArray(instruments)) {
      return res.status(400).json({ error: "Instruments array is required" })
    }

    const instrumentsParam = instruments.join(",")
    console.log("Making LTP request to Zerodha with instruments:", instrumentsParam)

    const response = await axios.get(`${ZERODHA_BASE_URL}/quote/ltp`, {
      headers: {
        Authorization: `token ${ZERODHA_API_KEY}:${currentAccessToken}`,
        "X-Kite-Version": "3",
      },
      params: {
        i: instrumentsParam,
      },
      timeout: 5000,
    })

    console.log("Zerodha LTP response:", response.data)
    res.json(response.data)
  } catch (error) {
    console.error("LTP fetch error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    })

    res.status(500).json({
      error: "Failed to fetch LTP",
      details: error.response?.data || error.message,
      debug: {
        hasAccessToken: !!getAccessTokenFromRequest(req),
        apiKey: ZERODHA_API_KEY ? `${ZERODHA_API_KEY.substring(0, 8)}...` : "missing",
        instruments: req.body.instruments,
      },
    })
  }
})

// Search endpoint
app.get("/api/search", async (req, res) => {
  try {
    const { q } = req.query;
    console.log(`[SEARCH] Request received for: "${q}"`);
    
    const allInstruments = getInstruments();
    console.log(`[SEARCH] Using ${allInstruments.length} instruments from ${getDataSource()}`);

    if (!q || q.length === 0) {
      console.log(`[SEARCH] No query provided, returning sample instruments`);
      return res.json({ 
        data: allInstruments.slice(0, 100),
        total: allInstruments.length,
        source: getDataSource(),
        metadata: jsonCacheMetadata
      });
    }

    if (q.length < 1) {
      return res.json({ data: [] });
    }

    const searchTerm = q.toLowerCase().trim();
    console.log(`[SEARCH] Searching in ${allInstruments.length} instruments for: "${searchTerm}"`);

    const results = allInstruments
      .filter((instrument) => {
        const symbolMatch = instrument.tradingsymbol.toLowerCase().includes(searchTerm);
        const nameMatch = instrument.name.toLowerCase().includes(searchTerm);
        return symbolMatch || nameMatch;
      })
      .slice(0, 50)
      .map((instrument) => ({
        key: instrument.key,
        tradingsymbol: instrument.tradingsymbol,
        name: instrument.name,
        exchange: instrument.exchange,
        instrument_type: instrument.instrument_type,
        segment: instrument.segment,
        display_name: instrument.display_name || `${instrument.tradingsymbol} - ${instrument.name}`,
        exchange_display: instrument.exchange_display || instrument.exchange,
        expiry: instrument.expiry,
        strike: instrument.strike,
        lot_size: instrument.lot_size,
        tick_size: instrument.tick_size,
      }));

    console.log(`[SEARCH] Found ${results.length} results for "${searchTerm}"`);
    if (results.length > 0) {
      console.log(`[SEARCH] First result: ${results[0].tradingsymbol} (${results[0].exchange})`);
    }
    
    res.json({ 
      data: results,
      query: q,
      total: results.length,
      source: getDataSource(),
      metadata: jsonCacheMetadata,
      debug: {
        searchTerm,
        totalInstruments: allInstruments.length,
        dataSource: getDataSource()
      }
    });
    
  } catch (error) {
    console.error("[SEARCH] Error:", error.message);
    res.status(500).json({
      error: "Failed to search instruments",
      details: error.message,
    });
  }
});

// Instruments management endpoints
app.get("/api/instruments/status", (req, res) => {
  const instruments = getInstruments();
  res.json({
    dataSource: getDataSource(),
    jsonCache: {
      available: jsonInstrumentsCache.length > 0,
      count: jsonInstrumentsCache.length,
      metadata: jsonCacheMetadata,
      filePath: INSTRUMENTS_JSON_PATH,
      fileExists: fs.existsSync(INSTRUMENTS_JSON_PATH)
    },
    fallbackData: {
      count: fallbackInstruments.length
    },
    totalAvailable: instruments.length,
    authenticated: !!accessToken,
    sample: instruments.slice(0, 5).map(i => ({ symbol: i.tradingsymbol, exchange: i.exchange }))
  });
});

app.post("/api/instruments/reload-json", (req, res) => {
  try {
    console.log('[RELOAD-JSON] Manual JSON reload requested');
    
    const success = loadInstrumentsFromJSON();
    
    if (success) {
      res.json({
        success: true,
        message: "JSON instruments reloaded successfully",
        count: jsonInstrumentsCache.length,
        metadata: jsonCacheMetadata,
        source: 'json_file'
      });
    } else {
      res.status(404).json({
        error: "Failed to reload JSON instruments",
        message: "JSON file not found or invalid",
        path: INSTRUMENTS_JSON_PATH
      });
    }
  } catch (error) {
    console.error('[RELOAD-JSON] Error:', error);
    res.status(500).json({
      error: "Failed to reload JSON instruments",
      details: error.message
    });
  }
});

// User endpoints
app.get("/api/profile", async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(401).json({ error: "Not authenticated. Please login first." })
    }

    const response = await axios.get(`${ZERODHA_BASE_URL}/user/profile`, {
      headers: {
        Authorization: `token ${ZERODHA_API_KEY}:${accessToken}`,
        "X-Kite-Version": "3",
      },
    })

    res.json(response.data.data)
  } catch (error) {
    console.error("Profile fetch error:", error.response?.data || error.message)
    res.status(500).json({
      error: "Failed to fetch profile",
      details: error.response?.data || error.message,
    })
  }
})

app.get("/api/margins", async (req, res) => {
  try {
    if (!accessToken) {
      return res.status(401).json({ error: "Not authenticated. Please login first." })
    }

    const response = await axios.get(`${ZERODHA_BASE_URL}/user/margins`, {
      headers: {
        Authorization: `token ${ZERODHA_API_KEY}:${accessToken}`,
        "X-Kite-Version": "3",
      },
    })

    res.json(response.data.data)
  } catch (error) {
    console.error("Margins fetch error:", error.response?.data || error.message)
    res.status(500).json({
      error: "Failed to fetch margins",
      details: error.response?.data || error.message,
    })
  }
})

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    apiKey: ZERODHA_API_KEY ? `${ZERODHA_API_KEY.substring(0, 8)}...` : "Not configured",
    apiSecret: ZERODHA_API_SECRET ? "Configured" : "Not configured",
    authenticated: !!accessToken,
    server: "Zerodha Trading API",
    instrumentsCount: getInstruments().length,
    dataSource: getDataSource()
  })
})

// Static files
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return;
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      "GET /api",
      "GET /api/health",
      "GET /api/auth/login-url",
      "POST /api/auth/session",
      "GET /api/auth/status",
      "POST /api/auth/logout",
      "GET /api/profile",
      "GET /api/margins",
      "POST /api/quote",
      "POST /api/ltp",
      "GET /api/search?q=searchterm",
      "GET /api/instruments/status",
      "POST /api/instruments/reload-json",
      "GET /api/zerodha/callback",
    ],
  })
})

async function startServer() {
  try {
    const port = await findAvailablePort(PORT)

    // Initialize instruments before starting server
    initializeInstruments();

    app.listen(port, () => {
      console.log(`🚀 Zerodha Trading API Server running on port ${port}`)
      console.log(`📊 API URL: http://localhost:${port}/api`)
      console.log(`🔑 Zerodha API Key: ${ZERODHA_API_KEY ? `${ZERODHA_API_KEY.substring(0, 8)}...` : "Not configured"}`)
      console.log(`🔐 Zerodha API Secret: ${ZERODHA_API_SECRET ? "Configured" : "Not configured"}`)
      console.log(`🌐 Login URL: https://kite.trade/connect/login?api_key=${ZERODHA_API_KEY}`)
      console.log(`📋 Instruments loaded: ${getInstruments().length} (${getDataSource()})`)
      console.log(`\n📋 Available endpoints:`)
      console.log(`   GET  /api - API documentation`)
      console.log(`   GET  /api/health - Health check`)
      console.log(`   GET  /api/search?q=term - Search instruments`)
      console.log(`   GET  /api/instruments/status - Instruments status`)
    })
  } catch (error) {
    console.error("❌ Failed to start server:", error.message)
    process.exit(1)
  }
}

startServer()