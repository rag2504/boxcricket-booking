import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  DollarSign,
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  IndianRupee,
} from "lucide-react";
import { format } from "date-fns";
import { bookingsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PaymentModal from "@/components/PaymentModal";
import { cn, isMongoObjectId } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/config";

interface Ground {
  _id: string;
  name: string;
  location: { address: string };
  price: {
    ranges: {
      start: string;
      end: string;
      perHour: number;
    }[];
    currency: string;
    discount?: number;
  };
  features: { capacity: number };
}

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  ground: Ground | null;
  onBookingCreated: (booking: any) => void;
}

interface TimeSlot {
  slot: string;
  label: string;
  isAvailable: boolean;
}

const ALL_24H_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const start = `${i.toString().padStart(2, "0")}:00`;
  const end = `${((i + 1) % 24).toString().padStart(2, "0")}:00`;
  const label =
    format(new Date(2000, 0, 1, i, 0), "hh:mm a") +
    " - " +
    format(new Date(2000, 0, 1, (i + 1) % 24, 0), "hh:mm a");
  return { slot: `${start}-${end}`, label };
});

const STEPS = [
  { id: 1, label: "Date", icon: Calendar },
  { id: 2, label: "Time", icon: Clock },
  { id: 3, label: "Details", icon: Users },
  { id: 4, label: "Review", icon: Star },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.35, ease },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.25, ease },
  }),
};

const inputClassName =
  "h-12 border-white/[0.08] bg-white/[0.03] backdrop-blur-md text-foreground";

const selectClassName =
  "w-full h-12 px-4 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md text-foreground text-sm focus:border-emerald/50 focus:outline-none focus:ring-2 focus:ring-emerald/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer";

const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  ground,
  onBookingCreated,
}) => {
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedStartSlotObj, setSelectedStartSlotObj] = useState<TimeSlot | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [playerCount, setPlayerCount] = useState("");
  const [teamName, setTeamName] = useState("");
  const [contactName, setContactName] = useState(user?.name || "");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<any>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const isPaymentModalOpenRef = useRef(isPaymentModalOpen);
  isPaymentModalOpenRef.current = isPaymentModalOpen;

  const getQuickDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isSameDay(date, tomorrow);
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE");
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return !!selectedDate;
      case 2:
        return !!selectedStartSlotObj && !!selectedEndTime;
      case 3:
        return !!playerCount && !!contactName && !!contactPhone;
      case 4:
        return (
          !!selectedDate &&
          !!selectedStartSlotObj &&
          !!selectedEndTime &&
          !!playerCount &&
          !!contactName &&
          !!contactPhone
        );
      default:
        return false;
    }
  };

  const canProceed = isStepComplete(currentStep);

  const goToStep = (step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  };

  const handleNext = () => {
    if (currentStep < 4 && canProceed) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  useEffect(() => {
    if (user) {
      setContactName(user.name || "");
      setContactPhone(user.phone || "");
      setContactEmail(user.email || "");
    }
  }, [user]);

  useEffect(() => {
    if (ground && selectedDate) {
      fetchAvailability();
    }
  }, [ground, selectedDate]);

  useEffect(() => {
    if (isOpen && user) {
      const timer = setTimeout(() => {
        fetchAvailability();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) {
      setIsPaymentModalOpen(false);
      setCreatedBooking(null);
      setCurrentStep(1);
      setDirection(0);
    }
  }, [isOpen]);

  const fetchAvailability = async () => {
    if (!ground || !selectedDate) return;
    setIsLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      const response = await bookingsApi.getGroundAvailability(ground._id, dateStr);
      let bookedSlots: string[] = [];

      if (response && (response as any).success && (response as any).availability) {
        bookedSlots = (response as any).availability.bookedSlots || [];
      }

      const now = new Date();
      const isSelectedToday =
        format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

      setAvailableSlots(
        ALL_24H_SLOTS.map((slot) => {
          const slotHour = parseInt(slot.slot.split(":")[0], 10);
          const isPast = isSelectedToday && slotHour <= now.getHours();
          const isBooked = bookedSlots.includes(slot.slot);
          return {
            ...slot,
            isAvailable: !isPast && !isBooked,
          };
        }),
      );
    } catch (e) {
      console.warn("Failed to fetch availability, showing all slots as available:", e);
      setAvailableSlots(
        ALL_24H_SLOTS.map((slot) => ({ ...slot, isAvailable: true })),
      );
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const getAvailableEndTimes = (startSlotObj: TimeSlot | null) => {
    if (!startSlotObj) return [];
    const startIdx = availableSlots.findIndex((s) => s.slot === startSlotObj.slot);
    if (startIdx === -1) return [];
    const maxDuration = 6;
    const endTimes: { value: string; label: string; duration: number }[] = [];

    const bookedRanges = availableSlots
      .filter((slot) => !slot.isAvailable)
      .map((slot) => {
        const [start, end] = slot.slot.split("-");
        return {
          start: new Date(`2000-01-01 ${start}`),
          end: new Date(`2000-01-01 ${end}`),
        };
      });

    const startTimeDate = new Date(`2000-01-01 ${startSlotObj.slot.split("-")[0]}`);

    for (let dur = 1; dur <= maxDuration; dur++) {
      const endIdx = startIdx + dur;
      if (endIdx > availableSlots.length) break;

      const endSlot = availableSlots[endIdx - 1];
      const endTimeDate = new Date(`2000-01-01 ${endSlot.slot.split("-")[1]}`);

      let hasOverlap = false;
      for (const bookedRange of bookedRanges) {
        if (startTimeDate < bookedRange.end && endTimeDate > bookedRange.start) {
          hasOverlap = true;
          break;
        }
      }

      if (hasOverlap) break;

      let allAvailable = true;
      for (let i = startIdx; i < endIdx; i++) {
        if (!availableSlots[i] || !availableSlots[i].isAvailable) {
          allAvailable = false;
          break;
        }
      }

      if (allAvailable) {
        endTimes.push({
          value: endSlot.slot.split("-")[1],
          label: endSlot.label.split(" - ")[1],
          duration: dur,
        });
      } else {
        break;
      }
    }
    return endTimes;
  };

  const findRangeForHour = (
    hour: number,
    ranges: { start: string; end: string; perHour: number }[],
  ) => {
    for (const range of ranges) {
      const start = parseInt(range.start.split(":")[0], 10);
      const end = parseInt(range.end.split(":")[0], 10);
      if (start < end) {
        if (hour >= start && hour < end) return range;
      } else {
        if (hour >= start || hour < end) return range;
      }
    }
    return null;
  };

  const calculateTotalPriceAndBreakdown = () => {
    if (!selectedStartSlotObj || !selectedEndTime || !ground)
      return { total: 0, breakdown: [] };
    const startHour = parseInt(selectedStartSlotObj.slot.split(":")[0], 10);
    const endHour = parseInt(selectedEndTime.split(":")[0], 10);
    let total = 0;
    let hour = startHour;
    const breakdown: { hour: string; rate: number | string; type: string }[] = [];
    while (hour !== endHour) {
      const range = findRangeForHour(hour, ground.price.ranges);
      const rate = range ? range.perHour : "Not set";
      const type = range ? `${range.start} - ${range.end}` : "No Range";
      breakdown.push({
        hour: `${hour.toString().padStart(2, "0")}:00 - ${(hour + 1) % 24 === 0 ? "00" : (hour + 1).toString().padStart(2, "0")}:00`,
        rate,
        type,
      });
      if (typeof rate === "number") total += rate;
      hour = (hour + 1) % 24;
      if (hour === startHour) break;
    }
    return { total, breakdown };
  };

  const handleBook = async () => {
    if (
      !ground ||
      !selectedDate ||
      !selectedStartSlotObj ||
      !selectedEndTime ||
      !playerCount ||
      !contactName ||
      !contactPhone
    )
      return;
    if (!user) {
      toast.error("Please login to create a booking");
      return;
    }

    if (isCreatingBooking) {
      console.log("Already creating booking, ignoring duplicate click");
      return;
    }

    try {
      const API = API_BASE_URL;
      const healthResponse = await fetch(`${API}/health`);
      if (!healthResponse.ok) throw new Error("Server not responding");
    } catch {
      toast.error("Server is not running. Please start the server first.");
      return;
    }

    setIsCreatingBooking(true);

    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const timeSlot = `${selectedStartSlotObj.slot.split("-")[0]}-${selectedEndTime}`;

      const bookingData = {
        groundId: ground._id,
        bookingDate: formattedDate,
        timeSlot: timeSlot,
        playerDetails: {
          teamName: teamName || undefined,
          playerCount: parseInt(playerCount),
          contactPerson: {
            name: contactName,
            phone: contactPhone,
            email: contactEmail || undefined,
          },
        },
        requirements: undefined,
      };

      console.log("Creating booking:", bookingData);
      const bookingResponse = await bookingsApi.createBooking(bookingData);

      if (bookingResponse && (bookingResponse as any).success) {
        toast.success("Booking created! Please complete payment to confirm.");

        const bookingWithGroundData = {
          ...(bookingResponse as any).booking,
          groundId: ground,
          ground: ground,
        };

        console.log("Booking created successfully:", bookingWithGroundData);
        setCreatedBooking(bookingWithGroundData);
        setIsPaymentModalOpen(true);
      } else {
        throw new Error((bookingResponse as any)?.message || "Failed to create booking");
      }
    } catch (error: any) {
      console.error("Booking error:", error);
      let errorMessage = "Failed to create booking. Please try again.";

      if (error.response?.status === 409) {
        errorMessage =
          error.response?.data?.message ||
          "This slot is no longer available. Please select a different time.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      await fetchAvailability();
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handlePaymentSuccess = (booking: any) => {
    toast.success("Payment successful! Your booking is confirmed.");
    onBookingCreated(booking);
    onClose();
    setIsPaymentModalOpen(false);
    setCreatedBooking(null);
  };

  const handlePaymentModalClose = async () => {
    setIsPaymentModalOpen(false);
    setCreatedBooking(null);
    await fetchAvailability();
  };

  if (!ground) return null;

  if (!isMongoObjectId(ground._id)) {
    return (
      <div className="p-6 text-center text-destructive">
        This ground cannot be booked online.
      </div>
    );
  }

  const { total, breakdown } = calculateTotalPriceAndBreakdown();

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Select Date
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose from the next 7 days
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
              {getQuickDates().map((date, index) => {
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                return (
                  <motion.button
                    key={index}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedStartSlotObj(null);
                      setSelectedEndTime("");
                    }}
                    className={cn(
                      "relative p-3 sm:p-4 rounded-xl text-center transition-all duration-200 min-h-[76px] sm:min-h-[84px] border",
                      isSelected
                        ? "border-emerald/50 bg-emerald/10 shadow-glow-sm text-emerald"
                        : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] text-foreground",
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="date-selected"
                        className="absolute inset-0 rounded-xl border border-emerald/30 bg-emerald/5"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <div className="relative z-10">
                      <div className="text-xs font-medium text-muted-foreground">
                        {getDateLabel(date)}
                      </div>
                      <div className="text-xl sm:text-2xl font-bold font-display">
                        {format(date, "d")}
                      </div>
                      <div className="text-xs text-muted-foreground">{format(date, "MMM")}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Select Time Range
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pick your start and end time
              </p>
            </div>

            {isLoadingSlots ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald" />
                <span className="text-sm text-muted-foreground">Loading available slots...</span>
              </div>
            ) : availableSlots.filter((s) => s.isAvailable).length === 0 ? (
              <GlassCard className="p-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No available slots for this day</p>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Start Time
                    </Label>
                    <select
                      className={selectClassName}
                      value={selectedStartSlotObj ? selectedStartSlotObj.slot : ""}
                      onChange={(e) => {
                        const slotObj = availableSlots.find((s) => s.slot === e.target.value);
                        setSelectedStartSlotObj(slotObj || null);
                        setSelectedEndTime("");
                      }}
                    >
                      <option value="" className="bg-[#0a0a0a]">
                        Select Start Time
                      </option>
                      {availableSlots
                        .filter((s) => s.isAvailable)
                        .map((slot) => (
                          <option key={slot.slot} value={slot.slot} className="bg-[#0a0a0a]">
                            {slot.label.split(" - ")[0]}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      End Time
                    </Label>
                    <select
                      className={selectClassName}
                      value={selectedEndTime}
                      onChange={(e) => setSelectedEndTime(e.target.value)}
                      disabled={!selectedStartSlotObj}
                    >
                      <option value="" className="bg-[#0a0a0a]">
                        Select End Time
                      </option>
                      {getAvailableEndTimes(selectedStartSlotObj).map((end) => (
                        <option key={end.value} value={end.value} className="bg-[#0a0a0a]">
                          {end.label} ({end.duration} hr{end.duration > 1 ? "s" : ""})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {selectedStartSlotObj && selectedEndTime && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3"
                  >
                    <p className="text-sm text-emerald font-medium">
                      Duration:{" "}
                      {(parseInt(selectedEndTime.split(":")[0], 10) -
                        parseInt(selectedStartSlotObj.slot.split(":")[0], 10) +
                        24) %
                        24}{" "}
                      hour(s)
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Team & Contact Details
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us about your booking
              </p>
            </div>

            <GlassCard className="p-4 sm:p-5 space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald" />
                Team Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Team Name (Optional)
                  </Label>
                  <Input
                    placeholder="Enter your team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Number of Players *
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={ground.features.capacity}
                    placeholder="Enter number of players"
                    value={playerCount}
                    onChange={(e) => setPlayerCount(e.target.value)}
                    className={inputClassName}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum {ground.features.capacity} players allowed
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5 space-y-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald" />
                Contact Person
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Full Name *
                    </Label>
                    <Input
                      placeholder="Contact person name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Phone Number *
                    </Label>
                    <Input
                      type="tel"
                      placeholder="Contact phone number"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className={inputClassName}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email Address (Optional)
                  </Label>
                  <Input
                    type="email"
                    placeholder="Contact email address"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className={inputClassName}
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Booking Summary
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review your booking before payment
              </p>
            </div>

            <GlassCard className="p-4 sm:p-5 space-y-4">
              <div className="space-y-3">
                {[
                  {
                    label: "Date",
                    value: selectedDate
                      ? format(selectedDate, "EEEE, MMMM d, yyyy")
                      : "—",
                  },
                  {
                    label: "Time",
                    value: selectedStartSlotObj
                      ? `${selectedStartSlotObj.slot.split("-")[0]} - ${selectedEndTime}`
                      : "—",
                  },
                  { label: "Players", value: `${playerCount} players` },
                  { label: "Team", value: teamName || "—" },
                  { label: "Contact", value: contactName },
                  { label: "Phone", value: contactPhone },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex flex-col sm:flex-row sm:justify-between gap-0.5 py-2 border-b border-white/[0.06] last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-4 sm:p-5 space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald" />
                Price Breakdown
              </h4>
              <div className="space-y-2">
                {breakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hours selected.</p>
                ) : (
                  breakdown.map((b, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{b.hour}</span>
                      <span className="font-medium">
                        {typeof b.rate === "number" ? `₹${b.rate}` : b.rate}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-white/[0.08] pt-3 flex justify-between items-center">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold font-display text-emerald">₹{total}</span>
              </div>
            </GlassCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog
        open={isOpen && !isPaymentModalOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isPaymentModalOpenRef.current) {
            onClose();
          }
        }}
      >
        <DialogContent
          className={cn(
            "max-w-4xl w-[95vw] sm:w-full rounded-2xl p-0 overflow-hidden border-white/[0.08] bg-[#0a0a0a]/95 shadow-glass-lg backdrop-blur-2xl max-h-[95vh] sm:max-h-[90vh]",
            "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-emerald/10 before:via-transparent before:to-emerald/5",
          )}
        >
          <DialogDescription className="sr-only">
            Book a cricket ground slot by selecting date, time, and providing contact details.
          </DialogDescription>

          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-emerald/8 blur-3xl" />
          <div className="noise-overlay pointer-events-none absolute inset-0 opacity-30" />

          {/* Header */}
          <div className="relative z-10 border-b border-white/[0.06] px-6 sm:px-8 py-5 sm:py-6">
            <DialogHeader>
              <DialogTitle className="font-display text-xl sm:text-2xl font-bold flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/15 border border-emerald/25">
                  <MapPin className="w-5 h-5 text-emerald" />
                </div>
                <span className="line-clamp-1">
                  Book <span className="gradient-text">{ground.name}</span>
                </span>
              </DialogTitle>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald shrink-0" />
                  <span className="line-clamp-1">{ground.location.address}</span>
                </span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  <DollarSign className="w-3.5 h-3.5 text-emerald shrink-0" />
                  {Array.isArray(ground?.price?.ranges) && ground.price.ranges.length > 0
                    ? ground.price.ranges.map((r, i) => (
                        <span key={i} className="text-xs whitespace-nowrap">
                          {r.start}-{r.end}: ₹{r.perHour}/hr
                        </span>
                      ))
                    : "No price ranges set"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald shrink-0" />
                  <span className="whitespace-nowrap">Max {ground.features.capacity}</span>
                </span>
              </div>
            </DialogHeader>

            {/* Stepper */}
            <div className="mt-6 flex items-center justify-between">
              {STEPS.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isComplete = isStepComplete(step.id) && currentStep > step.id;
                const isClickable = step.id < currentStep || isStepComplete(step.id);

                return (
                  <React.Fragment key={step.id}>
                    <button
                      type="button"
                      disabled={!isClickable && !isActive}
                      onClick={() => isClickable && goToStep(step.id)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 group transition-all",
                        isClickable || isActive ? "cursor-pointer" : "cursor-default",
                      )}
                    >
                      <div
                        className={cn(
                          "relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border transition-all duration-300",
                          isActive
                            ? "border-emerald/50 bg-emerald/15 shadow-glow-sm text-emerald"
                            : isComplete
                              ? "border-emerald/30 bg-emerald/10 text-emerald"
                              : "border-white/[0.08] bg-white/[0.03] text-muted-foreground",
                        )}
                      >
                        {isComplete && !isActive ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="step-indicator"
                            className="absolute inset-0 rounded-xl border border-emerald/40"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] sm:text-xs font-medium hidden xs:block",
                          isActive ? "text-emerald" : "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </span>
                    </button>
                    {index < STEPS.length - 1 && (
                      <div className="flex-1 mx-1 sm:mx-2 h-px relative">
                        <div className="absolute inset-0 bg-white/[0.08]" />
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-emerald/50"
                          initial={false}
                          animate={{
                            width: currentStep > step.id ? "100%" : "0%",
                          }}
                          transition={{ duration: 0.4, ease }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="relative z-10 px-6 sm:px-8 py-5 sm:py-6 max-h-[50vh] sm:max-h-[55vh] overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className="relative z-10 border-t border-white/[0.06] px-6 sm:px-8 py-4 sm:py-5 bg-white/[0.02] backdrop-blur-md">
            <div className="flex gap-3 sm:gap-4">
              {currentStep > 1 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="h-12 sm:h-13 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="h-12 sm:h-13 rounded-xl"
                >
                  Cancel
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  variant="glow"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="flex-1 h-12 sm:h-13 rounded-xl"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  variant="glow"
                  onClick={handleBook}
                  disabled={!canProceed || isCreatingBooking}
                  className="flex-1 h-12 sm:h-13 rounded-xl"
                >
                  {isCreatingBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Booking...
                    </>
                  ) : (
                    <>Proceed to Payment</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handlePaymentModalClose}
        booking={createdBooking}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default NewBookingModal;
