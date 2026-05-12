import React, { createContext, useContext, useState, useCallback } from "react";
import AppModal from "../components/AppModal";

const ModalCtx = createContext(null);

export const ModalProvider = ({ children }) => {
    const [config, setConfig] = useState(null);

    const showModal = useCallback((cfg) => setConfig(cfg), []);
    const hideModal = useCallback(() => setConfig(null), []);

    return (
        <ModalCtx.Provider value={showModal}>
            {children}
            <AppModal visible={!!config} config={config} onDismiss={hideModal} />
        </ModalCtx.Provider>
    );
};

export const useModal = () => {
    const ctx = useContext(ModalCtx);
    if (!ctx) throw new Error("useModal must be used within ModalProvider");
    return ctx;
};
