export interface SavingsResult {
  monthly: number;
  yearly: number;
}

export interface AllSettings {
  accountingPercentage: number;
  insurancePercentage: number;
  electricity: {
    currentFixedAmount: number;
    currentMarkup: number;
    newFixedAmount: number;
    newMarkup: number;
  };
}

// Regnskap: besparelse basert på prosentandel
export function calculateAccountingSavings(
  monthlyCost: number,
  percentage: number
): SavingsResult {
  const monthly = monthlyCost * (percentage / 100);
  return { monthly, yearly: monthly * 12 };
}

// Forsikring: besparelse basert på prosentandel
export function calculateInsuranceSavings(
  monthlyCost: number,
  percentage: number
): SavingsResult {
  const monthly = monthlyCost * (percentage / 100);
  return { monthly, yearly: monthly * 12 };
}

// Strøm: besparelse beregnet på årlig forbruk og differanse i fastbeløp + påslag
// Formel:
//   Årlig besparelse =
//     (dagens fastbeløp - nytt fastbeløp) * 12
//     + årlig forbruk kWh * (dagens påslag øre - nytt påslag øre) / 100
export function calculateElectricitySavings(
  annualKwh: number,
  currentFixedAmount: number,
  currentMarkup: number,
  newFixedAmount: number,
  newMarkup: number
): SavingsResult {
  const fixedSavingsYearly = (currentFixedAmount - newFixedAmount) * 12;
  const markupSavingsYearly = annualKwh * ((currentMarkup - newMarkup) / 100);
  const yearly = fixedSavingsYearly + markupSavingsYearly;
  return { monthly: yearly / 12, yearly };
}

// Totalbesparelse på tvers av alle kategorier
export function calculateTotalSavings(
  accounting: SavingsResult,
  insurance: SavingsResult,
  electricity: SavingsResult
): SavingsResult {
  return {
    monthly: accounting.monthly + insurance.monthly + electricity.monthly,
    yearly: accounting.yearly + insurance.yearly + electricity.yearly,
  };
}

// Formater norsk valuta
export function formatNOK(amount: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Formater tall med desimaler
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
