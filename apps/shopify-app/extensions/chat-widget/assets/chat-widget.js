// extensions/chat-widget/assets/chat-widget.ts
var SESSION_STORAGE_KEY = "delivai_session_id";
var CONVERSATION_STORAGE_KEY = "delivai_conversation_id";
var DelivAIWidget = class {
  config;
  sessionId;
  conversationId = null;
  messages = [];
  isOpen = false;
  isLoading = false;
  unreadCount = 0;
  currentStreamMessage = null;
  eventSource = null;
  // DOM refs
  container;
  launcher;
  panel;
  messagesEl;
  inputEl;
  sendBtn;
  typingEl;
  constructor(config) {
    this.config = config;
    this.sessionId = this.getOrCreateSessionId();
    this.conversationId = sessionStorage.getItem(CONVERSATION_STORAGE_KEY);
  }
  getOrCreateSessionId() {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  }
  mount() {
    this.injectStyles();
    this.render();
    this.attachEvents();
    this.tryLinkCustomerIdentity();
    this.initConversation();
  }
  injectStyles() {
    const cssUrl = `${this.config.appUrl}/extensions/chat-widget/assets/chat-widget.css`;
    if (!document.querySelector(`link[href="${cssUrl}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssUrl;
      document.head.appendChild(link);
    }
  }
  render() {
    this.container = document.createElement("div");
    this.container.className = `delivai-widget position-${this.config.widgetPosition}`;
    this.container.style.cssText = `
      bottom: 20px;
      ${this.config.widgetPosition === "bottom-right" ? "right: 20px;" : "left: 20px;"}
    `;
    this.container.innerHTML = this.getWidgetHTML();
    document.body.appendChild(this.container);
    this.launcher = this.container.querySelector(".delivai-launcher");
    this.panel = this.container.querySelector(".delivai-panel");
    this.messagesEl = this.container.querySelector(".delivai-messages");
    this.inputEl = this.container.querySelector(".delivai-input");
    this.sendBtn = this.container.querySelector(".delivai-send-btn");
    this.typingEl = this.container.querySelector(".delivai-typing");
    this.applyColor(this.config.widgetColor);
  }
  getWidgetHTML() {
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
              Online \xB7 Usually replies instantly
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
  applyColor(color) {
    this.container.style.setProperty("--delivai-primary", color);
    const launcher = this.container.querySelector(".delivai-launcher");
    if (launcher) launcher.style.background = color;
    const sendBtn = this.container.querySelector(".delivai-send-btn");
    if (sendBtn) sendBtn.style.background = color;
    const avatar = this.container.querySelector(".delivai-avatar");
    if (avatar) avatar.style.background = color;
  }
  attachEvents() {
    this.launcher.addEventListener("click", () => this.toggleOpen());
    this.container.querySelector(".delivai-close-btn")?.addEventListener(
      "click",
      () => this.setOpen(false)
    );
    this.inputEl.addEventListener("input", () => {
      this.sendBtn.disabled = !this.inputEl.value.trim() || this.isLoading;
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
  toggleOpen() {
    this.setOpen(!this.isOpen);
  }
  setOpen(open) {
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
  async initConversation() {
    if (this.conversationId) return;
    try {
      const res = await fetch(`${this.config.appUrl}/api/chat?shop=${this.config.shop}&action=start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shop-Domain": this.config.shop },
        body: JSON.stringify({
          storeId: this.config.shop,
          anonymousSessionId: this.sessionId
        })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.conversationId) {
        this.conversationId = data.conversationId;
        sessionStorage.setItem(CONVERSATION_STORAGE_KEY, data.conversationId);
      }
      this.appendMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: this.config.greetingMessage,
        timestamp: /* @__PURE__ */ new Date()
      });
      this.unreadCount = 1;
      this.updateUnreadBadge();
    } catch {
    }
  }
  async sendMessage() {
    const content = this.inputEl.value.trim();
    if (!content || this.isLoading || !this.conversationId) return;
    this.inputEl.value = "";
    this.inputEl.style.height = "auto";
    this.sendBtn.disabled = true;
    this.isLoading = true;
    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: /* @__PURE__ */ new Date()
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
          content
        })
      });
      if (!res.ok) {
        const err = await res.json();
        this.showErrorMessage(err.error ?? "Failed to send message. Please try again.");
        return;
      }
      const { streamUrl } = await res.json();
      await this.streamResponse(`${this.config.appUrl}${streamUrl}`);
    } catch {
      this.showErrorMessage("Connection error. Please check your internet and try again.");
    } finally {
      this.isLoading = false;
      this.sendBtn.disabled = !this.inputEl.value.trim();
    }
  }
  async streamResponse(streamUrl) {
    this.eventSource?.close();
    return new Promise((resolve) => {
      const streamMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: /* @__PURE__ */ new Date(),
        toolCalls: []
      };
      this.currentStreamMessage = streamMsg;
      const msgEl = this.renderMessage(streamMsg, true);
      this.messagesEl.appendChild(msgEl);
      this.messagesEl.insertBefore(this.typingEl, null);
      this.showTyping(true);
      this.eventSource = new EventSource(streamUrl);
      this.eventSource.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data);
          this.handleSSEEvent(event, streamMsg, msgEl);
        } catch {
        }
      };
      this.eventSource.onerror = () => {
        this.eventSource?.close();
        this.showTyping(false);
        resolve();
      };
      const originalHandle = this.eventSource.onmessage;
      this.eventSource.onmessage = (e) => {
        if (originalHandle) originalHandle.call(this.eventSource, e);
        try {
          const event = JSON.parse(e.data);
          if (event.type === "message_complete" || event.type === "error" || event.type === "escalated") {
            this.eventSource?.close();
            this.showTyping(false);
            resolve();
          }
        } catch {
        }
      };
    });
  }
  handleSSEEvent(event, msg, msgEl) {
    switch (event.type) {
      case "token": {
        const text = event.data.text ?? "";
        msg.content += text;
        const bubble = msgEl.querySelector(".delivai-bubble");
        if (bubble) bubble.textContent = msg.content;
        this.scrollToBottom();
        break;
      }
      case "tool_result": {
        const toolName = event.data.toolName ?? "";
        const output = event.data.output ?? {};
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
        const errMsg = event.data.message ?? "An error occurred.";
        msg.content = errMsg;
        const bubble = msgEl.querySelector(".delivai-bubble");
        if (bubble) bubble.textContent = errMsg;
        break;
      }
    }
  }
  renderMessage(msg, streaming = false) {
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
  renderToolCard(toolName, output) {
    const card = document.createElement("div");
    card.className = "delivai-tool-card";
    const iconMap = {
      get_order: "\u{1F4E6}",
      get_tracking: "\u{1F69A}",
      cancel_order: "\u274C",
      create_refund: "\u{1F4B0}",
      rebook_delivery: "\u{1F504}",
      search_knowledge: "\u{1F50D}",
      escalate_to_human: "\u{1F464}"
    };
    const labelMap = {
      get_order: "Order Details",
      get_tracking: "Tracking Info",
      cancel_order: "Order Cancellation",
      create_refund: "Refund Status",
      rebook_delivery: "Delivery Rebooked",
      search_knowledge: "Store Information",
      escalate_to_human: "Agent Assigned"
    };
    const icon = iconMap[toolName] ?? "\u2699\uFE0F";
    const label = labelMap[toolName] ?? toolName;
    let contentHTML = "";
    if (toolName === "get_order" && "name" in output) {
      const o = output;
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
      const o = output;
      const statusColor = o.status === "delivered" ? "#10b981" : "#f59e0b";
      contentHTML = `
        <div style="margin-bottom:8px">
          <span class="delivai-tracking-status" style="background:${statusColor}20;color:${statusColor}">
            ${o.status?.toUpperCase()}
          </span>
        </div>
        <div style="font-size:12px;color:#6b7280">${o.statusDetail ?? ""} \xB7 ${o.carrier}</div>
      `;
    } else if ("success" in output) {
      const o = output;
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
  appendMessage(msg) {
    this.messages.push(msg);
    const el = this.renderMessage(msg);
    this.messagesEl.insertBefore(el, this.typingEl);
    this.scrollToBottom();
    if (!this.isOpen && msg.role === "assistant") {
      this.unreadCount++;
      this.updateUnreadBadge();
    }
  }
  showTyping(visible) {
    this.typingEl.style.display = visible ? "flex" : "none";
    if (visible) this.scrollToBottom();
  }
  showErrorMessage(message) {
    this.appendMessage({
      id: crypto.randomUUID(),
      role: "assistant",
      content: message,
      timestamp: /* @__PURE__ */ new Date()
    });
    this.showTyping(false);
  }
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    });
  }
  updateUnreadBadge() {
    const badge = this.launcher.querySelector(".unread-badge");
    if (!badge) return;
    if (this.unreadCount > 0) {
      badge.textContent = String(Math.min(this.unreadCount, 9));
      badge.classList.add("visible");
    } else {
      badge.classList.remove("visible");
    }
  }
  formatTime(date) {
    return date.toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit" });
  }
  async tryLinkCustomerIdentity() {
    const meta = document.querySelector('meta[name="customer-id"]');
    const shopifyCustomer = window.ShopifyCustomer;
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
          customerName: shopifyCustomer?.name ?? ""
        })
      });
    } catch {
    }
  }
};
window.DelivAI = {
  init(config) {
    const fullConfig = {
      appUrl: config.appUrl ?? "",
      shop: config.shop ?? "",
      widgetColor: config.widgetColor ?? "#5B4FE8",
      widgetPosition: config.widgetPosition ?? "bottom-right",
      greetingMessage: config.greetingMessage ?? "Hi! I can help you track or manage your order. How can I help?",
      personaName: config.personaName ?? "Aria",
      collectEmailUpfront: config.collectEmailUpfront ?? false
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => new DelivAIWidget(fullConfig).mount());
    } else {
      new DelivAIWidget(fullConfig).mount();
    }
  }
};
if (window.__delivai_config) {
  window.DelivAI.init(window.__delivai_config);
}
