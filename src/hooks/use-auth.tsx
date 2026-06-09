import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from "react";
import { auth, db } from "@/integrations/firebase/client";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { AppRole } from "@/types";

interface AuthCtx {
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, roles: [], loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoles = useCallback(async (uid: string) => {
    try {
      const q = query(collection(db, "user_roles"), where("user_id", "==", uid));
      const snap = await getDocs(q);
      const fetchedRoles = snap.docs.map(doc => doc.data().role as AppRole);
      setRoles(fetchedRoles);
    } catch (e) {
      console.error("Error loading roles", e);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadRoles(currentUser.uid);
      } else {
        setRoles([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [loadRoles]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setRoles([]);
  };

  return <Ctx.Provider value={{ user, roles, loading, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
export const hasRole = (roles: AppRole[], r: AppRole) => roles.includes(r) || roles.includes("admin");