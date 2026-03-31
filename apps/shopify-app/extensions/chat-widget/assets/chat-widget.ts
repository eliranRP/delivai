/**
 * DelivAI Chat Widget — Storefront Runtime
 * TypeScript source — compiled to chat-widget.js via esbuild
 */
export {};

interface WidgetConfig {
  appUrl: string;
  shop: string;
  widgetColor: string;
  widgetPosition: "bottom-right" | "bottom-left";
  greetingMessage: string;
  personaName: string;
  collectEmailUpfront: boolean;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallDisplay[];
}

interface ToolCallDisplay {
  toolName: string;
  output: Record<string, unknown>;
}

type SSEEventType = "token" | "tool_start" | "tool_result" | "message_complete" | "error" | "escalated";
interface SSEEvent {
  type: SSEEventType;
  data: Record<string, unknown>;
}

const SESSION_STORAGE_KEY = "delivai_session_id";
const CONVERSATION_STORAGE_KEY = "delivai_conversation_id";

class DelivAIWidget {
  private config: WidgetConfig;
  private sessionId: string;
  private conversationId: string | null = null;
  private messages: Message[] = [];
  private isOpen = false;
  private isLoading = false;
  private unreadCount = 0;
  private currentStreamMessage: Message | null = null;
  private eventSource: EventSource | null = null;

  // DOM refs
  private container!: HTMLDivElement;
  private launcher!: HTMLButtonElement;
  private panel!: HTMLDivElement;
  private messagesEl!: HTMLDivElement;
  private inputEl!: HTMLTextAreaElement;
  private sendBtn!: HTMLButtonElement;
  private typingEl!: HTMLDivElement;

  constructor(config: WidgetConfig) {
    this.config = config;
    this.sessionId = this.getOrCreateSessionId();
    this.conversationId = sessionStorage.getItem(CONVERSATION_STORAGE_KEY);
  }

  private getOrCreateSessionId(): string {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  }

  mount(): void {
    this.injectStyles();
    this.render();
    this.attachEvents();

    // Auto-link identity if customer is logged in
    this.tryLinkCustomerIdentity();

    // Start conversation on first load
    this.initConversation();
  }

  private injectStyles(): void {
    const cssUrl = `${this.config.appUrl}/extensions/chat-widget/assets/chat-widget.css`;
    if (!document.querySelector(`link[href="${cssUrl}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssUrl;
      document.head.appendChild(link);
    }
  }

  private render(): void {
    this.container = document.createElement("div");
    this.container.className = `delivai-widget position-${this.config.widgetPosition}`;
    this.container.style.cssText = `
      bottom: 20px;
      ${this.config.widgetPosition === "bottom-right" ? "right: 20px;" : "left: 20px;"}
    `;

    this.container.innerHTML = this.getWidgetHTML();
    document.body.appendChild(this.container);

    // Cache DOM refs
    this.launcher = this.container.querySelector(".delivai-launcher")!;
    this.panel = this.container.querySelector(".delivai-panel")!;
    this.messagesEl = this.container.querySelector(".delivai-messages")!;
    this.inputEl = this.container.querySelector(".delivai-input")!;
    this.sendBtn = this.container.querySelector(".delivai-send-btn")!;
    this.typingEl = this.container.querySelector(".delivai-typing")!;

    // Apply brand color
    this.applyColor(this.config.widgetColor);
  }

  private getWidgetHTML(): string {
    const initial = this.config.personaName.charAt(0).toUpperCase();
    return `
      <button class="delivai-launcher" aria-label="Open support chat">
        <svg class="icon-chat" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
        <svg class="icon-close" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
        <span class="unread-badge" aria-hidden="true">1</span>
      </button>

      <div class="delivai-panel hidden" role="dialog" aria-label="Chat with ${this.config.personaName}">
        <div class="delivai-header">
          <div class="delivai-avatar">${initial}</div>
          <div class="delivai-header-info">
            <div class="delivai-header-name">${this.config.personaName}</div>
            <div class="delivai-header-status">
              <span class="delivai-status-dot"></span>
              Online · Usually replies instantly
            </div>
          </div>
          <button class="delivai-close-btn" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <div class="delivai-messages" role="log" aria-live="polite" aria-label="Chat messages">
          <div class="delivai-typing" style="display:none">
            <span class="delivai-typing-dot"></span>
            <span class="delivai-typing-dot"></span>
            <span class="delivai-typing-dot"></span>
          </div>
        </div>

        <div class="delivai-footer">
          <div class="delivai-input-row">
            <textarea
              class="delivai-input"
              placeholder="Ask about your order..."
              rows="1"
              aria-label="Type your message"
            ></textarea>
            <button class="delivai-send-btn" aria-label="Send message" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
          <div class="delivai-powered">
            Powered by <a href="https://delivai.com" target="_blank" rel="noopener" style="color:inherit;font-weight:600">DelivAI</a>
          </div>
        </div>
      </div>
    `;
  }

  private applyColor(color: string): void {
    this.container.style.setProperty("--delivai-primary", color);
    const launcher = this.container.querySelector<HTMLElement>(".delivai-launcher");
    if (launcher) launcher.style.background = color;
    const sendBtn = this.container.querySelector<HTMLElement>(".delivai-send-btn");
    if (sendBtn) sendBtn.style.background = color;
    const avatar = this.container.querySelector<HTMLElement>(".delivai-avatar");
    if (avatar) avatar.style.background = color;
  }

  private attachEvents(): void {
    // Launcher toggle
    this.launcher.addEventListener("click", () => this.toggleOpen());

    // Close button
    this.container.querySelector(".delivai-close-btn")?.addEventListener("click", () =>
      this.setOpen(false),
    );

    // Input handling
    this.inputEl.addEventListener("input", () => {
      this.sendBtn.disabled = !this.inputEl.value.trim() || this.isLoading;
      // Auto-resize textarea
      this.inputEl.style.height = "auto";
      this.inputEl.style.height = `${Math.min(this.inputEl.scrollHeight, 120)}px`;
    });

    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.sendBtn.addEventListener("click", () => this.sendMessage());
  }

  private toggleOpen(): void {
    this.setOpen(!this.isOpen);
  }

  private setOpen(open: boolean): void {
    this.isOpen = open;
    this.launcher.classList.toggle("open", open);
    this.panel.classList.toggle("hidden", !open);

    if (open) {
      this.unreadCount = 0;
      this.updateUnreadBadge();
      setTimeout(() => this.inputEl.focus(), 300);
      this.scrollToBottom();
    }
  }

  private async initConversation(): Promise<void> {
    if (this.conversationId) return;

    try {
      const res = await fetch(`${this.config.appUrl}/api/chat?shop=${this.config.shop}&action=start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shop-Domain": this.config.shop },
        body: JSON.stringify({
          storeId: this.config.shop,
          anonymousSessionId: this.sessionId,
        }),
      });

      if (!res.ok) return;
      const data = (await res.json()) as { conversationId?: string };
      if (data.conversationId) {
        this.conversationId = data.conversationId;
        sessionStorage.setItem(CONVERSATION_STORAGE_KEY, data.conversationId);
      }

      // Show greeting
      this.appendMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: this.config.greetingMessage,
        timestamp: new Date(),
      });

      this.unreadCount = 1;
      this.updateUnreadBadge();
    } catch {
      // Silently fail — widget still usable
    }
  }

  private async sendMessage(): Promise<void> {
    const content = this.inputEl.value.trim();
    if (!content || this.isLoading || !this.conversationId) return;

    this.inputEl.value = "";
    this.inputEl.style.height = "auto";
    this.sendBtn.disabled = true;
    this.isLoading = true;

    // Optimistically show user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    this.appendMessage(userMsg);
    this.showTyping(true);

    try {
      const res = await fetch(`${this.config.appUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shop-Domain": this.config.shop },
        body: JSON.stringify({
          conversationId: this.conversationId,
          anonymousSessionId: this.sessionId,
          content,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        this.showErrorMessage(err.error ?? "Failed to send message. Please try again.");
        return;
      }

      const { streamUrl } = (await res.json()) as { streamUrl: string };
      await this.streamResponse(`${this.config.appUrl}${streamUrl}`);
    } catch {
      this.showErrorMessage("Connection error. Please check your internet and try again.");
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = !this.inputEl.value.trim();
    }
  }

  private async streamResponse(streamUrl: string): Promise<void> {
    this.eventSource?.close();

    return new Promise((resolve) => {
      // Init stream message
      const streamMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        toolCalls: [],
      };
      this.currentStreamMessage = streamMsg;

      const msgEl = this.renderMessage(streamMsg, true);
      this.messagesEl.appendChild(msgEl);
      this.messagesEl.insertBefore(this.typingEl, null); // keep typing after messages
      this.showTyping(true);

      this.eventSource = new EventSource(streamUrl);

      this.eventSource.onmessage = (e: MessageEvent<string>) => {
        try {
          const event = JSON.parse(e.data) as SSEEvent;
          this.handleSSEEvent(event, streamMsg, msgEl);
        } catch {
          // Ignore malformed events
        }
      };

      this.eventSource.onerror = () => {
        this.eventSource?.close();
        this.showTyping(false);
        resolve();
      };

      // Handle message_complete / error / escalated
      const originalHandle = this.eventSource.onmessage;
      this.eventSource.onmessage = (e: MessageEvent<string>) => {
        if (originalHandle) originalHandle.call(this.eventSource!, e);
        try {
          const event = JSON.parse(e.data) as SSEEvent;
          if (event.type === "message_complete" || event.type === "error" || event.type === "escalated") {
            this.eventSource?.close();
            this.showTyping(false);
            resolve();
          }
        } catch {
          // ignore
        }
      };
    });
  }

  private handleSSEEvent(event: SSEEvent, msg: Message, msgEl: HTMLElement): void {
    switch (event.type) {
      case "token": {
        const text = (event.data as { text?: string }).text ?? "";
        msg.content += text;
        const bubble = msgEl.querySelector(".delivai-bubble");
        if (bubble) bubble.textContent = msg.content;
        this.scrollToBottom();
        break;
      }

      case "tool_result": {
        const toolName = (event.data as { toolName?: string }).toolName ?? "";
        const output = (event.data as { output?: Record<string, unknown> }).output ?? {};
        msg.toolCalls = msg.toolCalls ?? [];
        msg.toolCalls.push({ toolName, output });

        const toolCard = this.renderToolCard(toolName, output);
        msgEl.appendChild(toolCard);
        this.scrollToBottom();
        break;
      }

      case "escalated": {
        const banner = document.createElement("div");
        banner.className = "delivai-escalated-banner";
        banner.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          A human agent will be with you shortly.
        `;
        this.messagesEl.appendChild(banner);
        this.scrollToBottom();
        break;
      }

      case "error": {
        const errMsg = (event.data as { message?: string }).message ?? "An error occurred.";
        msg.content = errMsg;
        const bubble = msgEl.querySelector(".delivai-bubble");
        if (bubble) bubble.textContent = errMsg;
        break;
      }
    }
  }

  private renderMessage(msg: Message, streaming = false): HTMLElement {
    const div = document.createElement("div");
    div.className = `delivai-message from-${msg.role}`;
    div.dataset.messageId = msg.id;

    const bubble = document.createElement("div");
    bubble.className = "delivai-bubble";
    bubble.textContent = streaming ? "" : msg.content;
    if (msg.role === "user") {
      bubble.style.background = this.config.widgetColor;
    }
    div.appendChild(bubble);

    const ts = document.createElement("div");
    ts.className = "delivai-timestamp";
    ts.textContent = this.formatTime(msg.timestamp);
    div.appendChild(ts);

    return div;
  }

  private renderToolCard(toolName: string, output: Record<string, unknown>): HTMLElement {
    const card = document.createElement("div");
    card.className = "delivai-tool-card";

    const iconMap: Record<string, string> = {
      get_order: "📦",
      get_tracking: "🚚",
      cancel_order: "❌",
      create_refund: "💰",
      rebook_delivery: "🔄",
      search_knowledge: "🔍",
      escalate_to_human: "👤",
    };

    const labelMap: Record<string, string> = {
      get_order: "Order Details",
      get_tracking: "Tracking Info",
      cancel_order: "Order Cancellation",
      create_refund: "Refund Status",
      rebook_delivery: "Delivery Rebooked",
      search_knowledge: "Store Information",
      escalate_to_human: "Agent Assigned",
    };

    const icon = iconMap[toolName] ?? "⚙️";
    const label = labelMap[toolName] ?? toolName;

    let contentHTML = "";

    if (toolName === "get_order" && "name" in output) {
      const o = output as {
        name?: string;
        status?: string;
        total?: string;
        currency?: string;
        createdAt?: string;
      };
      contentHTML = `
        <div class="delivai-order-row">
          <span class="delivai-order-label">Order</span>
          <span class="delivai-order-value">${o.name}</span>
        </div>
        <div class="delivai-order-row">
          <span class="delivai-order-label">Status</span>
          <span class="delivai-order-value">${o.status}</span>
        </div>
        <div class="delivai-order-row">
          <span class="delivai-order-label">Total</span>
          <span class="delivai-order-value">${o.total} ${o.currency}</span>
        </div>
      `;
    } else if (toolName === "get_tracking" && "status" in output) {
      const o = output as { status?: string; statusDetail?: string; carrier?: string };
      const statusColor = o.status === "delivered" ? "#10b981" : "#f59e0b";
      contentHTML = `
        <div style="margin-bottom:8px">
          <span class="delivai-tracking-status" style="background:${statusColor}20;color:${statusColor}">
            ${o.status?.toUpperCase()}
          </span>
        </div>
        <div style="font-size:12px;color:#6b7280">${o.statusDetail ?? ""} · ${o.carrier}</div>
      `;
    } else if ("success" in output) {
      const o = output as { success?: boolean; message?: string };
      contentHTML = `<div style="font-size:13px;color:${o.success ? "#10b981" : "#ef4444"}">${o.message ?? ""}</div>`;
    }

    card.innerHTML = `
      <div class="delivai-tool-card-header">
        <div class="delivai-tool-icon" style="background:${this.config.widgetColor}20;color:${this.config.widgetColor}">
          ${icon}
        </div>
        ${label}
      </div>
      ${contentHTML}
    `;

    return card;
  }

  private appendMessage(msg: Message): void {
    this.messages.push(msg);
    const el = this.renderMessage(msg);
    // Insert before typing indicator
    this.messagesEl.insertBefore(el, this.typingEl);
    this.scrollToBottom();

    if (!this.isOpen && msg.role === "assistant") {
      this.unreadCount++;
      this.updateUnreadBadge();
    }
  }

  private showTyping(visible: boolean): void {
    this.typingEl.style.display = visible ? "flex" : "none";
    if (visible) this.scrollToBottom();
  }

  private showErrorMessage(message: string): void {
    this.appendMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: message,
      timestamp: new Date(),
    });
    this.showTyping(false);
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    });
  }

  private updateUnreadBadge(): void {
    const badge = this.launcher.querySelector<HTMLElement>(".unread-badge");
    if (!badge) return;
    if (this.unreadCount > 0) {
      badge.textContent = String(Math.min(this.unreadCount, 9));
      badge.classList.add("visible");
    } else {
      badge.classList.remove("visible");
    }
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }

  private async tryLinkCustomerIdentity(): Promise<void> {
    // Check if Shopify has exposed customer data (via meta or window)
    const meta = document.querySelector<HTMLMetaElement>('meta[name="customer-id"]');
    const shopifyCustomer = (window as unknown as { ShopifyCustomer?: { id?: string; email?: string; name?: string } }).ShopifyCustomer;
    const customerId = meta?.content ?? shopifyCustomer?.id;
    if (!customerId || !this.conversationId) return;

    try {
      await fetch(`${this.config.appUrl}/api/identity`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shop-Domain": this.config.shop },
        body: JSON.stringify({
          anonymousSessionId: this.sessionId,
          shopifyCustomerId: customerId,
          customerEmail: shopifyCustomer?.email ?? "",
          customerName: shopifyCustomer?.name ?? "",
        }),
      });
    } catch {
      // Non-critical — identity link can be done later
    }
  }
}

// ── Bootstrap ───────────────────────────────────────────────────────────────

declare global {
  interface Window {
    DelivAI?: { init: (config: Partial<WidgetConfig>) => void };
    __delivai_config?: Partial<WidgetConfig>;
  }
}

window.DelivAI = {
  init(config: Partial<WidgetConfig>) {
    const fullConfig: WidgetConfig = {
      appUrl: config.appUrl ?? "",
      shop: config.shop ?? "",
      widgetColor: config.widgetColor ?? "#5B4FE8",
      widgetPosition: config.widgetPosition ?? "bottom-right",
      greetingMessage:
        config.greetingMessage ?? "Hi! I can help you track or manage your order. How can I help?",
      personaName: config.personaName ?? "Aria",
      collectEmailUpfront: config.collectEmailUpfront ?? false,
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => new DelivAIWidget(fullConfig).mount());
    } else {
      new DelivAIWidget(fullConfig).mount();
    }
  },
};

// Auto-init if config is pre-loaded via Liquid
if (window.__delivai_config) {
  window.DelivAI.init(window.__delivai_config);
}
