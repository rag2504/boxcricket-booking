export const PLAYER_SURCHARGE_THRESHOLD = 10;
export const PLAYER_SURCHARGE_AMOUNT = 100;

export function getPlayerSurcharge(playerCount: number | string | undefined): number {
  const count = Number(playerCount) || 0;
  return count > PLAYER_SURCHARGE_THRESHOLD ? PLAYER_SURCHARGE_AMOUNT : 0;
}

export const PLAYER_SURCHARGE_LABEL = "Extra charge (10+ players)";
