import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Title, IconButton } from "react-native-paper";

const AccordionSection = ({ title, children, defaultExpanded = false }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <Card style={styles.card}>
            <View style={styles.header}>
                <Title style={styles.title}>{title}</Title>
                <IconButton
                    icon={expanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    onPress={() => setExpanded(!expanded)}
                />
            </View>
            {expanded && <Card.Content>{children}</Card.Content>}
        </Card>
    );
};

const styles = StyleSheet.create({
    card: {
        margin: 16,
        marginBottom: 8,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 16,
        paddingRight: 8,
        paddingVertical: 8,
    },
    title: {
        fontSize: 18,
        marginBottom: 0,
    },
});

export default AccordionSection;
