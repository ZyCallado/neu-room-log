
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else {
        router.push(user.role === "admin" ? "/admin" : "/dashboard");
      }
    }
  }, [user, loading, router]);

  return <div className="flex h-screen items-center justify-center">Initializing...</div>;
}
