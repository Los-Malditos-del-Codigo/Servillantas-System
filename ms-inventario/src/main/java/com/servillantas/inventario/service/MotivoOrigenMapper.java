package com.servillantas.inventario.service;

import java.text.Normalizer;

/**
 * Traduce el motivo enviado por el frontend (texto libre controlado) al valor
 * permitido por el CHECK de movimientos_inventario.origen, y viceversa.
 */
public final class MotivoOrigenMapper {

    private MotivoOrigenMapper() {
    }

    public static String origenEntrada(String motivo) {
        String m = normalizar(motivo);
        if (m == null || m.startsWith("otro")) {
            return "MANUAL";
        }
        return switch (m) {
            case "compra" -> "COMPRA";
            case "devolucion de cliente" -> "DEVOLUCION_VENTA";
            case "anulacion de venta" -> "VENTA_ANULADA";
            case "anulacion de servicio" -> "SERVICIO_ANULADO";
            case "ajuste de inventario" -> "AJUSTE";
            default -> "MANUAL";
        };
    }

    public static String origenSalida(String motivo) {
        String m = normalizar(motivo);
        if (m == null || m.startsWith("otro")) {
            return "MANUAL";
        }
        return switch (m) {
            case "venta" -> "VENTA";
            case "uso en servicio de taller" -> "SERVICIO";
            case "ajuste de inventario" -> "AJUSTE";
            default -> "MANUAL";
        };
    }

    public static String motivoLegible(String origen) {
        if (origen == null) {
            return "Otro";
        }
        return switch (origen) {
            case "COMPRA" -> "Compra";
            case "DEVOLUCION_VENTA" -> "Devolución de cliente";
            case "VENTA_ANULADA" -> "Anulación de venta";
            case "SERVICIO_ANULADO" -> "Anulación de servicio";
            case "VENTA" -> "Venta";
            case "SERVICIO" -> "Uso en servicio de taller";
            case "AJUSTE" -> "Ajuste de inventario";
            case "COMPENSACION" -> "Compensación";
            case "INICIAL" -> "Carga inicial";
            default -> "Otro";
        };
    }

    private static String normalizar(String motivo) {
        if (motivo == null) {
            return null;
        }
        String sinAcentos = Normalizer.normalize(motivo.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sinAcentos.toLowerCase();
    }
}
