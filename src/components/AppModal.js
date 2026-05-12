import React from "react";
import { StyleSheet, View } from "react-native";
import { Dialog, Portal, Text, Button, Divider, useTheme } from "react-native-paper";

const ICON_META = {
    success: { icon: "check-circle-outline", color: "#2e7d32" },
    error:   { icon: "alert-circle-outline",  color: null },
    warning: { icon: "alert-outline",          color: "#E65100" },
    confirm: { icon: "help-circle-outline",    color: null },
    info:    { icon: "information-outline",    color: null },
};

const AppModal = ({ visible, config, onDismiss }) => {
    const theme = useTheme();
    if (!config) return null;

    const meta = ICON_META[config.type] || ICON_META.info;
    const iconColor = meta.color
        || (config.type === "error" ? theme.colors.error : theme.colors.primary);

    const handleConfirm = () => {
        onDismiss();
        config.onConfirm?.();
    };

    const handleCancel = () => {
        onDismiss();
        config.onCancel?.();
    };

    const isDismissable = config.dismissable !== false;

    // Options-list variant (multiple actions)
    if (config.type === "options") {
        return (
            <Portal>
                <Dialog
                    visible={visible}
                    onDismiss={handleCancel}
                    style={styles.dialog}
                >
                    {config.title ? (
                        <Dialog.Title style={styles.centeredTitle}>{config.title}</Dialog.Title>
                    ) : null}
                    <Dialog.Content style={styles.optionsContent}>
                        {config.options.map((opt, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <Divider style={styles.optionDivider} />}
                                <Button
                                    mode="text"
                                    icon={opt.icon}
                                    onPress={() => { onDismiss(); opt.onPress?.(); }}
                                    textColor={opt.destructive ? theme.colors.error : theme.colors.primary}
                                    contentStyle={styles.optionContent}
                                    style={styles.optionButton}
                                >
                                    {opt.label}
                                </Button>
                            </React.Fragment>
                        ))}
                    </Dialog.Content>
                </Dialog>
            </Portal>
        );
    }

    // Standard modal (info / success / error / warning / confirm)
    return (
        <Portal>
            <Dialog
                visible={visible}
                onDismiss={isDismissable ? handleCancel : undefined}
                style={styles.dialog}
            >
                <Dialog.Icon icon={meta.icon} size={44} color={iconColor} />
                {config.title ? (
                    <Dialog.Title style={styles.centeredTitle}>{config.title}</Dialog.Title>
                ) : null}
                {config.message ? (
                    <Dialog.Content>
                        <Text
                            variant="bodyMedium"
                            style={[styles.message, { color: theme.colors.onSurfaceVariant }]}
                        >
                            {config.message}
                        </Text>
                    </Dialog.Content>
                ) : null}
                <Dialog.Actions style={styles.actions}>
                    {config.type === "confirm" && (
                        <Button
                            onPress={handleCancel}
                            textColor={theme.colors.onSurfaceVariant}
                            style={styles.actionBtn}
                        >
                            {config.cancelLabel || "Cancelar"}
                        </Button>
                    )}
                    <Button
                        mode="contained"
                        onPress={handleConfirm}
                        buttonColor={config.confirmDestructive ? theme.colors.error : undefined}
                        style={styles.actionBtn}
                    >
                        {config.confirmLabel || (config.type === "confirm" ? "Confirmar" : "Entendido")}
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    dialog: {
        borderRadius: 20,
        marginHorizontal: 24,
    },
    centeredTitle: {
        textAlign: "center",
    },
    message: {
        textAlign: "center",
        lineHeight: 22,
    },
    actions: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 8,
        justifyContent: "flex-end",
    },
    actionBtn: {
        borderRadius: 8,
        minWidth: 90,
    },
    optionsContent: {
        paddingHorizontal: 0,
        paddingBottom: 8,
    },
    optionDivider: {
        marginVertical: 2,
    },
    optionButton: {
        borderRadius: 0,
    },
    optionContent: {
        justifyContent: "flex-start",
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
});

export default AppModal;
