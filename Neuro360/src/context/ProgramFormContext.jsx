import React, { createContext, useContext, useState } from 'react';
import ProgramFormPopup from '../components/ProgramFormPopup';

const ProgramFormContext = createContext();

export const useProgramForm = () => {
  const context = useContext(ProgramFormContext);
  if (!context) {
    throw new Error('useProgramForm must be used within a ProgramFormProvider');
  }
  return context;
};

export const ProgramFormProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openProgramForm = () => setIsOpen(true);
  const closeProgramForm = () => setIsOpen(false);

  return (
    <ProgramFormContext.Provider value={{ isOpen, openProgramForm, closeProgramForm }}>
      {children}
      <ProgramFormPopup isOpen={isOpen} onClose={closeProgramForm} />
    </ProgramFormContext.Provider>
  );
};

export default ProgramFormContext;
