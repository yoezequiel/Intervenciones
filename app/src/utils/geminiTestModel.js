const THINKING_CANDIDATES = {
    "gemini-3.1-pro-preview": [
        { thinkingConfig: { thinkingLevel: "high" },   label: "razonamiento máximo" },
        { thinkingConfig: { thinkingLevel: "medium" }, label: "razonamiento intermedio" },
        { thinkingConfig: { thinkingLevel: "low" },    label: "razonamiento mínimo" },
        { thinkingConfig: null,                        label: "modo básico" },
    ],
};

function getThinkingCandidates(modelId) {
    if (THINKING_CANDIDATES[modelId]) return THINKING_CANDIDATES[modelId];

    if (modelId.startsWith("gemini-3")) {
        return [
            { thinkingConfig: { thinkingLevel: "high" },    label: "razonamiento máximo" },
            { thinkingConfig: { thinkingLevel: "medium" },  label: "razonamiento intermedio" },
            { thinkingConfig: { thinkingLevel: "low" },     label: "razonamiento mínimo" },
            { thinkingConfig: { thinkingLevel: "minimal" }, label: "razonamiento básico" },
        ];
    }
    if (modelId.startsWith("gemini-2.5-pro")) {
        return [
            { thinkingConfig: { thinkingBudget: -1 }, label: "razonamiento dinámico" },
            { thinkingConfig: null,                   label: "modo estándar" },
        ];
    }
    if (modelId.startsWith("gemini-2.5")) {
        return [
            { thinkingConfig: { thinkingBudget: -1 }, label: "razonamiento dinámico" },
            { thinkingConfig: { thinkingBudget: 0 },  label: "modo estándar" },
        ];
    }
    return [
        { thinkingConfig: null, label: "modo estándar" },
    ];
}

export async function testGeminiModel(modelId, apiKey, onProgress) {
    const candidates = getThinkingCandidates(modelId);

    for (const candidate of candidates) {
        onProgress?.(candidate.label);

        const generationConfig = { maxOutputTokens: 10 };
        if (candidate.thinkingConfig) {
            generationConfig.thinkingConfig = candidate.thinkingConfig;
        }

        let response;
        try {
            response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": apiKey,
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "Respondé con la palabra OK." }] }],
                        generationConfig,
                    }),
                }
            );
        } catch {
            throw new Error("Sin conexión a internet. Verificá tu conexión e intentá de nuevo.");
        }

        if (response.ok) {
            const data = await response.json().catch(() => ({}));
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return { thinkingConfig: candidate.thinkingConfig, label: candidate.label };
            }
            continue;
        }

        await response.json().catch(() => ({}));

        if (response.status === 401 || response.status === 403) {
            throw new Error("La API key no es válida o no tiene permiso para este modelo. Revisala en Configuración.");
        }
        if (response.status === 404) {
            throw new Error("Este modelo no está disponible en tu región o cuenta. Probá con otro modelo.");
        }
        if (response.status === 429) {
            throw new Error("Superaste el límite de consultas de Google. Esperá unos minutos e intentá de nuevo.");
        }
        if (response.status >= 500) {
            throw new Error("Los servidores de Google están teniendo problemas ahora mismo. Intentá más tarde.");
        }
        // 400 = this thinking level not supported for this model, try next candidate
    }

    throw new Error("Este modelo no está disponible con ninguna configuración de razonamiento. Probá con otro modelo.");
}
