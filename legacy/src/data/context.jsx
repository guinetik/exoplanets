import React, { useEffect, useState } from 'react';
import FirebaseData from './db';
//
export const AuthContext = React.createContext();
/**
 * Creates an AuthProvider tied to our AuthContext.
 * Whenever the firebase auth state changes, this component will re-render, setting the user state.
 * @param {Object} props - component props
 * @returns JSX.Element
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    FirebaseData.auth.onAuthStateChanged(setUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};
