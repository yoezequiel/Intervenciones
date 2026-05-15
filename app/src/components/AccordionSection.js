import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Card, Title, IconButton, Surface, useTheme } from "react-native-paper";

const AccordionSection = ({ title, children, defaultExpanded = false, icon }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const theme = useTheme();
    
    // Animación simple de rotación para el chevron
    const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: expanded ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [expanded, rotateAnim]);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "180deg"],
    });

    return (
        <Card style={styles.card} mode="elevated" elevation={1}>
            <Surface 
                style={[
                    styles.header, 
                    expanded ? styles.headerExpanded : null,
                    { backgroundColor: theme.colors.surfaceVariant }
                ]}
                onTouchEnd={() => setExpanded(!expanded)}
            >
                <View style={styles.titleContainer}>
                    {icon && <IconButton icon={icon} size={24} style={styles.titleIcon} iconColor={theme.colors.primary} />}
                    <Title style={styles.title}>{title}</Title>
                </View>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <IconButton
                        icon="chevron-down"
                        size={24}
                        onPress={() => setExpanded(!expanded)}
                    />
                </Animated.View>
            </Surface>
            {expanded && (
                <Card.Content style={styles.content}>
                    {children}
                </Card.Content>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderRadius: 12,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 16,
        paddingRight: 8,
        paddingVertical: 4,
    },
    headerExpanded: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    titleIcon: {
        margin: 0,
        marginRight: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
    },
    content: {
        paddingTop: 16,
        paddingBottom: 16,
    },
});

export default AccordionSection;
