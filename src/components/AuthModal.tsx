import { useState, useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  User,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

const ease = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.08 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease },
  },
};

interface AuthFieldProps {
  label: string;
  htmlFor: string;
  icon: ReactNode;
  children: ReactNode;
}

const AuthField = ({ label, htmlFor, icon, children }: AuthFieldProps) => (
  <motion.div variants={fieldVariants} className="space-y-2">
    <Label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    <div className="relative group">
      <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-emerald">
        {icon}
      </div>
      {children}
    </div>
  </motion.div>
);

const AuthModal = ({
  isOpen,
  onClose,
  defaultTab = "login",
}: AuthModalProps) => {
  const { login, register } = useAuth();

  const [loginData, setLoginData] = useState({
    emailOrPhone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.emailOrPhone || !loginData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      await login(loginData.emailOrPhone, loginData.password);
      onClose();
    } catch {
      // Error handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !registerData.name ||
      !registerData.email ||
      !registerData.phone ||
      !registerData.password
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (registerData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsLoading(true);
      await register({
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        password: registerData.password,
      });
      onClose();
    } catch {
      // Error handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  const resetStates = () => {
    setLoginData({ emailOrPhone: "", password: "" });
    setRegisterData({
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    setShowRegisterPassword(false);
  };

  const handleClose = () => {
    resetStates();
    onClose();
  };

  const inputClassName = "h-11 pl-10 border-white/[0.08] bg-white/[0.03] backdrop-blur-md";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "relative overflow-hidden border-white/[0.08] bg-[#0a0a0a]/95 p-0 shadow-glass-lg backdrop-blur-2xl sm:max-w-md",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-emerald/10 before:via-transparent before:to-emerald/5",
        )}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald/10 blur-3xl" />
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-40" />

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease }}
          className="relative z-10 p-6 sm:p-8"
        >
          <DialogHeader className="space-y-4 text-center sm:text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-light shadow-glow-sm"
            >
              <span className="font-display text-lg font-bold text-white">CB</span>
            </motion.div>
            <div className="space-y-1.5">
              <DialogTitle className="font-display text-2xl font-bold tracking-tight">
                Welcome to{" "}
                <span className="gradient-text">CricBox</span>
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Book premium box cricket grounds in seconds
              </DialogDescription>
            </div>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "login" | "register")}
            className="mt-6 w-full"
          >
            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1 backdrop-blur-md">
              <TabsTrigger
                value="login"
                className={cn(
                  "relative rounded-lg text-sm font-semibold transition-all duration-200",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground",
                  "data-[state=active]:bg-transparent data-[state=active]:text-emerald data-[state=active]:shadow-none",
                )}
              >
                {activeTab === "login" && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute inset-0 rounded-lg border border-emerald/25 bg-emerald/10 shadow-glow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Login</span>
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className={cn(
                  "relative rounded-lg text-sm font-semibold transition-all duration-200",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground",
                  "data-[state=active]:bg-transparent data-[state=active]:text-emerald data-[state=active]:shadow-none",
                )}
              >
                {activeTab === "register" && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute inset-0 rounded-lg border border-emerald/25 bg-emerald/10 shadow-glow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">Register</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5 focus-visible:outline-none">
                <motion.form
                  key="login-form"
                  onSubmit={handleLogin}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-4"
                >
                  <AuthField
                    label="Email or Phone"
                    htmlFor="loginEmail"
                    icon={<Mail className="h-4 w-4" />}
                  >
                    <Input
                      id="loginEmail"
                      type="text"
                      placeholder="Enter email or phone"
                      value={loginData.emailOrPhone}
                      onChange={(e) =>
                        setLoginData((prev) => ({
                          ...prev,
                          emailOrPhone: e.target.value,
                        }))
                      }
                      className={inputClassName}
                    />
                  </AuthField>

                  <AuthField
                    label="Password"
                    htmlFor="loginPassword"
                    icon={<Lock className="h-4 w-4" />}
                  >
                    <Input
                      id="loginPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className={cn(inputClassName, "pr-10")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-emerald"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </AuthField>

                  <motion.div variants={fieldVariants} className="pt-1">
                    <Button
                      type="submit"
                      variant="glow"
                      size="lg"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              </TabsContent>

              <TabsContent value="register" className="mt-5 focus-visible:outline-none">
                <motion.form
                  key="register-form"
                  onSubmit={handleRegister}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3.5"
                >
                  <AuthField
                    label="Full Name"
                    htmlFor="registerName"
                    icon={<User className="h-4 w-4" />}
                  >
                    <Input
                      id="registerName"
                      type="text"
                      placeholder="Enter your full name"
                      value={registerData.name}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className={inputClassName}
                    />
                  </AuthField>

                  <AuthField
                    label="Email"
                    htmlFor="registerEmail"
                    icon={<Mail className="h-4 w-4" />}
                  >
                    <Input
                      id="registerEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className={inputClassName}
                    />
                  </AuthField>

                  <AuthField
                    label="Phone Number"
                    htmlFor="registerPhone"
                    icon={<Phone className="h-4 w-4" />}
                  >
                    <Input
                      id="registerPhone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={registerData.phone}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className={inputClassName}
                    />
                  </AuthField>

                  <AuthField
                    label="Password"
                    htmlFor="registerPassword"
                    icon={<Lock className="h-4 w-4" />}
                  >
                    <Input
                      id="registerPassword"
                      type={showRegisterPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className={cn(inputClassName, "pr-10")}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowRegisterPassword(!showRegisterPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-emerald"
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </AuthField>

                  <AuthField
                    label="Confirm Password"
                    htmlFor="confirmPassword"
                    icon={<Lock className="h-4 w-4" />}
                  >
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className={inputClassName}
                    />
                  </AuthField>

                  <motion.div variants={fieldVariants} className="pt-1">
                    <Button
                      type="submit"
                      variant="glow"
                      size="lg"
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
            </TabsContent>
          </Tabs>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-5 text-center text-xs text-muted-foreground"
          >
            By continuing, you agree to our terms of service
          </motion.p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
