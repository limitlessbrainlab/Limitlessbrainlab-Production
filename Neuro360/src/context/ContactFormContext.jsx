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

  const openContactForm = () => setIsOpen(true);
  const closeContactForm = () => setIsOpen(false);

  return (
    <ContactFormContext.Provider value={{ isOpen, openContactForm, closeContactForm }}>
      {children}
      <ContactFormPopup isOpen={isOpen} onClose={closeContactForm} />
    </ContactFormContext.Provider>
  );
};

export default ContactFormContext;
