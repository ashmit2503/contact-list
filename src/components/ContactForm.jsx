import { useRef, useEffect, useState } from 'react'
import { countryCodes } from '../utils/constants'

export default function ContactForm({ onAddContact }) {
  const [newContact, setNewContact] = useState({ name: '', phone: '', countryCode: '+91', email: '' })
  const [errors, setErrors] = useState({})
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowCountryDropdown(false)
      }
    }

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCountryDropdown])

  const getSelectedCountry = () => {
    return countryCodes.find(c => c.code === newContact.countryCode) || countryCodes[0]
  }

  const validateContact = () => {
    const newErrors = {}
    const trimmedName = newContact.name.trim()
    const trimmedPhone = newContact.phone.trim()
    const trimmedEmail = newContact.email.trim()

    if (!trimmedName) {
      newErrors.name = 'Name is required'
    }

    if (!trimmedPhone) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d+$/.test(trimmedPhone)) {
      newErrors.phone = 'Phone number must contain only digits'
    } else {
      const selectedCountry = getSelectedCountry()
      if (trimmedPhone.length !== selectedCountry.length) {
        newErrors.phone = `Phone number must be ${selectedCountry.length} digits for ${selectedCountry.name}`
      }
    }

    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        newErrors.email = 'Invalid email format'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddContact = async (e) => {
    e.preventDefault()
    if (validateContact()) {
      const contact = {
        name: newContact.name.trim(),
        phone: `${newContact.countryCode} ${newContact.phone.trim()}`,
        countryCode: newContact.countryCode,
        email: newContact.email.trim() || null
      }
      
      try {
        await onAddContact(contact)
        setNewContact({ name: '', phone: '', countryCode: '+91', email: '' })
        setErrors({})
      } catch (err) {
        if (err.message.includes('phone number')) {
          setErrors({ phone: err.message })
        } else if (err.message.includes('email')) {
          setErrors({ email: err.message })
        } else {
          setErrors({ name: err.message })
        }
      }
    }
  }

  const handleCountrySelect = (code) => {
    setNewContact({ ...newContact, countryCode: code })
    setShowCountryDropdown(false)
  }

  const handlePhoneInput = (value) => {
    const cleaned = value.replace(/\D/g, '')
    setNewContact({ ...newContact, phone: cleaned })
  }

  return (
    <>
      <div className="add-contact-panel">
        <h4>Add New Contact</h4>
        <form onSubmit={handleAddContact} className="contact-form">
          <div className="form-group">
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              type="text"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder="Enter name"
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="contact-phone">Phone Number</label>
            <div className="phone-input-container">
              <div className="country-selector">
                <button
                  ref={buttonRef}
                  type="button"
                  className="country-selector-btn"
                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                >
                  <span className="flag">{getSelectedCountry().flag}</span>
                  <span className="code">{getSelectedCountry().code}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>
              
              <input
                id="contact-phone"
                type="tel"
                value={newContact.phone}
                onChange={(e) => handlePhoneInput(e.target.value)}
                placeholder={`${getSelectedCountry().length} digits`}
                className={errors.phone ? 'input-error' : ''}
                maxLength={getSelectedCountry().length}
              />
            </div>
            {errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="contact-email">Email (Optional)</label>
            <input
              id="contact-email"
              type="email"
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              placeholder="Enter email address"
              className={errors.email ? 'input-error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <button type="submit" className="btn-add-contact">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            Add Contact
          </button>
        </form>
      </div>

      {showCountryDropdown && (
        <div 
          ref={dropdownRef}
          className="country-dropdown"
        >
          {countryCodes.map((country) => (
            <button
              key={country.code}
              type="button"
              className={`country-option ${country.code === newContact.countryCode ? 'selected' : ''}`}
              onClick={() => handleCountrySelect(country.code)}
            >
              <span className="flag">{country.flag}</span>
              <span className="country-name">{country.name}</span>
              <span className="code">{country.code}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
