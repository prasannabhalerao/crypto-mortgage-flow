
import React, { createContext, useState, useContext, useEffect } from "react";

interface User {
  id: string;
  username: string;
  address: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserAddress: (address: string) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // For MVP, we'll use localStorage to persist the user
  useEffect(() => {
    const storedUser = localStorage.getItem("mortgageUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Simple login function (for MVP)
  const login = async (username: string, password: string) => {
    // This is a simple mock login for MVP
    // In a real app, you'd validate against a backend
    if (username === "admin" && password === "admin") {
      const adminUser: User = {
        id: "admin1",
        username: "admin",
        address: null,
        isAdmin: true
      };
      setCurrentUser(adminUser);
      localStorage.setItem("mortgageUser", JSON.stringify(adminUser));
    } else {
      // Regular user login
      const user: User = {
        id: `user_${Date.now()}`,
        username,
        address: null,
        isAdmin: false
      };
      setCurrentUser(user);
      localStorage.setItem("mortgageUser", JSON.stringify(user));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("mortgageUser");
  };

  const updateUserAddress = (address: string) => {
    if (currentUser) {
      const updatedUser = { ...currentUser, address };
      setCurrentUser(updatedUser);
      localStorage.setItem("mortgageUser", JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        login, 
        logout, 
        updateUserAddress,
        isAuthenticated: !!currentUser,
        isAdmin: currentUser?.isAdmin || false
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
