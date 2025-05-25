import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

// Sample responses for the AI chatbot
const botResponses: { [key: string]: string } = {
  default: "I'm your financial assistant. I can help you with budgeting, expense tracking, and financial advice.",
  hello: "Hello! How can I assist with your finances today?",
  hi: "Hi there! How can I help you manage your money better?",
  budget: "Based on your recent spending, I recommend allocating 30% for housing, 15% for food, 10% for transport, and saving at least 20% of your monthly income.",
  save: "To improve your savings, consider the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. I can help you create a detailed savings plan if you'd like.",
  spend: "I've analyzed your spending patterns. Your highest expense categories are Housing, Food, and Transport this month.",
  invest: "For beginners, I recommend starting with low-cost index funds. With your current profile, a mix of 70% stocks and 30% bonds might be suitable. Would you like more specific investment advice?",
  card: "You currently have cards linked to your Wallet Master account. Want details or to link a new card?",
  help: "I can help you with budgeting, expense tracking, saving tips, investment advice, and analyzing your spending patterns. What would you like assistance with?",
};

const AIChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: "initial",
      content: "Hi there! I'm your AI financial assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New: Most recent spending and investment summaries
  const [spendingSummary, setSpendingSummary] = useState<string | null>(null);
  const [investmentSummary, setInvestmentSummary] = useState<string | null>(null);

  useEffect(() => {
    // Fetch a simple breakdown of spending and investments for chatbot context
    const loadData = async () => {
      let email = "";
      const storedUser = localStorage.getItem("walletmaster_user");
      if (storedUser) {
        try {
          const userObj = JSON.parse(storedUser);
          email = userObj.email || "";
        } catch {}
      }
      if (!email) return;

      // Fetch top spending categories (last 30 days expenses)
      const { data: txs } = await supabase
        .from("transactions")
        .select("amount, category, date")
        .eq("email", email)
        .eq("type", "expense");

      if (Array.isArray(txs)) {
        // Find top 2 categories and their sums
        const catMap: Record<string, number> = {};
        txs.forEach((t) => {
          const cat = t.category || "Misc";
          catMap[cat] = (catMap[cat] || 0) + Number(t.amount);
        });
        const sortedCats = Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2);
        if (sortedCats.length) {
          setSpendingSummary(
            `Your highest expenses are ${sortedCats
              .map(([c, v]) => `${c} ($${v.toFixed(2)})`)
              .join(" and ")}.`
          );
        }
      }

      // Fetch investments
      const { data: investments } = await supabase
        .from("investments")
        .select("name, value, change_pct")
        .eq("email", email);
      if (Array.isArray(investments) && investments.length > 0) {
        const total = investments.reduce((s, i) => s + (i.value || 0), 0);
        setInvestmentSummary(
          `You have ${investments.length} investments with a total value of $${total.toFixed(
            2
          )}.`
        );
      }
    };
    loadData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      content: input,
      sender: "user" as const,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    setTimeout(async () => {
      const lowerInput = input.toLowerCase();
      let botResponse = "";

      if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
        botResponse = botResponses.hello;
      } else if (lowerInput.includes("budget")) {
        botResponse = botResponses.budget;
      } else if (lowerInput.includes("save") || lowerInput.includes("savings")) {
        botResponse = botResponses.save;
      } else if (lowerInput.includes("spend") || lowerInput.includes("spending") || lowerInput.includes("expense")) {
        // Custom: fetch real data from spendingSummary
        botResponse =
          spendingSummary ||
          "I'm fetching your spending data, please try again in a moment.";
      } else if (lowerInput.includes("invest") || lowerInput.includes("investment")) {
        // Custom: fetch real data from investmentSummary
        botResponse =
          investmentSummary ||
          "I'm fetching your investments, please try again in a moment.";
      } else if (lowerInput.includes("card")) {
        botResponse = botResponses.card;
      } else if (lowerInput.includes("help")) {
        botResponse = botResponses.help;
      } else {
        botResponse = botResponses.default;
      }

      const aiMessage = {
        id: `bot-${Date.now()}`,
        content: botResponse,
        sender: "bot" as const,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>AI Financial Assistant</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 h-full">
        <div className="flex-grow overflow-auto mb-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "chatbot-message",
                message.sender === "user" ? "user-message" : "bot-message"
              )}
            >
              <p>{message.content}</p>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="bot-message chatbot-message">
              <div className="flex space-x-2">
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-0"></div>
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-150"></div>
                <div className="h-2 w-2 bg-primary rounded-full animate-bounce delay-300"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Ask me anything about your finances..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            className="flex-grow"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={isTyping || !input.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatbot;
