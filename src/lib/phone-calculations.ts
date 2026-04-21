export interface PhonePlanData {
  id: string;
  label: string;
  dataGB: number; // -1 = Fri bruk
  pricePerSub: number;
  sortOrder: number;
}

export interface PhoneProviderData {
  id: string;
  name: string;
  isOurOffer: boolean;
  active: boolean;
  sortOrder: number;
  plans: PhonePlanData[];
}

// Finn det minste SMB-abonnementet som dekker kundens GB-behov.
// Regel: bruk minst mulig besparelse → velg SMB-plan med lavest GB >= kundens GB.
// Hvis kunden har Fri bruk: sammenlign mot SMB Fri bruk.
export function findSMBMatch(
  customerPlan: PhonePlanData,
  smbPlans: PhonePlanData[]
): PhonePlanData | null {
  if (customerPlan.dataGB === -1) {
    return smbPlans.find((p) => p.dataGB === -1) ?? null;
  }

  // Sorter SMB-planer stigende på GB, Fri bruk sist
  const sorted = [...smbPlans].sort((a, b) => {
    if (a.dataGB === -1) return 1;
    if (b.dataGB === -1) return -1;
    return a.dataGB - b.dataGB;
  });

  // Finn minste plan som dekker kundens GB
  for (const plan of sorted) {
    if (plan.dataGB === -1 || plan.dataGB >= customerPlan.dataGB) {
      return plan;
    }
  }

  return null;
}

export interface PhoneLineSavings {
  smbMatch: PhonePlanData | null;
  savingsPerSub: number;      // kr/mnd per abonnement
  totalMonthlySavings: number; // savingsPerSub × antall
}

export function calculatePhoneLineSavings(
  customerPlan: PhonePlanData,
  quantity: number,
  smbPlans: PhonePlanData[]
): PhoneLineSavings {
  const smbMatch = findSMBMatch(customerPlan, smbPlans);

  if (!smbMatch) {
    return { smbMatch: null, savingsPerSub: 0, totalMonthlySavings: 0 };
  }

  // Hvis SMB er dyrere enn kundens plan: besparelse = 0
  const savingsPerSub = Math.max(0, customerPlan.pricePerSub - smbMatch.pricePerSub);

  return {
    smbMatch,
    savingsPerSub,
    totalMonthlySavings: savingsPerSub * quantity,
  };
}
