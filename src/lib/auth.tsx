import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
export interface UserProfile {
  id: string;
  role: 'worker' | 'employer';
  language: string;
  org_id: string;
  site_id: string;
  full_name: string;
  org_name: string;
  site_name: string;
  sector: 'construction' | 'college';
}

interface AuthState {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

/* ------------------------------------------------------------------ */
/*  Demo users                                                        */
/* ------------------------------------------------------------------ */
interface DemoUser {
  username: string;
  password: string;
  user: { id: string; email: string };
  profile: UserProfile;
}

const DEMO_USERS: DemoUser[] = [
  {
    username: 'worker_construction',
    password: 'pass123',
    user: { id: 'demo-wc-001', email: 'worker_construction' },
    profile: {
      id: 'demo-wc-001',
      role: 'worker',
      language: 'en',
      org_id: 'org-metrobuild',
      site_id: 'site-alpha',
      full_name: 'Rajesh Kumar',
      org_name: 'MetroBuild Construction',
      site_name: 'Site Alpha',
      sector: 'construction',
    },
  },
  {
    username: 'employer_construction',
    password: 'pass123',
    user: { id: 'demo-ec-001', email: 'employer_construction' },
    profile: {
      id: 'demo-ec-001',
      role: 'employer',
      language: 'en',
      org_id: 'org-metrobuild',
      site_id: 'site-alpha',
      full_name: 'Anita Sharma',
      org_name: 'MetroBuild Construction',
      site_name: 'Site Alpha',
      sector: 'construction',
    },
  },
  {
    username: 'worker_college',
    password: 'pass123',
    user: { id: 'demo-wk-002', email: 'worker_college' },
    profile: {
      id: 'demo-wk-002',
      role: 'worker',
      language: 'en',
      org_id: 'org-srm',
      site_id: 'dept-cs',
      full_name: 'Priya Venkatesh',
      org_name: 'SRM University',
      site_name: 'CS Department',
      sector: 'college',
    },
  },
  {
    username: 'employer_college',
    password: 'pass123',
    user: { id: 'demo-ec-002', email: 'employer_college' },
    profile: {
      id: 'demo-ec-002',
      role: 'employer',
      language: 'en',
      org_id: 'org-srm',
      site_id: 'dept-cs',
      full_name: 'Dr. Suresh Iyer',
      org_name: 'SRM University',
      site_name: 'CS Department',
      sector: 'college',
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Context                                                           */
/* ------------------------------------------------------------------ */
const AuthContext = createContext<AuthState | null>(null);

/* ------------------------------------------------------------------ */
/*  Storage keys                                                      */
/* ------------------------------------------------------------------ */
const STORAGE_KEY_USER = 'fairshift-user';
const STORAGE_KEY_PROFILE = 'fairshift-profile';

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState['user']>(null);
  const [profile, setProfile] = useState<AuthState['profile']>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);
      const storedProfile = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (storedUser && storedProfile) {
        setUser(JSON.parse(storedUser) as AuthState['user']);
        setProfile(JSON.parse(storedProfile) as UserProfile);
      }
    } catch {
      // Corrupted storage — ignore
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Demo mode: check against hardcoded users
    const match = DEMO_USERS.find(
      (u) => u.username === email && u.password === password,
    );

    if (!match) {
      throw new Error('Invalid username or password');
    }

    setUser(match.user);
    setProfile(match.profile);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(match.user));
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(match.profile));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_PROFILE);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, profile, loading, login, logout }),
    [user, profile, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
