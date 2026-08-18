const DEFAULT_API_BASE = 'https://www.zohoapis.com/crm/v2'

function missingEnvResponse() {
  return {
    error: true,
    message:
      'Missing required environment variables. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, and ZOHO_ORG_ID in Vercel environment variables.'
  }
}

function getAuthDomain(apiBase) {
  try {
    const baseUrl = new URL(apiBase)
    const apiHost = baseUrl.host
    const accountHost = apiHost.replace('zohoapis', 'zoho')
    return `accounts.${accountHost}`
  } catch {
    return 'accounts.zoho.com'
  }
}

async function getAccessToken(env) {
  const body = new URLSearchParams({
    refresh_token: env.ZOHO_REFRESH_TOKEN,
    client_id: env.ZOHO_CLIENT_ID,
    client_secret: env.ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token'
  })

  const tokenResponse = await fetch(`https://${getAuthDomain(env.ZOHO_API_BASE || DEFAULT_API_BASE)}/oauth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  })

  if (!tokenResponse.ok) {
    const payload = await tokenResponse.json().catch(() => ({}))
    throw new Error(payload.error_description || 'Failed to refresh Zoho access token')
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}

function toNumber(value) {
  const num = Number(String(value || '').replace(/,/g, ''))
  return Number.isNaN(num) ? 0 : num
}

function summarizeDeals(records = []) {
  const stageCounts = records.reduce((acc, item) => {
    const key = item.Stage || 'Unspecified'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const stageDistribution = Object.entries(stageCounts)
    .map(([label, total], index) => ({
      label,
      total,
      fill: Math.min(100, Math.max(8, Math.round((total / Math.max(records.length, 1)) * 100))) +
        (index % 2 === 0 ? 0 : 3)
    }))
    .sort((a, b) => b.total - a.total)

  const openDeals = records.filter((item) => item.Stage !== 'Closed Won' && item.Stage !== 'Closed Lost')
  const totalValue = openDeals.reduce((sum, item) => sum + toNumber(item.Amount), 0)
  const wonDeals = records.filter((item) => item.Stage === 'Closed Won').length
  const wonRate = records.length ? ((wonDeals / records.length) * 100).toFixed(1) : '0.0'

  const sampleEvents = records
    .slice(0, 3)
    .map((record) => ({
      name: `Deal updated: ${record.Deal_Name || 'Untitled deal'}`,
      when: new Date().toLocaleDateString(),
      status: record.Stage || 'No stage'
    }))

  return {
    kpis: [
      {
        title: 'Open Pipeline',
        value: `${openDeals.length} Deals`,
        detail: `Total open value: $${toNumber(totalValue).toLocaleString()}`,
        delta: '+Live from Zoho'
      },
      {
        title: 'Win Rate',
        value: `${wonRate}%`,
        detail: `Closed Won: ${wonDeals}`,
        delta: 'auto-updated'
      },
      {
        title: 'Total Records',
        value: String(records.length),
        detail: 'Current page size',
        delta: 'Auto-sync enabled'
      },
      {
        title: 'Active Reps',
        value: String(new Set(records.map((item) => item.Owner?.name).filter(Boolean)).size || 0),
        detail: 'Unique owners in response',
        delta: 'live'
      }
    ],
    stageDistribution,
    events: sampleEvents
  }
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.status(405).json({ error: true, message: 'Method not allowed' })
    return
  }

  const env = process.env
  if (!env.ZOHO_CLIENT_ID || !env.ZOHO_CLIENT_SECRET || !env.ZOHO_REFRESH_TOKEN || !env.ZOHO_ORG_ID) {
    response.status(500).json(missingEnvResponse())
    return
  }

  const moduleName = new URL(request.url, 'http://localhost').searchParams.get('module') || 'Deals'
  const limit = new URL(request.url, 'http://localhost').searchParams.get('per_page') || '200'
  const apiBase = env.ZOHO_API_BASE || DEFAULT_API_BASE

  try {
    const accessToken = await getAccessToken(env)
    const endpointUrl = new URL(`${apiBase}/${moduleName}`)
    endpointUrl.searchParams.set('per_page', String(limit))
    endpointUrl.searchParams.set('fields', 'Deal_Name,Stage,Amount,Owner,Owner.name,Modified_Time')

    const apiResponse = await fetch(endpointUrl, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`
      }
    })

    if (!apiResponse.ok) {
      const responsePayload = await apiResponse.json().catch(() => ({}))
      response.status(apiResponse.status).json({
        error: true,
        message: responsePayload.message || 'Failed to load CRM data',
        details: responsePayload
      })
      return
    }

    const payload = await apiResponse.json()
    const records = Array.isArray(payload.data) ? payload.data : []
    const summary = summarizeDeals(records)

    response.status(200).json({
      module: moduleName,
      source: env.ZOHO_API_BASE || DEFAULT_API_BASE,
      count: records.length,
      refreshedAt: new Date().toISOString(),
      ...summary
    })
  } catch (error) {
    response.status(500).json({
      error: true,
      message: error.message || 'Unexpected error while fetching Zoho data'
    })
  }
}
