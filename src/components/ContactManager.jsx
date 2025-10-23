import { useState, useEffect, useRef } from 'react'
import ContactForm from './ContactForm'
import ContactList from './ContactList'
import DeleteModal from './DeleteModal'
import ContactDetailModal from './ContactDetailModal'
import EditContactModal from './EditContactModal'
import { contactsAPI } from '../utils/api'
import { parseVCF } from '../utils/helpers'
import { countryCodes } from '../utils/constants'

export default function ContactManager() {
  const [contacts, setContacts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteContactId, setDeleteContactId] = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [editContact, setEditContact] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [copiedEmailId, setCopiedEmailId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedContacts, setSelectedContacts] = useState([])
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      const fetchedContacts = await contactsAPI.getAll()
      const transformedContacts = fetchedContacts.map(contact => {
        const phoneDigits = String(contact.phone || '').replace(/\D/g, '')
        const candidates = countryCodes
          .map(c => ({ code: c.code, d: c.code.replace(/\D/g, '') }))
          .filter(x => phoneDigits.startsWith(x.d))
          .sort((a,b) => b.d.length - a.d.length)
        const inferredCode = candidates[0]?.code
        const countryCode = contact.country_code || inferredCode || '+91'
        const ccDigits = String(countryCode).replace(/\D/g, '')
        const displayPhone = ccDigits && !phoneDigits.startsWith(ccDigits)
          ? `${countryCode} ${phoneDigits}`
          : (contact.phone || `${countryCode} ${phoneDigits}`)
        return {
          id: contact.id,
          name: contact.name,
          phone: displayPhone,
          countryCode,
          email: contact.email
        }
      })
      setContacts(transformedContacts)
    } catch (err) {
      console.error('Failed to fetch contacts:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = async (contact) => {
    try {
      const newContact = await contactsAPI.add({
        name: contact.name,
        phone: contact.phone,
        countryCode: contact.countryCode,
        email: contact.email
      })
      const transformedContact = {
        id: newContact.id,
        name: newContact.name,
        phone: newContact.phone,
        countryCode: newContact.country_code,
        email: newContact.email
      }
      setContacts([transformedContact, ...contacts])
    } catch (err) {
      console.error('Failed to add contact:', err)
      throw err
    }
  }

  const confirmDelete = async () => {
    try {
      if (bulkDeleteMode) {
        await contactsAPI.bulkDelete(selectedContacts)
        setContacts(contacts.filter(c => !selectedContacts.includes(c.id)))
        setSelectedContacts([])
        setBulkDeleteMode(false)
      } else {
        await contactsAPI.delete(deleteContactId)
        setContacts(contacts.filter(c => c.id !== deleteContactId))
      }
      setDeleteContactId(null)
    } catch (err) {
      console.error('Failed to delete contact:', err)
      alert('Failed to delete contact(s). Please try again.')
    }
  }

  const handleToggleSelect = (contactId) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId)
      } else {
        return [...prev, contactId]
      }
    })
  }

  const handleSelectAll = (filteredContactIds) => {
    if (selectedContacts.length === filteredContactIds.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContactIds)
    }
  }

  const handleBulkDelete = () => {
    if (selectedContacts.length > 0) {
      setBulkDeleteMode(true)
      setDeleteContactId('bulk')
    }
  }

  const handleExportContacts = () => {
    if (selectedContacts.length === 0) return

    const contactsToExport = contacts.filter(c => selectedContacts.includes(c.id))

    const toE164 = (countryCode, phone) => {
      const cc = String(countryCode || '').replace(/\D/g, '')
      let digits = String(phone || '').replace(/\D/g, '')
      if (!digits) return ''
      if (cc && digits.startsWith(cc)) {
        return `+${digits}`
      }
      return cc ? `+${cc}${digits}` : `+${digits}`
    }

    const vcfContent = contactsToExport.map(contact => {
      const fullName = contact.name || ''
      const email = (contact.email || '').trim()
      const e164 = toE164(contact.countryCode, contact.phone)
      const uid = `${contact.id}@contact-list`

      let vcf = 'BEGIN:VCARD\r\n'
      vcf += 'VERSION:3.0\r\n'
      vcf += `UID:${uid}\r\n`
      vcf += `N:;${fullName};;;\r\n`
      vcf += `FN:${fullName}\r\n`
      if (e164) {
        vcf += `TEL;TYPE=CELL:${e164}\r\n`
      }
      if (email) {
        vcf += `EMAIL:${email}\r\n`
      }
      vcf += 'END:VCARD\r\n'
      return vcf
    }).join('')

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = selectedContacts.length === 1 
      ? `${contactsToExport[0].name.replace(/[^a-z0-9]/gi, '_')}.vcf`
      : `contacts_${selectedContacts.length}.vcf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    setSelectedContacts([])
  }

  const handleImportContacts = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.vcf')) {
      alert('Please select a valid VCF file')
      event.target.value = ''
      return
    }

    try {
      const content = await file.text()
      
      const parsedContacts = parseVCF(content)
      
      if (parsedContacts.length === 0) {
        alert('No valid contacts found in the VCF file')
        event.target.value = ''
        return
      }

      const confirmImport = window.confirm(
        `Found ${parsedContacts.length} contact(s) in the file. Do you want to import them?`
      )

      if (!confirmImport) {
        event.target.value = ''
        return
      }

      const normalizedForServer = parsedContacts.map(c => ({
        name: c.name,
        countryCode: c.countryCode,
        phone: `${c.countryCode} ${String(c.phone || '').replace(/\D/g, '')}`,
        email: c.email || null
      }))

      const result = await contactsAPI.bulkCreate(normalizedForServer)
      
      const transformedContacts = result.contacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        phone: contact.phone,
        countryCode: contact.country_code,
        email: contact.email
      }))

      setContacts([...transformedContacts, ...contacts])
      
      let message = `Successfully imported ${result.importedCount} contact(s)`
      if (result.skippedCount > 0) {
        message += `\n${result.skippedCount} contact(s) were skipped due to validation errors.`
      }
      alert(message)

    } catch (err) {
      console.error('Failed to import contacts:', err)
      alert(`Failed to import contacts: ${err.message}`)
    } finally {
      event.target.value = ''
    }
  }

  const handleCancelDelete = () => {
    setDeleteContactId(null)
    setBulkDeleteMode(false)
  }

  const handleCopyPhone = async (phone, id) => {
    try {
      await navigator.clipboard.writeText(phone)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleCopyEmail = async (email, id) => {
    try {
      await navigator.clipboard.writeText(email)
      setCopiedEmailId(id)
      setTimeout(() => setCopiedEmailId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDeleteFromDetailView = (id) => {
    setSelectedContact(null)
    setDeleteContactId(id)
  }

  const handleUpdateContact = async (updatedContactData) => {
    try {
      const combinedPhone = `${updatedContactData.countryCode} ${String(updatedContactData.phone || '').replace(/\D/g, '')}`
      const updatedContact = await contactsAPI.update(updatedContactData.id, {
        name: updatedContactData.name,
        phone: combinedPhone,
        countryCode: updatedContactData.countryCode,
        email: updatedContactData.email
      })
      
      const transformedContact = {
        id: updatedContact.id,
        name: updatedContact.name,
        phone: updatedContact.phone,
        countryCode: updatedContact.country_code,
        email: updatedContact.email
      }
      
      setContacts(contacts.map(c => c.id === transformedContact.id ? transformedContact : c))
      setEditContact(null)
    } catch (err) {
      console.error('Failed to update contact:', err)
      throw err
    }
  }

  const handleEditFromDetailView = (contact) => {
    setSelectedContact(null)
    setEditContact(contact)
  }

  return (
    <>
      {loading ? (
        <div className="loading-container">
          Loading contacts...
        </div>
      ) : error ? (
        <div className="error-container">
          Error: {error}
        </div>
      ) : (
        <div className="contact-container">
          <ContactForm onAddContact={handleAddContact} contacts={contacts} />
          
          <ContactList
            contacts={contacts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onContactClick={setSelectedContact}
            onCopyPhone={handleCopyPhone}
            onCopyEmail={handleCopyEmail}
            onDeleteClick={setDeleteContactId}
            onEditClick={setEditContact}
            copiedId={copiedId}
            copiedEmailId={copiedEmailId}
            selectedContacts={selectedContacts}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onBulkDelete={handleBulkDelete}
            onExportContacts={handleExportContacts}
            onImportContacts={handleImportContacts}
          />
          
          <input
            type="file"
            ref={fileInputRef}
            accept=".vcf"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      )}

      <DeleteModal
        show={!!deleteContactId}
        onConfirm={confirmDelete}
        onCancel={handleCancelDelete}
        isBulk={bulkDeleteMode}
        count={bulkDeleteMode ? selectedContacts.length : 1}
      />

      <ContactDetailModal
        contact={selectedContact}
        show={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onCopy={handleCopyPhone}
        onCopyEmail={handleCopyEmail}
        onDelete={handleDeleteFromDetailView}
        onEdit={handleEditFromDetailView}
        copiedId={copiedId}
        copiedEmailId={copiedEmailId}
      />

      <EditContactModal
        contact={editContact}
        show={!!editContact}
        onClose={() => setEditContact(null)}
        onUpdate={handleUpdateContact}
      />
    </>
  )
}
