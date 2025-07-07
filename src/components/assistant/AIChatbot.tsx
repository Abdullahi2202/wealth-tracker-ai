
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Loader2, Sparkles, RefreshCw } from "lucide-react";
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
      content: "👋 Hello! I'm your enhanced WalletMaster AI assistant with access to your real financial data. I can help you:\n\n• Analyze your spending patterns and trends\n• Provide personalized budget recommendations\n• Suggest investment strategies based on your finances\n• Answer questions about your transactions\n• Help with financial planning and goals\n\nYour data is updated in real-time! How can I assist you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Get user context
    const fetchUserContext = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Get additional user info from profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', session.user.id)
            .single();

          setUserContext({
            email: session.user.email,
            full_name: profile?.full_name || session.user.user_metadata?.full_name,
            id: session.user.id,
            isAdmin: false // You can check admin status here
          });
        }
      } catch (error) {
        console.error("Error fetching user context:", error);
      }
    };

    fetchUserContext();

    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refreshData = async () => {
    try {
      // Trigger a refresh of financial insights
      window.location.reload();
    } catch (error) {
      toast.error("Failed to refresh data");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!isOnline) {
      toast.error("You're offline. Please check your internet connection.");
      return;
    }

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
        
        Context: Enhanced financial assistant for WalletMaster app with access to real user financial data including spending patterns, income, expenses, investment opportunities, and budget analysis. Provide detailed, actionable advice based on their actual financial data. Use emojis and formatting to make responses engaging and easy to read.
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

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

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
        content: "🚫 I'm sorry, I'm currently experiencing technical difficulties. Please try again later or contact support if the issue persists.\n\n💡 **Tip**: Make sure you're connected to the internet and your session hasn't expired.",
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
    <div className="flex flex-col h-full max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="w-8 h-8" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                WalletMaster AI Assistant
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </h2>
              <p className="text-blue-100 text-sm">
                {userContext.full_name ? `Hello ${userContext.full_name}! ` : ''}
                {isOnline ? 'Connected & Ready' : 'Offline - Limited functionality'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshData}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Financial Insights */}
      <div className="p-4 bg-gray-50 border-b">
        <FinancialInsights />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            } animate-fade-in`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            
            <Card className={`max-w-[80%] p-4 shadow-md ${
              message.role === "user" 
                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600" 
                : "bg-white border border-gray-200 hover:shadow-lg transition-shadow"
            }`}>
              <div className={`text-sm whitespace-pre-wrap leading-relaxed ${
                message.role === "user" ? "text-white" : "text-gray-800"
              }`}>
                {message.content}
              </div>
              <p className={`text-xs mt-3 opacity-70 ${
                message.role === "user" ? "text-blue-100" : "text-gray-500"
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </Card>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 shadow-md">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <Card className="bg-white border border-gray-200 p-4 max-w-xs">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">Analyzing your financial data...</span>
              </div>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your spending, investments, budget optimization, or financial goals..."
            disabled={isLoading || !isOnline}
            className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading || !isOnline}
            size="icon"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            Press Enter to send • Ask about spending patterns, investment advice, or budget optimization
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>
    </div>
  );
}
