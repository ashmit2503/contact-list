import { getInitials } from '../utils/helpers.jsx'

export default function ContactDetailModal({ contact, show, onClose, onCopy, onCopyEmail, onDelete, onEdit, copiedId, copiedEmailId }) {
  if (!show || !contact) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="enhanced-contact-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <div className="enhanced-contact-avatar">
          {getInitials(contact.name)}
        </div>
        
        <h3 className="enhanced-contact-name">{contact.name}</h3>
        
        <div className="enhanced-contact-phone">
          <div className="phone-label">Phone Number</div>
          <div className="phone-value-with-copy">
            <div className="phone-value">{contact.phone}</div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCopy(contact.phone, contact.id)
              }}
              className="btn-copy-modal"
              aria-label="Copy phone number"
              title="Copy phone number"
            >
              {copiedId === contact.id ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              )}
            </button>
          </div>
        </div>

        {contact.email && (
          <div className="enhanced-contact-phone">
            <div className="phone-label">Email</div>
            <div className="phone-value-with-copy">
              <a 
                href={`mailto:${contact.email}`}
                className="phone-value email-link-modal"
                onClick={(e) => e.stopPropagation()}
                target="_blank"
                rel="noopener noreferrer"
              >
                {contact.email}
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCopyEmail(contact.email, contact.id)
                }}
                className="btn-copy-modal"
                aria-label="Copy email address"
                title="Copy email address"
              >
                {copiedEmailId === contact.id ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
        
        <div className="enhanced-contact-actions">
          <button 
            className="action-btn edit-btn"
            onClick={() => onEdit(contact)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Contact
          </button>
          
          <button 
            className="action-btn delete-btn"
            onClick={() => onDelete(contact.id)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            Delete Contact
          </button>
        </div>
      </div>
    </div>
  )
}
