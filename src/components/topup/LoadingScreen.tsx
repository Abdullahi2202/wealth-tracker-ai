
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message: string;
}

export const LoadingScreen = ({ message }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen bg-muted pt-3 px-2 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};
