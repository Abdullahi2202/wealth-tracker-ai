
import DashboardLayout from "@/components/layout/DashboardLayout";
import AIChatbot from "@/components/assistant/AIChatbot";

const Assistant = () => {
  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-10rem)]">
        <AIChatbot />
      </div>
    </DashboardLayout>
  );
};

export default Assistant;
