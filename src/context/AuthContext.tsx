
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useAuth as useFirebaseAuth, useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: "admin" | "professor";
  is_blocked: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const router = useRouter();
  const auth = useFirebaseAuth();
  const db = useFirestore();

  // Helper function to fetch full user profile and role
  const fetchUserProfile = async (fUser: FirebaseUser): Promise<AppUser> => {
    try {
      // 1. Check for Admin role in the specialized roles collection
      const adminDocRef = doc(db, "roles_admin", fUser.uid);
      const adminDoc = await getDoc(adminDocRef);
      const isAdmin = adminDoc.exists();

      // 2. Fetch User Profile for status and display info
      const userDocRef = doc(db, "users", fUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : null;

      return {
        uid: fUser.uid,
        email: fUser.email,
        displayName: userData?.name || fUser.displayName || fUser.email?.split('@')[0] || "User",
        role: isAdmin ? "admin" : "professor",
        is_blocked: userData?.is_blocked || false,
      };
    } catch (error) {
      // Fallback to basic professor if database is unreachable or profile missing
      return {
        uid: fUser.uid,
        email: fUser.email,
        displayName: fUser.displayName || "User",
        role: "professor",
        is_blocked: false,
      };
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      if (!fUser) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  // Effect to handle profile fetching when firebase user changes
  useEffect(() => {
    let isMounted = true;

    if (firebaseUser) {
      setLoading(true);
      fetchUserProfile(firebaseUser).then((appUser) => {
        if (isMounted) {
          setUser(appUser);
          setLoading(false);
        }
      });
    }

    return () => { isMounted = false; };
  }, [firebaseUser, db]);

  const refreshUser = async () => {
    if (firebaseUser) {
      const updatedUser = await fetchUserProfile(firebaseUser);
      setUser(updatedUser);
    }
  };

  const signOut = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
