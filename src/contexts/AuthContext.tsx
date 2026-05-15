import { createContext, useContext, useEffect, useState } from "react";
import {
  authApi,
  setAuthToken,
  removeAuthToken,
  setUser,
  getUser,
} from "@/lib/api";
import { toast } from "sonner";

interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  isVerified: boolean;
  location?: {
    cityId: string;
    cityName: string;
    state: string;
    latitude: number;
    longitude: number;
  };
  preferences?: {
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      marketing: boolean;
    };
    language?: string;
    currency?: string;
    darkMode?: boolean;
    defaultLocation?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    const savedUser = getUser();
    if (savedUser) {
      setUserState(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (emailOrPhone: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authApi.login({ emailOrPhone, password });
      const data: AuthResponse = response.data || response;
      if (data.success) {
        setAuthToken(data.token!);
        setUser(data.user!);
        setUserState(data.user!);
        toast.success("Login successful!");
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Login failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(data);
      const resData: AuthResponse = response.data || response;
      if (resData.success) {
        setAuthToken(resData.token!);
        setUser(resData.user!);
        setUserState(resData.user!);
        toast.success("Registration successful!");
        return;
      }
      throw new Error(resData.message);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setUserState(null);
    toast.success("Logged out successfully!");
  };

  const updateUser = (userData: Partial<User>) => {
    const updatedUser = { ...user, ...userData } as User;
    setUser(updatedUser);
    setUserState(updatedUser);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
