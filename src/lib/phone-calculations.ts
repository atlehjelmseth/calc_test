export interface PhonePlanData {
  id: string;
  label: string;
  dataGB: number;      // -1 = Fri bruk; ignored when isExtraSim = true
  isExtraSim: boolean; // true = Ekstra SIM product — matched by flag, not GB
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

// Find the reference (SMB) plan that corresponds to the customer's plan.
// Ekstra SIM: match against the reference provider's Ekstra SIM plan.
// Fri bruk:   match against the reference provider's Fri bruk plan.
// Normal GB:  match against the smallest reference plan that covers the customer's GB.
export function findSMBMatch(
  customerPlan: PhonePlanData,
  smbPlans: PhonePlanData[]
): PhonePlanData | null {
  if (customerPlan.isExtraSim) {
    return smbPlans.find((p) => p.isExtraSim) ?? null;
  }

  if (customerPlan.dataGB === -1) {
    return smbPlans.find((p) => p.dataGB === -1 && !p.isExtraSim) ?? null;
  }

  // Sort SMB plans ascending by GB (Fri bruk and Ekstra SIM last)
  const sorted = [...smbPlans]
    .filter((p) => !p.isExtraSim)
    .sort((a, b) => {
      if (a.dataGB === -1) return 1;
      if (b.dataGB === -1) return -1;
      return a.dataGB - b.dataGB;
    });

  for (const plan of sorted) {
    if (plan.dataGB === -1 || plan.dataGB >= customerPlan.dataGB) {
      return plan;
    }
  }

  return null;
}

export interface PhoneLineSavings {
  smbMatch: PhonePlanData | null;
  savingsPerSub: number;
  totalMonthlySavings: number;
}

export function calculatePhoneLineSavings(
  customerPlan: PhonePlanData,
  quantity: number,
  smbPlans: PhonePlanData[]
): PhoneLineSavings {
  const smbMatch = findSMBMatch(customerPlan, smbPlans);
  if (!smbMatch) return { smbMatch: null, savingsPerSub: 0, totalMonthlySavings: 0 };

  const savingsPerSub = Math.max(0, customerPlan.pricePerSub - smbMatch.pricePerSub);
  return { smbMatch, savingsPerSub, totalMonthlySavings: savingsPerSub * quantity };
}
