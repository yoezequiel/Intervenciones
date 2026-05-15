import React, { createContext, useContext, useState, useEffect } from "react";
import { getStoredUser, logout as apiLogout, deleteAccount as apiDeleteAccount } from "../services/firesyncApi";

const AuthContext = createContext(undefined);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        getStoredUser()
            .then((u) => setUser(u))
            .catch(() => setUser(null))
            .finally(() => setIsAuthReady(true));
    }, []);

    const signIn = (userData) => setUser(userData);

    const signOut = async () => {
        await apiLogout();
        setUser(null);
    };

    const removeAccount = async () => {
        await apiDeleteAccount();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthReady, signIn, signOut, removeAccount }}>
            {children}
        </AuthContext.Provider>
    );
};
