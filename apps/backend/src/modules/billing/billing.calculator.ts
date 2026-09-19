export const TOLA_GRAM_EQUIVALENT = 11.6638;

export interface CalculatedItem {
  categoryId?: string | null;
  categoryName: string;
  description: string;
  designStyle?: string | null;
  metalType: string;
  purity: string;
  grossWeight: number;
  netWeight: number;
  metalRatePerGram: number;
  ratePerTola: number;
  metalValue: number;
  hasStone: boolean;
  stoneType?: string | null;
  stoneCarat?: number | null;
  stoneWeight?: number | null;
  stoneCharges: number;
  makingCharges: number;
  discountApplicable: boolean;
  discountPercentage: number;
  discountAmount: number;
  itemSubtotal: number;
  taxableAmount: number;
  gstRate: number;
  gstAmount: number;
  totalItemAmount: number;
}

export interface CalculatedInvoiceSummary {
  grossItemsAmount: number; // Subtotal
  totalDiscount: number;
  overallDiscountPercentage?: number;
  overallDiscountAmount?: number;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  roundOff: number;
  netAmount: number; // Final Bill Amount
}

export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function roundWeight(val: number): number {
  return Math.round((val + Number.EPSILON) * 1000) / 1000;
}

export function calculateTolaRate(ratePerGram: number): number {
  return roundCurrency(ratePerGram * TOLA_GRAM_EQUIVALENT);
}

export function calculateItem(
  item: {
    categoryId?: string | null;
    categoryName: string;
    description: string;
    designStyle?: string | null;
    metalType?: string | null;
    purity: string;
    grossWeight?: number | null;
    netWeight: number;
    metalRatePerGram: number;
    ratePerTola?: number | null;
    hasStone?: boolean | null;
    stoneType?: string | null;
    stoneCarat?: number | null;
    stoneWeight?: number | null;
    stoneCharges?: number | null;
    makingCharges?: number | null;
    discountApplicable?: boolean | null;
    discountPercentage?: number | null;
  },
  gstRate: number,
): CalculatedItem {
  const netWeight = roundWeight(Math.max(0, item.netWeight || 0));
  const grossWeight = roundWeight(Math.max(0, item.grossWeight ?? netWeight));
  const ratePerGram = roundCurrency(Math.max(0, item.metalRatePerGram || 0));
  const ratePerTola = item.ratePerTola ? roundCurrency(item.ratePerTola) : calculateTolaRate(ratePerGram);

  // Metal Value = Net Weight * Rate per gram
  const metalValue = roundCurrency(netWeight * ratePerGram);

  // Making and Stone charges
  const makingCharges = roundCurrency(Math.max(0, item.makingCharges || 0));
  const hasStone = Boolean(item.hasStone);
  const stoneCharges = hasStone ? roundCurrency(Math.max(0, item.stoneCharges || 0)) : 0;
  const stoneType = hasStone ? (item.stoneType || null) : null;
  const stoneCarat = hasStone && item.stoneCarat ? roundCurrency(Math.max(0, item.stoneCarat)) : null;
  const stoneWeight = hasStone && item.stoneWeight ? roundWeight(Math.max(0, item.stoneWeight)) : null;

  // Item Subtotal = Metal Value + Making Charges + Stone Charges
  const itemSubtotal = roundCurrency(metalValue + makingCharges + stoneCharges);

  // Item Discount = applicable category discount
  const discountApplicable = Boolean(item.discountApplicable);
  const discountPercentage = discountApplicable ? roundCurrency(Math.max(0, item.discountPercentage || 0)) : 0;
  const discountAmount = discountApplicable
    ? roundCurrency((itemSubtotal * discountPercentage) / 100)
    : 0;

  // Taxable Amount = Item Subtotal - Item Discount
  const taxableAmount = roundCurrency(Math.max(0, itemSubtotal - discountAmount));

  // GST = Taxable Amount * configured GST rate
  const safeGstRate = roundCurrency(Math.max(0, gstRate || 0));
  const gstAmount = roundCurrency((taxableAmount * safeGstRate) / 100);

  // Final Item Amount = Taxable Amount + GST
  const totalItemAmount = roundCurrency(taxableAmount + gstAmount);

  return {
    categoryId: item.categoryId || null,
    categoryName: item.categoryName,
    description: item.description,
    designStyle: item.designStyle || null,
    metalType: item.metalType || 'GOLD',
    purity: item.purity,
    grossWeight,
    netWeight,
    metalRatePerGram: ratePerGram,
    ratePerTola,
    metalValue,
    hasStone,
    stoneType,
    stoneCarat,
    stoneWeight,
    stoneCharges,
    makingCharges,
    discountApplicable,
    discountPercentage,
    discountAmount,
    itemSubtotal,
    taxableAmount,
    gstRate: safeGstRate,
    gstAmount,
    totalItemAmount,
  };
}

export function calculateInvoice(
  items: CalculatedItem[],
  defaultGstRate: number,
  isInterstate: boolean = false,
  options?: {
    discountType?: 'CATEGORY' | 'OVERALL';
    overallDiscountPercentage?: number;
    overallDiscountAmount?: number;
  },
): CalculatedInvoiceSummary {
  let grossItemsAmount = 0;
  let categoryTotalDiscount = 0;

  for (const item of items) {
    grossItemsAmount = roundCurrency(grossItemsAmount + item.itemSubtotal);
    categoryTotalDiscount = roundCurrency(categoryTotalDiscount + item.discountAmount);
  }

  const isOverall = options?.discountType === 'OVERALL';
  let totalDiscount = 0;
  let overallDiscountPercentage = 0;
  let overallDiscountAmount = 0;

  if (isOverall) {
    if (options?.overallDiscountPercentage && options.overallDiscountPercentage > 0) {
      overallDiscountPercentage = roundCurrency(Math.min(100, Math.max(0, options.overallDiscountPercentage)));
      totalDiscount = roundCurrency((grossItemsAmount * overallDiscountPercentage) / 100);
      overallDiscountAmount = totalDiscount;
    } else if (options?.overallDiscountAmount && options.overallDiscountAmount > 0) {
      totalDiscount = roundCurrency(Math.min(grossItemsAmount, Math.max(0, options.overallDiscountAmount)));
      overallDiscountAmount = totalDiscount;
      overallDiscountPercentage = grossItemsAmount > 0 ? roundCurrency((totalDiscount / grossItemsAmount) * 100) : 0;
    }
  } else {
    totalDiscount = categoryTotalDiscount;
  }

  // Taxable Amount = Subtotal - Discount
  const taxableAmount = roundCurrency(Math.max(0, grossItemsAmount - totalDiscount));

  // Tax calculation
  const safeGstRate = roundCurrency(Math.max(0, defaultGstRate || 0));
  const totalTaxAmount = roundCurrency((taxableAmount * safeGstRate) / 100);

  const unroundedTotal = roundCurrency(taxableAmount + totalTaxAmount);
  const netAmount = Math.round(unroundedTotal);
  const roundOff = roundCurrency(netAmount - unroundedTotal);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterstate) {
    igstAmount = totalTaxAmount;
  } else {
    cgstAmount = roundCurrency(totalTaxAmount / 2);
    sgstAmount = roundCurrency(totalTaxAmount - cgstAmount);
  }

  return {
    grossItemsAmount,
    totalDiscount,
    overallDiscountPercentage,
    overallDiscountAmount,
    taxableAmount,
    gstRate: defaultGstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTaxAmount,
    roundOff,
    netAmount,
  };
}
