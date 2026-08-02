export interface RoundRobinParticipant {
  id: number;
  seed?: number | null;
}

export interface RoundRobinPairing {
  round: number;
  matchNumber: number;
  player1Id: number;
  player2Id: number;
}

/** Standard circle-method schedule. A null slot represents a rest round. */
export function generateRoundRobinSchedule(
  participants: RoundRobinParticipant[],
): RoundRobinPairing[] {
  const ordered = [...participants].sort(
    (left, right) => (left.seed ?? Number.MAX_SAFE_INTEGER) - (right.seed ?? Number.MAX_SAFE_INTEGER)
      || left.id - right.id,
  );
  const rotation: Array<RoundRobinParticipant | null> = [...ordered];
  if (rotation.length % 2 === 1) rotation.push(null);
  if (rotation.length < 2) return [];

  const rounds = rotation.length - 1;
  const pairings: RoundRobinPairing[] = [];
  for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
    let matchNumber = 1;
    for (let index = 0; index < rotation.length / 2; index += 1) {
      const left = rotation[index];
      const right = rotation[rotation.length - 1 - index];
      if (!left || !right) continue;
      const swapSides = (roundIndex + index) % 2 === 1;
      pairings.push({
        round: roundIndex + 1,
        matchNumber: matchNumber++,
        player1Id: swapSides ? right.id : left.id,
        player2Id: swapSides ? left.id : right.id,
      });
    }

    const fixed = rotation[0];
    const tail = rotation.slice(1);
    tail.unshift(tail.pop()!);
    rotation.splice(0, rotation.length, fixed, ...tail);
  }
  return pairings;
}
