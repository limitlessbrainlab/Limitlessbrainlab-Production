import React, { createContext, useContext, useState } from 'react';
import LocationsPopup from '../components/LocationsPopup';

const LocationsPopupContext = createContext();

export const useLocationsPopup = () => {
  const context = useContext(LocationsPopupContext);
  if (!context) {
    throw new Error('useLocationsPopup must be used within a LocationsPopupProvider');
  }
  return context;
};

export const LocationsPopupProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openLocationsPopup = () => setIsOpen(true);
  const closeLocationsPopup = () => setIsOpen(false);

  return (
    <LocationsPopupContext.Provider value={{ isOpen, openLocationsPopup, closeLocationsPopup }}>
      {children}
      <LocationsPopup isOpen={isOpen} onClose={closeLocationsPopup} />
    </LocationsPopupContext.Provider>
  );
};

export default LocationsPopupContext;
