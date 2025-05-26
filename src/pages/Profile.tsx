
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import ProfileView from "@/components/profile/ProfileView";

const Profile = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted px-2">
      <Card className="max-w-2xl w-full rounded-2xl shadow-lg border border-gray-200 p-0">
        <CardContent className="p-8 pt-8 flex flex-col gap-6">
          <div className="flex flex-col items-center mb-2">
            <CardTitle className="text-2xl font-extrabold mb-1 text-center">
              My Profile
            </CardTitle>
          </div>
          <ProfileView />
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
