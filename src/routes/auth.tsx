import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrainFront, Mail, Lock, Loader2 } from "lucide-react";
import { auth } from "@/integrations/firebase/client";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      toast.success("Welcome back, Operator");
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message);
    }
    toast.success("Welcome back, Operator");
    navigate({ to: "/dashboard" });
  }

  async function onSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setLoading(false);
      toast.success("Account created. You can sign in now.");
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message);
    }
    toast.success("Account created. You can sign in now.");
  }

  async function onGoogle() {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setLoading(false);
      navigate({ to: "/dashboard" });
    } catch (error: any) {
      setLoading(false);
      toast.error(error.message || "Google sign-in failed");
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex relative overflow-hidden p-12 flex-col justify-between" style={{ background: "var(--gradient-primary)" }}>
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/30">
            <TrainFront className="w-5 h-5" />
          </div>
          <div className="font-extrabold text-xl">RailOne AI</div>
        </div>
        <div className="relative text-white max-w-md">
          <div className="text-[10px] uppercase tracking-[0.3em] mb-4 opacity-80">Mission Control</div>
          <h2 className="text-4xl font-black leading-tight">Every train. Every track. Every second.</h2>
          <p className="mt-4 text-white/80">Autonomous AI agents coordinate inspection, repair, and emergency response across your entire railway network.</p>
        </div>
        <div className="relative text-white/70 text-xs font-mono">v2.4 · Secured Operations Console</div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center glow-ring mb-4" style={{ background: "var(--gradient-primary)" }}>
              <TrainFront className="w-6 h-6 text-white" />
            </div>
            <div className="font-extrabold text-xl">RailOneAI: ER</div>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">Operator access</h1>
          <p className="text-sm text-muted-foreground mt-1">Authenticate to enter the command center.</p>

          <Button onClick={onGoogle} disabled={loading} variant="outline" className="w-full mt-6 h-11 border-border/80">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" opacity=".7"/><path fill="#fff" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" opacity=".5"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z" opacity=".85"/></svg>
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or with email <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={onSignIn} className="space-y-3 mt-4">
                <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} />
                <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} />
                <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-secondary">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={onSignUp} className="space-y-3 mt-4">
                <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} />
                <Field icon={Lock} label="Password" type="password" value={password} onChange={setPassword} />
                <Button type="submit" disabled={loading} className="w-full h-11 bg-primary hover:bg-secondary">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, type, value, onChange }: any) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="relative mt-1.5">
        <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required className="pl-9 h-11" />
      </div>
    </div>
  );
}