
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
}

export default function AIChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "👋 Hello! I'm your WalletMaster AI assistant. I can help you with:\n\n• Financial advice and budgeting tips\n• Investment strategies and portfolio management\n• Spending analysis and recommendations\n• General financial questions\n• Wallet and payment assistance\n\nHow can I help you today?",
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
    const fetchUserContext = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, phone')
            .eq('id', session.user.id)
            .single();

          setUserContext({
            email: session.user.email,
            full_name: profile?.full_name || session.user.user_metadata?.full_name,
            id: session.user.id,
          });
        }
      } catch (error) {
        console.error("Error fetching user context:", error);
      }
    };

    fetchUserContext();
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
      // Simulate AI response for now - you can replace this with actual AI integration
      const aiResponse = generateAIResponse(input.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: "assistant",
        timestamp: new Date(),
      };

      // Add a small delay to simulate processing
      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "🚫 I'm sorry, I'm currently experiencing technical difficulties. Please try again later.\n\n💡 **Tip**: Make sure you're connected to the internet.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
      setIsLoading(false);
    }
  };

  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Simple response logic - replace with actual AI integration
    if (input.includes('balance') || input.includes('money') || input.includes('wallet')) {
      return `💰 **Wallet & Balance Help**\n\nI can help you with wallet-related questions! Here are some things I can assist with:\n\n• Check your current balance\n• Understand transaction history\n• Set up payment methods\n• Manage your financial goals\n\nWhat specific wallet feature would you like help with?`;
    }
    
    if (input.includes('budget') || input.includes('spend') || input.includes('save')) {
      return `📊 **Budgeting & Savings Advice**\n\nGreat question about budgeting! Here are some personalized tips:\n\n• **50/30/20 Rule**: 50% needs, 30% wants, 20% savings\n• **Track your expenses** regularly\n• **Set specific savings goals**\n• **Review and adjust** monthly\n\nWould you like me to help you create a specific budget plan?`;
    }
    
    if (input.includes('invest') || input.includes('stock') || input.includes('portfolio')) {
      return `📈 **Investment Guidance**\n\nInvestment advice tailored for you:\n\n• **Start with emergency fund** (3-6 months expenses)\n• **Diversify your portfolio** across asset classes\n• **Consider low-cost index funds** for beginners\n• **Invest regularly** (dollar-cost averaging)\n\nRemember: Never invest more than you can afford to lose. Would you like specific investment recommendations based on your risk tolerance?`;
    }
    
    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return `👋 **Hello ${userContext.full_name || 'there'}!**\n\nI'm your WalletMaster AI assistant, ready to help with all your financial needs!\n\nYou can ask me about:\n• Budgeting and savings strategies\n• Investment advice\n• Expense tracking\n• Financial planning\n• Wallet management\n\nWhat would you like to explore today?`;
    }
    
    // Default response
    return `🤖 **AI Assistant Response**\n\nThank you for your question! I'm here to help with financial advice and wallet management.\n\n**Popular topics I can help with:**\n• Personal budgeting strategies\n• Investment and savings advice\n• Expense tracking and analysis\n• Financial goal setting\n• Payment and wallet features\n\nCould you provide more details about what you'd like assistance with? The more specific your question, the better I can help!`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white p-4">
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
              {userContext.full_name ? `Hello ${userContext.full_name}! ` : ''}Ready to help with your finances
            </p>
          </div>
        </div>
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <Card className="bg-white border border-gray-200 p-4 max-w-xs">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about finances, budgeting, investments..."
            disabled={isLoading}
            className="flex-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            size="icon"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Ask about budgeting, investments, or financial advice
        </p>
      </div>
    </div>
  );
}
