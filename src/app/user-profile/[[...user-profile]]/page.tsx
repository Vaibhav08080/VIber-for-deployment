export const dynamic = "force-dynamic";

import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <UserProfile path="/user-profile" routing="path" />
    </div>
  );
}
