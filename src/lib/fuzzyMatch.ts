export function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  if (s1 === s2) return 1.0;
  if (s1.length < 2 || s2.length < 2) return 0;

  const bigrams1 = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bigram = s1.substring(i, i + 2);
    bigrams1.set(bigram, (bigrams1.get(bigram) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.substring(i, i + 2);
    const count = bigrams1.get(bigram) || 0;
    if (count > 0) {
      bigrams1.set(bigram, count - 1);
      intersection++;
    }
  }

  return (2.0 * intersection) / (s1.length + s2.length - 2);
}

export function detectAchievementCollision(
  incoming: {
    title?: string | null;
    personName?: string | null;
    rollNumber?: string | null;
    academicYear?: string | null;
    organization?: string | null;
  },
  published: {
    id: string;
    title: string;
    personName: string;
    primaryStudentRoll?: string | null;
    academicYear: string;
    organizationEventName?: string | null;
  }
): { isCollision: boolean; similarity: number; reason: string } {
  // 1. Same student roll number
  const sameRoll =
    incoming.rollNumber &&
    published.primaryStudentRoll &&
    incoming.rollNumber.trim().toUpperCase() === published.primaryStudentRoll.trim().toUpperCase();

  // 2. Same student name
  const nameSim = stringSimilarity(incoming.personName || '', published.personName || '');
  const sameStudent = sameRoll || nameSim > 0.85;

  // 3. Title similarity
  const titleSim = stringSimilarity(incoming.title || '', published.title || '');

  // 4. Org / Event similarity
  const orgSim = stringSimilarity(incoming.organization || '', published.organizationEventName || '');

  let similarity = 0;
  if (sameRoll) {
    similarity = titleSim * 0.7 + orgSim * 0.3;
  } else {
    similarity = titleSim * 0.5 + nameSim * 0.3 + orgSim * 0.2;
  }

  if (sameStudent && titleSim > 0.75) {
    return {
      isCollision: true,
      similarity: Math.round(similarity * 100) / 100,
      reason: `High similarity (${Math.round(similarity * 100)}%) for same student in academic year ${published.academicYear}`,
    };
  }

  if (titleSim > 0.9) {
    return {
      isCollision: true,
      similarity: Math.round(titleSim * 100) / 100,
      reason: `Near identical title match (${Math.round(titleSim * 100)}%)`,
    };
  }

  return {
    isCollision: false,
    similarity: Math.round(similarity * 100) / 100,
    reason: 'Distinct record',
  };
}
