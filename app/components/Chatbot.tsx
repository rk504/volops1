import { useState } from "react";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { text: "Hi! I can recommend volunteer opportunities. What are you interested in?", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { text: input, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
  
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chatgpt_reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ user_message: input }),
      });
  
      const data = await response.json();
      setMessages((prev) => [...prev, { text: data, sender: "bot" }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { text: "Sorry, I'm having trouble connecting. Please try again later.", sender: "bot" }]);
    }
  
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 border rounded-lg shadow-lg">
      <div className="h-80 overflow-y-auto border-b p-2">
        {messages.map((msg, i) => (
          <div key={i} className={msg.sender === "user" ? "text-right" : "text-left"}>
            <p className={msg.sender === "user" ? "bg-blue-500 text-white p-2 rounded-lg inline-block" : "bg-gray-200 p-2 rounded-lg inline-block"}>
              {msg.text}
            </p>
          </div>
        ))}
        {loading && (
          <div className="text-left">
            <p className="bg-gray-200 p-2 rounded-lg inline-block">
              Thinking...
            </p>
          </div>
        )}
      </div>
      <div className="mt-2 flex">
        <input
          className="flex-1 p-2 border rounded-lg"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          className="ml-2 p-2 bg-green-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
  