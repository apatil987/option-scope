import { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }) {
  const [userInfo, setUserInfo] = useState(null);

  const updateUser = (newData) => {
    setUserInfo((prev) => ({ ...prev, ...newData }));
  };

  return (
    <UserContext.Provider value={{ userInfo, setUserInfo, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}
