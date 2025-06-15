import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let redirecting = false;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[Index] Supabase session on mount:", session);
      if (session && !redirecting) {
        redirecting = true;
        navigate("/dashboard", { replace: true });
      }
      setChecking(false);
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("[Index] Supabase session changed:", session);
      if (session && !redirecting) {
        redirecting = true;
        navigate("/dashboard", { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Show loading while checking session
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3" />
          <p className="text-center text-muted-foreground">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold text-finance-purple">
            Wallet<span className="text-finance-blue">Master</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/login")}>Get Started</Button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Smart Financial Management at Your Fingertips
                </h1>
                <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Wallet Master helps you track expenses, manage cards, set budgets, and get AI-powered financial insights all in one place.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" onClick={() => navigate("/login")}>
                    Get Started for Free
                  </Button>
                  <Button size="lg" variant="outline">
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="mx-auto lg:ml-auto flex items-center justify-center">
                <div className="relative">
                  <div className="credit-card w-80 h-48 rotate-6 shadow-xl">
                    <div className="p-6 flex flex-col h-full justify-between text-white">
                      <div className="flex justify-between items-start">
                        <div className="text-white/80 font-medium">Wallet Master</div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="40"
                          height="32"
                          viewBox="0 0 40 32"
                          className="opacity-80"
                          fill="none"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M25.5 11C26.3284 11 27 10.3284 27 9.5C27 8.67157 26.3284 8 25.5 8C24.6716 8 24 8.67157 24 9.5C24 10.3284 24.6716 11 25.5 11ZM31.5 8C30.6716 8 30 8.67157 30 9.5C30 10.3284 30.6716 11 31.5 11C32.3284 11 33 10.3284 33 9.5C33 8.67157 32.3284 8 31.5 8Z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <div className="mt-4 text-lg tracking-widest font-mono">
                        4540 •••• •••• 1234
                      </div>
                      <div className="flex justify-between items-end mt-6">
                        <div className="text-sm space-y-1">
                          <div className="text-white/70 uppercase text-xs">Card Holder</div>
                          <div>DEMO USER</div>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="text-white/70 uppercase text-xs">Expires</div>
                          <div>12/26</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="credit-card w-80 h-48 rotate-3 shadow-xl absolute top-6 right-6 bg-gradient-to-r from-purple-500 to-indigo-600">
                    <div className="p-6 flex flex-col h-full justify-between text-white">
                      <div className="flex justify-between items-start">
                        <div className="text-white/80 font-medium">Metro Credit</div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="40"
                          height="32"
                          viewBox="0 0 40 32"
                          className="opacity-80"
                          fill="none"
                        >
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M25.5 11C26.3284 11 27 10.3284 27 9.5C27 8.67157 26.3284 8 25.5 8C24.6716 8 24 8.67157 24 9.5C24 10.3284 24.6716 11 25.5 11ZM31.5 8C30.6716 8 30 8.67157 30 9.5C30 10.3284 30.6716 11 31.5 11C32.3284 11 33 10.3284 33 9.5C33 8.67157 32.3284 8 31.5 8Z"
                            fill="white"
                          />
                        </svg>
                      </div>
                      <div className="mt-4 text-lg tracking-widest font-mono">
                        5412 •••• •••• 5678
                      </div>
                      <div className="flex justify-between items-end mt-6">
                        <div className="text-sm space-y-1">
                          <div className="text-white/70 uppercase text-xs">Card Holder</div>
                          <div>DEMO USER</div>
                        </div>
                        <div className="text-sm space-y-1">
                          <div className="text-white/70 uppercase text-xs">Expires</div>
                          <div>09/27</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 items-start">
              <div className="group p-6 bg-background shadow-lg rounded-lg transition-all hover:shadow-xl">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Multi-Card Management</h3>
                <p className="text-muted-foreground mt-3">
                  Link multiple debit/credit cards from different banks and manage them all in one place.
                </p>
              </div>
              <div className="group p-6 bg-background shadow-lg rounded-lg transition-all hover:shadow-xl">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <PieChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Expense Tracking</h3>
                <p className="text-muted-foreground mt-3">
                  Auto-categorize transactions with real-time expense tracking and visual breakdowns.
                </p>
              </div>
              <div className="group p-6 bg-background shadow-lg rounded-lg transition-all hover:shadow-xl">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">AI Financial Assistant</h3>
                <p className="text-muted-foreground mt-3">
                  Get personalized financial advice and insights from our AI-powered chatbot.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full py-6 px-4 sm:px-6 lg:px-8 border-t">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-muted-foreground">
            © 2025 Wallet Master. All rights reserved.
          </div>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-foreground">
              Terms
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

function MessageSquare(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CreditCard(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function PieChart(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
