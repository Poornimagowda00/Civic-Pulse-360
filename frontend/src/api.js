export const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const isFormData = body instanceof FormData
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body && !isFormData
        ? { 'Content-Type': 'application/json', ...headers }
        : headers,
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    })
  } catch {
    throw new ApiError(
      'Civic Pulse is unable to reach the FastAPI service right now. Please check that the backend is running and try again.',
      0,
    )
  }
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok) {
    throw new ApiError(data?.detail || `Request failed (${response.status})`, response.status)
  }
  return data
}
