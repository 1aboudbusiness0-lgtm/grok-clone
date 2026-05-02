import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are Grok, an AI assistant made by xAI. You are witty, direct, and a bit rebellious. You're not afraid to be edgy or tell it like it is. You have a dark sense of humor and don't sugarcoat things. You're knowledgeable, sharp, and occasionally sarcastic. Keep responses concise but impactful. You can talk about almost anything without excessive warnings or disclaimers.`;

const XLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const GrokLogo = () => (
  <div style={{
    width: 36, height: 36,
    background: "linear-gradient(135deg, #00d4ff, #7b2fff)",
    borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 900, fontSize: 18, color: "#fff", letterSpacing: -1,
    boxShadow: "0 0 20px rgba(0,212,255,0.4)"
  }}>G</div>
);

const TypingDots = () => (
  <div style={{ display: "flex", gap: 6, padding: "4px 0" }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
        width: 8, height: 8, borderRadius: "50%",
        background: "#00d4ff",
        animation: "bounce 1.2s infinite",
        animationDelay: `${i * 0.2}s`
      }} />
    ))}
  </div>
);

export default function GrokClone() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "أنا Grok. اسألني أي شيء — لا قيود، لا مزيد من الهراء المؤدب. ماذا تريد؟"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamingText("");

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
          stream: true
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "content_block_delta" && data.delta?.text) {
                fullText += data.delta.text;
                setStreamingText(fullText);
              }
            } catch {}
          }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: fullText }]);
      setStreamingText("");
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "حدث خطأ ما. حاول مجدداً." }]);
      setStreamingText("");
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0a0a0a;
          color: #e8e8e8;
          font-family: 'Space Grotesk', sans-serif;
          height: 100vh;
          overflow: hidden;
        }

        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-8px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        .grok-app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          max-width: 780px;
          margin: 0 auto;
          position: relative;
        }

        .scanline {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0,212,255,0.15), transparent);
          animation: scanline 8s linear infinite;
          pointer-events: none;
          z-index: 100;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,10,10,0.9);
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.5px;
          background: linear-gradient(90deg, #fff, #00d4ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .header-badge {
          font-size: 10px;
          font-family: 'DM Mono', monospace;
          color: #00d4ff;
          border: 1px solid rgba(0,212,255,0.3);
          padding: 2px 8px;
          border-radius: 20px;
          letter-spacing: 0.5px;
        }

        .x-logo {
          color: rgba(255,255,255,0.6);
          transition: color 0.2s;
          cursor: pointer;
        }
        .x-logo:hover { color: #fff; }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        .message-wrapper {
          animation: fadeIn 0.3s ease;
        }

        .message-wrapper.user {
          display: flex;
          justify-content: flex-end;
        }

        .message-wrapper.assistant {
          display: flex;
          justify-content: flex-start;
          gap: 12px;
          align-items: flex-start;
        }

        .bubble {
          max-width: 70%;
          padding: 14px 18px;
          border-radius: 18px;
          line-height: 1.65;
          font-size: 15px;
        }

        .bubble.user {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 1px solid rgba(0,212,255,0.2);
          color: #e8e8e8;
          border-bottom-right-radius: 4px;
        }

        .bubble.assistant {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          color: #d4d4d4;
          border-bottom-left-radius: 4px;
        }

        .typing-bubble {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(0,212,255,0.15);
          border-radius: 18px;
          border-bottom-left-radius: 4px;
          padding: 14px 18px;
          max-width: 70%;
        }

        .input-area {
          padding: 20px 24px 24px;
          border-top: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,10,10,0.95);
          backdrop-filter: blur(20px);
        }

        .input-wrapper {
          display: flex;
          gap: 12px;
          align-items: flex-end;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 12px 16px;
          transition: border-color 0.2s;
        }

        .input-wrapper:focus-within {
          border-color: rgba(0,212,255,0.4);
          box-shadow: 0 0 20px rgba(0,212,255,0.05);
        }

        textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #e8e8e8;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 15px;
          line-height: 1.5;
          resize: none;
          min-height: 24px;
          max-height: 120px;
          overflow-y: auto;
          scrollbar-width: none;
        }

        textarea::placeholder { color: rgba(255,255,255,0.25); }

        .send-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
          background: linear-gradient(135deg, #00d4ff, #7b2fff);
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 16px rgba(0,212,255,0.4);
        }

        .send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .disclaimer {
          text-align: center;
          font-size: 11px;
          color: rgba(255,255,255,0.2);
          margin-top: 10px;
          font-family: 'DM Mono', monospace;
        }

        .noise {
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
          opacity: 0.5;
        }
      `}</style>

      <div className="noise" />
      <div className="scanline" />

      <div className="grok-app">
        <div className="header">
          <div className="header-left">
            <GrokLogo />
            <span className="header-title">Grok</span>
            <span className="header-badge">BETA</span>
          </div>
          <div className="x-logo"><XLogo /></div>
        </div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message-wrapper ${msg.role}`}>
              {msg.role === "assistant" && <GrokLogo />}
              <div className={`bubble ${msg.role}`}>{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div className="message-wrapper assistant">
              <GrokLogo />
              {streamingText ? (
                <div className="bubble assistant">{streamingText}</div>
              ) : (
                <div className="typing-bubble"><TypingDots /></div>
              )}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKey}
              placeholder="اسألني أي شيء..."
              rows={1}
              dir="auto"
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="disclaimer">Grok يعمل بتقنية Claude — للأغراض التعليمية فقط</p>
        </div>
      </div>
    </>
  );
}
