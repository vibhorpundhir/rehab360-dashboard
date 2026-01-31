import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hey there! I'm Ally, your recovery companion. 👋 How are you feeling today?",
    timestamp: new Date(),
  },
];

const contextResponses: Record<string, string> = {
  craving: "I notice you're experiencing some cravings. That's completely normal and takes a lot of courage to acknowledge. Let's try a quick grounding exercise: Take 5 deep breaths with me. Inhale for 4 counts, hold for 4, exhale for 6. Ready?",
  anxious: "I see you might be feeling anxious. Your sleep data shows you've been getting less rest lately, which can definitely contribute to anxiety. Would you like to try a quick 2-minute breathing exercise, or talk through what's on your mind?",
  happy: "That's wonderful to hear! 🌟 Celebrating the good moments is so important for recovery. What's been contributing to your positive mood today?",
  tired: "Feeling tired is really common. I noticed from your logs that your sleep quality has been around 65% this week. Want me to suggest some sleep hygiene tips, or would you prefer to log how you're feeling right now?",
  default: "I'm here to listen and support you on your journey. Feel free to share what's on your mind, or ask me about your progress, breathing exercises, or wellness tips.",
};

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("crav") || lowerMessage.includes("urge")) {
      return contextResponses.craving;
    }
    if (lowerMessage.includes("anxi") || lowerMessage.includes("worried") || lowerMessage.includes("stress")) {
      return contextResponses.anxious;
    }
    if (lowerMessage.includes("happy") || lowerMessage.includes("good") || lowerMessage.includes("great")) {
      return contextResponses.happy;
    }
    if (lowerMessage.includes("tired") || lowerMessage.includes("sleep") || lowerMessage.includes("exhaust")) {
      return contextResponses.tired;
    }
    
    return contextResponses.default;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full",
          "bg-gradient-violet shadow-glow-violet",
          "flex items-center justify-center",
          "hover:scale-110 transition-transform"
        )}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 180 : 0 }}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={cn(
              "fixed bottom-24 right-6 z-50",
              "w-96 h-[500px] max-h-[70vh]",
              "glass-card flex flex-col",
              "overflow-hidden"
            )}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-violet flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Ally</h3>
                <p className="text-xs text-muted-foreground">Your AI Companion</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-muted-foreground">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary/50 text-foreground rounded-bl-md"
                    )}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-1 items-center p-4 bg-secondary/30 rounded-2xl w-fit"
                >
                  <span className="w-2 h-2 rounded-full bg-primary chat-wave" />
                  <span className="w-2 h-2 rounded-full bg-primary chat-wave" />
                  <span className="w-2 h-2 rounded-full bg-primary chat-wave" />
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className={cn(
                    "flex-1 bg-secondary/50 rounded-xl px-4 py-3",
                    "text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    "transition-all duration-200"
                  )}
                />
                <motion.button
                  onClick={handleSend}
                  className={cn(
                    "w-12 h-12 rounded-xl",
                    "bg-gradient-violet text-white",
                    "flex items-center justify-center",
                    "hover:shadow-glow-violet transition-shadow"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
