import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

/**
 * Genera un PDF profesional para una intervención de bomberos
 * @param {Object} intervention - El objeto de la intervención
 * @returns {Promise<void>}
 */
export const generateInterventionPDF = async (intervention, communication = null) => {
    try {
        const formatDate = (dateString) => {
            if (!dateString) return "No especificada";
            try {
                return new Date(dateString).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                });
            } catch (e) {
                return dateString;
            }
        };

        const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @page {
            margin: 20mm;
        }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .header {
            border-bottom: 2px solid #b71c1c;
            padding-bottom: 10px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .header-title {
            color: #b71c1c;
            margin: 0;
            font-size: 24px;
            text-transform: uppercase;
        }
        .report-id {
            font-size: 14px;
            color: #666;
        }
        .section {
            margin-bottom: 25px;
        }
        .section-title {
            background-color: #f5f5f5;
            padding: 5px 10px;
            font-size: 18px;
            font-weight: bold;
            color: #b71c1c;
            border-left: 4px solid #b71c1c;
            margin-bottom: 10px;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .label {
            font-weight: bold;
            color: #555;
            display: block;
            font-size: 12px;
            text-transform: uppercase;
        }
        .value {
            font-size: 16px;
            color: #000;
        }
        .notes-box {
            background-color: #fffde7;
            border: 1px solid #fff59d;
            padding: 15px;
            border-radius: 4px;
            min-height: 100px;
            white-space: pre-wrap;
        }
        .photo-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 10px;
        }
        .photo-item {
            border: 1px solid #ddd;
            padding: 5px;
            border-radius: 4px;
            text-align: center;
        }
        .photo-img {
            max-width: 100%;
            max-height: 200px;
            object-fit: contain;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        table th {
            background-color: #f2f2f2;
            font-size: 12px;
        }
        .footer {
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            font-size: 10px;
            color: #999;
            text-align: center;
        }
        .signature-row {
            margin-top: 60px;
            display: flex;
            justify-content: space-around;
        }
        .signature-box {
            border-top: 1px solid #000;
            width: 200px;
            text-align: center;
            padding-top: 5px;
            font-size: 12px;
        }
        .comm-section-title {
            background-color: #e3f2fd;
            padding: 5px 10px;
            font-size: 18px;
            font-weight: bold;
            color: #1565C0;
            border-left: 4px solid #1565C0;
            margin-bottom: 10px;
        }
        .comm-badge {
            display: inline-block;
            background-color: #1565C0;
            color: white;
            font-size: 11px;
            font-weight: bold;
            padding: 2px 10px;
            border-radius: 12px;
            text-transform: uppercase;
            margin-bottom: 12px;
        }
        .comm-notes-box {
            background-color: #e8f4fd;
            border: 1px solid #bbdefb;
            padding: 12px 15px;
            border-radius: 4px;
            margin-top: 10px;
            white-space: pre-wrap;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1 class="header-title">Informe de Intervención</h1>
            <div class="report-id">Registro N°: ${intervention.id || '---'}</div>
        </div>
        <div style="text-align: right">
            <div class="value" style="font-weight: bold">CUERPO DE BOMBEROS</div>
            <div class="report-id">${formatDate(intervention.createdAt)}</div>
        </div>
    </div>

    <div class="section">
        <div class="section-title">Datos Generales</div>
        <div class="grid">
            <div class="info-item">
                <span class="label">Tipo de Intervención</span>
                <span class="value">${intervention.type}</span>
            </div>
            <div class="info-item">
                <span class="label">Ubicación</span>
                <span class="value">${intervention.address || "No especificada"}</span>
            </div>
        </div>
    </div>

    ${communication ? `
    <div class="section">
        <div class="comm-section-title">Comunicación de Origen</div>
        <span class="comm-badge">Ref. Comunicación N° ${communication.id}</span>
        <div class="grid">
            <div class="info-item">
                <span class="label">Llamante</span>
                <span class="value">${communication.callerName || 'No registrado'}</span>
            </div>
            <div class="info-item">
                <span class="label">Teléfono</span>
                <span class="value">${communication.callerPhone || 'No registrado'}</span>
            </div>
            <div class="info-item">
                <span class="label">Hora del Llamado</span>
                <span class="value">${communication.time || '--:--'}</span>
            </div>
            <div class="info-item">
                <span class="label">Tipo Reportado</span>
                <span class="value">${communication.incidentType || 'Sin definir'}</span>
            </div>
            ${communication.address ? `
            <div class="info-item" style="grid-column: span 2">
                <span class="label">Dirección Reportada</span>
                <span class="value">${communication.address}</span>
            </div>
            ` : ''}
        </div>
        ${communication.notes ? `
        <div class="comm-notes-box"><strong>Observaciones:</strong> ${communication.notes}</div>
        ` : ''}
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">Cronología de Tiempos</div>
        <div class="grid" style="grid-template-columns: 1fr 1fr 1fr">
            <div class="info-item">
                <span class="label">Hora de Llamado</span>
                <span class="value">${intervention.callTime || "--:--"}</span>
            </div>
            <div class="info-item">
                <span class="label">Hora de Salida</span>
                <span class="value">${intervention.departureTime || "--:--"}</span>
            </div>
            <div class="info-item">
                <span class="label">Hora de Regreso</span>
                <span class="value">${intervention.returnTime || "--:--"}</span>
            </div>
        </div>
    </div>

    ${intervention.fieldNotes ? `
    <div class="section">
        <div class="section-title">Detalles y Notas de Campo</div>
        <div class="notes-box">${intervention.fieldNotes}</div>
    </div>
    ` : ''}

    ${intervention.otherServices && intervention.otherServices.length > 0 ? `
    <div class="section">
        <div class="section-title">Servicios Intervinientes</div>
        <table>
            <thead>
                <tr>
                    <th>Servicio / Fuerza</th>
                    <th>Móviles / IDs</th>
                    <th>Personal a Cargo</th>
                </tr>
            </thead>
            <tbody>
                ${intervention.otherServices.map(s => `
                    <tr>
                        <td>${s.type}</td>
                        <td>${s.ids || '---'}</td>
                        <td>${s.personnel || '---'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${(intervention.victims && intervention.victims.length > 0) || (intervention.witnesses && intervention.witnesses.length > 0) ? `
    <div class="section">
        <div class="section-title">Personas Involucradas</div>
        <table>
            <thead>
                <tr>
                    <th>Nombre y Apellido</th>
                    <th>DNI / Edad</th>
                    <th>Rol / Condición</th>
                </tr>
            </thead>
            <tbody>
                ${intervention.victims ? intervention.victims.map(v => `
                    <tr>
                        <td>${v.name || 'S/N'}</td>
                        <td>${v.dni || '---'} / ${v.age ? v.age + ' años' : '---'}</td>
                        <td>Víctima - ${v.description || 'Sin datos'}</td>
                    </tr>
                `).join('') : ''}
                ${intervention.witnesses ? intervention.witnesses.map(w => {
                    const isString = typeof w === "string";
                    return `
                        <tr>
                            <td>${isString ? w : (w.name || 'S/N')}</td>
                            <td>${isString ? '---' : (w.dni || '---')} / ${(!isString && w.age) ? w.age + ' años' : '---'}</td>
                            <td>Testigo - ${(!isString && w.description) ? w.description : '---'}</td>
                        </tr>
                    `;
                }).join('') : ''}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${intervention.report ? `
    <div class="section">
        <div class="section-title">Resumen de Actuación (IA)</div>
        <div style="font-style: italic; font-size: 14px; text-align: justify">
            ${intervention.report}
        </div>
    </div>
    ` : ''}

    ${intervention.photos && intervention.photos.length > 0 ? `
    <div class="section">
        <div class="section-title">Evidencia Fotográfica</div>
        <div class="photo-grid">
            ${intervention.photos.map(uri => `
                <div class="photo-item">
                    <img src="${uri}" class="photo-img" />
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    <div class="signature-row">
        <div class="signature-box">Oficial a Cargo</div>
        <div class="signature-box">Responsable de Guardia</div>
    </div>

    <div class="footer">
        Documento generado automáticamente por Sistema de Gestión de Intervenciones Bomberos.
        <br>Fecha de impresión: ${new Date().toLocaleString('es-AR')}
    </div>
</body>
</html>
        `;

        // Generar el PDF
        const { uri } = await Print.printToFileAsync({
            html,
            base64: false
        });

        console.log("PDF generado en:", uri);

        // Compartir el PDF
        if (Platform.OS === "ios") {
            await Sharing.shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
        } else {
            await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
        }

    } catch (error) {
        console.error("Error generando PDF:", error);
        throw error;
    }
};
