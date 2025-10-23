/* eslint react-refresh/only-export-components: 0 */
import { createContext, useContext, useState, useEffect } from 'react'

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          logout()
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const text = await response.text()
    let data
    
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      console.error('Failed to parse response:', text)
      throw new Error('Invalid server response. The server may be experiencing issues.')
    }

    if (!response.ok) {
      throw new Error(data.error || 'Login failed')
    }

    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const register = async (email, password, name) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    })

    const text = await response.text()
    let data
    
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      console.error('Failed to parse response:', text)
      throw new Error('Invalid server response. The server may be experiencing issues.')
    }

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed')
    }

    localStorage.setItem('token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
