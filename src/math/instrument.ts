/** One pricing interface over bills (BEY convention) and coupon bonds / STRIPS (street convention). */
import { cleanPrice, modDuration, ytm, SETTLE } from './bond.ts';
import { billModDuration, billPrice, billYield } from './bill.ts';
import type { DateInput } from './dates.ts';

export type PricingKind = 'bill' | 'coupon' | 'zero';

export interface Priceable {
  pricing: PricingKind;
  /** Annual coupon per 100 face; 0 for bills and STRIPS. */
  coupon: number;
  maturity: string;
}

export function priceAt(inst: Priceable, y: number, settle: DateInput = SETTLE): number {
  return inst.pricing === 'bill' ? billPrice(y, inst.maturity, settle) : cleanPrice(y, inst.coupon, inst.maturity, settle);
}

export function yieldAt(inst: Priceable, price: number, settle: DateInput = SETTLE): number {
  return inst.pricing === 'bill' ? billYield(price, inst.maturity, settle) : ytm(price, inst.coupon, inst.maturity, settle);
}

export function durationAt(inst: Priceable, y: number, settle: DateInput = SETTLE): number {
  return inst.pricing === 'bill' ? billModDuration(y, inst.maturity, settle) : modDuration(y, inst.coupon, inst.maturity, settle);
}
