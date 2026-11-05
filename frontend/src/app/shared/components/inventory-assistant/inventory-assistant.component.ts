import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Inventario } from '../../../core/models/inventario.model';
import { Producto } from '../../../core/models/producto.model';
import { InventarioService } from '../../../core/services/inventario.service';
import { ProductoService } from '../../../core/services/producto.service';

type MessageRole = 'assistant' | 'user';
interface ChatMessage {
  role: MessageRole;
  text: string;
}

@Component({
  selector: 'app-inventory-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <button
      class="assistant-launcher"
      type="button"
      (click)="toggle()"
      [attr.aria-expanded]="abierto()"
      aria-controls="inventory-assistant-panel"
      aria-label="Abrir asistente IA de inventario"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3a8 8 0 0 0-6.9 12.05L4 21l5.95-1.1A8 8 0 1 0 12 3Z"></path>
        <path d="M8.5 10.5h7M8.5 14h4"></path>
      </svg>
      <span>Asistente IA</span>
      <i aria-hidden="true"></i>
    </button>

    @if (abierto()) {
      <section
        class="assistant-panel"
        id="inventory-assistant-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="assistant-title"
      >
        <header class="assistant-header">
          <div class="assistant-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3v2M5.6 5.6 7 7M3 12h2m14 0h2m-3.6-6.4L16 7"></path>
              <rect x="5" y="8" width="14" height="12" rx="4"></rect>
              <path d="M9 13h.01M15 13h.01M9 17h6"></path>
            </svg>
          </div>
          <div class="assistant-heading">
            <h2 id="assistant-title">Asistente de inventario</h2>
            <span><i></i> Consultas disponibles</span>
          </div>
          <button class="assistant-icon-button" type="button" (click)="recargarDatos()" aria-label="Actualizar datos">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 7v5h-5M4 17v-5h5"></path>
              <path d="M5.6 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.4-3"></path>
            </svg>
          </button>
          <button class="assistant-icon-button" type="button" (click)="cerrar()" aria-label="Cerrar asistente">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m18 6-12 12M6 6l12 12"></path>
            </svg>
          </button>
        </header>

        <div class="assistant-context">
          <span class="context-dot"></span>
          <span>Inventario</span>
          <span class="context-divider">·</span>
          <span>{{ productos().length }} productos activos</span>
          @if (actualizadoEn()) {
            <span class="context-updated">Actualizado {{ actualizadoEn() }}</span>
          }
        </div>

        <div class="assistant-messages" #messageList aria-live="polite" aria-relevant="additions">
          @for (message of mensajes(); track $index) {
            <article class="message-row" [class.user-row]="message.role === 'user'">
              @if (message.role === 'assistant') {
                <span class="message-avatar" aria-hidden="true">IA</span>
              }
              <div class="message-bubble" [class.user-bubble]="message.role === 'user'">
                <p>{{ message.text }}</p>
              </div>
            </article>
          }
          @if (cargando()) {
            <article class="message-row">
              <span class="message-avatar" aria-hidden="true">IA</span>
              <div class="message-bubble loading-bubble" role="status">Consultando inventario…</div>
            </article>
          }
          @if (mensajes().length === 1 && !cargando()) {
            <div class="suggestions">
              <span>Prueba preguntando</span>
              <button type="button" (click)="preguntar('¿Qué productos tienen stock bajo?')">
                ¿Qué productos tienen stock bajo?
              </button>
              <button type="button" (click)="preguntar('¿Cuántos productos hay en inventario?')">
                ¿Cuántos productos hay?
              </button>
              <button type="button" (click)="preguntar('¿Cuánto stock hay disponible?')">
                ¿Cuánto stock hay disponible?
              </button>
            </div>
          }
        </div>

        <form class="assistant-composer" (ngSubmit)="enviar()">
          <label class="sr-only" for="assistant-question">Escribe tu consulta sobre el inventario</label>
          <textarea
            id="assistant-question"
            name="question"
            [(ngModel)]="consulta"
            (keydown.enter)="onEnter($event)"
            placeholder="Pregunta sobre productos o stock…"
            rows="1"
            [disabled]="cargando()"
          ></textarea>
          <button
            class="send-button"
            type="submit"
            [disabled]="!consulta.trim() || cargando()"
            aria-label="Enviar consulta"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m5 12 14-7-4 14-3-6-7-1Z"></path>
              <path d="m12 13 7-8"></path>
            </svg>
          </button>
        </form>
        <p class="assistant-disclaimer">
          Prototipo de consultas. Las respuestas usan los datos actuales del sistema; aún no está conectado a un modelo de IA.
        </p>
      </section>
    }
  `,
  styles: [`
    :host {
      --assistant-ink: #172b3a;
      --assistant-primary: #235a6b;
      --assistant-soft: #edf5f5;
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 1100;
      font-family: var(--font-sans);
    }

    .assistant-launcher {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 12px 17px;
      border: 0;
      border-radius: 999px;
      color: #fff;
      background: linear-gradient(135deg, #235a6b, #347e83);
      box-shadow: 0 8px 26px rgba(23, 55, 69, .28);
      font: 600 13px var(--font-sans);
      cursor: pointer;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 11px 30px rgba(23, 55, 69, .34);
      }

      svg {
        width: 19px;
        height: 19px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.7;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      i, .assistant-heading i {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #91e0b0;
        box-shadow: 0 0 0 3px rgba(145, 224, 176, .18);
      }
    }

    .assistant-panel {
      position: absolute;
      right: 0;
      bottom: 64px;
      display: flex;
      flex-direction: column;
      width: min(390px, calc(100vw - 32px));
      height: min(590px, calc(100dvh - 112px));
      min-height: 390px;
      overflow: hidden;
      border: 1px solid #dce5e9;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 18px 56px rgba(18, 42, 55, .22);
      animation: assistant-appear 160ms ease-out;
    }

    .assistant-header {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 17px 15px 14px;
      color: #fff;
      background: linear-gradient(125deg, #183d50, #286b75);
    }

    .assistant-avatar {
      display: grid;
      width: 40px;
      height: 40px;
      flex: 0 0 auto;
      place-items: center;
      border: 1px solid rgba(255,255,255,.25);
      border-radius: 13px;
      background: rgba(255,255,255,.12);

      svg {
        width: 24px;
        height: 24px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.5;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }

    .assistant-heading {
      flex: 1;
      min-width: 0;

      h2 {
        margin: 0 0 3px;
        font-size: 14px;
        font-weight: 650;
      }

      span {
        display: flex;
        align-items: center;
        gap: 7px;
        color: rgba(255,255,255,.8);
        font-size: 11px;
      }

      i {
        display: inline-block;
        width: 6px;
        height: 6px;
      }
    }

    .assistant-icon-button {
      display: grid;
      width: 31px;
      height: 31px;
      flex: 0 0 auto;
      place-items: center;
      border: 0;
      border-radius: 8px;
      color: rgba(255,255,255,.85);
      background: transparent;
      cursor: pointer;

      &:hover { background: rgba(255,255,255,.14); color: #fff; }
      svg {
        width: 17px;
        height: 17px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }

    .assistant-context {
      display: flex;
      align-items: center;
      gap: 7px;
      min-height: 34px;
      padding: 0 16px;
      border-bottom: 1px solid #edf0f2;
      color: #63727e;
      font-size: 10px;
    }

    .context-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4c9a7a;
    }

    .context-divider { color: #b6c0c6; }
    .context-updated { margin-left: auto; color: #8c989f; }

    .assistant-messages {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 15px;
      overflow-y: auto;
      padding: 18px 15px;
      background:
        radial-gradient(circle at 100% 0, rgba(233, 245, 244, .6), transparent 34%),
        #fbfcfc;
    }

    .message-row {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      max-width: 92%;
    }

    .user-row { align-self: flex-end; }
    .message-avatar {
      display: grid;
      width: 24px;
      height: 24px;
      flex: 0 0 auto;
      place-items: center;
      border-radius: 8px;
      color: #286475;
      background: #e5f0f1;
      font-size: 9px;
      font-weight: 700;
    }

    .message-bubble {
      padding: 10px 12px;
      border: 1px solid #e8edef;
      border-radius: 13px 13px 13px 4px;
      color: #33434d;
      background: #fff;
      box-shadow: 0 2px 6px rgba(20, 45, 54, .035);
      font-size: 12px;
      line-height: 1.55;

      p { margin: 0; white-space: pre-line; }
    }

    .user-bubble {
      border-color: #d7e9e9;
      border-radius: 13px 13px 4px 13px;
      color: #214650;
      background: #eaf4f3;
    }

    .loading-bubble { color: #73828a; font-style: italic; }
    .suggestions { display: grid; gap: 7px; padding-left: 32px; }
    .suggestions > span { margin-bottom: 2px; color: #7a8990; font-size: 10px; }

    .suggestions button {
      width: fit-content;
      max-width: 100%;
      padding: 7px 10px;
      border: 1px solid #dce9ea;
      border-radius: 999px;
      color: #2b6571;
      background: #fff;
      font: 500 10.5px var(--font-sans);
      text-align: left;
      cursor: pointer;

      &:hover { border-color: #8bb9b9; background: #f0f8f7; }
    }

    .assistant-composer {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      margin: 0 13px;
      padding: 8px 8px 8px 13px;
      border: 1px solid #dce4e7;
      border-radius: 14px;
      background: #fff;
      box-shadow: 0 3px 12px rgba(31, 57, 68, .06);
      transition: border-color var(--transition-fast);

      &:focus-within { border-color: #77a6ad; }
      textarea {
        width: 100%;
        max-height: 80px;
        resize: none;
        border: 0;
        outline: 0;
        color: #263a45;
        background: transparent;
        font: 12px/1.5 var(--font-sans);
      }
      textarea::placeholder { color: #98a4aa; }
    }

    .send-button {
      display: grid;
      width: 31px;
      height: 31px;
      flex: 0 0 auto;
      place-items: center;
      border: 0;
      border-radius: 10px;
      color: #fff;
      background: #276779;
      cursor: pointer;
      transition: background var(--transition-fast);
      &:hover:not(:disabled) { background: #1e5363; }
      &:disabled { background: #cbd6da; cursor: not-allowed; }
      svg {
        width: 16px;
        height: 16px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
    }

    .assistant-disclaimer {
      padding: 8px 16px 12px;
      color: #87949a;
      font-size: 9px;
      line-height: 1.4;
      text-align: center;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @keyframes assistant-appear {
      from { opacity: 0; transform: translateY(8px) scale(.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (max-width: 600px) {
      :host { right: 12px; bottom: 12px; }
      .assistant-panel {
        position: fixed;
        right: 8px;
        bottom: 76px;
        width: calc(100vw - 16px);
        height: min(640px, calc(100dvh - 96px));
        min-height: 360px;
      }
      .assistant-launcher { padding: 11px 14px; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
    }
  `],
})
export class InventoryAssistantComponent {
  private readonly inventarioService = inject(InventarioService);
  private readonly productoService = inject(ProductoService);
  private dataLoaded = false;

  readonly abierto = signal(false);
  readonly cargando = signal(false);
  readonly productos = signal<Producto[]>([]);
  readonly inventario = signal<Inventario[]>([]);
  readonly actualizadoEn = signal('');
  readonly mensajes = signal<ChatMessage[]>([
    {
      role: 'assistant',
      text: '¡Hola! Puedo ayudarte a consultar el inventario. Pregúntame por el stock disponible, productos agotados o artículos por debajo del mínimo.',
    },
  ]);
  consulta = '';
  private pendingQuestion = '';

  toggle(): void {
    this.abierto.update((value) => !value);
    if (this.abierto() && !this.dataLoaded) this.recargarDatos();
  }

  cerrar(): void {
    this.abierto.set(false);
  }

  recargarDatos(): void {
    if (this.cargando()) return;
    this.cargando.set(true);
    forkJoin({
      productos: this.productoService.listar(),
      inventario: this.inventarioService.obtenerStock(),
    }).subscribe({
      next: ({ productos, inventario }) => {
        this.productos.set(productos.filter((producto) => producto.activo));
        this.inventario.set(inventario);
        this.actualizadoEn.set(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }));
        this.dataLoaded = true;
        this.cargando.set(false);
        if (this.pendingQuestion) {
          const answer = this.responder(this.pendingQuestion);
          this.pendingQuestion = '';
          this.mensajes.update((messages) => [...messages, { role: 'assistant', text: answer }]);
        }
      },
      error: () => {
        this.cargando.set(false);
        this.dataLoaded = false;
        this.pendingQuestion = '';
        this.mensajes.update((messages) => [
          ...messages,
          { role: 'assistant', text: 'No pude cargar el inventario. Revisa tu conexión e inténtalo nuevamente con el botón actualizar.' },
        ]);
      },
    });
  }

  preguntar(texto: string): void {
    this.consulta = texto;
    this.enviar();
  }

  enviar(): void {
    const pregunta = this.consulta.trim();
    if (!pregunta || this.cargando()) return;

    this.mensajes.update((messages) => [...messages, { role: 'user', text: pregunta }]);
    this.consulta = '';
    if (!this.dataLoaded) {
      this.pendingQuestion = pregunta;
      if (!this.cargando()) this.recargarDatos();
      return;
    }

    this.mensajes.update((messages) => [...messages, { role: 'assistant', text: this.responder(pregunta) }]);
  }

  onEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.enviar();
    }
  }

  private responder(pregunta: string): string {
    const normalizada = this.normalizar(pregunta);
    const productos = this.productos();
    const inventarioPorProducto = new Map(this.inventario().map((item) => [item.productoId, item.stockActual]));
    const stockDe = (producto: Producto): number => inventarioPorProducto.get(producto.id) ?? 0;
    const agotados = productos.filter((producto) => stockDe(producto) === 0);
    const bajos = productos.filter((producto) => stockDe(producto) > 0 && stockDe(producto) <= producto.stockMinimo);

    if (/(stock bajo|stock critico|bajo minimo|por debajo|agotad|sin stock)/.test(normalizada)) {
      const lista = [...agotados, ...bajos];
      if (!lista.length) return 'No hay productos agotados ni por debajo del stock mínimo actualmente.';
      return `Encontré ${lista.length} producto(s) que requieren atención:\n${lista
        .slice(0, 8)
        .map((producto) => `• ${producto.nombre}: ${stockDe(producto)} disponibles (mínimo ${producto.stockMinimo})`)
        .join('\n')}${lista.length > 8 ? '\n• Hay más productos en la lista.' : ''}`;
    }

    const terminos = normalizada
      .split(/\s+/)
      .filter((termino) => termino.length > 2 && !['cuanto', 'cuantos', 'tiene', 'tenemos', 'disponible', 'productos', 'producto', 'inventario', 'stock', 'hay', 'para', 'del', 'por', 'favor', 'dime', 'quiero', 'saber'].includes(termino));
    const producto = productos.find((item) => {
      const nombre = this.normalizar(item.nombre);
      const codigo = this.normalizar(item.codigo);
      return (terminos.length > 0 && terminos.some((termino) => nombre.includes(termino) || codigo.includes(termino))) ||
        normalizada.includes(codigo);
    });
    if (producto) {
      return `${producto.nombre}\nCódigo: ${producto.codigo}\nStock disponible: ${stockDe(producto)} unidades\nStock mínimo: ${producto.stockMinimo} unidades\nPrecio de venta: S/ ${producto.precioVenta.toFixed(2)}.`;
    }

    if (/(cuantos|cantidad|total|resumen|disponible|inventario|productos)/.test(normalizada)) {
      const unidades = productos.reduce((total, item) => total + stockDe(item), 0);
      return `Resumen actual del inventario:\n• ${productos.length} productos activos\n• ${unidades} unidades en stock\n• ${agotados.length} productos agotados\n• ${bajos.length} productos con stock bajo.`;
    }

    return 'Puedo ayudarte a buscar un producto por nombre o código, revisar cuánto stock tiene o listar los artículos con stock bajo. ¿Qué producto deseas consultar?';
  }

  private normalizar(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[¿?¡!,.:;]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
