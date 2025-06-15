
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VerifyIdentityForm } from "@/components/verify-identity/VerifyIdentityForm";

const VerifyIdentity = () => {
  const navigate = useNavigate();
  // Back to Profile
  const handleBack = () => {
    navigate("/profile");
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-slate-100 to-blue-100 px-2">
      <Card className="w-full max-w-md sm:max-w-lg shadow-xl rounded-xl mx-auto mt-16 mb-8 animate-fade-in">
        <CardHeader className="relative pb-3">
          <button
            className="absolute left-2 top-2 flex items-center text-muted-foreground hover:text-primary transition-colors rounded-lg px-2 py-1 focus:outline-none bg-transparent"
            type="button"
            onClick={handleBack}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 mr-1" aria-hidden="true" />
            <span className="text-sm font-medium">Back to Profile</span>
          </button>
          <CardTitle className="pl-8 text-2xl sm:text-3xl font-bold tracking-tight">
            Verify Your Identity
          </CardTitle>
          <CardDescription className="pl-8 pt-1 text-base sm:text-lg text-muted-foreground">
            For your security, upload an official document.
          </CardDescription>
        </CardHeader>
        <VerifyIdentityForm />
      </Card>
    </div>
  );
};

export default VerifyIdentity;
