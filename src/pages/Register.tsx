
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import RegistrationForm from "@/components/register/RegistrationForm";

const Register = () => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md w-full">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-finance-purple text-center">
          Registration
        </h1>
        <RegistrationForm />
      </div>
    </div>
  );
};

export default Register;
