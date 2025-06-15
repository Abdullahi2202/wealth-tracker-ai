import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageSquare, Search, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ChatbotConversation = {
  id: string;
  user_id: string;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [intentFilter, setIntentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ChatbotConversation | null>(null);

  useEffect(() => {
    fetchConversations();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('chatbot-conversations-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chatbot_conversations' },
        (payload) => {
          console.log('Chatbot conversation change:', payload);
          if (payload.eventType === 'INSERT') {
            setConversations(prev => [payload.new as ChatbotConversation, ...prev]);
            toast.info("New chatbot conversation");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error("Error fetching chatbot conversations:", error);
    }
    setLoading(false);
  };

  const generateSampleConversations = async () => {
    try {
      // Get a sample user to assign conversations to
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .limit(1);

      if (!users || users.length === 0) {
        toast.error("No users found. Please create a user first.");
        return;
      }

      const sampleUser = users[0];

      const sampleConversations = [
        {
          user_id: sampleUser.id,
          session_id: `sess_${Date.now()}_1`,
          message: "How do I reset my password?",
          response: "You can reset your password by clicking the 'Forgot Password' link on the login page.",
          intent_detected: "password_reset",
          satisfaction_score: 5,
          response_time_ms: 180
        },
        {
          user_id: sampleUser.id,
          session_id: `sess_${Date.now()}_2`,
          message: "What are my transaction limits?",
          response: "Your daily transaction limit is $5,000 for verified accounts and $1,000 for unverified accounts.",
          intent_detected: "transaction_limits",
          satisfaction_score: 4,
          response_time_ms: 220
        },
        {
          user_id: sampleUser.id,
          session_id: `sess_${Date.now()}_3`,
          message: "I need help with identity verification",
          response: "To verify your identity, please upload a clear photo of your government-issued ID and proof of address.",
          intent_detected: "identity_verification",
          satisfaction_score: 5,
          response_time_ms: 150
        }
      ];

      for (const conversation of sampleConversations) {
        await supabase.from("chatbot_conversations").insert(conversation);
      }

      toast.success("Sample conversations generated");
      fetchConversations();
    } catch (error) {
      console.error("Error generating sample conversations:", error);
      toast.error("Failed to generate sample conversations");
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = (conversation.user_id || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      conversation.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIntent = intentFilter === "all" || conversation.intent_detected === intentFilter;
    return matchesSearch && matchesIntent;
  });

  const getIntents = () => {
    const intents = conversations
      .map(c => c.intent_detected)
      .filter((intent, index, arr) => intent && arr.indexOf(intent) === index);
    return intents;
  };

  const getSatisfactionColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-800";
    if (score >= 4) return "bg-green-100 text-green-800";
    if (score >= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const calculateStats = () => {
    const totalConversations = conversations.length;
    const avgSatisfaction = conversations
      .filter(c => c.satisfaction_score)
      .reduce((sum, c) => sum + (c.satisfaction_score || 0), 0) / 
      conversations.filter(c => c.satisfaction_score).length || 0;
    const avgResponseTime = conversations
      .filter(c => c.response_time_ms)
      .reduce((sum, c) => sum + (c.response_time_ms || 0), 0) / 
      conversations.filter(c => c.response_time_ms).length || 0;
    
    return { totalConversations, avgSatisfaction, avgResponseTime };
  };

  const stats = calculateStats();

  if (loading) {
    return <div className="text-center py-8">Loading chatbot conversations...</div>;
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
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">All chatbot interactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Satisfaction</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgSatisfaction.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">User satisfaction score</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgResponseTime)}ms</div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Intents</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getIntents().length}</div>
            <p className="text-xs text-muted-foreground">Different intent types</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by email or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={intentFilter} onValueChange={setIntentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by intent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Intents</SelectItem>
            {getIntents().map(intent => (
              <SelectItem key={intent} value={intent || ""}>{intent}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchConversations}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={generateSampleConversations}>
          Generate Sample Data
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Satisfaction</TableHead>
              <TableHead>Response Time</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredConversations.map((conversation) => (
              <TableRow key={conversation.id}>
                <TableCell>
                  {new Date(conversation.created_at).toLocaleDateString()} {' '}
                  {new Date(conversation.created_at).toLocaleTimeString()}
                </TableCell>
                <TableCell className="font-medium">
                  {conversation.user_id || "Unknown"}
                </TableCell>
                <TableCell className="max-w-xs truncate">{conversation.message}</TableCell>
                <TableCell>
                  {conversation.intent_detected ? (
                    <Badge variant="outline">{conversation.intent_detected}</Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {conversation.satisfaction_score ? (
                    <Badge className={getSatisfactionColor(conversation.satisfaction_score)}>
                      {conversation.satisfaction_score}/5
                    </Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {conversation.response_time_ms ? `${conversation.response_time_ms}ms` : "-"}
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Conversation Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="font-medium">User ID:</label>
                          <p>{conversation.user_id}</p>
                        </div>
                        <div>
                          <label className="font-medium">Session ID:</label>
                          <p>{conversation.session_id}</p>
                        </div>
                        <div>
                          <label className="font-medium">User Message:</label>
                          <p className="whitespace-pre-wrap">{conversation.message}</p>
                        </div>
                        <div>
                          <label className="font-medium">Bot Response:</label>
                          <p className="whitespace-pre-wrap">{conversation.response || "No response"}</p>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <label className="font-medium">Intent:</label>
                            <p>{conversation.intent_detected || "Unknown"}</p>
                          </div>
                          <div>
                            <label className="font-medium">Satisfaction:</label>
                            <p>{conversation.satisfaction_score ? `${conversation.satisfaction_score}/5` : "Not rated"}</p>
                          </div>
                          <div>
                            <label className="font-medium">Response Time:</label>
                            <p>{conversation.response_time_ms ? `${conversation.response_time_ms}ms` : "Unknown"}</p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredConversations.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No conversations found. Click "Generate Sample Data" to create some sample conversations.
        </div>
      )}
    </div>
  );
};

export default ChatbotLogs;
