"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api/client";
import { ChatBubbleIcon, CloseIcon, SendIcon } from "../ui/icons";

interface BotButton {
  title: string;
  value: string;
}

interface BotCard {
  title?: string;
  subtitle?: string;
  image?: { url: string; alt?: string };
  buttons?: BotButton[];
}

interface BotResponse {
  responses?: (
    | { type: "text"; text: string }
    | { type: "cards"; cards: BotCard[] }
  )[];
}

interface ChatEntry {
  id: number;
  sender: "user" | "bot";
  text?: string;
  cards?: BotCard[];
}

const GREETING: ChatEntry = {
  id: 0,
  sender: "bot",
  text: "¡Hola! 👋 Soy TurisBot, tu asistente de viajes. ¿En qué puedo ayudarte?",
};

async function sendMessageToBot(
  message: string,
  userId: string,
  conversationId: string,
): Promise<BotResponse> {
  const activity = {
    type: "message",
    text: message,
    from: { id: userId, name: "User" },
    conversation: { id: conversationId },
    timestamp: new Date().toISOString(),
    channelId: "webchat",
  };

  const response = await fetch(`${API_BASE_URL}/messages/webchat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activity),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as BotResponse;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([GREETING]);
  const [typing, setTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const idsRef = useRef<{ userId: string; conversationId: string }>({
    userId: "",
    conversationId: "",
  });
  const nextId = useRef(1);

  useEffect(() => {
    idsRef.current = {
      userId: localStorage.getItem("chat_user_id") ?? "",
      conversationId: localStorage.getItem("chat_conversation_id") ?? "",
    };
  }, []);

  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, typing, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let { userId, conversationId } = idsRef.current;

    if (!userId) {
      userId = "user-" + Math.random().toString(36).slice(2, 11);
      localStorage.setItem("chat_user_id", userId);
    }
    if (!conversationId) {
      conversationId = "conv-" + Math.random().toString(36).slice(2, 11);
      localStorage.setItem("chat_conversation_id", conversationId);
    }
    idsRef.current = { userId, conversationId };

    const message = inputValue.trim();
    if (!message || typing) return;

    setInputValue("");
    setEntries((prev) => [
      ...prev,
      { id: nextId.current++, sender: "user", text: message },
    ]);
    setTyping(true);

    try {
      const response = await sendMessageToBot(message, userId, conversationId);
      const newEntries: ChatEntry[] = [];
      for (const resp of response.responses ?? []) {
        if (resp.type === "text" && resp.text) {
          newEntries.push({
            id: nextId.current++,
            sender: "bot",
            text: resp.text,
          });
        } else if (resp.type === "cards" && resp.cards?.length) {
          newEntries.push({
            id: nextId.current++,
            sender: "bot",
            cards: resp.cards,
          });
        }
      }
      setEntries((prev) => [...prev, ...newEntries]);
    } catch {
      setEntries((prev) => [
        ...prev,
        {
          id: nextId.current++,
          sender: "bot",
          text: "Lo siento, hubo un error. Por favor intenta de nuevo.",
        },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="chat-widget">
      {!open && (
        <button
          type="button"
          title="Abrir chat"
          onClick={() => setOpen(true)}
          className="w-[60px] h-[60px] rounded-full gradient-bg text-white flex items-center justify-center cursor-pointer shadow-[0_4px_20px_rgba(102,126,234,0.4)] hover:scale-105 transition-transform"
        >
          <ChatBubbleIcon />
        </button>
      )}

      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="flex items-center gap-3">
              <div className="chat-avatar">
                <span aria-hidden="true">🤖</span>
              </div>
              <div className="flex-1">
                <span className="block text-base font-semibold">TurisBot</span>
                <span className="block text-xs opacity-90">En línea</span>
              </div>
              <button
                type="button"
                title="Cerrar"
                onClick={() => setOpen(false)}
                className="chat-close-btn"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="chat-messages" ref={messagesRef}>
            {entries.map((entry) => (
              <div key={entry.id} className={`chat-message ${entry.sender}`}>
                {entry.cards ? (
                  <div className="chat-cards">
                    {entry.cards.map((card, i) => (
                      <div key={i} className="chat-card">
                        {card.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className="chat-card-image"
                            src={card.image.url}
                            alt={card.image.alt ?? ""}
                          />
                        )}
                        <div className="chat-card-body">
                          {card.title && (
                            <h4 className="chat-card-title text-sm font-semibold mb-1.5">
                              {card.title}
                            </h4>
                          )}
                          {card.subtitle && (
                            <p className="chat-card-subtitle text-xs text-gray-500 leading-snug mb-2.5">
                              {card.subtitle}
                            </p>
                          )}
                          {card.buttons?.map((btn) => (
                            <button
                              key={btn.title}
                              type="button"
                              className="chat-card-btn w-full py-2 px-3 text-white rounded-lg text-[13px]"
                              onClick={() => window.open(btn.value, "_blank")}
                            >
                              {btn.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="chat-message-content whitespace-pre-line break-words">
                    {entry.text}
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="chat-message bot">
                <div className="chat-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-area">
            <form className="chat-form" onSubmit={handleSubmit}>
              <input
                id="chat-input"
                type="text"
                placeholder="Escribe tu mensaje..."
                autoComplete="off"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" title="Enviar" className="chat-send-btn">
                <SendIcon />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
