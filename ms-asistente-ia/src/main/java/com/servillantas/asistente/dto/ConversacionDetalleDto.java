package com.servillantas.asistente.dto;

import java.util.List;

public record ConversacionDetalleDto(
    ConversacionDto conversacion,
    List<MensajeDto> mensajes
) {}

