const rawBase = import.meta.env.VITE_API_URL || ''
const API_BASE = rawBase.replace(/\/$/, '')

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return API_BASE ? `${API_BASE}${p}` : p
}

function getToken() {
  return sessionStorage.getItem('accessToken')
}

function setToken(token) {
  sessionStorage.setItem('accessToken', token)
}

function clearToken() {
  sessionStorage.removeItem('accessToken')
}

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload
  } catch {
    return null
  }
}

function isTokenExpired(token) {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) return true
  return Date.now() >= payload.exp * 1000
}

async function refreshAccessToken() {
  try {
    const res = await fetch(apiUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.accessToken) {
      setToken(data.accessToken)
      return data.accessToken
    }
    return null
  } catch {
    return null
  }
}

async function apiFetch(url, options = {}) {
  let token = getToken()

  if (token && isTokenExpired(token)) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      token = newToken
    } else {
      clearToken()
      token = null
    }
  }

  const headers = { ...options.headers }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })
    }
  }

  return res
}

export { getToken, setToken, clearToken, decodeToken, isTokenExpired, refreshAccessToken, apiFetch }
