import { Injectable } from '@angular/core';
import { HttpClient, HttpBackend, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Producto } from '../models/producto.model';
import { Inventario } from '../models/inventario.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private readonly http: HttpClient;
  private readonly apiKey = (environment as any).geminiApiKey || 'AIzaSyAeoKYcooI6mZVEXpKV5nS_Rty_-IDXctM';

  constructor(handler: HttpBackend) {
    // Usar HttpBackend para desacoplar llamadas directas a Google de la sesion del frontend
    this.http = new HttpClient(handler);
  }

  generarRespuesta(
    pregunta: string,
    productos: Producto[],
    inventarios: Inventario[]
  ): Observable<string | null> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      return of(null);
    }

    const invMap = new Map(inventarios.map((i) => [i.productoId, i.stockActual]));

    const contextoInventario = productos
      .map(
        (p) =>
          `- ${p.nombre} (Código: ${p.codigo}): Stock Actual = ${invMap.get(p.id) ?? 0}, Stock Mínimo = ${p.stockMinimo}, Precio = S/ ${Number(p.precioVenta).toFixed(2)}`
      )
      .join('\n');

    const prompt = `Eres el Asistente Inteligente oficial de Servillantas RV, una serviteca automotriz líder en neumáticos, lubricantes, baterías y servicios de taller.
Operas como una Inteligencia Artificial Generativa (LLM) con razonamiento contextual y asesoría técnica especializada.

=== CONTEXTO OPERATIVO EN TIEMPO REAL (BASE DE DATOS POSTGRESQL / SUPABASE) ===
${contextoInventario}

=== CONSULTA DEL USUARIO ===
"${pregunta}"

=== DIRECTRICES DE GENERACIÓN ===
1. Eres un LLM de IA Generativa. Comprende la intención del usuario de manera semántica y natural, respondiendo siempre con calidez, profesionalismo y fluidez en español.
2. Saludos y consultas generales: Si el usuario te saluda ("hola", "buenas", etc.) o te pregunta qué puedes hacer, salúdalo cordialmente y resume de forma atractiva en qué le puedes asistir (búsqueda de repuestos, cálculo de disponibilidad, recomendaciones de aceites y llantas, estado crítico de inventario y precios).
3. RAG (Generación Aumentada por Recuperación): Basa siempre tus respuestas técnicas, de stock, precios y códigos en el inventario real suministrado arriba. Si un producto está por agotarse o bajo el stock mínimo, alértalo y sugiere reposición.
4. Asesoría técnica: Si te consultan por compatibilidad, viscosidad (ej. 15W-40) o especificaciones de llantas y baterías, aporta una breve recomendación experta y orientativa.
5. Estilo: Sé claro, conciso y bien estructurado (utiliza viñetas o párrafos cortos según convenga). Evita respuestas excesivamente largas a menos que se te pida un análisis detallado.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-goog-api-key': this.apiKey,
    });

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 500,
      },
    };

    return this.http.post<any>(url, body, { headers }).pipe(
      timeout(12000),
      map((res) => {
        const parts = res?.candidates?.[0]?.content?.parts;
        if (!parts || !Array.isArray(parts)) return null;
        const text = parts.map((p: any) => p.text || '').join('').trim();
        if (text) {
          console.info('[Gemini AI] Respuesta generada con éxito por Google Gemini.');
        }
        return text || null;
      }),
      catchError((err) => {
        console.warn('Gemini API error o timeout, usando motor local de respaldo:', err?.error?.error?.message || err);
        return of(null);
      })
    );
  }
}
