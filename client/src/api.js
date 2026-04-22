const API_URL = import.meta.env.VITE_API_URL

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token')

  const response = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  })

  return response.json()
}
