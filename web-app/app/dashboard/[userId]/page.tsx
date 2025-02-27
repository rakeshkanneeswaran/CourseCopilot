"use client";

import { useParams, useRouter } from "next/navigation";

const DashboardPage = () => {
  const params = useParams();
  const userId = params.userId;
  const router = useRouter();

  return (
    <div>
      <div>Welcome, User {userId}</div>
      <div>
        <button
          onClick={() => {
            router.push(`/createProject/${userId}`);
          }}
        >
          Click to create a new Project
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
