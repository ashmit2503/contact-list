import { useState } from 'react'
import { highlightText } from '../utils/helpers.jsx'

export default function ContactList({ 
  contacts, 
  searchQuery, 
  onSearchChange, 
  onContactClick, 
  onCopyPhone, 
  onCopyEmail,
  onDeleteClick,
  onEditClick,
  copiedId,
  copiedEmailId,
  selectedContacts = [],
  onToggleSelect,
  onSelectAll,
  onBulkDelete,
  onExportContacts,
  onImportContacts
}) {
  const [sortOrder, setSortOrder] = useState('asc')
  const [hoveredCard, setHoveredCard] = useState(null)

  const hasSelections = selectedContacts.length > 0

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const nameA = a.name.toLowerCase()
    const nameB = b.name.toLowerCase()
    if (sortOrder === 'asc') {
      return nameA.localeCompare(nameB)
    } else {
      return nameB.localeCompare(nameA)
    }
  })

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="contacts-panel">
      <div className="contacts-header">
        <div className="search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="contacts-count-sort">
          <div className="contacts-count">
            <span className="count-number">{filteredContacts.length}</span>
            <span className="count-label">{filteredContacts.length === 1 ? 'Contact' : 'Contacts'}</span>
            {searchQuery && contacts.length !== filteredContacts.length && (
              <span className="count-total"> of {contacts.length}</span>
            )}
          </div>
          <div className="action-buttons">
            {hasSelections && (
              <button 
                className="select-all-button" 
                onClick={() => onSelectAll(sortedContacts.map(c => c.id))}
                title={selectedContacts.length === sortedContacts.length ? 'Deselect All' : 'Select All'}
              >
                {selectedContacts.length === sortedContacts.length ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4"></path>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  </svg>
                )}
                <span>{selectedContacts.length === sortedContacts.length ? 'Deselect All' : 'Select All'}</span>
              </button>
            )}
            <button 
              className="bulk-import-button" 
              onClick={onImportContacts}
              title="Import contacts from VCF file"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Import</span>
            </button>
            <button 
              className="bulk-export-button" 
              onClick={onExportContacts}
              disabled={!hasSelections}
              title={hasSelections ? `Export ${selectedContacts.length} contact(s) as VCF` : 'Select contacts to export'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <span>Export ({selectedContacts.length})</span>
            </button>
            <button 
              className="bulk-delete-button" 
              onClick={onBulkDelete}
              disabled={!hasSelections}
              title={hasSelections ? `Delete ${selectedContacts.length} contact(s)` : 'Select contacts to delete'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              <span>Delete ({selectedContacts.length})</span>
            </button>
            <button 
              className="sort-button" 
              onClick={toggleSortOrder}
              title={`Sort ${sortOrder === 'asc' ? 'Z-A' : 'A-Z'}`}
            >
              {sortOrder === 'asc' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5h4"></path>
                  <path d="M11 9h7"></path>
                  <path d="M11 13h10"></path>
                  <path d="m3 17 3 3 3-3"></path>
                  <path d="M6 18V4"></path>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5h10"></path>
                  <path d="M11 9h7"></path>
                  <path d="M11 13h4"></path>
                  <path d="m3 17 3 3 3-3"></path>
                  <path d="M6 4v14"></path>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="contacts-list">
        {sortedContacts.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <p>{searchQuery ? 'No contacts found' : 'No contacts yet. Add your first contact!'}</p>
          </div>
        ) : (
          sortedContacts.map(contact => {
            const isSelected = selectedContacts.includes(contact.id)
            const showCheckbox = hasSelections || hoveredCard === contact.id

            return (
              <div 
                key={contact.id} 
                className={`contact-card ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => setHoveredCard(contact.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => onContactClick(contact)}
              >
                <div 
                  className={`selection-bubble ${showCheckbox ? 'visible' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleSelect(contact.id)
                  }}
                >
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <div className="contact-info">
                  <h5>{highlightText(contact.name, searchQuery)}</h5>
                  <div className="phone-with-copy">
                    <p>{highlightText(contact.phone, searchQuery)}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCopyPhone(contact.phone, contact.id)
                      }}
                      className="btn-copy"
                      aria-label="Copy phone number"
                      title="Copy phone number"
                    >
                      {copiedId === contact.id ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                  {contact.email && (
                    <div className="phone-with-copy">
                      <a 
                        href={`mailto:${contact.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="email-link"
                        title="Send email"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {highlightText(contact.email, searchQuery)}
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onCopyEmail(contact.email, contact.id)
                        }}
                        className="btn-copy"
                        aria-label="Copy email address"
                        title="Copy email address"
                      >
                        {copiedEmailId === contact.id ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <div className="card-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditClick(contact)
                    }} 
                    className="btn-edit"
                    aria-label="Edit contact"
                    title="Edit contact"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteClick(contact.id)
                    }} 
                    className="btn-delete"
                    aria-label="Delete contact"
                    title="Delete contact"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
