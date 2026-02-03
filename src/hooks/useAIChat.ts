import { useState, useCallback } from "react";
import { useData, getLogsForDays } from "./useData";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UseAIChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
}

export function useAIChat(): UseAIChatReturn {
  const { logs } = useData();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey there! I'm Ally, your recovery companion. 👋 How are you feeling today? I'm here to listen, support, and help you through anything.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract user stats from recent logs
  const getUserStats = useCallback(() => {
    const recentLogs = getLogsForDays(logs, 7);
    if (recentLogs.length === 0) return undefined;

    const todayLog = recentLogs[0];
    const avgSleep = Math.round(
      recentLogs.reduce((sum, log) => sum + (log.sleep_quality || 0), 0) / recentLogs.length
    );

    return {
      sleepQuality: avgSleep,
      moodTag: todayLog?.mood_tag || undefined,
      cravingIntensity: todayLog?.craving_intensity || undefined,
      currentStreak: recentLogs.length, // Simplified streak calculation
    };
  }, [logs]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    let assistantContent = "";

    const updateAssistantMessage = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.role === "assistant" && lastMessage.id.startsWith("assistant-streaming")) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [
          ...prev,
          {
            id: `assistant-streaming-${Date.now()}`,
            role: "assistant" as const,
            content: assistantContent,
            timestamp: new Date(),
          },
        ];
      });
    };

    try {
      const apiMessages = messages
        .filter((m) => m.id !== "welcome")
        .concat(userMessage)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          userStats: getUserStats(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistantMessage(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistantMessage(content);
          } catch {
            /* ignore */
          }
        }
      }

      // Finalize the message ID
      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.id.startsWith("assistant-streaming")) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, id: `assistant-${Date.now()}` } : m
          );
        }
        return prev;
      });
    } catch (err) {
      console.error("AI Chat error:", err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      setError(errorMessage);
      
      // Add a fallback message
      setMessages((prev) => {
        // Remove any streaming message
        const filtered = prev.filter((m) => !m.id.startsWith("assistant-streaming"));
        return [
          ...filtered,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: `I'm having trouble connecting right now. ${errorMessage}. Please try again in a moment. 💙`,
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  }, [messages, getUserStats]);

  const clearHistory = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hey there! I'm Ally, your recovery companion. 👋 How are you feeling today? I'm here to listen, support, and help you through anything.",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory,
  };
}
