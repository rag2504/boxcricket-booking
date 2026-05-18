import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Smartphone,
  Mail,
  Settings2,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import PageShell from "@/components/layout/PageShell";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { staggerContainer, staggerItem } from "@/lib/motion";

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
  });
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [openDownloadData, setOpenDownloadData] = useState(false);
  const [openDeleteAccount, setOpenDeleteAccount] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const [first, ...rest] = user.name ? user.name.split(" ") : [""];
      setFirstName(first || "");
      setLastName(rest.join(" ") || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      if (user.preferences) {
        setNotifications(user.preferences.notifications || notifications);
      }
    }
  }, [user]);

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedUser = {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        preferences: {
          notifications,
        },
      };
      updateUser(updatedUser);
      alert("Settings saved successfully!");
    } catch (error) {
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      const [first, ...rest] = user.name ? user.name.split(" ") : [""];
      setFirstName(first || "");
      setLastName(rest.join(" ") || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      if (user.preferences) {
        setNotifications(user.preferences.notifications || notifications);
      }
    }
  };

  const notificationItems = [
    {
      key: "email",
      icon: Mail,
      label: "Email Notifications",
      description: "Booking confirmations and updates",
    },
    {
      key: "push",
      icon: Smartphone,
      label: "Push Notifications",
      description: "Real-time alerts on your device",
    },
    {
      key: "sms",
      icon: Smartphone,
      label: "SMS Notifications",
      description: "Important updates via text message",
    },
    {
      key: "marketing",
      icon: Mail,
      label: "Marketing Communications",
      description: "Promotional offers and cricket tips",
    },
  ] as const;

  return (
    <PageShell>
      <Navbar />

      <section className="section-padding pt-4 pb-16">
        <div className="container-premium max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald to-emerald-light shadow-glow-sm">
                <Settings2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="heading-display text-2xl sm:text-3xl">Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your account preferences and app settings
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Account Settings */}
            <motion.div variants={staggerItem}>
              <GlassCard className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10 border border-emerald/20">
                    <User className="h-4 w-4 text-emerald" />
                  </div>
                  <h2 className="font-display font-semibold text-foreground">
                    Account Settings
                  </h2>
                </div>
                <div className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-muted-foreground">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-muted-foreground">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-muted-foreground">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-muted-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <Separator className="bg-white/[0.06]" />

                  <div className="flex flex-wrap gap-2">
                    <Button variant="glow" onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Notification Settings */}
            <motion.div variants={staggerItem}>
              <GlassCard className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10 border border-emerald/20">
                    <Bell className="h-4 w-4 text-emerald" />
                  </div>
                  <h2 className="font-display font-semibold text-foreground">
                    Notification Preferences
                  </h2>
                </div>
                <div className="divide-y divide-white/[0.06] p-2">
                  {notificationItems.map(({ key, icon: Icon, label, description }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between gap-4 rounded-xl px-4 py-4 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08]">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <Label className="font-medium text-foreground">{label}</Label>
                          <p className="text-sm text-muted-foreground">{description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications[key]}
                        onCheckedChange={(value) => handleNotificationChange(key, value)}
                      />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Privacy & Security */}
            <motion.div variants={staggerItem}>
              <GlassCard className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-6 py-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald/10 border border-emerald/20">
                    <Shield className="h-4 w-4 text-emerald" />
                  </div>
                  <h2 className="font-display font-semibold text-foreground">
                    Privacy & Security
                  </h2>
                </div>
                <div className="space-y-6 p-6">
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08]">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <Label className="font-medium text-foreground">Location Sharing</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow app to access your location for nearby grounds
                        </p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <Separator className="bg-white/[0.06]" />

                  <div className="space-y-3">
                    <Dialog open={openChangePassword} onOpenChange={setOpenChangePassword}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-emerald/20 text-emerald hover:bg-emerald/10 hover:text-emerald"
                        >
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input type="password" placeholder="Current Password" />
                          <Input type="password" placeholder="New Password" />
                          <Input type="password" placeholder="Confirm New Password" />
                        </div>
                        <DialogFooter>
                          <Button variant="glow">Save</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={openDownloadData} onOpenChange={setOpenDownloadData}>
                      <DialogTrigger asChild>
                        <Button variant="glass" className="w-full">
                          Download My Data
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Download My Data</DialogTitle>
                        </DialogHeader>
                        <p className="mb-4 text-sm text-muted-foreground">
                          You can download a copy of your account data. This may take a few
                          moments.
                        </p>
                        <DialogFooter>
                          <Button variant="glow">Download</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog open={openDeleteAccount} onOpenChange={setOpenDeleteAccount}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                        >
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you sure you want to delete your account?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. All your data will be permanently
                            deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
};

export default Settings;
