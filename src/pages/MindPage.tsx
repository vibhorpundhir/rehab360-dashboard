import { useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Heart, Wind, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIChat } from "@/hooks/useAIChat";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const pageVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

const MindPage = () => {
  const { messages, isLoading, sendMessage, clearHistory } = useAIChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Dynamic background based on conversation length
  const backgroundStyle = useMemo(() => {
    const progress = Math.min(messages.length / 20, 1);
    const hue = 220 + progress * 40; // Blue to Teal shift
    return {
      background: `linear-gradient(135deg, hsl(${hue}, 50%, 8%) 0%, hsl(${hue + 20}, 40%, 12%) 100%)`,
    };
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    await sendMessage(message);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-4"
      style={backgroundStyle}
    >
      {/* Chat Container */}
      <MotionCard 
        className="w-full max-w-3xl h-full flex flex-col overflow-hidden"
        delay={0}
        hoverLift={false}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <motion.div 
            className="w-12 h-12 rounded-full bg-gradient-violet flex items-center justify-center shadow-glow-violet"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              Ally
              <Heart className="w-4 h-4 text-alert" />
            </h3>
            <p className="text-xs text-muted-foreground">Your AI Recovery Companion • Powered by AI</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, type: "spring" }}
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
                {message.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="text-sm leading-relaxed mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 my-2 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 my-2 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-sm">{children}</li>,
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-violet flex items-center justify-center">
                <Wind className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="flex gap-1 items-center p-3 bg-secondary/30 rounded-2xl">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Share what's on your mind..."
              disabled={isLoading}
              className={cn(
                "flex-1 bg-secondary/50 rounded-xl px-4 py-3",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "transition-all duration-200",
                "disabled:opacity-50"
              )}
            />
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={cn(
                  "h-12 px-6 rounded-xl",
                  "bg-gradient-violet text-white",
                  "hover:shadow-glow-violet transition-shadow",
                  "disabled:opacity-50"
                )}
              >
                <Send className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </MotionCard>
    </motion.div>
  );
};

export default MindPage;
