
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import FinancialInsights from "./FinancialInsights";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface UserContext {
  email?: string;
  full_name?: string;
  id?: string;
  isAdmin?: boolean;
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your WalletMaster AI assistant with access to your real financial data. I can help you analyze your spending patterns, suggest budget improvements, provide investment advice based on your actual financial situation, and answer any questions about your wallet. How can I assist you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Get user context from localStorage
    const storedUser = localStorage.getItem("walletmaster_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserContext({
          email: user.email,
          full_name: user.full_name,
          id: user.id,
          isAdmin: user.isAdmin
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const enhancedContext = `
        User Information:
        - Name: ${userContext.full_name || 'Unknown'}
        - Email: ${userContext.email || 'Unknown'}
        - User Type: ${userContext.isAdmin ? 'Admin' : 'Regular User'}
        
        Context: Financial assistant for WalletMaster app with access to real user financial data including spending patterns, income, expenses, and investment opportunities. User is asking for personalized financial advice based on their actual data.
      `;

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { 
          prompt: input.trim(),
          context: enhancedContext,
          userInfo: {
            name: userContext.full_name,
            email: userContext.email,
            isAdmin: userContext.isAdmin
          }
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm currently experiencing technical difficulties. Please try again later or contact support if the issue persists.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <Bot className="w-8 h-8" />
          <div>
            <h2 className="text-xl font-semibold">WalletMaster AI Assistant</h2>
            <p className="text-blue-100 text-sm">
              {userContext.full_name ? `Hello ${userContext.full_name}! ` : ''}Your personal financial advisor with real-time data
            </p>
          </div>
        </div>
      </div>

      {/* Financial Insights */}
      <div className="p-4 bg-gray-50">
        <FinancialInsights />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            
            <Card className={`max-w-[80%] p-3 ${
              message.role === "user" 
                ? "bg-blue-600 text-white" 
                : "bg-white border border-gray-200"
            }`}>
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-2 ${
                message.role === "user" ? "text-blue-100" : "text-gray-500"
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </Card>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <Card className="bg-white border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Analyzing your financial data...</span>
              </div>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your spending, savings, investments, or financial goals..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Ask about your real spending patterns, investment advice, or budget optimization
        </p>
      </div>
    </div>
  );
}
