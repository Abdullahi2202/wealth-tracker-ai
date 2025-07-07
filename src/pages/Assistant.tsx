
import DashboardLayout from "@/components/layout/DashboardLayout";
import AIChatbot from "@/components/assistant/AIChatbot";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Sparkles, TrendingUp, MessageCircle } from "lucide-react";

const Assistant = () => {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
        {/* Enhanced Header Section */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  WalletMaster AI Assistant
                  <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                </h1>
                <p className="text-blue-100 text-sm md:text-base">
                  Your intelligent financial advisor with real-time insights
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-300" />
                <span>Live Data</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-blue-300" />
                <span>Smart Chat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Smart Analysis</h3>
                  <p className="text-xs text-green-600">Real-time spending insights</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">AI Powered</h3>
                  <p className="text-xs text-blue-600">Personalized recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-800">24/7 Support</h3>
                  <p className="text-xs text-purple-600">Always here to help</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Chatbot Component */}
        <div className="flex-1 min-h-0">
          <AIChatbot />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Assistant;
