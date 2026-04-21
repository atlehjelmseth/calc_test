export interface ElectricityProviderData {
  id: string;
  name: string;
  isOurOffer: boolean;
  active: boolean;
  plans: ElectricityPlanData[];
}

export interface ElectricityPlanData {
  id: string;
  name: string;
  fixedAmount: number;
  markup: number;
}

export function calcElectricitySavings(
  annualKwh: number,
  customerPlan: ElectricityPlanData,
  ourPlan: ElectricityPlanData
): { monthly: number; yearly: number } {
  const customerYearly =
    customerPlan.fixedAmount * 12 + annualKwh * (customerPlan.markup / 100);
  const ourYearly =
    ourPlan.fixedAmount * 12 + annualKwh * (ourPlan.markup / 100);
  const yearly = Math.max(0, customerYearly - ourYearly);
  return { monthly: yearly / 12, yearly };
}
