export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

export const highlightText = (text, query) => {
  if (!query.trim()) return text
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'))
  return parts.map((part, index) => 
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="highlight">{part}</mark>
    ) : (
      part
    )
  )
}

export const parseVCF = (vcfContent) => {
  const contacts = []
  
  const vCards = vcfContent.split(/BEGIN:VCARD/i).filter(card => card.trim())
  
  vCards.forEach(vCardContent => {
    const lines = vCardContent.split(/\r?\n/).filter(line => line.trim())
    
    let name = ''
    let phone = ''
    let email = ''
    let countryCode = ''
    
    lines.forEach(line => {
      const trimmedLine = line.trim()
      
      if (trimmedLine.startsWith('FN:')) {
        name = trimmedLine.substring(3).trim()
      }
      
      if (trimmedLine.startsWith('TEL')) {
        const phoneMatch = trimmedLine.match(/:(.*?)$/)
        if (phoneMatch) {
          let fullPhone = phoneMatch[1].trim().replace(/\s+/g, '')
          
          if (fullPhone.startsWith('+')) {
            fullPhone = fullPhone.substring(1)
            
            const countryCodePatterns = [
              { code: '+1', length: 1, phoneLength: 10 },      // US/Canada
              { code: '+91', length: 2, phoneLength: 10 },     // India
              { code: '+44', length: 2, phoneLength: 10 },     // UK
              { code: '+61', length: 2, phoneLength: 9 },      // Australia
              { code: '+81', length: 2, phoneLength: 10 },     // Japan
              { code: '+86', length: 2, phoneLength: 11 },     // China
              { code: '+33', length: 2, phoneLength: 9 },      // France
              { code: '+49', length: 2, phoneLength: 10 },     // Germany
            ]
            
            let matched = false
            for (const pattern of countryCodePatterns) {
              const cc = fullPhone.substring(0, pattern.length)
              if (pattern.code === `+${cc}`) {
                countryCode = pattern.code
                phone = fullPhone.substring(pattern.length)
                matched = true
                break
              }
            }
            
            if (!matched) {
              if (fullPhone.length > 10) {
                countryCode = `+${fullPhone.substring(0, fullPhone.length - 10)}`
                phone = fullPhone.substring(fullPhone.length - 10)
              } else {
                countryCode = '+91'
                phone = fullPhone
              }
            }
          } else {
            countryCode = '+91'
            phone = fullPhone
          }
        }
      }
      
      if (trimmedLine.startsWith('EMAIL')) {
        const emailMatch = trimmedLine.match(/:(.*?)$/)
        if (emailMatch) {
          email = emailMatch[1].trim()
        }
      }
    })
    
    if (name && phone) {
      contacts.push({
        name: name,
        phone: phone,
        countryCode: countryCode,
        email: email || ''
      })
    }
  })
  
  return contacts
}
