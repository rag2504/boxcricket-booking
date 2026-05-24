import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  MapPin,
  IndianRupee,
  Camera,
  Check,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Users,
  ShieldAlert,
  CheckCircle2,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { indianCities } from "@/lib/cities";
import { groundsApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ListGroundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function ListGroundModal({ isOpen, onClose }: ListGroundModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: {
      address: "",
      cityId: "",
      cityName: "",
      state: "",
      pincode: "",
    },
    price: {
      ranges: [
        { start: "20:00", end: "08:00", perHour: 500 },
        { start: "08:00", end: "20:00", perHour: 400 },
      ],
      discount: 0,
    },
    images: [
      { url: "", alt: "", isPrimary: true },
      { url: "", alt: "", isPrimary: false },
      { url: "", alt: "", isPrimary: false },
    ],
    features: {
      pitchType: "Artificial Turf",
      capacity: 22,
      lighting: false,
      parking: false,
      changeRoom: false,
      washroom: false,
      cafeteria: false,
      equipment: false,
    },
    amenities: [] as string[],
    owner: {
      name: "",
      email: "",
      contact: "",
      password: "",
    },
  });

  // Validation helpers
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => /^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ""));
  const isValidPincode = (pin: string) => /^\d{6}$/.test(pin.trim());
  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const updateComplementaryRange = (rangeIndex: number, field: "start" | "end", value: string) => {
    const newRanges = [...formData.price.ranges];
    if (rangeIndex === 0) {
      newRanges[0] = { ...newRanges[0], [field]: value };
      newRanges[1] = {
        ...newRanges[1],
        start: newRanges[0].end,
        end: newRanges[0].start,
      };
    }
    setFormData({
      ...formData,
      price: { ...formData.price, ranges: newRanges },
    });
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Owner validations
      if (!formData.owner.name.trim()) newErrors.ownerName = "Owner name is required";
      else if (formData.owner.name.trim().length < 3) newErrors.ownerName = "Name must be at least 3 characters";

      if (!formData.owner.email.trim()) newErrors.ownerEmail = "Email is required";
      else if (!isValidEmail(formData.owner.email)) newErrors.ownerEmail = "Please enter a valid email address";

      if (!formData.owner.contact.trim()) newErrors.ownerContact = "Phone number is required";
      else if (!isValidPhone(formData.owner.contact)) newErrors.ownerContact = "Enter a valid 10-digit Indian mobile number";

      if (!formData.owner.password.trim()) newErrors.ownerPassword = "Password is required";
      else if (formData.owner.password.length < 6) newErrors.ownerPassword = "Password must be at least 6 characters";

      if (!confirmPassword.trim()) newErrors.confirmPassword = "Please confirm your password";
      else if (formData.owner.password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";

      // Ground validations
      if (!formData.name.trim()) newErrors.groundName = "Ground name is required";
      else if (formData.name.trim().length < 3) newErrors.groundName = "Ground name must be at least 3 characters";

      if (formData.features.capacity < 2) newErrors.capacity = "Capacity must be at least 2 players";
    } else if (step === 2) {
      if (!formData.location.cityId) newErrors.city = "Please select a city";
      if (!formData.location.address.trim()) newErrors.address = "Address is required";
      if (!formData.location.pincode.trim()) newErrors.pincode = "Pincode is required";
      else if (!isValidPincode(formData.location.pincode)) newErrors.pincode = "Enter a valid 6-digit pincode";

      if (formData.price.ranges.some(r => r.perHour <= 0)) newErrors.price = "Hourly rate must be greater than ₹0";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error(Object.values(newErrors)[0]);
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.images[0].url.trim()) {
      newErrors.primaryImage = "Primary Ground Image URL is required";
    } else if (!isValidUrl(formData.images[0].url)) {
      newErrors.primaryImage = "Please enter a valid image URL";
    }

    // Validate optional image URLs if provided
    formData.images.slice(1).forEach((img, idx) => {
      if (img.url.trim() && !isValidUrl(img.url)) {
        newErrors[`image${idx + 2}`] = `Image ${idx + 2} URL is not valid`;
      }
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    try {
      setIsSubmitting(true);
      // Filter out images with empty URLs to avoid schema validation errors
      const filteredImages = formData.images.filter((img) => img.url.trim() !== "");
      // Ensure description has a default if user left it empty
      const submitData = {
        ...formData,
        images: filteredImages,
        description: formData.description.trim() || `${formData.name} - Box Cricket Ground`,
      };
      const res = await groundsApi.registerGround(submitData);
      if (res.success) {
        setIsSuccess(true);
      } else {
        toast.error(res.message || "Failed to list ground.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsSuccess(false);
    setStep(1);
    setConfirmPassword("");
    setErrors({});
    setFormData({
      name: "",
      description: "",
      location: {
        address: "",
        cityId: "",
        cityName: "",
        state: "",
        pincode: "",
      },
      price: {
        ranges: [
          { start: "20:00", end: "08:00", perHour: 500 },
          { start: "08:00", end: "20:00", perHour: 400 },
        ],
        discount: 0,
      },
      images: [
        { url: "", alt: "", isPrimary: true },
        { url: "", alt: "", isPrimary: false },
        { url: "", alt: "", isPrimary: false },
      ],
      features: {
        pitchType: "Artificial Turf",
        capacity: 22,
        lighting: false,
        parking: false,
        changeRoom: false,
        washroom: false,
        cafeteria: false,
        equipment: false,
      },
      amenities: [],
      owner: {
        name: "",
        email: "",
        contact: "",
        password: "",
      },
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent
        className={cn(
          "max-w-2xl p-0 overflow-hidden border-white/[0.08] bg-[#0a0a0a]/95 shadow-glass-lg backdrop-blur-2xl text-white max-h-[90vh] flex flex-col",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-emerald/15 before:via-transparent before:to-emerald/5"
        )}
      >
        <DialogDescription className="sr-only">
          List your ground on CricBox. Fill owner and ground details to submit request to admin.
        </DialogDescription>

        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-emerald/10 blur-3xl" />
        <div className="noise-overlay pointer-events-none absolute inset-0 opacity-20" />

        {isSuccess ? (
          /* ───── SUCCESS SCREEN ───── */
          <div className="relative z-10 flex flex-col items-center justify-center py-12 px-8 text-center space-y-6">
            <DialogTitle className="sr-only">Request Submitted</DialogTitle>
            <DialogDescription className="sr-only">Your ground listing request has been submitted successfully.</DialogDescription>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald/15 border-2 border-emerald/30"
            >
              <CheckCircle2 className="w-10 h-10 text-emerald" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <h3 className="text-xl font-bold text-white">Request Submitted Successfully!</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your ground listing request has been received. Our admin team will verify the details and get back to you.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full max-w-sm space-y-3"
            >
              <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15">
                  <Mail className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-white">Email Notification</p>
                  <p className="text-[10px] text-muted-foreground">You'll receive an update at {formData.owner.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/15">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-white">WhatsApp Notification</p>
                  <p className="text-[10px] text-muted-foreground">Status updates on +91 {formData.owner.contact}</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="pt-2"
            >
              <p className="text-[10px] text-muted-foreground mb-4">Typical verification takes 24-48 hours</p>
              <Button
                onClick={handleCloseModal}
                className="bg-emerald text-black hover:bg-emerald/90 font-medium px-8"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Done
              </Button>
            </motion.div>
          </div>
        ) : (
          <>

        <DialogHeader className="relative z-10 px-6 pt-6 pb-4 border-b border-white/[0.05] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/15 border border-emerald/25">
              <Building className="w-5 h-5 text-emerald" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-bold flex items-center gap-2">
                List Your <span className="gradient-text">Ground</span>
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Register facility details. Verification is required before showing on portal.
              </p>
            </div>
          </div>

          {/* Stepper tracker */}
          <div className="flex items-center justify-between gap-2 mt-4 max-w-md">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                    step === s
                      ? "bg-emerald text-black shadow-glow-sm"
                      : step > s
                      ? "bg-emerald/30 text-emerald"
                      : "bg-white/10 text-muted-foreground"
                  )}
                >
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                <div
                  className={cn(
                    "h-[2px] flex-1 rounded-full transition-all duration-300",
                    step > s ? "bg-emerald" : "bg-white/10"
                  )}
                />
              </div>
            ))}
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald shrink-0">
              Step {step} of 3
            </span>
          </div>
        </DialogHeader>

        {/* Scrollable Form Content */}
        <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-hide">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease }}
                className="space-y-5"
              >
                <div className="space-y-3">
                  <Badge className="bg-emerald/10 text-emerald border-emerald/20">
                    Owner Details
                  </Badge>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Full Name *
                      </label>
                      <Input
                        value={formData.owner.name}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            owner: { ...formData.owner, name: e.target.value },
                          });
                          if (errors.ownerName) setErrors(prev => { const n = {...prev}; delete n.ownerName; return n; });
                        }}
                        placeholder="Owner full name"
                        className={cn("bg-white/[0.03] border-white/[0.08]", errors.ownerName && "border-red-500/50")}
                        required
                      />
                      {errors.ownerName && <p className="text-[10px] text-red-400">{errors.ownerName}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        value={formData.owner.email}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            owner: { ...formData.owner, email: e.target.value },
                          });
                          if (errors.ownerEmail) setErrors(prev => { const n = {...prev}; delete n.ownerEmail; return n; });
                        }}
                        placeholder="owner@domain.com"
                        className={cn("bg-white/[0.03] border-white/[0.08]", errors.ownerEmail && "border-red-500/50")}
                        required
                      />
                      {errors.ownerEmail && <p className="text-[10px] text-red-400">{errors.ownerEmail}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Mobile Number * <span className="text-muted-foreground/60">(10 digits)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground bg-white/[0.05] px-2.5 py-2 rounded-md border border-white/[0.08]">+91</span>
                        <Input
                          value={formData.owner.contact}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setFormData({
                              ...formData,
                              owner: { ...formData.owner, contact: val },
                            });
                            if (errors.ownerContact) setErrors(prev => { const n = {...prev}; delete n.ownerContact; return n; });
                          }}
                          placeholder="9876543210"
                          maxLength={10}
                          className={cn("bg-white/[0.03] border-white/[0.08] flex-1", errors.ownerContact && "border-red-500/50")}
                          required
                        />
                      </div>
                      {formData.owner.contact && (
                        <p className={cn("text-[10px]", formData.owner.contact.length === 10 ? "text-emerald/70" : "text-muted-foreground/60")}>
                          {formData.owner.contact.length}/10 digits
                        </p>
                      )}
                      {errors.ownerContact && <p className="text-[10px] text-red-400">{errors.ownerContact}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Create Password * <span className="text-muted-foreground/60">(min 6 chars)</span>
                      </label>
                      <Input
                        type="password"
                        value={formData.owner.password}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            owner: { ...formData.owner, password: e.target.value },
                          });
                          if (errors.ownerPassword) setErrors(prev => { const n = {...prev}; delete n.ownerPassword; return n; });
                        }}
                        placeholder="Min 6 characters"
                        className={cn("bg-white/[0.03] border-white/[0.08]", errors.ownerPassword && "border-red-500/50")}
                        required
                      />
                      {errors.ownerPassword && <p className="text-[10px] text-red-400">{errors.ownerPassword}</p>}
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Confirm Password *
                      </label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors(prev => { const n = {...prev}; delete n.confirmPassword; return n; });
                        }}
                        placeholder="Re-enter your password"
                        className={cn("bg-white/[0.03] border-white/[0.08]", errors.confirmPassword && "border-red-500/50")}
                        required
                      />
                      {errors.confirmPassword && <p className="text-[10px] text-red-400">{errors.confirmPassword}</p>}
                      {confirmPassword && formData.owner.password === confirmPassword && (
                        <p className="text-[10px] text-emerald/70 flex items-center gap-1"><Check className="w-3 h-3" /> Passwords match</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Badge className="bg-emerald/10 text-emerald border-emerald/20">
                    Ground Basics
                  </Badge>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Ground Name *
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Lords Box Arena, Wankhede Turf"
                        className="bg-white/[0.03] border-white/[0.08]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Capacity (Total Players) *
                      </label>
                      <Input
                        type="number"
                        min="2"
                        value={formData.features.capacity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            features: { ...formData.features, capacity: Number(e.target.value) },
                          })
                        }
                        className="bg-white/[0.03] border-white/[0.08]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Pitch Type *
                      </label>
                      <Select
                        value={formData.features.pitchType}
                        onValueChange={(val) =>
                          setFormData({
                            ...formData,
                            features: { ...formData.features, pitchType: val },
                          })
                        }
                      >
                        <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                          <SelectValue placeholder="Select pitch type" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border-white/[0.08] text-white">
                          <SelectItem value="Artificial Turf">Artificial Turf</SelectItem>
                          <SelectItem value="Synthetic">Synthetic</SelectItem>
                          <SelectItem value="Matting">Matting</SelectItem>
                          <SelectItem value="Concrete">Concrete</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground block">
                      Description
                    </label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Share facility details, special highlights, guidelines etc."
                      className="bg-white/[0.03] border-white/[0.08] min-h-[80px]"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease }}
                className="space-y-5"
              >
                <div className="space-y-3">
                  <Badge className="bg-emerald/10 text-emerald border-emerald/20">
                    Location details
                  </Badge>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Select City *
                      </label>
                      <Select
                        value={formData.location.cityId}
                        onValueChange={(val) => {
                          const target = indianCities.find((c) => c.id === val);
                          setFormData({
                            ...formData,
                            location: {
                              ...formData.location,
                              cityId: val,
                              cityName: target?.name || "",
                              state: target?.state || "",
                            },
                          });
                        }}
                      >
                        <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                          <SelectValue placeholder="Choose city" />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border-white/[0.08] text-white max-h-56">
                          {indianCities.map((city) => (
                            <SelectItem key={city.id} value={city.id}>
                              {city.name}, {city.state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Pincode *
                      </label>
                      <Input
                        value={formData.location.pincode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location: { ...formData.location, pincode: e.target.value },
                          })
                        }
                        placeholder="e.g., 400001"
                        className="bg-white/[0.03] border-white/[0.08]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Complete Address *
                      </label>
                      <Input
                        value={formData.location.address}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location: { ...formData.location, address: e.target.value },
                          })
                        }
                        placeholder="Street address, Landmark, Sector details"
                        className="bg-white/[0.03] border-white/[0.08]"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Badge className="bg-emerald/10 text-emerald border-emerald/20">
                    Pricing Ranges
                  </Badge>
                  <p className="text-[11px] text-muted-foreground">
                    Define complementary day & night pricing slots. Alter the first row to auto-balance.
                  </p>
                  <div className="space-y-3">
                    {formData.price.ranges.map((range, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl"
                      >
                        <div className="flex items-center gap-1.5">
                          <Select
                            value={range.start}
                            onValueChange={(val) => updateComplementaryRange(idx, "start", val)}
                            disabled={idx === 1}
                          >
                            <SelectTrigger className="w-20 bg-white/[0.02] border-white/[0.08]">
                              <SelectValue placeholder="Start" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-white/[0.08] text-white">
                              {Array.from({ length: 24 }, (_, i) => {
                                const hr = i.toString().padStart(2, "0");
                                return (
                                  <SelectItem key={`${hr}:00`} value={`${hr}:00`}>
                                    {hr}:00
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <span className="text-[10px] text-muted-foreground">to</span>
                          <Select
                            value={range.end}
                            onValueChange={(val) => updateComplementaryRange(idx, "end", val)}
                            disabled={idx === 1}
                          >
                            <SelectTrigger className="w-20 bg-white/[0.02] border-white/[0.08]">
                              <SelectValue placeholder="End" />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-900 border-white/[0.08] text-white">
                              {Array.from({ length: 24 }, (_, i) => {
                                const hr = i.toString().padStart(2, "0");
                                return (
                                  <SelectItem key={`${hr}:00`} value={`${hr}:00`}>
                                    {hr}:00
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 relative flex items-center">
                          <IndianRupee className="absolute left-2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            type="number"
                            min="0"
                            value={range.perHour}
                            onChange={(e) => {
                              const ranges = [...formData.price.ranges];
                              ranges[idx] = { ...ranges[idx], perHour: Number(e.target.value) };
                              setFormData({
                                ...formData,
                                price: { ...formData.price, ranges },
                              });
                            }}
                            placeholder="Hourly Rate"
                            className="pl-7 bg-white/[0.03] border-white/[0.08] h-9"
                          />
                          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">/ Hour</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Promotional Discount (%)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.price.discount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: { ...formData.price, discount: Number(e.target.value) },
                          })
                        }
                        placeholder="Discount"
                        className="bg-white/[0.03] border-white/[0.08]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.35, ease }}
                className="space-y-5"
              >
                <div className="space-y-3">
                  <Badge className="bg-emerald/10 text-emerald border-emerald/20">
                    Photos (URLs)
                  </Badge>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Primary Image URL *
                      </label>
                      <Input
                        value={formData.images[0].url}
                        onChange={(e) => {
                          const imgs = [...formData.images];
                          imgs[0] = { url: e.target.value, alt: formData.name || "Primary image", isPrimary: true };
                          setFormData({ ...formData, images: imgs });
                        }}
                        placeholder="https://images.unsplash.com/... or public URL"
                        className="bg-white/[0.03] border-white/[0.08]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Second View URL (Optional)
                      </label>
                      <Input
                        value={formData.images[1].url}
                        onChange={(e) => {
                          const imgs = [...formData.images];
                          imgs[1] = { url: e.target.value, alt: "Additional View", isPrimary: false };
                          setFormData({ ...formData, images: imgs });
                        }}
                        placeholder="https://images.unsplash.com/... or public URL"
                        className="bg-white/[0.03] border-white/[0.08]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Third View URL (Optional)
                      </label>
                      <Input
                        value={formData.images[2].url}
                        onChange={(e) => {
                          const imgs = [...formData.images];
                          imgs[2] = { url: e.target.value, alt: "Detail View", isPrimary: false };
                          setFormData({ ...formData, images: imgs });
                        }}
                        placeholder="https://images.unsplash.com/... or public URL"
                        className="bg-white/[0.03] border-white/[0.08]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Badge className="bg-emerald/10 text-emerald border-emerald/20">
                    Features & Amenities
                  </Badge>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Floodlights</span>
                      <Switch
                        checked={formData.features.lighting}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            features: { ...formData.features, lighting: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Parking</span>
                      <Switch
                        checked={formData.features.parking}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            features: { ...formData.features, parking: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Changing Room</span>
                      <Switch
                        checked={formData.features.changeRoom}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            features: { ...formData.features, changeRoom: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Washrooms</span>
                      <Switch
                        checked={formData.features.washroom}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            features: { ...formData.features, washroom: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Cafeteria / Snacks</span>
                      <Switch
                        checked={formData.features.cafeteria}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            features: { ...formData.features, cafeteria: checked },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">Equipment Rental</span>
                      <Switch
                        checked={formData.features.equipment}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            features: { ...formData.features, equipment: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 items-start bg-emerald/5 border border-emerald/10 p-3.5 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-emerald shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-emerald/80">
                    By submitting, you certify that all information about the ground, pitch type, and owner contact details is accurate. Administrative verification typically takes 24 to 48 hours.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal footer navigation controls */}
        <div className="relative z-10 px-6 py-4 border-t border-white/[0.05] flex items-center justify-between bg-[#080808]/90 shrink-0">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="border-white/10 hover:bg-white/5 text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              <span>Back</span>
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              onClick={handleNext}
              className="bg-emerald text-black hover:bg-emerald/90 font-medium"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-emerald text-black hover:bg-emerald/90 font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Listing</span>
                  <Check className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          )}
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
