import { describe, it, expect } from 'vitest';
import {
  calculateItem,
  calculateInvoice,
  calculateTolaRate,
  roundCurrency,
  roundWeight,
} from './billing.calculator';

describe('Billing Calculator', () => {
  it('should correctly calculate 1 Tola = 11.6638g rate conversion', () => {
    const ratePerGram = 7250;
    const tolaRate = calculateTolaRate(ratePerGram);
    // 7250 * 11.6638 = 84562.55
    expect(tolaRate).toBe(84562.55);
  });

  it('should calculate item with metal value, making charges, stone charges, category discount, and GST', () => {
    // Net weight: 5.000g, Rate: 7000/g => Metal Value: 35000
    // Making charges: 2000
    // Stone charges: 1000 (hasStone: true)
    // Item Subtotal: 35000 + 2000 + 1000 = 38000
    // Category discount: 5% => Discount: 38000 * 0.05 = 1900
    // Taxable Amount: 38000 - 1900 = 36100
    // GST: 3% => 36100 * 0.03 = 1083
    // Final Item Amount: 36100 + 1083 = 37183
    const calculated = calculateItem(
      {
        categoryName: 'Ring',
        description: '22K Gold Handcrafted Ring',
        designStyle: 'Traditional',
        metalType: 'GOLD',
        purity: '22K (916)',
        grossWeight: 5.5,
        netWeight: 5.0,
        metalRatePerGram: 7000,
        hasStone: true,
        stoneType: 'Ruby',
        stoneWeight: 0.5,
        stoneCharges: 1000,
        makingCharges: 2000,
        discountApplicable: true,
        discountPercentage: 5,
      },
      3.0,
    );

    expect(calculated.metalValue).toBe(35000);
    expect(calculated.itemSubtotal).toBe(38000);
    expect(calculated.discountAmount).toBe(1900);
    expect(calculated.taxableAmount).toBe(36100);
    expect(calculated.gstAmount).toBe(1083);
    expect(calculated.totalItemAmount).toBe(37183);
    expect(calculated.ratePerTola).toBe(81646.6); // 7000 * 11.6638 = 81646.6
  });

  it('should set discount to 0 if discountApplicable is false', () => {
    const calculated = calculateItem(
      {
        categoryName: 'Ring',
        description: 'Gold Ring',
        metalType: 'GOLD',
        purity: '22K',
        netWeight: 2,
        metalRatePerGram: 6000,
        hasStone: false,
        discountApplicable: false,
        discountPercentage: 10,
      },
      3.0,
    );

    expect(calculated.metalValue).toBe(12000);
    expect(calculated.itemSubtotal).toBe(12000);
    expect(calculated.discountAmount).toBe(0);
    expect(calculated.taxableAmount).toBe(12000);
    expect(calculated.gstAmount).toBe(360);
    expect(calculated.totalItemAmount).toBe(12360);
  });

  it('should ignore stone charges if hasStone is false', () => {
    const calculated = calculateItem(
      {
        categoryName: 'Chain',
        description: 'Plain Chain',
        metalType: 'GOLD',
        purity: '22K',
        netWeight: 10,
        metalRatePerGram: 7000,
        hasStone: false,
        stoneCharges: 5000, // Should be ignored
        makingCharges: 3000,
      },
      3.0,
    );

    expect(calculated.stoneCharges).toBe(0);
    expect(calculated.itemSubtotal).toBe(73000);
  });

  it('should calculate invoice summary for multiple items', () => {
    const item1 = calculateItem(
      {
        categoryName: 'Ring',
        description: 'Gold Ring',
        metalType: 'GOLD',
        purity: '22K',
        netWeight: 5,
        metalRatePerGram: 7000,
        makingCharges: 1000,
        hasStone: false,
        discountApplicable: true,
        discountPercentage: 5,
      },
      3.0,
    );

    const item2 = calculateItem(
      {
        categoryName: 'Earrings',
        description: 'Gold Earrings',
        metalType: 'GOLD',
        purity: '22K',
        netWeight: 10,
        metalRatePerGram: 7000,
        makingCharges: 2000,
        hasStone: false,
        discountApplicable: false,
      },
      3.0,
    );

    const invoice = calculateInvoice([item1, item2], 3.0, false);

    // item1: subtotal 36000, disc 1800, tax 34200, gst 1026, total 35226
    // item2: subtotal 72000, disc 0, tax 72000, gst 2160, total 74160
    expect(invoice.grossItemsAmount).toBe(108000);
    expect(invoice.totalDiscount).toBe(1800);
    expect(invoice.taxableAmount).toBe(106200);
    expect(invoice.totalTaxAmount).toBe(3186);
    expect(invoice.cgstAmount).toBe(1593);
    expect(invoice.sgstAmount).toBe(1593);
    expect(invoice.igstAmount).toBe(0);
    expect(invoice.netAmount).toBe(109386);
  });

  it('should support stoneCarat on jewellery items with stone work', () => {
    const item = calculateItem(
      {
        categoryName: 'Diamond Ring',
        description: 'Solitaire Ring with 0.50 Carat Diamond',
        metalType: 'GOLD',
        purity: '18K (750)',
        netWeight: 3.5,
        metalRatePerGram: 5800,
        hasStone: true,
        stoneType: 'Diamond',
        stoneCarat: 0.5,
        stoneWeight: 0.1,
        stoneCharges: 25000,
        makingCharges: 3000,
      },
      3.0,
    );

    expect(item.hasStone).toBe(true);
    expect(item.stoneCarat).toBe(0.5);
    expect(item.stoneCharges).toBe(25000);
    // Metal value = 3.5 * 5800 = 20300
    // Item subtotal = 20300 + 3000 + 25000 = 48300
    expect(item.itemSubtotal).toBe(48300);
    expect(item.taxableAmount).toBe(48300);
    expect(item.gstAmount).toBe(1449);
    expect(item.totalItemAmount).toBe(49749);
  });

  it('should apply Overall Bill Discount without double-discounting category discounts', () => {
    const item1 = calculateItem(
      {
        categoryName: 'Bangle',
        description: 'Gold Bangle',
        metalType: 'GOLD',
        purity: '22K',
        netWeight: 10,
        metalRatePerGram: 7000,
        makingCharges: 2000,
        discountApplicable: true,
        discountPercentage: 10, // Category discount would have been 10%, but overall discount takes precedence
      },
      3.0,
    );

    const item2 = calculateItem(
      {
        categoryName: 'Chain',
        description: 'Gold Chain',
        metalType: 'GOLD',
        purity: '22K',
        netWeight: 10,
        metalRatePerGram: 7000,
        makingCharges: 1000,
        discountApplicable: false,
      },
      3.0,
    );

    // item1 subtotal = 72000; item2 subtotal = 71000 => Total Subtotal = 143000
    // Overall discount: 5% of 143000 = 7150
    const invoice = calculateInvoice([item1, item2], 3.0, false, {
      discountType: 'OVERALL',
      overallDiscountPercentage: 5,
    });

    expect(invoice.grossItemsAmount).toBe(143000);
    expect(invoice.totalDiscount).toBe(7150);
    expect(invoice.overallDiscountPercentage).toBe(5);
    expect(invoice.overallDiscountAmount).toBe(7150);
    // Taxable = 143000 - 7150 = 135850
    expect(invoice.taxableAmount).toBe(135850);
    // GST 3% of 135850 = 4075.50
    expect(invoice.totalTaxAmount).toBe(4075.5);
    // Net Amount with round-off
    expect(invoice.netAmount).toBe(139926);
  });
});
