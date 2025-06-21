
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [walletNumber, setWalletNumber] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    
    const { fullName, email, password, phone } = form;
    if (!fullName || !email || !password || !phone) {
      toast.error("Please fill in all required fields.");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Starting registration process for:", email);
      
      // First, create record in registration table
      const { error: registrationError } = await supabase
        .from("registration")
        .insert({
          email,
          full_name: fullName,
          password: password, // In production, this should be hashed
          phone,
          document_type: 'passport',
          verification_status: 'unverified'
        });

      if (registrationError) {
        console.error("Registration table error:", registrationError);
        if (registrationError.code === '23505') { // Unique violation
          toast.error("An account with this email already exists.");
          setApiError("An account with this email already exists.");
          return;
        }
        toast.error("Registration failed: " + registrationError.message);
        setApiError("Registration failed: " + registrationError.message);
        return;
      }

      // Then register with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            phone: phone
          }
        },
      });
      
      if (signUpError) {
        console.error("Supabase signup error:", signUpError);
        toast.error("Auth signup failed: " + signUpError.message);
        setApiError("Auth signup failed: " + signUpError.message);
        return;
      }

      console.log("Registration successful:", authData.user?.id);

      // Fetch the wallet number for the newly created user
      if (authData.user?.id) {
        // Wait a moment for the wallet to be created by the trigger
        setTimeout(async () => {
          const { data: walletData, error: walletError } = await supabase
            .from("wallets")
            .select("wallet_number")
            .eq("user_id", authData.user.id)
            .single();

          if (!walletError && walletData?.wallet_number) {
            setWalletNumber(walletData.wallet_number.toString());
          }
        }, 1000);
      }

      toast.success(
        "Registration successful! Please check your email to verify. You can now log in.",
        { duration: 4200 }
      );
      
      setTimeout(() => navigate("/login"), 3000);
      
    } catch (err: any) {
      console.error("Registration exception:", err);
      toast.error("Registration failed: " + (err?.message || "Unknown error"));
      setApiError("Registration failed: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  if (walletNumber) {
    return (
      <Card className="shadow-lg p-4">
        <CardContent className="text-center space-y-4 mt-4">
          <div className="text-green-600 text-lg font-semibold">
            Registration Successful! 🎉
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Your Wallet Number:</p>
            <p className="text-2xl font-bold text-blue-600">{walletNumber}</p>
            <p className="text-xs text-gray-500 mt-2">
              Please save this number for your records
            </p>
          </div>
          <p className="text-sm text-gray-600">
            Please check your email to verify your account, then you can log in.
          </p>
          <Button onClick={() => navigate("/login")} className="w-full">
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg p-4">
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {apiError && (
            <div className="bg-red-100 text-red-600 border border-red-300 p-2 rounded text-sm">
              {apiError}
            </div>
          )}
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="mt-4">
            {loading ? "Registering..." : "Register"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegistrationForm;
