import { useEffect, useState } from "react";
import { getSupabase } from "./supabase";
import { getFirebaseAuth } from "./firebase";

export type SessionUser = {
  id: string;
  email: string | null;
  name: string | null;
  photo: string | null;
};

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let sbDone = false;
    let fbDone = false;
    const settle = () => {
      if (sbDone && fbDone) setLoading(false);
    };

    const supabase = getSupabase();
    const unsubs: Array<() => void> = [];

    if (supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          const u = data.session.user;
          setUser({
            id: u.id,
            email: u.email ?? null,
            name: (u.user_metadata?.["full_name"] as string) ?? null,
            photo: (u.user_metadata?.["avatar_url"] as string) ?? null,
          });
        }
        sbDone = true;
        settle();
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (session?.user) {
          const u = session.user;
          setUser({
            id: u.id,
            email: u.email ?? null,
            name: (u.user_metadata?.["full_name"] as string) ?? null,
            photo: (u.user_metadata?.["avatar_url"] as string) ?? null,
          });
        }
      });
      unsubs.push(() => sub.subscription.unsubscribe());
    } else {
      sbDone = true;
    }

    const auth = getFirebaseAuth();
    if (auth) {
      import("firebase/auth").then(({ onAuthStateChanged }) => {
        const un = onAuthStateChanged(auth, (fu) => {
          if (fu) {
            setUser({
              id: fu.uid,
              email: fu.email,
              name: fu.displayName,
              photo: fu.photoURL,
            });
          }
          fbDone = true;
          settle();
        });
        unsubs.push(un);
      });
    } else {
      fbDone = true;
    }

    settle();
    return () => unsubs.forEach((f) => f());
  }, []);

  const signOut = async () => {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    const auth = getFirebaseAuth();
    if (auth) {
      const { signOut: fbSignOut } = await import("firebase/auth");
      await fbSignOut(auth);
    }
    setUser(null);
  };

  return { user, loading, signOut };
}