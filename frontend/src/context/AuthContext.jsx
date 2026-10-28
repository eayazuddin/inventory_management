import { createContext, useState, useContext, useCallback } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(()=>{
    const storedUser = localStorage.getItem("pos-user");
    return storedUser ? JSON.parse(storedUser) : null;
  })


   const login = (userData, token)=>{
    setUser(userData);
    localStorage.setItem("pos-user",JSON.stringify(userData));
    localStorage.setItem("pos-token",token);
   }

   const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem("pos-user", JSON.stringify(updatedUser));
   }

    const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("pos-user");
    localStorage.removeItem("pos-token");
   }, []);


   return(
     <AuthContext.Provider value={{user, login, logout, updateUser}}>
     {children}
     </AuthContext.Provider>
   )
}


export const useAuth = () => useContext(AuthContext);
export default AuthProvider;