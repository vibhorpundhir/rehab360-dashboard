import { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { MotionCard } from "@/components/motion/MotionCard";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Heart, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

const pageVariants = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const initialMessage: Message = {
  id: "1",
  role: "assistant",
  content: "Hey there! I'm Ally, your recovery companion. 👋 How are you feeling today? I'm here to listen, support, and help you through anything.",
  timestamp: new Date(),
};

const breathingExercise = `I hear you're feeling anxious. That takes courage to share. 💙

Let's try a quick breathing exercise together:

**Box Breathing (4-4-4-4)**
1. 🌬️ Breathe IN for 4 seconds
2. ⏸️ HOLD for 4 seconds  
3. 💨 Breathe OUT for 4 seconds
4. ⏸️ HOLD for 4 seconds

Repeat this 4 times. I'll wait right here.

Remember: This feeling is temporary. You're doing great by reaching out. 🌟`;

const contextResponses: Record<string, string> = {
  anxious: breathingExercise,
  anxiety: breathingExercise,
  worried: breathingExercise,
  panic: breathingExercise,
  stressed: `I can sense you're stressed. That's a heavy feeling to carry. 

Let's pause for a moment. Try this grounding technique:

**5-4-3-2-1 Grounding**
- 👀 Name 5 things you can SEE
- ✋ Name 4 things you can TOUCH
- 👂 Name 3 things you can HEAR
- 👃 Name 2 things you can SMELL
- 👅 Name 1 thing you can TASTE

This helps bring you back to the present moment. What do you see around you?`,
  craving: `I see you're experiencing a craving. That's completely normal and part of the journey. 💪

Remember: Cravings typically peak within 15-20 minutes and then fade. You've got this!

**Try the HALT check:**
- **H**ungry? Grab a healthy snack
- **A**ngry? Express it safely
- **L**onely? Reach out to someone
- **T**ired? Rest if you can

What triggered this craving? Let's talk through it.`,
  sad: `I'm sorry you're feeling sad. 💙 It's okay to feel this way - emotions are messengers, not monsters.

Would you like to:
1. Talk about what's making you sad?
2. Try a quick mood-lifting activity?
3. Just have me here with you?

I'm not going anywhere. Take your time.`,
  happy: `That's wonderful to hear! 🌟 Celebrating the good moments is so important in recovery.

What's bringing you joy today? I'd love to hear about it! 

Maybe we can note this as a positive memory to look back on during harder times.`,
  tired: `Being tired can really affect everything, including your recovery resilience. 

Your sleep data shows there might be room for improvement. Here are some quick tips:
- Try to avoid screens 1 hour before bed
- Keep your room cool (65-68°F ideal)
- Consider a short 20-min power nap if it's before 3 PM

Would you like to log your sleep so we can track patterns together?`,
};

const defaultResponse = `I'm here for you. 💜 

Whether you want to share what's on your mind, try a quick mindfulness exercise, or just chat - I'm listening.

Some things we can explore:
- How you're feeling right now
- Review your progress and wins
- Try a breathing or grounding exercise
- Talk through a challenging situation

What feels right?`;

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [keyword, response] of Object.entries(contextResponses)) {
      if (lowerMessage.includes(keyword)) {
        return response;
      }
    }
    
    return defaultResponse;
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
            <p className="text-xs text-muted-foreground">Your AI Recovery Companion</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">Always here</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: "spring" }}
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
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {message.content}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
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
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Share what's on your mind..."
              className={cn(
                "flex-1 bg-secondary/50 rounded-xl px-4 py-3",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/50",
                "transition-all duration-200"
              )}
            />
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSend}
                className={cn(
                  "h-12 px-6 rounded-xl",
                  "bg-gradient-violet text-white",
                  "hover:shadow-glow-violet transition-shadow"
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

export default ChatPage;
