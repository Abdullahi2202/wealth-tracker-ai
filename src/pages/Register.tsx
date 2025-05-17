import RegistrationForm from "@/components/register/RegistrationForm";

const Register = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-finance-purple text-center">
          Registration
        </h1>
        <RegistrationForm />
      </div>
    </div>
  );
};

export default Register;
