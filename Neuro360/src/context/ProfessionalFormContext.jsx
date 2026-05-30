import React, { createContext, useContext, useState } from 'react';
import ProfessionalFormPopup from '../components/ProfessionalFormPopup';

const ProfessionalFormContext = createContext();

export const useProfessionalForm = () => {
  const context = useContext(ProfessionalFormContext);
  if (!context) {
    throw new Error('useProfessionalForm must be used within a ProfessionalFormProvider');
  }
  return context;
};

export const ProfessionalFormProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openProfessionalForm = () => setIsOpen(true);
  const closeProfessionalForm = () => setIsOpen(false);

  return (
    <ProfessionalFormContext.Provider value={{ isOpen, openProfessionalForm, closeProfessionalForm }}>
      {children}
      <ProfessionalFormPopup isOpen={isOpen} onClose={closeProfessionalForm} />
    </ProfessionalFormContext.Provider>
  );
};

export default ProfessionalFormContext;
