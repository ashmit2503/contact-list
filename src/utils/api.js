const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'

const getAuthHeader = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export const contactsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/contacts`, {
      headers: getAuthHeader()
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch contacts')
    }
    return data.contacts
  },

  add: async (contact) => {
    const response = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify(contact)
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to add contact')
    }
    return data.contact
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete contact')
    }
    return data
  },

  update: async (id, contact) => {
    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: getAuthHeader(),
      body: JSON.stringify(contact)
    })
    
    const text = await response.text()
    let data
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      console.error('Failed to parse response:', text)
      throw new Error('Invalid server response')
    }
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update contact')
    }
    return data.contact
  },

  bulkDelete: async (contactIds) => {
    const response = await fetch(`${API_URL}/contacts/bulk-delete`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ contactIds })
    })
    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete contacts')
    }
    return data
  },

  bulkCreate: async (contacts) => {
    const response = await fetch(`${API_URL}/contacts/bulk-create`, {
      method: 'POST',
      headers: getAuthHeader(),
      body: JSON.stringify({ contacts })
    })
    
    const text = await response.text()
    let data
    try {
      data = text ? JSON.parse(text) : {}
    } catch {
      console.error('Failed to parse response:', text)
      throw new Error('Invalid server response. Please ensure the server is running and the endpoint exists.')
    }
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to import contacts')
    }
    return data
  }
}
