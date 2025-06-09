
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Clock, Star, TrendingUp } from "lucide-react";

type ChatbotConversation = {
  id: string;
  user_email: string;
  session_id: string;
  message: string;
  response: string | null;
  intent_detected: string | null;
  satisfaction_score: number | null;
  response_time_ms: number | null;
  created_at: string;
};

const ChatbotLogs = () => {
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [intentFilter, setIntentFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("chatbot_conversations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching chatbot conversations:", error);
    } else {
      setConversations(data || []);
    }
    setLoading(false);
  };

  const filteredConversations = conversations.filter(conversation => 
    intentFilter === "all" || conversation.intent_detected === intentFilter
  );

  const calculateMetrics = () => {
    const totalConversations = conversations.length;
    const avgResponseTime = conversations
      .filter(c => c.response_time_ms)
      .reduce((sum, c) => sum + (c.response_time_ms || 0), 0) / 
      conversations.filter(c => c.response_time_ms).length || 0;
    
    const avgSatisfaction = conversations
      .filter(c => c.satisfaction_score)
      .reduce((sum, c) => sum + (c.satisfaction_score || 0), 0) / 
      conversations.filter(c => c.satisfaction_score).length || 0;
    
    const successfulInteractions = conversations.filter(c => 
      c.satisfaction_score && c.satisfaction_score >= 4
    ).length;
    
    return {
      totalConversations,
      avgResponseTime: Math.round(avgResponseTime),
      avgSatisfaction: avgSatisfaction.toFixed(1),
      successRate: ((successfulInteractions / totalConversations) * 100).toFixed(1)
    };
  };

  const getIntentBadgeColor = (intent: string | null) => {
    if (!intent) return "bg-gray-100 text-gray-800";
    
    switch (intent) {
      case "password_reset": return "bg-blue-100 text-blue-800";
      case "transaction_limits": return "bg-green-100 text-green-800";
      case "identity_verification": return "bg-purple-100 text-purple-800";
      case "payment_issues": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getSatisfactionColor = (score: number | null) => {
    if (!score) return "text-gray-500";
    if (score >= 4) return "text-green-600";
    if (score >= 3) return "text-yellow-600";
    return "text-red-600";
  };

  const uniqueIntents = [...new Set(conversations.map(c => c.intent_detected).filter(Boolean))];
  const metrics = calculateMetrics();

  if (loading) {
    return <div className="text-center py-8">Loading chatbot logs...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalConversations}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">-15ms from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgSatisfaction}/5</div>
            <p className="text-xs text-muted-foreground">+0.2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRate}%</div>
            <p className="text-xs text-muted-foreground">Satisfaction ≥ 4</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Recent Conversations</h3>
        <Select value={intentFilter} onValueChange={setIntentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by intent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intents</SelectItem>
            {uniqueIntents.map(intent => (
              <SelectItem key={intent} value={intent!}>
                {intent?.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Response</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Response Time</TableHead>
              <TableHead>Satisfaction</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConversations.map((conversation) => (
              <TableRow key={conversation.id}>
                <TableCell>
                  {new Date(conversation.created_at).toLocaleDateString()} {' '}
                  {new Date(conversation.created_at).toLocaleTimeString()}
                </TableCell>
                <TableCell className="font-medium">{conversation.user_email}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate">{conversation.message}</div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate">{conversation.response || "-"}</div>
                </TableCell>
                <TableCell>
                  {conversation.intent_detected ? (
                    <Badge className={getIntentBadgeColor(conversation.intent_detected)}>
                      {conversation.intent_detected.replace("_", " ")}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {conversation.response_time_ms ? `${conversation.response_time_ms}ms` : "-"}
                </TableCell>
                <TableCell>
                  {conversation.satisfaction_score ? (
                    <span className={getSatisfactionColor(conversation.satisfaction_score)}>
                      {conversation.satisfaction_score}/5 ⭐
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ChatbotLogs;
