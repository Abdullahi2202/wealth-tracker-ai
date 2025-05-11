
import LoginForm from "@/components/auth/LoginForm";

const Login = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-finance-purple">
            Wallet<span className="text-finance-blue">Master</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Smart financial management solution
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
