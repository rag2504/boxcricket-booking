import { useState, useEffect, useRef } from "react";
import { X, Send, User, Bot, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import io from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "ai" | "admin";
  content: string;
  timestamp: Date;
}

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface LiveChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveChatWidget({ isOpen, onClose }: LiveChatWidgetProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hi there! I am the CricBox AI assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState<"ai" | "human">("ai");
  const [socket, setSocket] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Create a stable anonymous user ID if not logged in
  const userId = user?._id || localStorage.getItem("anonymousUserId") || Math.random().toString(36).substring(7);
  
  useEffect(() => {
    if (!user?._id && !localStorage.getItem("anonymousUserId")) {
      localStorage.setItem("anonymousUserId", userId);
    }
  }, [user, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (chatMode === "human") {
      const newSocket = io(BACKEND_URL);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        newSocket.emit("join-chat", userId);
        newSocket.emit("request-admin", {
          userId,
          name: user?.name || "Guest User",
          email: user?.email || "guest@example.com",
        });
        
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "ai",
            content: "Connecting you to a human agent. Please wait...",
            timestamp: new Date(),
          },
        ]);
      });

      newSocket.on("new-message", (data: { message: string; sender: string }) => {
        if (data.sender === "admin") {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "admin",
              content: data.message,
              timestamp: new Date(),
            },
          ]);
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [chatMode, userId, user]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");

    if (chatMode === "ai") {
      setIsTyping(true);
      try {
        const apiMessages = messages
          .filter(m => m.role === "user" || m.role === "ai")
          .map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
          }))
          .concat({ role: "user", content: newUserMsg.content });

        const response = await fetch(`${BACKEND_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        const data = await response.json();
        
        if (data.success) {
          if (data.reply.includes("TRANSFER_TO_HUMAN")) {
            setChatMode("human");
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                role: "ai",
                content: data.reply,
                timestamp: new Date(),
              },
            ]);
          }
        } else {
          throw new Error("Chat failed");
        }
      } catch (error) {
        toast.error("Failed to connect to AI server. Trying human agent...");
        setChatMode("human");
      } finally {
        setIsTyping(false);
      }
    } else if (socket) {
      socket.emit("send-message", {
        room: `chat-${userId}`,
        message: newUserMsg.content,
        sender: "user",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-6 z-[100] w-80 sm:w-96 shadow-2xl shadow-emerald/20 rounded-2xl overflow-hidden bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.08] flex flex-col h-[500px]">
      <div className="bg-emerald p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          {chatMode === "ai" ? <Bot size={20} /> : <User size={20} />}
          <span className="font-semibold">{chatMode === "ai" ? "AI Assistant" : "Live Agent"}</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-black/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[85%] rounded-2xl px-4 py-2",
              msg.role === "user"
                ? "bg-emerald text-white self-end rounded-br-sm ml-auto"
                : "bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-white/5 self-start rounded-bl-sm shadow-sm"
            )}
          >
            <span className="text-[10px] opacity-70 mb-1 flex items-center gap-1 font-semibold tracking-wider">
              {msg.role === "ai" ? <Bot size={10}/> : msg.role === "admin" ? <ShieldAlert size={10} className="text-blue-500" /> : <User size={10}/>}
              {msg.role.toUpperCase()}
            </span>
            <span className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</span>
          </div>
        ))}
        {isTyping && (
          <div className="bg-white dark:bg-zinc-800 border border-gray-100 dark:border-white/5 self-start rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1 w-16">
            <div className="w-1.5 h-1.5 bg-emerald/60 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-emerald/60 rounded-full animate-bounce delay-75" />
            <div className="w-1.5 h-1.5 bg-emerald/60 rounded-full animate-bounce delay-150" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-white/[0.08] flex items-center gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1 bg-gray-100 dark:bg-white/[0.03] border-none focus-visible:ring-1 focus-visible:ring-emerald text-foreground"
        />
        <Button
          onClick={handleSendMessage}
          size="icon"
          className="bg-emerald hover:bg-emerald/90 h-10 w-10 shrink-0 rounded-full"
          disabled={!inputValue.trim() || isTyping}
        >
          <Send size={18} />
        </Button>
      </div>
    </div>
  );
}
