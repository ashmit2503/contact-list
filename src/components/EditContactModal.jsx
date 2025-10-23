import { useState, useEffect, useRef } from 'react'
import Modal from './Modal'
import { countryCodes } from '../utils/constants'

export default function EditContactModal({ contact, show, onClose, onUpdate }) {
  const [formData, setFormData] = useState({ name: '', phone: '', countryCode: '+91', email: '' })
  const [errors, setErrors] = useState({})
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)

  const resolveCountry = (rawCode, rawPhone) => {
    const codeStr = String(rawCode || '').trim()
    const byCode = countryCodes.find(c => c.code === codeStr)
    if (byCode) return byCode
    const digits = codeStr.replace(/\D/g, '')
    if (digits) {
      const byDigits = countryCodes.find(c => c.code.replace(/\D/g, '') === digits)
      if (byDigits) return byDigits
    }
    const byIso = countryCodes.find(c => String(c.country || '').toUpperCase() === codeStr.toUpperCase())
    if (byIso) return byIso
    const phoneDigits = String(rawPhone || '').replace(/\D/g, '')
    if (phoneDigits) {
      const match = countryCodes
        .map(c => ({ c, d: c.code.replace(/\D/g, '') }))
        .filter(x => phoneDigits.startsWith(x.d))
        .sort((a,b) => b.d.length - a.d.length)[0]
      if (match) return match.c
    }
    return countryCodes[0]
  }

  useEffect(() => {
    if (contact && show) {
      const country = resolveCountry(contact.countryCode, contact.phone)
      const targetLen = country.length || 10
      const ccDigits = String(country.code || '').replace(/\D/g, '')
      const phoneDigits = String(contact.phone || '').replace(/\D/g, '')
      let phoneWithoutCode = phoneDigits
      if (ccDigits && phoneDigits.startsWith(ccDigits)) {
        phoneWithoutCode = phoneDigits.slice(ccDigits.length)
      }
      if (phoneWithoutCode.length !== targetLen && phoneDigits.length >= targetLen) {
        phoneWithoutCode = phoneDigits.slice(-targetLen)
      }
      setFormData({
        name: contact.name,
        phone: phoneWithoutCode,
        countryCode: country.code,
        email: contact.email || ''
      })
      setErrors({})
    }
  }, [contact, show])

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

  const getSelectedCountry = () => resolveCountry(formData.countryCode, contact?.phone)

  const validateContact = () => {
    const newErrors = {}
    const trimmedName = formData.name.trim()
    const trimmedPhone = formData.phone.trim()
    const trimmedEmail = formData.email.trim()

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validateContact() && !isSubmitting) {
      setIsSubmitting(true)
      try {
        await onUpdate({
          id: contact.id,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          countryCode: formData.countryCode,
          email: formData.email.trim() || null
        })
        onClose()
      } catch (err) {
        if (err.message.includes('phone number')) {
          setErrors({ phone: err.message })
        } else if (err.message.includes('email')) {
          setErrors({ email: err.message })
        } else {
          setErrors({ name: err.message })
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleCountrySelect = (code) => {
    setFormData({ ...formData, countryCode: code })
    setShowCountryDropdown(false)
  }

  const handlePhoneInput = (value) => {
    const cleaned = value.replace(/\D/g, '')
    setFormData({ ...formData, phone: cleaned })
  }

  if (!contact) return null

  const selectedCountry = getSelectedCountry()

  return (
    <Modal show={show} onClose={onClose} title="Edit Contact">
      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <label htmlFor="edit-name">
            Name <span className="required">*</span>
          </label>
          <input
            id="edit-name"
            type="text"
            placeholder="Enter name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={errors.name ? 'error' : ''}
            disabled={isSubmitting}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="edit-phone">
            Phone Number <span className="required">*</span>
          </label>
          <div className="phone-input-wrapper">
            <button
              ref={buttonRef}
              type="button"
              className="country-code-button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              disabled={isSubmitting}
            >
              <span className="flag">{selectedCountry.flag}</span>
              <span className="code">{selectedCountry.code}</span>
              <svg className="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            {showCountryDropdown && (
              <div ref={dropdownRef} className="country-dropdown">
                {countryCodes.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    className={`country-option ${country.code === formData.countryCode ? 'selected' : ''}`}
                    onClick={() => handleCountrySelect(country.code)}
                  >
                    <span className="flag">{country.flag}</span>
                    <span className="name">{country.name}</span>
                    <span className="code">{country.code}</span>
                  </button>
                ))}
              </div>
            )}

            <input
              id="edit-phone"
              type="tel"
              placeholder={`Enter ${selectedCountry.length}-digit number`}
              value={formData.phone}
              onChange={(e) => handlePhoneInput(e.target.value)}
              maxLength={selectedCountry.length}
              className={errors.phone ? 'error' : ''}
              disabled={isSubmitting}
            />
          </div>
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="edit-email">Email (Optional)</label>
          <input
            id="edit-email"
            type="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={errors.email ? 'error' : ''}
            disabled={isSubmitting}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        <div className="modal-actions">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Contact'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
