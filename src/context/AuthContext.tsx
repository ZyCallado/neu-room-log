"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useAuth as useFirebaseAuth, useFirestore } from "@/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
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
  const fetchUserProfile = async (fUser: FirebaseUser): Promise<AppUser | null> => {
    // Enforcement: Only @neu.edu.ph emails are allowed
    if (fUser.email && !fUser.email.endsWith("@neu.edu.ph")) {
      return null;
    }

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
      // Fallback for basic info if Firestore fetch fails
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
      // Global domain enforcement
      if (fUser && fUser.email && !fUser.email.endsWith("@neu.edu.ph")) {
        auth.signOut();
        setFirebaseUser(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setFirebaseUser(fUser);
      if (!fUser) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [auth]);

  // Effect to handle real-time profile fetching
  useEffect(() => {
    let unsubscribeUserDoc: () => void = () => {};

    if (firebaseUser) {
      setLoading(true);
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      
      // We use a listener for the user doc to handle "blocked" status in real-time
      unsubscribeUserDoc = onSnapshot(userDocRef, async (snapshot) => {
        const appUser = await fetchUserProfile(firebaseUser);
        setUser(appUser);
        setLoading(false);
      }, (error) => {
        // Fallback on error (like permission denied if doc doesn't exist yet)
        fetchUserProfile(firebaseUser).then(appUser => {
          setUser(appUser);
          setLoading(false);
        });
      });
    }

    return () => unsubscribeUserDoc();
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
