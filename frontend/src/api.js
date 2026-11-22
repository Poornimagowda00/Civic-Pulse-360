const configuredApiBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL
const defaultApiBase = import.meta.env.DEV ? 'http://127.0.0.1:8000/api' : '/api'
export const API_BASE = (configuredApiBase || defaultApiBase).replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const REQUEST_TIMEOUT_MS = 15000

export async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const isFormData = body instanceof FormData
  const retryable = ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
  const attempts = retryable ? 2 : 1
  let response
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method,
        headers: body && !isFormData
          ? { 'Content-Type': 'application/json', ...headers }
          : headers,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        signal: controller.signal,
      })
      break
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new ApiError('Connection timed out. Please check your internet connection and try again.', 0)
      }
      if (attempt === attempts - 1) {
        throw new ApiError('Our service is temporarily unavailable. Please try again shortly.', 0)
      }
    } finally {
      window.clearTimeout(timeout)
    }
  }
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) {
    const message = response.status === 401
      ? 'Incorrect email or password.'
      : response.status === 409
        ? 'An account with this email already exists.'
        : response.status === 422
          ? 'Please check your details and try again.'
          : response.status === 500
            ? 'We cannot complete your request right now. Please try again later.'
            : response.status === 502 || response.status === 503 || response.status === 504
              ? 'Our service is temporarily unavailable. Please try again later.'
            : data?.detail || `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }
  return data
}
