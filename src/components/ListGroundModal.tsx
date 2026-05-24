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
    // Basic validation per step
    if (step === 1) {
      if (
        !formData.owner.name.trim() ||
        !formData.owner.email.trim() ||
        !formData.owner.contact.trim() ||
        !formData.owner.password.trim() ||
        !formData.name.trim()
      ) {
        toast.error("Please fill in all required basic details & owner information.");
        return;
      }
    } else if (step === 2) {
      if (
        !formData.location.cityId ||
        !formData.location.address.trim() ||
        !formData.location.pincode.trim()
      ) {
        toast.error("Please specify complete location details.");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.images[0].url.trim()) {
      toast.error("Primary Ground Image URL is required.");
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
        toast.success("Ground listed successfully! Admin review is pending approval.");
        onClose();
        // Reset form
        setStep(1);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            owner: { ...formData.owner, name: e.target.value },
                          })
                        }
                        placeholder="Owner full name"
                        className="bg-white/[0.03] border-white/[0.08]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        value={formData.owner.email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            owner: { ...formData.owner, email: e.target.value },
                          })
                        }
                        placeholder="owner@domain.com"
                        className="bg-white/[0.03] border-white/[0.08]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Contact / Phone Number *
                      </label>
                      <Input
                        value={formData.owner.contact}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            owner: { ...formData.owner, contact: e.target.value },
                          })
                        }
                        placeholder="Enter 10 digit number"
                        className="bg-white/[0.03] border-white/[0.08]"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">
                        Create Password *
                      </label>
                      <Input
                        type="password"
                        value={formData.owner.password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            owner: { ...formData.owner, password: e.target.value },
                          })
                        }
                        placeholder="Password for Owner Panel"
                        className="bg-white/[0.03] border-white/[0.08]"
                        required
                      />
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
      </DialogContent>
    </Dialog>
  );
}
