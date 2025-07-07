
import DashboardLayout from "@/components/layout/DashboardLayout";
import AIChatbot from "@/components/assistant/AIChatbot";

const Assistant = () => {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] p-4">
        <AIChatbot />
      </div>
    </DashboardLayout>
  );
};

export default Assistant;
