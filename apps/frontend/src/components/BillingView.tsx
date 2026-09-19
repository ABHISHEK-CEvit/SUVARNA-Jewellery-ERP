import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  CategoryDto,
  CustomerDto,
  SalesInvoiceDto,
  BillCorrectionRequestDto,
  CreateSalesInvoiceItemInput,
} from '@jewellery-erp/shared';
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
  FileText,
  User,
  Phone,
  Layers,
  Sparkles,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldAlert,
  History,
  X,
  Ban,
  RotateCcw,
  Percent,
  Tag,
} from 'lucide-react';

const TOLA_GRAM = 11.6638;

const INDIAN_GEM_TYPES = [
  'Diamond',
  'Ruby (Manik)',
  'Emerald (Panna)',
  'Sapphire (Neelam)',
  'Pearl (Moti)',
  'Yellow Sapphire (Pukhraj)',
  'Coral (Moonga)',
  'Cubic Zirconia (AD / CZ)',
  'Other',
];

const GOLD_PURITIES = ['24K (999)', '22K (916)', '20K (833)', '18K (750)', '14K (585)'];
const SILVER_PURITIES = ['Fine Silver (999)', 'Sterling Silver (925)', 'Standard Silver'];

export const BillingView: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [activeSubTab, setActiveSubTab] = useState<'create' | 'existing' | 'requests'>('create');

  // Master Data
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Customer Selection State (Dynamic Autocomplete)
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<CustomerDto[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDto | null>(null);
  const customerSearchRef = useRef<HTMLDivElement>(null);

  // Quick Customer Creation Modal
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    phone: '',
    pan: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    openingBalance: 0,
    openingBalanceType: 'DEBIT' as 'DEBIT' | 'CREDIT',
  });

  // Current item being drafted
  const [draftItem, setDraftItem] = useState<{
    categoryId: string;
    isCustomCategory: boolean;
    customCategoryName: string;
    description: string;
    designStyle: string;
    isCustomStyle: boolean;
    customStyleName: string;
    metalType: string;
    purity: string;
    grossWeight: number;
    netWeight: number;
    metalRatePerGram: number;
    hasStone: boolean;
    stoneType: string;
    stoneCarat: number;
    stoneWeight: number;
    stoneCharges: number;
    makingCharges: number;
    discountApplicable: boolean;
    discountPercentage: number;
  }>({
    categoryId: '',
    isCustomCategory: false,
    customCategoryName: '',
    description: '',
    designStyle: 'Traditional',
    isCustomStyle: false,
    customStyleName: '',
    metalType: 'GOLD',
    purity: '22K (916)',
    grossWeight: 0,
    netWeight: 0,
    metalRatePerGram: 0,
    hasStone: false,
    stoneType: 'Diamond',
    stoneCarat: 0,
    stoneWeight: 0,
    stoneCharges: 0,
    makingCharges: 0,
    discountApplicable: false,
    discountPercentage: 0,
  });

  // Bill-Level State
  const [billItems, setBillItems] = useState<CreateSalesInvoiceItemInput[]>([]);
  const [discountType, setDiscountType] = useState<'CATEGORY' | 'OVERALL'>('CATEGORY');
  const [overallDiscountPercentage, setOverallDiscountPercentage] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI'>('CASH');
  const [billNotes, setBillNotes] = useState('');
  const [creatingBill, setCreatingBill] = useState(false);

  // Existing Bills State
  const [bills, setBills] = useState<SalesInvoiceDto[]>([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateQuery, setDateQuery] = useState('');

  // Slip Modal
  const [selectedBillForSlip, setSelectedBillForSlip] = useState<SalesInvoiceDto | null>(null);
  const [slipModalOpen, setSlipModalOpen] = useState(false);

  // Invalidation Modal (Admin Only)
  const [invalidatingBill, setInvalidatingBill] = useState<SalesInvoiceDto | null>(null);
  const [invalidationReason, setInvalidationReason] = useState('');
  const [submittingInvalidation, setSubmittingInvalidation] = useState(false);

  // Edit Bill Modal
  const [editingBill, setEditingBill] = useState<SalesInvoiceDto | null>(null);
  const [editCustomerSearchQuery, setEditCustomerSearchQuery] = useState('');
  const [editCustomerResults, setEditCustomerResults] = useState<CustomerDto[]>([]);
  const [editCustomerDropdown, setEditCustomerDropdown] = useState(false);
  const [editChangeReason, setEditChangeReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Correction Request Modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [targetInvoiceForCorrection, setTargetInvoiceForCorrection] = useState<SalesInvoiceDto | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Correction Requests List State (Admin)
  const [correctionRequests, setCorrectionRequests] = useState<BillCorrectionRequestDto[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
  };

  // Helper to determine configured rate
  const getConfiguredRate = (metal: string, purity: string, currentSettings: any): number => {
    if (!currentSettings) return 0;
    if (metal === 'GOLD') {
      if (purity.includes('24K')) return Number(currentSettings.todayGold24kRate) || 0;
      if (purity.includes('22K')) return Number(currentSettings.todayGold22kRate) || 0;
      if (purity.includes('20K')) return Number(currentSettings.todayGold20kRate) || 0;
      if (purity.includes('18K')) return Number(currentSettings.todayGold18kRate) || 0;
      if (purity.includes('14K')) return Number(currentSettings.todayGold14kRate) || 0;
      return Number(currentSettings.todayGold22kRate) || 0;
    }
    if (metal === 'SILVER') {
      return Number(currentSettings.todaySilverRate) || 0;
    }
    return 0;
  };

  // Load initial settings and categories
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [catsRes, settRes] = await Promise.all([
        api.get('/api/v1/categories?activeOnly=true'),
        api.get('/api/v1/settings'),
      ]);
      let currentSett = null;
      if (settRes.data?.success) {
        currentSett = settRes.data.data;
        setSettings(currentSett);
      }
      if (catsRes.data?.success) {
        setCategories(catsRes.data.data);
        if (catsRes.data.data.length > 0) {
          const firstCat = catsRes.data.data[0];
          const initialMetal = firstCat.metalType || 'GOLD';
          const initialPurity = firstCat.defaultPurity || '22K (916)';
          const rate = getConfiguredRate(initialMetal, initialPurity, currentSett);
          setDraftItem((prev) => ({
            ...prev,
            categoryId: firstCat.id,
            discountPercentage: firstCat.discountRate || 0,
            metalType: initialMetal,
            purity: initialPurity,
            metalRatePerGram: rate,
          }));
        }
      }
    } catch {
      showNotification('error', 'Failed to load master categories and rates');
    }
  };

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Customer Dynamic Autocomplete Lookup
  const handleCustomerSearch = async (term: string) => {
    setCustomerSearchQuery(term);
    if (!term.trim()) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    setCustomerSearching(true);
    try {
      const res = await api.get(`/api/v1/customers?search=${encodeURIComponent(term.trim())}`);
      if (res.data?.success && res.data.data?.items) {
        setCustomerSearchResults(res.data.data.items);
        setShowCustomerDropdown(true);
      } else {
        setCustomerSearchResults([]);
      }
    } catch {
      setCustomerSearchResults([]);
    } finally {
      setCustomerSearching(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerDto) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    setShowCustomerDropdown(false);
  };

  // Customer Autocomplete inside Edit Modal
  const handleEditCustomerSearch = async (term: string) => {
    setEditCustomerSearchQuery(term);
    if (!term.trim()) {
      setEditCustomerResults([]);
      setEditCustomerDropdown(false);
      return;
    }
    try {
      const res = await api.get(`/api/v1/customers?search=${encodeURIComponent(term.trim())}`);
      if (res.data?.success && res.data.data?.items) {
        setEditCustomerResults(res.data.data.items);
        setEditCustomerDropdown(true);
      }
    } catch {
      setEditCustomerResults([]);
    }
  };

  // Create Customer Quick Form Submit
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.name.trim() || !newCustomerForm.phone.trim()) {
      showNotification('error', 'Name and Mobile Number are required.');
      return;
    }
    try {
      const payload: any = {
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.phone.trim(),
        address: newCustomerForm.address.trim() || undefined,
        city: newCustomerForm.city.trim() || undefined,
        state: newCustomerForm.state.trim() || 'Maharashtra',
        openingBalance: Number(newCustomerForm.openingBalance) || 0,
        openingBalanceType: newCustomerForm.openingBalanceType,
      };
      if (newCustomerForm.pan.trim()) {
        payload.pan = newCustomerForm.pan.trim().toUpperCase();
      }

      const res = await api.post('/api/v1/customers', payload);
      if (res.data?.success) {
        setSelectedCustomer(res.data.data);
        setNewCustomerModalOpen(false);
        showNotification('success', `Customer "${res.data.data.name}" created and selected!`);
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to create customer');
    }
  };

  // Category Selection Change
  const handleCategoryChange = (catId: string) => {
    if (catId === 'OTHER') {
      setDraftItem((prev) => ({
        ...prev,
        categoryId: '',
        isCustomCategory: true,
        discountPercentage: 0,
      }));
    } else {
      const cat = categories.find((c) => c.id === catId);
      if (cat) {
        const metal = cat.metalType || 'GOLD';
        const purity = cat.defaultPurity || (metal === 'GOLD' ? '22K (916)' : 'Fine Silver (999)');
        const rate = getConfiguredRate(metal, purity, settings);

        setDraftItem((prev) => ({
          ...prev,
          categoryId: cat.id,
          isCustomCategory: false,
          customCategoryName: '',
          metalType: metal,
          purity: purity,
          discountPercentage: cat.discountRate || 0,
          metalRatePerGram: rate,
        }));
      }
    }
  };

  // Metal Type Change
  const handleMetalChange = (newMetal: string) => {
    let newPurity = draftItem.purity;
    if (newMetal === 'GOLD') {
      newPurity = '22K (916)';
    } else if (newMetal === 'SILVER') {
      newPurity = 'Fine Silver (999)';
    } else if (newMetal === 'PLATINUM') {
      newPurity = '950 Platinum';
    } else {
      newPurity = 'Standard';
    }
    const rate = getConfiguredRate(newMetal, newPurity, settings);

    setDraftItem((prev) => ({
      ...prev,
      metalType: newMetal,
      purity: newPurity,
      metalRatePerGram: rate,
    }));
  };

  // Purity Change
  const handlePurityChange = (newPurity: string) => {
    const rate = getConfiguredRate(draftItem.metalType, newPurity, settings);
    setDraftItem((prev) => ({
      ...prev,
      purity: newPurity,
      metalRatePerGram: rate,
    }));
  };

  // Add Item to billItems array
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();

    const categoryName = draftItem.isCustomCategory
      ? draftItem.customCategoryName.trim()
      : categories.find((c) => c.id === draftItem.categoryId)?.name || 'Custom Jewellery';

    if (!categoryName) {
      showNotification('error', 'Please select or enter a Category Name');
      return;
    }
    if (!draftItem.description.trim()) {
      showNotification('error', 'Please enter Item Description');
      return;
    }
    if (draftItem.netWeight <= 0) {
      showNotification('error', 'Net Weight must be greater than 0');
      return;
    }
    if (draftItem.metalRatePerGram <= 0) {
      showNotification('error', 'Metal rate must be greater than 0');
      return;
    }

    const designStyle = draftItem.isCustomStyle
      ? draftItem.customStyleName.trim()
      : draftItem.designStyle;

    const ratePerTola = Math.round(draftItem.metalRatePerGram * TOLA_GRAM * 100) / 100;

    const newItem: CreateSalesInvoiceItemInput = {
      categoryId: draftItem.isCustomCategory ? null : draftItem.categoryId,
      categoryName,
      description: draftItem.description.trim(),
      designStyle: designStyle || 'Traditional',
      metalType: draftItem.metalType,
      purity: draftItem.purity,
      grossWeight: Number(draftItem.grossWeight) || Number(draftItem.netWeight),
      netWeight: Number(draftItem.netWeight),
      metalRatePerGram: Number(draftItem.metalRatePerGram),
      ratePerTola,
      hasStone: draftItem.hasStone,
      stoneType: draftItem.hasStone ? draftItem.stoneType : undefined,
      stoneCarat: draftItem.hasStone && draftItem.stoneCarat ? Number(draftItem.stoneCarat) : undefined,
      stoneWeight: draftItem.hasStone && draftItem.stoneWeight ? Number(draftItem.stoneWeight) : undefined,
      stoneCharges: draftItem.hasStone ? Number(draftItem.stoneCharges) || 0 : 0,
      makingCharges: Number(draftItem.makingCharges) || 0,
      discountApplicable: discountType === 'CATEGORY' ? draftItem.discountApplicable : false,
      discountPercentage:
        discountType === 'CATEGORY' && draftItem.discountApplicable
          ? Number(draftItem.discountPercentage)
          : 0,
    };

    setBillItems([...billItems, newItem]);

    // Reset draft item fields for next entry
    setDraftItem((prev) => ({
      ...prev,
      description: '',
      grossWeight: 0,
      netWeight: 0,
      hasStone: false,
      stoneCarat: 0,
      stoneWeight: 0,
      stoneCharges: 0,
      makingCharges: 0,
      discountApplicable: false,
    }));

    showNotification('success', `Item "${categoryName}" added to bill`);
  };

  const handleRemoveItem = (index: number) => {
    setBillItems(billItems.filter((_, idx) => idx !== index));
  };

  // Live bill totals calculation
  const calculateBillTotals = () => {
    const defaultGst = settings ? Number(settings.defaultGstRate) : 3.0;
    let subtotal = 0;
    let totalDiscount = 0;

    billItems.forEach((item) => {
      const metalVal = (item.netWeight || 0) * (item.metalRatePerGram || 0);
      const itemSub = metalVal + (item.makingCharges || 0) + (item.stoneCharges || 0);
      subtotal += itemSub;

      if (discountType === 'CATEGORY' && item.discountApplicable) {
        const disc = (itemSub * (item.discountPercentage || 0)) / 100;
        totalDiscount += disc;
      }
    });

    if (discountType === 'OVERALL') {
      totalDiscount = (subtotal * (overallDiscountPercentage || 0)) / 100;
    }

    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    const totalTax = (taxableAmount * defaultGst) / 100;
    const unroundedTotal = taxableAmount + totalTax;
    const finalAmount = Math.round(unroundedTotal);
    const roundOff = Math.round((finalAmount - unroundedTotal) * 100) / 100;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      gstRate: defaultGst,
      totalTax: Math.round(totalTax * 100) / 100,
      cgst: Math.round((totalTax / 2) * 100) / 100,
      sgst: Math.round((totalTax - totalTax / 2) * 100) / 100,
      roundOff,
      finalAmount,
    };
  };

  const billTotals = calculateBillTotals();

  // Handle Save Bill
  const handleSaveBill = async () => {
    if (!selectedCustomer) {
      showNotification('error', 'Please select or create a Customer first');
      return;
    }
    if (billItems.length === 0) {
      showNotification('error', 'Please add at least one jewellery item to the bill');
      return;
    }

    setCreatingBill(true);
    try {
      const payload = {
        customerId: selectedCustomer.id,
        items: billItems,
        paymentMode,
        discountType,
        overallDiscountPercentage: discountType === 'OVERALL' ? overallDiscountPercentage : undefined,
        notes: billNotes.trim() || undefined,
      };

      const res = await api.post('/api/v1/billing', payload);
      if (res.data?.success) {
        showNotification('success', `Bill #${res.data.data.invoiceNumber} generated successfully!`);
        setSelectedBillForSlip(res.data.data);
        setSlipModalOpen(true);
        // Reset form
        setBillItems([]);
        setSelectedCustomer(null);
        setCustomerSearchQuery('');
        setBillNotes('');
        setOverallDiscountPercentage(0);
        setDiscountType('CATEGORY');
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to save bill');
    } finally {
      setCreatingBill(false);
    }
  };

  // Fetch Existing Bills
  const fetchBills = async () => {
    setBillsLoading(true);
    try {
      let url = '/api/v1/billing?';
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}&`;
      if (dateQuery) url += `date=${encodeURIComponent(dateQuery)}&`;
      const res = await api.get(url);
      if (res.data?.success) {
        setBills(res.data.data.items);
      }
    } catch {
      showNotification('error', 'Failed to load existing bills');
    } finally {
      setBillsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'existing') {
      fetchBills();
    } else if (activeSubTab === 'requests') {
      fetchCorrectionRequests();
    }
  }, [activeSubTab]);

  const fetchCorrectionRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await api.get('/api/v1/billing/correction-requests');
      if (res.data?.success) {
        setCorrectionRequests(res.data.data);
      }
    } catch {
      showNotification('error', 'Failed to load correction requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  // Check Staff Edit Eligibility
  const canStaffEdit = (bill: SalesInvoiceDto): { allowed: boolean; reason?: string } => {
    if (bill.status === 'INVALID') {
      return { allowed: false, reason: 'Invalidated bills cannot be edited.' };
    }
    if (isAdmin) return { allowed: true };

    // If bill was created by an Admin, Staff cannot edit
    if (bill.createdByRole === 'ADMIN') {
      return { allowed: false, reason: 'Staff cannot edit Admin-created bills.' };
    }

    // Staff max 1 edit limit
    if (bill.editCount >= 1) {
      return { allowed: false, reason: 'Direct edit limit reached (maximum 1 edit allowed for staff).' };
    }

    // 30-minute window
    const elapsedMinutes = (Date.now() - new Date(bill.createdAt).getTime()) / (1000 * 60);
    if (elapsedMinutes > 30) {
      return { allowed: false, reason: '30-minute direct edit window has expired.' };
    }

    return { allowed: true };
  };

  // Check if Staff can request correction
  const canStaffRequestCorrection = (bill: SalesInvoiceDto): { allowed: boolean; reason?: string } => {
    if (bill.status === 'INVALID') {
      return { allowed: false, reason: 'Cannot request correction for an invalidated bill.' };
    }
    if (bill.createdByRole === 'ADMIN') {
      return { allowed: false, reason: 'Correction requests can only be made for staff-created bills.' };
    }
    return { allowed: true };
  };

  // Open Edit Bill Modal
  const openEditBillModal = (bill: SalesInvoiceDto) => {
    const editCheck = canStaffEdit(bill);
    if (!editCheck.allowed) {
      showNotification('error', editCheck.reason || 'Edit not allowed');
      return;
    }
    setEditingBill(JSON.parse(JSON.stringify(bill)));
    setEditChangeReason('');
    setEditCustomerSearchQuery('');
    setEditCustomerResults([]);
    setEditCustomerDropdown(false);
    setSlipModalOpen(false);
  };

  // Submit Bill Edit
  const handleSaveBillEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    if (!editChangeReason.trim()) {
      showNotification('error', 'Please provide a mandatory reason for modifying this bill');
      return;
    }

    setSavingEdit(true);
    try {
      const payload = {
        customerId: editingBill.customerId,
        items: editingBill.items.map((it) => ({
          categoryId: it.categoryId,
          categoryName: it.categoryName,
          description: it.description,
          designStyle: it.designStyle,
          metalType: it.metalType,
          purity: it.purity,
          grossWeight: it.grossWeight,
          netWeight: it.netWeight,
          metalRatePerGram: it.metalRatePerGram,
          ratePerTola: it.ratePerTola || Math.round(it.metalRatePerGram * TOLA_GRAM * 100) / 100,
          hasStone: it.hasStone,
          stoneType: it.stoneType,
          stoneCarat: it.stoneCarat,
          stoneWeight: it.stoneWeight,
          stoneCharges: it.stoneCharges,
          makingCharges: it.makingCharges,
          discountApplicable: it.discountApplicable,
          discountPercentage: it.discountPercentage,
        })),
        paymentMode: editingBill.payments?.[0]?.paymentMode || 'CASH',
        discountType: editingBill.discountType || 'CATEGORY',
        overallDiscountPercentage: editingBill.overallDiscountPercentage || 0,
        changeReason: editChangeReason.trim(),
        notes: editingBill.notes,
      };

      const res = await api.put(`/api/v1/billing/${editingBill.id}`, payload);
      if (res.data?.success) {
        showNotification('success', 'Bill updated successfully and revision archived!');
        setEditingBill(null);
        fetchBills();
        setSelectedBillForSlip(res.data.data);
        setSlipModalOpen(true);
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to update bill');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Bill Invalidation (Admin Only)
  const handleInvalidateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invalidatingBill || !invalidationReason.trim()) {
      showNotification('error', 'Invalidation reason is required.');
      return;
    }
    setSubmittingInvalidation(true);
    try {
      const res = await api.post(`/api/v1/billing/${invalidatingBill.id}/invalidate`, {
        reason: invalidationReason.trim(),
      });
      if (res.data?.success) {
        showNotification('success', `Bill #${invalidatingBill.invoiceNumber} has been invalidated.`);
        setInvalidatingBill(null);
        setInvalidationReason('');
        fetchBills();
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to invalidate bill');
    } finally {
      setSubmittingInvalidation(false);
    }
  };

  // Handle Bill Restoration (Admin Only)
  const handleRestoreBill = async (bill: SalesInvoiceDto) => {
    if (!confirm(`Are you sure you want to restore Bill #${bill.invoiceNumber}? It will be reactivated and included in sales.`)) {
      return;
    }
    try {
      const res = await api.post(`/api/v1/billing/${bill.id}/restore`);
      if (res.data?.success) {
        showNotification('success', `Bill #${bill.invoiceNumber} has been restored to Active status!`);
        fetchBills();
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to restore bill');
    }
  };

  // Open Correction Request Modal
  const openCorrectionModal = (bill: SalesInvoiceDto) => {
    const check = canStaffRequestCorrection(bill);
    if (!check.allowed) {
      showNotification('error', check.reason || 'Correction request not allowed');
      return;
    }
    setTargetInvoiceForCorrection(bill);
    setCorrectionReason('');
    setCorrectionModalOpen(true);
    setSlipModalOpen(false);
  };

  // Submit Correction Request
  const handleSubmitCorrectionRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInvoiceForCorrection || !correctionReason.trim()) return;

    setSubmittingCorrection(true);
    try {
      const res = await api.post(`/api/v1/billing/${targetInvoiceForCorrection.id}/correction-request`, {
        reason: correctionReason.trim(),
      });
      if (res.data?.success) {
        showNotification('success', 'Correction request sent to Admin successfully!');
        setCorrectionModalOpen(false);
        if (activeSubTab === 'requests') fetchCorrectionRequests();
      }
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to submit correction request');
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Admin resolves correction request
  const handleResolveRequest = async (req: BillCorrectionRequestDto, status: 'RESOLVED' | 'REJECTED') => {
    try {
      const res = await api.patch(`/api/v1/billing/correction-requests/${req.id}`, {
        status,
        resolutionNotes: `Handled by Admin: ${user?.name}`,
      });
      if (res.data?.success) {
        showNotification('success', `Correction request marked as ${status}`);
        fetchCorrectionRequests();
      }
    } catch {
      showNotification('error', 'Failed to resolve request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/90 border border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-2.5">
            <Receipt className="w-7 h-7 text-amber-500" />
            <span>Sales & Billing Hub</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real Jewellery Shop Counter Operations &bull; Autocomplete Customer &bull; Metal & Purity Rates &bull; Stone Work &bull; GST Slip
          </p>
        </div>

        {/* Sub-Navigation */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('create')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Bill</span>
          </button>
          <button
            onClick={() => setActiveSubTab('existing')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'existing'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Existing Bills</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveSubTab('requests')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'requests'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Correction Requests</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: CREATE NEW BILL */}
      {activeSubTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Customer & Add Item Form (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Customer Selection (Dynamic Autocomplete) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl" ref={customerSearchRef}>
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <User className="w-4 h-4" />
                  <span>Step 1: Customer Selection</span>
                </span>
                {selectedCustomer && (
                  <button
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerSearchQuery('');
                    }}
                    className="text-[11px] text-red-400 hover:underline flex items-center space-x-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Change Customer</span>
                  </button>
                )}
              </div>

              {!selectedCustomer ? (
                <div className="space-y-3 relative">
                  <label className="block text-xs text-slate-400">
                    Search Customer by Name or Mobile Number (Shows matching directory entries)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Type customer name or mobile number..."
                        value={customerSearchQuery}
                        onChange={(e) => handleCustomerSearch(e.target.value)}
                        onFocus={() => {
                          if (customerSearchResults.length > 0) setShowCustomerDropdown(true);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCustomerForm({
                          name: '',
                          phone: /^\d+$/.test(customerSearchQuery.trim()) ? customerSearchQuery.trim() : '',
                          pan: '',
                          address: '',
                          city: '',
                          state: 'Maharashtra',
                          openingBalance: 0,
                          openingBalanceType: 'DEBIT',
                        });
                        setNewCustomerModalOpen(true);
                      }}
                      className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Customer</span>
                    </button>
                  </div>

                  {customerSearching && (
                    <span className="text-[11px] text-slate-500">Searching matching customers...</span>
                  )}

                  {/* Autocomplete Dropdown List */}
                  {showCustomerDropdown && customerSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-800/80">
                      {customerSearchResults.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-3 hover:bg-slate-900 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-slate-200 text-xs">{c.name}</span>
                              {c.city && <span className="text-[10px] text-slate-400">({c.city})</span>}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{c.phone}</span>
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 block uppercase">Balance</span>
                            <span className="text-xs font-mono text-slate-300">
                              ₹{c.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-emerald-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      {selectedCustomer.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200 text-xs">{selectedCustomer.name}</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                          Selected
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {selectedCustomer.phone} {selectedCustomer.city ? `&bull; ${selectedCustomer.city}, ${selectedCustomer.state}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase">Current Ledger Balance</span>
                    <span className="text-xs font-mono font-bold text-slate-300">
                      ₹{selectedCustomer.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Add Item Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Step 2: Add Jewellery Item</span>
                </span>
                <span className="text-[11px] text-slate-400">Zero Mandatory SKU &bull; Milligram Precision</span>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4 text-xs">
                {/* Row 1: Category & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Jewellery Category / Item Type <span className="text-amber-400">*</span>
                    </label>
                    <select
                      value={draftItem.isCustomCategory ? 'OTHER' : draftItem.categoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.metalType} &bull; Disc: {c.discountRate || 0}%)
                        </option>
                      ))}
                      <option value="OTHER">Other / Custom Category...</option>
                    </select>

                    {draftItem.isCustomCategory && (
                      <input
                        type="text"
                        placeholder="Type custom category name..."
                        value={draftItem.customCategoryName}
                        onChange={(e) =>
                          setDraftItem({ ...draftItem, customCategoryName: e.target.value })
                        }
                        className="mt-2 w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      Item Description <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 22K Gold Handcrafted Bridal Necklace..."
                      value={draftItem.description}
                      onChange={(e) => setDraftItem({ ...draftItem, description: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Row 2: Design Style, Metal Type, Purity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Design Style</label>
                    <select
                      value={draftItem.isCustomStyle ? 'OTHER' : draftItem.designStyle}
                      onChange={(e) => {
                        if (e.target.value === 'OTHER') {
                          setDraftItem({ ...draftItem, isCustomStyle: true, customStyleName: '' });
                        } else {
                          setDraftItem({ ...draftItem, isCustomStyle: false, designStyle: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="Traditional">Traditional</option>
                      <option value="Modern">Modern</option>
                      <option value="Temple">Temple</option>
                      <option value="Antique">Antique</option>
                      <option value="Bridal">Bridal</option>
                      <option value="Handcrafted">Handcrafted</option>
                      <option value="OTHER">Other / Custom...</option>
                    </select>
                    {draftItem.isCustomStyle && (
                      <input
                        type="text"
                        placeholder="Type custom style..."
                        value={draftItem.customStyleName}
                        onChange={(e) =>
                          setDraftItem({ ...draftItem, customStyleName: e.target.value })
                        }
                        className="mt-2 w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Metal Type</label>
                    <select
                      value={draftItem.metalType}
                      onChange={(e) => handleMetalChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50 font-semibold"
                    >
                      <option value="GOLD">GOLD</option>
                      <option value="SILVER">SILVER</option>
                      <option value="PLATINUM">PLATINUM</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Purity</label>
                    {draftItem.metalType === 'GOLD' ? (
                      <select
                        value={draftItem.purity}
                        onChange={(e) => handlePurityChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                      >
                        {GOLD_PURITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    ) : draftItem.metalType === 'SILVER' ? (
                      <select
                        value={draftItem.purity}
                        onChange={(e) => handlePurityChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                      >
                        {SILVER_PURITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Purity specification..."
                        value={draftItem.purity}
                        onChange={(e) => setDraftItem({ ...draftItem, purity: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                      />
                    )}
                  </div>
                </div>

                {/* Row 3: Weights & Rate per gram */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Gross Weight (grams)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.000"
                      value={draftItem.grossWeight || ''}
                      onChange={(e) =>
                        setDraftItem({ ...draftItem, grossWeight: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      Net Weight (grams) <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      required
                      placeholder="0.000"
                      value={draftItem.netWeight || ''}
                      onChange={(e) =>
                        setDraftItem({ ...draftItem, netWeight: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400">
                        Rate (₹/g) <span className="text-amber-400">*</span>
                      </label>
                      <span className="text-[10px] text-amber-400 font-mono">
                        ≈ ₹{Math.round(draftItem.metalRatePerGram * TOLA_GRAM).toLocaleString('en-IN')}/Tola
                      </span>
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      required
                      value={draftItem.metalRatePerGram || ''}
                      onChange={(e) =>
                        setDraftItem({
                          ...draftItem,
                          metalRatePerGram: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                {/* Row 4: Stone Details & Making Charges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/80 pt-3">
                  {/* Stone section */}
                  <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-300 font-medium">Stone Work (No Qty &bull; Pure Stone Value)</label>
                      <button
                        type="button"
                        onClick={() => setDraftItem({ ...draftItem, hasStone: !draftItem.hasStone })}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                          draftItem.hasStone
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {draftItem.hasStone ? 'Yes (Stones Included)' : 'No Stones'}
                      </button>
                    </div>

                    {draftItem.hasStone && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 animate-in fade-in">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Gem Type</label>
                          <select
                            value={draftItem.stoneType}
                            onChange={(e) => setDraftItem({ ...draftItem, stoneType: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          >
                            {INDIAN_GEM_TYPES.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Carat (cts)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={draftItem.stoneCarat || ''}
                            onChange={(e) =>
                              setDraftItem({
                                ...draftItem,
                                stoneCarat: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Weight (g)</label>
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="0.000"
                            value={draftItem.stoneWeight || ''}
                            onChange={(e) =>
                              setDraftItem({
                                ...draftItem,
                                stoneWeight: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-0.5">Charges (₹)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={draftItem.stoneCharges || ''}
                            onChange={(e) =>
                              setDraftItem({
                                ...draftItem,
                                stoneCharges: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Making charges & Category discount toggle */}
                  <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Making Charges (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={draftItem.makingCharges || ''}
                        onChange={(e) =>
                          setDraftItem({
                            ...draftItem,
                            makingCharges: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-mono text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-slate-300 font-medium block">
                          Category Discount
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {discountType === 'CATEGORY'
                            ? `Configured: ${draftItem.discountPercentage}%`
                            : 'Disabled (Overall Bill Discount is active)'}
                        </span>
                      </div>
                      {discountType === 'CATEGORY' && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraftItem({
                              ...draftItem,
                              discountApplicable: !draftItem.discountApplicable,
                            })
                          }
                          className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                            draftItem.discountApplicable
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {draftItem.discountApplicable ? 'Apply Discount' : 'No Discount'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add Item Button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item to Bill</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Step 3: Items in Current Bill */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Items in This Bill ({billItems.length})</span>
                </span>
                <span className="text-[11px] text-slate-400">Independent Calculations</span>
              </div>

              {billItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No jewellery items added yet. Use the form above to add items to the customer's bill.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Item</th>
                        <th className="px-3 py-2.5">Style</th>
                        <th className="px-3 py-2.5">Net Wt</th>
                        <th className="px-3 py-2.5">Rate/g</th>
                        <th className="px-3 py-2.5">Making</th>
                        <th className="px-3 py-2.5">Stone</th>
                        <th className="px-3 py-2.5">Discount</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                        <th className="px-3 py-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {billItems.map((it, idx) => {
                        const metalVal = it.netWeight * it.metalRatePerGram;
                        const sub = metalVal + (it.makingCharges || 0) + (it.stoneCharges || 0);
                        const disc =
                          discountType === 'CATEGORY' && it.discountApplicable
                            ? (sub * (it.discountPercentage || 0)) / 100
                            : 0;
                        const taxable = sub - disc;
                        const gst = (taxable * (settings?.defaultGstRate || 3.0)) / 100;
                        const itemFinal = taxable + gst;

                        return (
                          <tr key={idx} className="hover:bg-slate-800/30">
                            <td className="px-4 py-3">
                              <span className="font-bold text-slate-200 block">{it.categoryName}</span>
                              <span className="text-[10px] text-slate-400">
                                {it.description} &bull; {it.purity}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-400">{it.designStyle || '—'}</td>
                            <td className="px-3 py-3 font-mono font-semibold text-slate-200">
                              {it.netWeight.toFixed(3)}g
                            </td>
                            <td className="px-3 py-3 font-mono text-slate-300">
                              ₹{it.metalRatePerGram}
                            </td>
                            <td className="px-3 py-3 font-mono text-slate-400">
                              {it.makingCharges ? `₹${it.makingCharges}` : '—'}
                            </td>
                            <td className="px-3 py-3 font-mono text-slate-400">
                              {it.hasStone ? (
                                <span>
                                  {it.stoneType} ({it.stoneCarat ? `${it.stoneCarat}ct` : ''} ₹{it.stoneCharges || 0})
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-3 py-3 font-mono text-emerald-400">
                              {disc > 0 ? `-₹${Math.round(disc)}` : '—'}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-amber-300 text-right">
                              ₹{Math.round(itemFinal).toLocaleString('en-IN')}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-slate-500 hover:text-red-400 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Bill Summary & Discount Mode & Payment (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Discount Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5 border-b border-slate-800 pb-2">
                <Tag className="w-4 h-4" />
                <span>Discount Architecture</span>
              </span>
              <p className="text-[11px] text-slate-400">
                Choose between Category Discounts or an Overall Bill Discount. Double-discounting is strictly prevented.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('CATEGORY')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    discountType === 'CATEGORY'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Tag className="w-4 h-4 mx-auto mb-1" />
                  <span>Category-wise</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDiscountType('OVERALL')}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    discountType === 'OVERALL'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Percent className="w-4 h-4 mx-auto mb-1" />
                  <span>Overall Bill %</span>
                </button>
              </div>

              {discountType === 'OVERALL' && (
                <div className="pt-2">
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">
                    Overall Bill Discount Percentage (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      value={overallDiscountPercentage || ''}
                      onChange={(e) => setOverallDiscountPercentage(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-slate-500 font-bold">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bill Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5 border-b border-slate-800 pb-2">
                <Receipt className="w-4 h-4" />
                <span>Invoice Summary</span>
              </span>

              <div className="space-y-2 text-xs divide-y divide-slate-800/60">
                <div className="flex justify-between text-slate-300 pt-1">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{billTotals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-emerald-400 pt-2">
                  <span>{discountType === 'OVERALL' ? `Overall Discount (${overallDiscountPercentage}%)` : 'Category Discounts'}</span>
                  <span className="font-mono">-₹{billTotals.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-slate-300 pt-2">
                  <span>Taxable Amount</span>
                  <span className="font-mono">₹{billTotals.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-slate-400 pt-2">
                  <span>CGST ({billTotals.gstRate / 2}%)</span>
                  <span className="font-mono">₹{billTotals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between text-slate-400 pt-2">
                  <span>SGST ({billTotals.gstRate / 2}%)</span>
                  <span className="font-mono">₹{billTotals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                {billTotals.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-400 pt-2">
                    <span>Round-off</span>
                    <span className="font-mono">₹{billTotals.roundOff.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t-2 border-slate-800 text-slate-100">
                  <span className="font-bold text-sm">Final Bill Amount</span>
                  <span className="font-bold text-lg text-amber-400 font-mono">
                    ₹{billTotals.finalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <span className="text-xs font-bold text-slate-300 block">
                  Payment Mode (Full Settlement)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      paymentMode === 'CASH'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Banknote className="w-4 h-4 mb-1" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('CARD')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      paymentMode === 'CARD'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mb-1" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      paymentMode === 'UPI'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mb-1" />
                    <span>UPI</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Bill Remarks / Notes</label>
                  <input
                    type="text"
                    placeholder="Optional remarks..."
                    value={billNotes}
                    onChange={(e) => setBillNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <button
                  type="button"
                  disabled={creatingBill || billItems.length === 0 || !selectedCustomer}
                  onClick={handleSaveBill}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center space-x-2 text-sm"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{creatingBill ? 'Recording Transaction...' : 'Confirm & Generate Bill'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EXISTING BILLS */}
      {activeSubTab === 'existing' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 shadow-lg">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Customer Name, Mobile, or Bill #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchBills()}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <input
                type="date"
                value={dateQuery}
                onChange={(e) => setDateQuery(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 font-mono"
              />
              <button
                onClick={fetchBills}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all"
              >
                Search
              </button>
            </div>
          </div>

          {/* Bills Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5">Invoice #</th>
                    <th className="px-4 py-3.5">Date & Time</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-4 py-3.5 font-mono">Amount</th>
                    <th className="px-4 py-3.5">Payment</th>
                    <th className="px-4 py-3.5">Handled By</th>
                    <th className="px-4 py-3.5">Version</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {billsLoading ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-8 text-center text-slate-500">
                        Loading bills...
                      </td>
                    </tr>
                  ) : bills.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-5 py-8 text-center text-slate-500">
                        No sales bills found matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    bills.map((bill) => {
                      const staffCheck = canStaffEdit(bill);
                      const isInvalid = bill.status === 'INVALID';

                      return (
                        <tr
                          key={bill.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isInvalid ? 'bg-red-950/20 opacity-80' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5">
                            {isInvalid ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                                INVALID
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                                ACTIVE
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-amber-400">
                            {bill.invoiceNumber}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                            {new Date(bill.createdAt).toLocaleDateString()}{' '}
                            {new Date(bill.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-bold text-slate-100 block">{bill.customerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{bill.customerPhone || '—'}</span>
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-100">
                            ₹{bill.netAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                              {bill.payments?.[0]?.paymentMode || 'PAID'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">
                            {bill.createdByName || 'Staff'}{' '}
                            <span className="text-[10px] text-slate-500">({bill.createdByRole})</span>
                          </td>
                          <td className="px-4 py-3.5 font-mono">
                            {bill.editCount > 0 ? (
                              <span className="text-amber-400 font-semibold">
                                Edited (v{bill.version})
                              </span>
                            ) : (
                              <span className="text-slate-500">v1</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedBillForSlip(bill);
                                setSlipModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-semibold transition-all"
                            >
                              Slip
                            </button>

                            {!isInvalid && staffCheck.allowed && (
                              <button
                                onClick={() => openEditBillModal(bill)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold transition-all"
                              >
                                Edit
                              </button>
                            )}

                            {!isInvalid && !staffCheck.allowed && !isAdmin && canStaffRequestCorrection(bill).allowed && (
                              <button
                                onClick={() => openCorrectionModal(bill)}
                                title="Request Admin Correction"
                                className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[11px] font-semibold transition-all"
                              >
                                Request Fix
                              </button>
                            )}

                            {/* Admin-only Invalidation / Restoration */}
                            {isAdmin && !isInvalid && (
                              <button
                                onClick={() => {
                                  setInvalidatingBill(bill);
                                  setInvalidationReason('');
                                }}
                                title="Invalidate Bill (Admin Only)"
                                className="px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800/50 rounded-lg text-[11px] font-semibold transition-all"
                              >
                                <Ban className="w-3.5 h-3.5 inline mr-1" />
                                Invalidate
                              </button>
                            )}

                            {isAdmin && isInvalid && (
                              <button
                                onClick={() => handleRestoreBill(bill)}
                                title="Restore Bill (Admin Only)"
                                className="px-2 py-1 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 rounded-lg text-[11px] font-semibold transition-all"
                              >
                                <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
                                Restore
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CORRECTION REQUESTS (Admin Only) */}
      {activeSubTab === 'requests' && isAdmin && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Staff Correction Requests</span>
              </span>
              <span className="text-[11px] text-slate-400">Admin Authorization Center</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="px-5 py-3">Bill / Invoice</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Requested By</th>
                    <th className="px-5 py-3">Reason / Problem</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {requestsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        Loading requests...
                      </td>
                    </tr>
                  ) : correctionRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                        No billing correction requests found.
                      </td>
                    </tr>
                  ) : (
                    correctionRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-800/30">
                        <td className="px-5 py-3.5 font-mono font-bold text-amber-400">
                          {req.invoiceNumber || req.invoiceId.substring(0, 8)}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-200">{req.customerName || '—'}</td>
                        <td className="px-4 py-3.5 text-slate-300">
                          {req.requestedByName} <span className="text-[10px] text-slate-500">({req.requestedByRole})</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-300 max-w-xs">{req.reason}</td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              req.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : req.status === 'RESOLVED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-2">
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    const inv = await api.get(`/api/v1/billing/${req.invoiceId}`);
                                    if (inv.data?.success) {
                                      openEditBillModal(inv.data.data);
                                      handleResolveRequest(req, 'RESOLVED');
                                    }
                                  } catch {
                                    showNotification('error', 'Could not open bill');
                                  }
                                }}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px]"
                              >
                                Modify Bill
                              </button>
                              <button
                                onClick={() => handleResolveRequest(req, 'REJECTED')}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-red-950/50 text-slate-400 hover:text-red-400 rounded-lg text-[11px]"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SLIP-STYLE BILL MODAL */}
      {slipModalOpen && selectedBillForSlip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setSlipModalOpen(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-100 p-1.5 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Slip Paper Container */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-slate-200 shadow-inner font-sans space-y-6 relative overflow-hidden">
              {/* Watermark if Invalid */}
              {selectedBillForSlip.status === 'INVALID' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-10">
                  <span className="text-red-500/20 text-8xl font-black rotate-[-30deg] tracking-widest border-8 border-red-500/20 px-8 py-4 rounded-3xl">
                    CANCELLED
                  </span>
                </div>
              )}

              {/* Slip Header */}
              <div className="text-center border-b border-slate-800 pb-4 space-y-1">
                <h2 className="text-xl font-bold tracking-tight text-amber-400">
                  {settings?.shopName || 'SUVARNA JEWELLERY'}
                </h2>
                <p className="text-[11px] text-slate-400">{settings?.address || 'Main Bazaar Road'}</p>
                <p className="text-[11px] text-slate-400">
                  GSTIN: <span className="font-mono text-slate-300">{settings?.gstin || '27AAAAA0000A1Z5'}</span> &bull; Phone: {settings?.phone || '+91 98765 43210'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    TAX INVOICE SLIP
                  </span>
                  {selectedBillForSlip.status === 'INVALID' && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40">
                      BILL INVALIDATED
                    </span>
                  )}
                  {selectedBillForSlip.version > 1 && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      Version {selectedBillForSlip.version}
                    </span>
                  )}
                </div>
              </div>

              {/* Bill & Customer Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-800/80 pb-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Bill Details</span>
                  <p className="font-bold text-slate-200 font-mono mt-0.5">#{selectedBillForSlip.invoiceNumber}</p>
                  <p className="text-slate-400 font-mono text-[11px]">
                    {new Date(selectedBillForSlip.createdAt).toLocaleDateString()} {new Date(selectedBillForSlip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Billed By: <span className="text-slate-200 font-medium">{selectedBillForSlip.createdByName || 'Staff'}</span> ({selectedBillForSlip.createdByRole})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Customer Details</span>
                  <p className="font-bold text-slate-200 mt-0.5">{selectedBillForSlip.customerName}</p>
                  <p className="text-slate-400 font-mono text-[11px]">{selectedBillForSlip.customerPhone || '—'}</p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] text-slate-300">
                  <thead className="border-b border-slate-800 text-slate-400 uppercase text-[9px]">
                    <tr>
                      <th className="py-2">Item Description</th>
                      <th className="py-2 font-mono">Net Wt</th>
                      <th className="py-2 font-mono">Rate/g</th>
                      <th className="py-2 font-mono">Tola Rate</th>
                      <th className="py-2 font-mono">Disc</th>
                      <th className="py-2 font-mono text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {selectedBillForSlip.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 pr-2">
                          <span className="font-bold text-slate-100 block">{it.categoryName}</span>
                          <span className="text-[10px] text-slate-400">
                            {it.description} ({it.purity || it.metalType})
                          </span>
                          {it.hasStone && (
                            <span className="text-[10px] text-amber-400 block">
                              + Stone: {it.stoneType || 'Yes'} {it.stoneCarat ? `(${it.stoneCarat}ct)` : ''} (₹{it.stoneCharges})
                            </span>
                          )}
                          {it.makingCharges > 0 && (
                            <span className="text-[10px] text-slate-400 block">+ Making: ₹{it.makingCharges}</span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono">{it.netWeight.toFixed(3)}g</td>
                        <td className="py-2.5 font-mono">₹{it.metalRatePerGram}</td>
                        <td className="py-2.5 font-mono text-amber-400">
                          ₹{it.ratePerTola || Math.round(it.metalRatePerGram * TOLA_GRAM)}
                        </td>
                        <td className="py-2.5 font-mono text-emerald-400">
                          {it.discountAmount > 0 ? `-₹${Math.round(it.discountAmount)}` : '—'}
                        </td>
                        <td className="py-2.5 font-mono font-bold text-slate-100 text-right">
                          ₹{Math.round(it.totalItemAmount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Totals */}
              <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono">₹{selectedBillForSlip.grossItemsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {selectedBillForSlip.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>
                      {selectedBillForSlip.discountType === 'OVERALL'
                        ? `Overall Bill Discount (${selectedBillForSlip.overallDiscountPercentage || 0}%)`
                        : 'Category Discount'}
                    </span>
                    <span className="font-mono">-₹{selectedBillForSlip.totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Taxable Value</span>
                  <span className="font-mono">₹{selectedBillForSlip.taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST ({selectedBillForSlip.gstRate}%)</span>
                  <span className="font-mono">₹{selectedBillForSlip.totalTaxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                {selectedBillForSlip.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Round Off</span>
                    <span className="font-mono">₹{selectedBillForSlip.roundOff.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-800 font-bold text-sm text-slate-100">
                  <span>Total Amount Paid</span>
                  <span className="text-amber-400 font-mono text-base">
                    ₹{selectedBillForSlip.netAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Payment Mode</span>
                  <span className="font-bold text-emerald-400 uppercase font-mono">
                    {selectedBillForSlip.payments?.[0]?.paymentMode || 'CASH'} (PAID IN FULL)
                  </span>
                </div>
              </div>

              {/* History / Audit Section */}
              {selectedBillForSlip.history && selectedBillForSlip.history.length > 0 && (
                <div className="border-t border-slate-800 pt-3 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 flex items-center space-x-1">
                    <History className="w-3.5 h-3.5" />
                    <span>Audit & Revision History ({selectedBillForSlip.history.length})</span>
                  </span>
                  <div className="space-y-1.5 text-[10px] font-mono text-slate-400 max-h-32 overflow-y-auto">
                    {selectedBillForSlip.history.map((h, i) => (
                      <div key={i} className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                        <div className="flex justify-between text-slate-300">
                          <span className="font-bold text-amber-400">Version {h.version}</span>
                          <span>{new Date(h.createdAt).toLocaleDateString()} {new Date(h.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="mt-0.5 text-slate-400">Modified by: {h.changedByName} ({h.changedByRole})</p>
                        <p className="text-slate-300 italic">"{h.changeReason}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              {selectedBillForSlip.status !== 'INVALID' && canStaffEdit(selectedBillForSlip).allowed && (
                <button
                  onClick={() => openEditBillModal(selectedBillForSlip)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold"
                >
                  Edit This Bill
                </button>
              )}
              <button
                onClick={() => setSlipModalOpen(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BILL MODAL */}
      {editingBill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-100 mb-1 flex items-center space-x-2">
              <Edit2 className="w-5 h-5 text-amber-400" />
              <span>Modify Bill #{editingBill.invoiceNumber}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {isAdmin
                ? 'Admin correction: Full modification privileges (Anytime & Unlimited)'
                : 'Staff direct edit: Single permitted edit within 30 minutes of creation'}
            </p>

            <form onSubmit={handleSaveBillEdit} className="space-y-4 text-xs">
              {/* Editable Customer on Existing Bill */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-slate-300 block">Customer on Bill</span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-amber-400 text-sm block">{editingBill.customerName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{editingBill.customerPhone || 'No Phone'}</span>
                  </div>
                </div>

                <div className="relative pt-1">
                  <input
                    type="text"
                    placeholder="Search another customer to reassign..."
                    value={editCustomerSearchQuery}
                    onChange={(e) => handleEditCustomerSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none"
                  />
                  {editCustomerDropdown && editCustomerResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-30 max-h-40 overflow-y-auto divide-y divide-slate-800">
                      {editCustomerResults.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setEditingBill({
                              ...editingBill,
                              customerId: c.id,
                              customerName: c.name,
                              customerPhone: c.phone,
                            });
                            setEditCustomerDropdown(false);
                            setEditCustomerSearchQuery('');
                          }}
                          className="p-2 hover:bg-slate-800 cursor-pointer flex justify-between"
                        >
                          <span className="font-bold text-slate-200">{c.name} ({c.city || '—'})</span>
                          <span className="text-slate-400 font-mono">{c.phone}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Reason for Modification <span className="text-amber-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Mandatory reason for modifying this bill (stored in immutable audit trail)..."
                  value={editChangeReason}
                  onChange={(e) => setEditChangeReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Items modification */}
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                <span className="font-bold text-slate-300 block">Edit Items & Weights:</span>
                {editingBill.items.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between font-bold text-slate-200">
                      <span>{item.categoryName} ({item.description})</span>
                      <span className="font-mono text-amber-400">Item #{idx + 1}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-400">Net Wt (g)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={item.netWeight}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...editingBill.items];
                            updated[idx] = { ...updated[idx], netWeight: val };
                            setEditingBill({ ...editingBill, items: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400">Rate (₹/g)</label>
                        <input
                          type="number"
                          value={item.metalRatePerGram}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...editingBill.items];
                            updated[idx] = { ...updated[idx], metalRatePerGram: val };
                            setEditingBill({ ...editingBill, items: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400">Making (₹)</label>
                        <input
                          type="number"
                          value={item.makingCharges || 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...editingBill.items];
                            updated[idx] = { ...updated[idx], makingCharges: val };
                            setEditingBill({ ...editingBill, items: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBill(null)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-xl"
                >
                  {savingEdit ? 'Saving Revision...' : 'Save & Archive Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVALIDATION MODAL (Admin Only) */}
      {invalidatingBill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-red-400 mb-1 flex items-center space-x-2">
              <Ban className="w-5 h-5 text-red-400" />
              <span>Invalidate Bill #{invalidatingBill.invoiceNumber}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Invalidating this bill will permanently exclude its ₹{invalidatingBill.netAmount.toLocaleString('en-IN')} amount from sales analytics and ledger reports until restored.
            </p>

            <form onSubmit={handleInvalidateBill} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Reason for Invalidation <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Customer cancelled purchase, entry entered in error..."
                  value={invalidationReason}
                  onChange={(e) => setInvalidationReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-red-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInvalidatingBill(null)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvalidation}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2 rounded-xl"
                >
                  {submittingInvalidation ? 'Invalidating...' : 'Confirm Invalidation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CORRECTION REQUEST MODAL */}
      {correctionModalOpen && targetInvoiceForCorrection && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in">
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>Request Correction from Admin</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Direct staff edits are locked for Bill #{targetInvoiceForCorrection.invoiceNumber}.
              Please submit a correction request to the Admin.
            </p>

            <form onSubmit={handleSubmitCorrectionRequest} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Reason for Correction <span className="text-amber-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what needs to be corrected and why..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCorrectionModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCorrection}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-xl"
                >
                  {submittingCorrection ? 'Sending...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK CREATE CUSTOMER MODAL */}
      {newCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-slate-100 mb-1 flex items-center space-x-2">
              <User className="w-5 h-5 text-amber-400" />
              <span>Quick Create Customer</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Creates customer in shop directory and immediately selects them for this bill.
            </p>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name <span className="text-amber-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Shah"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mobile Number <span className="text-amber-400">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="10-digit mobile"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">PAN Number <span className="text-slate-500">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. ABCDE1234F"
                  value={newCustomerForm.pan}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, pan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono uppercase focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={newCustomerForm.city}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Maharashtra"
                    value={newCustomerForm.state}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewCustomerModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-xl"
                >
                  Create & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
