import { useAuth } from './AuthContext'
import Auth from './Auth'
import Navbar from './components/Navbar'
import ContactManager from './components/ContactManager'
import { getGreeting } from './utils/helpers.jsx'
import './App.css'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-container">Loading...</div>
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-content">
        <div className="greeting-section">
          <h2>{getGreeting()}, {user.name.split(' ')[0]}!</h2>
          <h3>Your Contacts</h3>
        </div>
        
        <ContactManager />
      </div>
    </div>
  )
}

export default App
