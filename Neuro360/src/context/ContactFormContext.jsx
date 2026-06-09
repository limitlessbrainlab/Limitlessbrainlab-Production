import React, { createContext, useContext, useState } from 'react';
import ContactFormPopup from '../components/ContactFormPopup';

const ContactFormContext = createContext();

export const useContactForm = () => {
  const context = useContext(ContactFormContext);
  if (!context) {
    throw new Error('useContactForm must be used within a ContactFormProvider');
  }
  return context;
};

export const ContactFormProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState(null);

  const openContactForm = (src = null) => { setSource(src); setIsOpen(true); };
  const closeContactForm = () => { setIsOpen(false); setSource(null); };

  return (
    <ContactFormContext.Provider value={{ isOpen, openContactForm, closeContactForm }}>
      {children}
      <ContactFormPopup isOpen={isOpen} onClose={closeContactForm} source={source} />
    </ContactFormContext.Provider>
  );
};

export default ContactFormContext;
