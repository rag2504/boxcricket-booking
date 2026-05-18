export const PLAYER_SURCHARGE_THRESHOLD = 10;
export const PLAYER_SURCHARGE_AMOUNT = 100;

export function getPlayerSurcharge(playerCount) {
  const count = Number(playerCount) || 0;
  return count > PLAYER_SURCHARGE_THRESHOLD ? PLAYER_SURCHARGE_AMOUNT : 0;
}

export function getPricing(ground, timeSlot, playerCount = 0) {
  let duration = 1;
  let perHour = ground.price?.perHour || 500;
  if (timeSlot && typeof timeSlot === "object" && timeSlot.duration) {
    duration = Number(timeSlot.duration) || 1;
  }
  if (Array.isArray(ground.price?.ranges) && ground.price.ranges.length > 0 && timeSlot?.startTime) {
    const startHour = parseInt(timeSlot.startTime.split(":")[0]);
    const slot = ground.price.ranges.find((r) => {
      const rangeStart = parseInt(r.start.split(":")[0]);
      const rangeEnd = parseInt(r.end.split(":")[0]);

      if (rangeStart > rangeEnd) {
        return startHour >= rangeStart || startHour < rangeEnd;
      }
      return startHour >= rangeStart && startHour < rangeEnd;
    });

    if (slot) {
      perHour = slot.perHour;
    } else {
      perHour = ground.price.ranges[0].perHour;
    }
  }
  const baseAmount = perHour * duration;
  const discount = ground.price?.discount || 0;
  const playerSurcharge = getPlayerSurcharge(playerCount);
  const discountedAmount = baseAmount - discount + playerSurcharge;
  const convenienceFee = Math.round(discountedAmount * 0.02);
  const totalAmount = discountedAmount + convenienceFee;
  return {
    baseAmount,
    discount,
    playerSurcharge,
    taxes: convenienceFee,
    totalAmount,
    duration,
  };
}
