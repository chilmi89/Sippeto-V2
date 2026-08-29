"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Check,
  Printer,
  X,
  Package,
  Store,
  ChevronDown,
  Edit2,
  Receipt,
  Search,
  Layers,
  Ticket,
  MapPin,
  CheckCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import { getPOSProductsAction, savePOSTransactionAction } from "./actions";
import { validateDiscountCodeAction, getDiscountsAction } from "@/app/actions/discount";
import ReceiptModal from "./ReceiptModal";
import { printReceiptPdf } from "./receiptUtils";

// Bluetooth thermal printer constants
const BT_SERVICE_UUIDS = [
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000ffe5-0000-1000-8000-00805f9b34fb",
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000aabb-0000-1000-8000-00805f9b34fb",
  "0000ae30-0000-1000-8000-00805f9b34fb",
  "0000af30-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "49535441-5254-4745-4e49-555353455256",
];

const BT_NAME_PREFIXES = [
  "MTP", "PT", "RP", "Thermal", "58mm", "80mm",
  "BT_", "Printer", "POS", "Xprinter", "ZJ", "GH",
  "LP", "GP", "PP", "MA", "BP", "ECO", "BP-ECO",
];

// Cache printer device instance at page session level (prevents re-pairing on same page load)
let cachedPrinterDevice: any = null;
let cachedGattServer: any = null;
let cachedWriteChar: any = null;
let cachedUsbDevice: any = null;

const getQuickCashPresets = (total: number): number[] => {
  if (total <= 0) return [10000, 20000, 50000, 100000];
  const presets = new Set<number>();
  const nominals = [10000, 20000, 50000, 100000];
  for (const nom of nominals) {
    if (nom > total) {
      presets.add(nom);
    }
  }
  const nearest10k = Math.ceil(total / 10000) * 10000;
  if (nearest10k > total) presets.add(nearest10k);
  const nearest50k = Math.ceil(total / 50000) * 50000;
  if (nearest50k > total) presets.add(nearest50k);
  return Array.from(presets).sort((a, b) => a - b).slice(0, 3);
};

const wrapText = (text: string, maxWidth: number = 32): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + (currentLine ? " " : "") + word).length <= maxWidth) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      if (word.length > maxWidth) {
        let remaining = word;
        while (remaining.length > maxWidth) {
          lines.push(remaining.slice(0, maxWidth));
          remaining = remaining.slice(maxWidth);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
};

interface Product {
  id: string;
  name: string;
  sell_price: number;
  base_price: number;
  image_url: string | null;
  category_id: string | null;
  product_categories?: {
    name: string;
  } | null;
  current_branch_stock?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  effective_price: number;
  product_discount?: any;
}

interface Category {
  id: string;
  name: string;
  profile_id?: string | null;
}

interface Branch {
  id: string;
  name: string;
}

interface PaymentMethod {
  id: string;
  name: string;
}

interface POSFormProps {
  profile: any;
  branches: Branch[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  txCategories: any[];
  initialProducts: Product[];
  initialBranchId: string;
  editTransaction: any;
  editId: string | null;
}

export default function POSForm({
  profile,
  branches,
  categories,
  paymentMethods,
  txCategories,
  initialProducts,
  initialBranchId,
  editTransaction,
  editId
}: POSFormProps) {
  const router = useRouter();

  // Selection States
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  // Cart & Transaction Form States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState("");
  const [isAutoDate, setIsAutoDate] = useState(true);
  const [description, setDescription] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [inputQty, setInputQty] = useState<number>(1);

  const [cashPaid, setCashPaid] = useState<string>("");

  // Coupon Discount State
  const [couponCode, setCouponCode] = useState("");
  const [availableDiscounts, setAvailableDiscounts] = useState<any[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState<string>("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    discount_id: string;
    code: string;
    name: string;
    discount_amount: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Loadings
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  // Search & Filter & Bluetooth States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [categoryScope, setCategoryScope] = useState<"all" | "pusat" | "tenant">("all");
  const [isPrintingBt, setIsPrintingBt] = useState(false);
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [isBtConnected, setIsBtConnected] = useState(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string | null>(null);

  // USB Thermal Printer States
  const [isUsbSupported, setIsUsbSupported] = useState(false);
  const [isUsbConnected, setIsUsbConnected] = useState(false);
  const [usbDeviceName, setUsbDeviceName] = useState<string | null>(null);
  const [isPrintingUsb, setIsPrintingUsb] = useState(false);
  const [printMethod, setPrintMethod] = useState<"bluetooth" | "usb">("usb");

  // Pagination & Search Cache optimization
  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const pusatCategories = useMemo(() => {
    return categories.filter((c) => !c.profile_id);
  }, [categories]);

  const tenantCategories = useMemo(() => {
    return categories.filter((c) => !!c.profile_id);
  }, [categories]);

  const filteredCategoryList = useMemo(() => {
    if (categoryScope === "pusat") return pusatCategories;
    if (categoryScope === "tenant") return tenantCategories;
    return categories;
  }, [categoryScope, pusatCategories, tenantCategories, categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (selectedCategoryId !== "all") {
        matchesCategory = p.category_id === selectedCategoryId;
      } else if (categoryScope === "pusat") {
        const cat = categories.find(c => c.id === p.category_id);
        matchesCategory = cat ? !cat.profile_id : false;
      } else if (categoryScope === "tenant") {
        const cat = categories.find(c => c.id === p.category_id);
        matchesCategory = cat ? !!cat.profile_id : false;
      }

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId, categoryScope, categories]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  }, [filteredProducts]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const checkBluetoothSupport = useCallback(() => {
    setIsBluetoothSupported(typeof window !== "undefined" && !!(navigator as any).bluetooth);
  }, []);

  const checkUsbSupport = useCallback(() => {
    setIsUsbSupported(typeof window !== "undefined" && !!(navigator as any).usb);
  }, []);

  useEffect(() => {
    checkBluetoothSupport();
    checkUsbSupport();
  }, [checkBluetoothSupport, checkUsbSupport]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!!(navigator as any).usb) {
        setPrintMethod("usb");
      } else if (!!(navigator as any).bluetooth) {
        setPrintMethod("bluetooth");
      }
    }
  }, []);

  useEffect(() => {
    if (cachedPrinterDevice && cachedPrinterDevice.gatt?.connected) {
      setIsBtConnected(true);
      setBluetoothDeviceName(cachedPrinterDevice.name || "Thermal Printer");
    }
    if (cachedUsbDevice && cachedUsbDevice.opened) {
      setIsUsbConnected(true);
      setUsbDeviceName(cachedUsbDevice.productName || "USB Printer");
    }
    return () => {
      if (cachedPrinterDevice && cachedPrinterDevice.gatt?.connected) {
        console.log("Disconnecting printer on page unmount...");
        cachedPrinterDevice.gatt.disconnect();
      }
    };
  }, []);

  // Searched Products for custom combobox
  const searchedProducts = useMemo(() => {
    if (!productSearchQuery) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase())
    );
  }, [products, productSearchQuery]);

  // Initialize form values
  useEffect(() => {
    if (editTransaction) {
      setReference(editTransaction.reference_number || "");
      setDate(editTransaction.transaction_date?.split("T")[0] || new Date().toISOString().split("T")[0]);
      setIsAutoDate(false);
      setDescription(editTransaction.description || "");
      setCustomerName(editTransaction.customer_name || "");
      if (editTransaction.customer_phone) setCustomerPhone(editTransaction.customer_phone);
      if (editTransaction.customer_address) setCustomerAddress(editTransaction.customer_address);

      if (editTransaction.items?.length > 0) {
        const firstItemPaymentId = editTransaction.items[0].payment_method_id;
        if (firstItemPaymentId) setPaymentMethodId(firstItemPaymentId);
      }

      // Rebuild keranjang (gabungkan item dengan product_id yang sama)
      const rebuiltCart: CartItem[] = [];
      for (const item of editTransaction.items) {
        if (item.product_id) {
          const found = products.find((p) => p.id === item.product_id);
          if (found) {
            const existing = rebuiltCart.find((c) => c.product.id === item.product_id);
            if (existing) {
              existing.quantity += item.quantity || 1;
            } else {
              const itemPrice = item.unit_price ?? found.sell_price;
              rebuiltCart.push({ product: found, quantity: item.quantity || 1, effective_price: itemPrice });
            }
          }
        }
      }
      setCart(rebuiltCart);
    } else {
      const now = new Date();
      setDate(now.toISOString().split("T")[0]);
      setIsAutoDate(true);
      setReference(`POS-${now.getTime().toString().slice(-6)}`);
      if (paymentMethods.length > 0) {
        const defaultMethod = paymentMethods.find(
          (pm) =>
            pm.name.toLowerCase().includes("tunai") ||
            pm.name.toLowerCase().includes("cash")
        ) || paymentMethods[0];
        setPaymentMethodId(defaultMethod.id);
      }
    }
  }, [editTransaction, paymentMethods]);

  // Fetch Available Discounts
  useEffect(() => {
    if (profile?.tenant_owner_id) {
      getDiscountsAction({ profile_id: profile.tenant_owner_id, limit: 100 }).then((res) => {
        if (res.success && res.data) {
          setAvailableDiscounts(res.data.filter((d: any) => d.is_active));
        }
      });
    }
  }, [profile?.tenant_owner_id]);

  const getEffectivePriceInfo = useCallback((product: Product) => {
    const activeDisc = availableDiscounts.find(
      (d) =>
        d.is_active &&
        d.product_ids &&
        d.product_ids.length > 0 &&
        d.product_ids.includes(product.id)
    );
    if (!activeDisc) {
      return {
        effectivePrice: product.sell_price,
        originalPrice: product.sell_price,
        discount: null,
      };
    }

    let discAmount = 0;
    if (activeDisc.type === "PERCENTAGE") {
      discAmount = (product.sell_price * activeDisc.value) / 100;
      if (activeDisc.max_discount && activeDisc.max_discount > 0 && discAmount > activeDisc.max_discount) {
        discAmount = activeDisc.max_discount;
      }
    } else {
      discAmount = activeDisc.value;
    }

    const finalPrice = Math.max(0, product.sell_price - discAmount);
    return {
      effectivePrice: finalPrice,
      originalPrice: product.sell_price,
      discount: activeDisc,
    };
  }, [availableDiscounts]);

  useEffect(() => {
    if (availableDiscounts.length > 0 && cart.length > 0) {
      setCart(prevCart =>
        prevCart.map(item => {
          const info = getEffectivePriceInfo(item.product);
          return {
            ...item,
            effective_price: info.effectivePrice,
            product_discount: info.discount,
          };
        })
      );
    }
  }, [availableDiscounts, getEffectivePriceInfo]);

  const calculateCartDiscount = useCallback((disc: any, cartItems: CartItem[]) => {
    const netSubtotal = cartItems.reduce(
      (sum, item) => sum + (item.effective_price * item.quantity),
      0
    );

    if (netSubtotal <= 0) {
      return { amount: 0, error: "Keranjang belanja masih kosong" };
    }

    // 1. Syarat Minimal Belanja Transaksi
    if (disc.min_purchase && disc.min_purchase > 0 && netSubtotal < disc.min_purchase) {
      return {
        amount: 0,
        error: `Minimal belanja untuk promo "${disc.name}" adalah ${formatCurrency(disc.min_purchase)}`,
      };
    }

    // 2. Nilai Diskon Global Voucher
    let amount = 0;
    if (disc.type === "PERCENTAGE") {
      amount = (netSubtotal * disc.value) / 100;
      if (disc.max_discount && disc.max_discount > 0 && amount > disc.max_discount) {
        amount = disc.max_discount;
      }
    } else {
      amount = disc.value;
    }

    if (amount > netSubtotal) {
      amount = netSubtotal;
    }

    return { amount, error: null };
  }, []);

  const handleSelectDiscount = (discId: string) => {
    setSelectedDiscountId(discId);
    setCouponCode("");
    if (!discId) {
      setAppliedDiscount(null);
      return;
    }
    const disc = availableDiscounts.find((d) => d.id === discId);
    if (!disc) return;

    const calc = calculateCartDiscount(disc, cart);
    if (calc.error) {
      toast.warning(calc.error);
      setAppliedDiscount(null);
      return;
    }

    setAppliedDiscount({
      discount_id: disc.id,
      code: disc.code || "",
      name: disc.name,
      discount_amount: calc.amount,
    });
    toast.success(`Voucher "${disc.name}" berhasil diterapkan! (-${formatCurrency(calc.amount)})`);
  };

  // Fetch Products based on selected branch changes
  const fetchProductsForBranch = useCallback(async (bId: string) => {
    if (!bId) return;
    try {
      const res = await getPOSProductsAction(profile.tenant_owner_id, bId);
      if (res.status === "success" && res.data) {
        setProducts(res.data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memperbarui data produk cabang");
    }
  }, [profile.tenant_owner_id]);

  useEffect(() => {
    if (selectedBranchId !== initialBranchId) {
      fetchProductsForBranch(selectedBranchId);
      setCart([]); // Reset keranjang jika ganti cabang untuk konsistensi stok
    }
  }, [selectedBranchId, fetchProductsForBranch, initialBranchId]);

  // Cart operations
  const addToCart = (product: Product) => {
    const stockLimit = product.current_branch_stock ?? 0;
    const priceInfo = getEffectivePriceInfo(product);
    const existing = cart.find(item => item.product.id === product.id);

    if (existing) {
      if (existing.quantity >= stockLimit) {
        toast.warning(`Stok produk tidak mencukupi (Maksimal: ${stockLimit} pcs)`);
        return;
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1, effective_price: priceInfo.effectivePrice, product_discount: priceInfo.discount } 
          : item
      ));
    } else {
      if (stockLimit <= 0) {
        toast.warning("Stok produk habis!");
        return;
      }
      setCart([...cart, { product, quantity: 1, effective_price: priceInfo.effectivePrice, product_discount: priceInfo.discount }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    const stockLimit = item.product.current_branch_stock ?? 0;

    if (newQty <= 0) {
      removeFromCart(productId);
    } else if (newQty > stockLimit) {
      toast.warning(`Stok produk terbatas pada ${stockLimit} pcs`);
    } else {
      setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: newQty } : i));
    }
  };

  const handleQtyInput = (productId: string, val: string) => {
    const num = parseInt(val);
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;

    const stockLimit = item.product.current_branch_stock ?? 0;

    if (isNaN(num) || num <= 0) {
      setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: 1 } : i));
    } else if (num > stockLimit) {
      toast.warning(`Stok produk terbatas pada ${stockLimit} pcs`);
      setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: stockLimit } : i));
    } else {
      setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: num } : i));
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const handleAddProductFromSelect = () => {
    if (!selectedProductId) return toast.warning("Silakan pilih produk terlebih dahulu");
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const stockLimit = prod.current_branch_stock ?? 0;
    if (stockLimit <= 0) {
      toast.warning("Stok produk habis!");
      return;
    }

    const priceInfo = getEffectivePriceInfo(prod);
    const existing = cart.find(item => item.product.id === prod.id);
    const currentQty = existing ? existing.quantity : 0;
    const targetQty = currentQty + inputQty;

    if (targetQty > stockLimit) {
      toast.warning(`Stok tidak mencukupi. Maksimal stok: ${stockLimit}`);
      return;
    }

    if (existing) {
      setCart(cart.map(item => 
        item.product.id === prod.id 
          ? { ...item, quantity: targetQty, effective_price: priceInfo.effectivePrice, product_discount: priceInfo.discount } 
          : item
      ));
    } else {
      setCart([...cart, { product: prod, quantity: inputQty, effective_price: priceInfo.effectivePrice, product_discount: priceInfo.discount }]);
    }
    
    setSelectedProductId("");
    setProductSearchQuery("");
    setInputQty(1);
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.effective_price * item.quantity), 0);
  const cartOriginalSubtotal = cart.reduce((sum, item) => sum + (item.product.sell_price * item.quantity), 0);
  const cartProductDiscountTotal = Math.max(0, cartOriginalSubtotal - cartSubtotal);
  const cartDiscountAmount = appliedDiscount ? appliedDiscount.discount_amount : 0;
  const cartFinalTotal = Math.max(0, cartSubtotal - cartDiscountAmount);

  // Recalculate applied discount dynamically whenever cart or selectedDiscountId changes
  useEffect(() => {
    if (!selectedDiscountId) return;
    const disc = availableDiscounts.find((d) => d.id === selectedDiscountId);
    if (!disc) return;

    const calc = calculateCartDiscount(disc, cart);
    if (calc.error || calc.amount <= 0) {
      setAppliedDiscount(null);
      return;
    }

    setAppliedDiscount({
      discount_id: disc.id,
      code: disc.code || "",
      name: disc.name,
      discount_amount: calc.amount,
    });
  }, [cart, selectedDiscountId, availableDiscounts, calculateCartDiscount]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setAppliedDiscount(null);
      return;
    }
    if (cartSubtotal <= 0) {
      toast.warning("Pilih produk terlebih dahulu sebelum menerapkan kupon");
      return;
    }
    setIsValidatingCoupon(true);
    try {
      const res = await validateDiscountCodeAction({
        code: couponCode.trim(),
        profile_id: profile.tenant_owner_id,
        subtotal: cartSubtotal,
      });
      if (res.success && res.data) {
        setAppliedDiscount(res.data);
        toast.success(`Kupon "${res.data.name}" berhasil diterapkan! (-${formatCurrency(res.data.discount_amount)})`);
      } else {
        setAppliedDiscount(null);
        toast.error(res.error || "Kode kupon diskon tidak valid.");
      }
    } catch {
      toast.error("Gagal memvalidasi kode kupon.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleSubmitTransaction = async () => {
    if (cart.length === 0) return toast.warning("Keranjang belanja masih kosong");
    if (!paymentMethodId) return toast.warning("Mohon pilih metode pembayaran");

    try {
      setIsSubmitting(true);
      
      const targetCat = txCategories.find(c => c.type === "pemasukan" && c.name.toLowerCase().includes("penjualan")) 
                        || txCategories.find(c => c.type === "pemasukan") 
                        || { id: null };

      const netSubtotal = cart.reduce((sum, item) => sum + (item.effective_price * item.quantity), 0);
      const globalDiscVal = appliedDiscount ? appliedDiscount.discount_amount : 0;
      const ratio = netSubtotal > 0 ? Math.max(0, netSubtotal - globalDiscVal) / netSubtotal : 1;

      const itemsPayload = cart.map(item => {
        const itemNet = item.effective_price * item.quantity;
        const itemFinalAmount = Math.round(itemNet * ratio);
        return {
          name: `${item.product.name} (x${item.quantity})`,
          amount: itemFinalAmount,
          category_id: targetCat.id,
          payment_method_id: paymentMethodId,
          type: "INCOME",
          product_id: item.product.id,
          quantity: item.quantity
        };
      });

      const isEditMode = !!editId;
      const numericCashPaid = Number(cashPaid) || 0;
      const changeAmount = numericCashPaid > cartFinalTotal ? numericCashPaid - cartFinalTotal : 0;

      const posMeta = {
        items: cart.map(item => ({
          product_id: item.product.id,
          name: item.product.name,
          sell_price: item.product.sell_price,
          effective_price: item.effective_price
        })),
        subtotal: cartSubtotal,
        product_discount: cartProductDiscountTotal,
        global_discount: appliedDiscount ? {
          name: appliedDiscount.name,
          amount: appliedDiscount.discount_amount
        } : null,
        cash_paid: numericCashPaid,
        change: changeAmount
      };

      const descriptionPayload = JSON.stringify({
        pos_meta: posMeta,
        note: description || "Transaksi POS Kasir"
      });

      const payload = {
        ...(isEditMode && { id: editId }),
        profile_id: profile.tenant_owner_id,
        branch_id: selectedBranchId,
        reference_number: reference,
        transaction_date: date,
        description: descriptionPayload,
        customer_name: customerName || "Pembeli Umum",
        customer_phone: customerPhone || null,
        customer_address: customerAddress || null,
        order_status: 6,
        items: itemsPayload
      };

      const res = await savePOSTransactionAction(payload);

      if (res.status === "success") {
        const numericCashPaid = Number(cashPaid) || 0;
        const changeAmount = numericCashPaid > cartFinalTotal ? numericCashPaid - cartFinalTotal : 0;

        setLastTransaction({
          ...res.data,
          items: cart,
          customer_name: customerName || "Pembeli Umum",
          payment_method: paymentMethods.find(pm => pm.id === paymentMethodId)?.name || "Tunai",
          cash_paid: numericCashPaid,
          change: changeAmount,
          applied_discount: appliedDiscount ? { ...appliedDiscount } : null
        });

        if (isEditMode) {
          toast.success("Transaksi berhasil diperbarui dan stok telah disesuaikan!");
        } else {
          toast.success("Transaksi kasir berhasil disimpan!");
        }
        
        setCart([]);
        setCustomerName("");
        setCustomerPhone("");
        setCustomerAddress("");
        setDescription("");
        setCashPaid("");
        setAppliedDiscount(null);
        setSelectedDiscountId("");
        setCouponCode("");
        
        fetchProductsForBranch(selectedBranchId);

        const now = new Date();
        setDate(now.toISOString().split("T")[0]);
        setIsAutoDate(true);
        setReference(`POS-${now.getTime().toString().slice(-6)}`);
        
        setShowReceiptModal(true);
      } else {
        toast.error(res.message || "Gagal memproses transaksi");
      }

    } catch (e) {
      toast.error("Kesalahan jaringan saat memproses transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!lastTransaction) return;
    await printReceiptPdf(
      {
        business_name: profile?.business_name,
        branch_name: branches.find((b) => b.id === selectedBranchId)?.name || "Cabang Utama",
        address: profile?.address,
        avatar_url: profile?.avatar_url,
      },
      {
        reference_number: lastTransaction.reference_number,
        transaction_date: lastTransaction.transaction_date || new Date().toISOString(),
        customer_name: lastTransaction.customer_name || "Pembeli Umum",
        payment_method: lastTransaction.payment_method || "Tunai",
        items: (lastTransaction.items || []).map((it: any) => ({
          name: it.product?.name || it.name || "Produk",
          quantity: it.quantity || 1,
          sell_price: it.product?.sell_price || it.sell_price || 0,
          effective_price: it.effective_price ?? (it.product?.sell_price ?? 0),
          subtotal: (it.effective_price ?? (it.product?.sell_price ?? 0)) * (it.quantity || 1),
        })),
        subtotal: (lastTransaction.items || []).reduce((sum: number, it: any) => sum + ((it.product?.sell_price || 0) * (it.quantity || 1)), 0),
        product_discount: (lastTransaction.items || []).reduce((sum: number, it: any) => sum + (Math.max(0, (it.product?.sell_price || 0) - (it.effective_price ?? (it.product?.sell_price || 0))) * (it.quantity || 1)), 0),
        global_discount: lastTransaction.applied_discount ? {
          name: lastTransaction.applied_discount.name,
          amount: lastTransaction.applied_discount.discount_amount,
        } : null,
        total_income: Math.max(0,
          ((lastTransaction.items || []).reduce((sum: number, it: any) => sum + ((it.product?.sell_price || 0) * (it.quantity || 1)), 0)) -
          ((lastTransaction.items || []).reduce((sum: number, it: any) => sum + (Math.max(0, (it.product?.sell_price || 0) - (it.effective_price ?? (it.product?.sell_price || 0))) * (it.quantity || 1)), 0)) -
          (lastTransaction.applied_discount ? lastTransaction.applied_discount.discount_amount : 0)
        ),
        cash_paid: lastTransaction.cash_paid,
        change: lastTransaction.change,
      }
    );
  };

  const connectBluetoothPrinter = async (forceNewScan = false) => {
    if (!(navigator as any).bluetooth) {
      throw new Error("Browser Anda tidak mendukung Web Bluetooth. Silakan gunakan Google Chrome versi terbaru.");
    }

    let device = cachedPrinterDevice;

    if (forceNewScan || !device) {
      if (cachedPrinterDevice?.gatt?.connected) {
        try {
          cachedPrinterDevice.gatt.disconnect();
        } catch (_) {}
      }
      cachedPrinterDevice = null;
      cachedGattServer = null;
      cachedWriteChar = null;
      setIsBtConnected(false);
      setBluetoothDeviceName(null);
      
      if (!forceNewScan && typeof (navigator as any).bluetooth.getDevices === "function") {
        try {
          const pairedDevices = await (navigator as any).bluetooth.getDevices();
          device = pairedDevices.find((d: any) => {
            const name = d.name || "";
            return BT_NAME_PREFIXES.some(p => name.startsWith(p));
          });
        } catch (e) {
          console.warn("Gagal membaca daftar perangkat terpasang:", e);
        }
      }

      if (!device) {
        device = await (navigator as any).bluetooth.requestDevice({
          filters: [
            ...BT_SERVICE_UUIDS.map(u => ({ services: [u] })),
            ...BT_NAME_PREFIXES.map(p => ({ namePrefix: p })),
          ],
          optionalServices: BT_SERVICE_UUIDS,
        });
      }
      cachedPrinterDevice = device;
    }

    if (device && !device.listenerAdded) {
      device.addEventListener("gattserverdisconnected", () => {
        console.log("Printer terputus (GATT disconnected) — reset semua cache");
        // Invalidate semua cache agar reconnect dipaksa pada cetak berikutnya
        cachedGattServer = null;
        cachedWriteChar = null;
        // Jangan null-kan cachedPrinterDevice agar device object tetap tersedia untuk reconnect
        // namun tandai bahwa perlu koneksi ulang
        setIsBtConnected(false);
        setBluetoothDeviceName(null);
      });
      device.listenerAdded = true;
    }

    // Selalu reconnect jika GATT tidak terhubung (menangani auto-disconnect setelah idle)
    let server = cachedGattServer;
    if (!server || !device.gatt.connected) {
      // Reset writeChar juga karena server sudah disconnected
      cachedWriteChar = null;
      try {
        console.log("Menghubungkan ulang ke GATT server...");
        server = await device.gatt.connect();
        cachedGattServer = server;
      } catch (connectErr: any) {
        console.error("Gagal menghubungkan ke printer:", connectErr);
        cachedPrinterDevice = null;
        cachedGattServer = null;
        cachedWriteChar = null;
        setIsBtConnected(false);
        setBluetoothDeviceName(null);
        throw new Error(`Gagal terhubung ke printer. Pastikan printer menyala, berada dalam jangkauan, dan tidak terhubung ke perangkat lain.`);
      }
    }

    // Selalu discover ulang writeChar jika null (akibat disconnect)
    let writeChar = cachedWriteChar;
    if (!writeChar) {
      console.log("Mencari Write Characteristic...");
      for (const uuid of BT_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(uuid);
          const characteristics = await service.getCharacteristics();
          writeChar = characteristics.find(
            (c: any) => c.properties.write || c.properties.writeWithoutResponse
          );
          if (writeChar) break;
        } catch {
          // Lanjutkan ke UUID berikutnya
        }
      }

      if (!writeChar) {
        try {
          const allServices = await server.getPrimaryServices();
          for (const service of allServices) {
            const characteristics = await service.getCharacteristics();
            writeChar = characteristics.find(
              (c: any) => c.properties.write || c.properties.writeWithoutResponse
            );
            if (writeChar) break;
          }
        } catch (svcErr: any) {
          // Jika getPrimaryServices gagal karena server disconnected, lempar error yang jelas
          console.error("getPrimaryServices gagal:", svcErr);
          cachedGattServer = null;
          cachedWriteChar = null;
          throw new Error(`Server printer terputus saat mencari service. Coba cetak lagi untuk menghubungkan ulang secara otomatis.`);
        }
      }

      if (!writeChar) {
        throw new Error("Tidak menemukan port tulis data printer (Write Characteristic)");
      }
      cachedWriteChar = writeChar;
    }

    setIsBtConnected(true);
    setBluetoothDeviceName(device.name || "Thermal Printer");
    return writeChar;
  };

  const handleConnectPrinterManual = async () => {
    try {
      setIsPrintingBt(true);
      await connectBluetoothPrinter(true);
      toast.success("Printer berhasil dihubungkan!");
    } catch (err: any) {
      console.error(err);
      if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("dibatalkan")) return;
      toast.error(`Gagal menghubungkan printer: ${err.message || err}`);
    } finally {
      setIsPrintingBt(false);
    }
  };

  const handleDisconnectPrinterManual = async () => {
    try {
      if (cachedPrinterDevice?.gatt?.connected) {
        await cachedPrinterDevice.gatt.disconnect();
      }
      cachedPrinterDevice = null;
      cachedGattServer = null;
      cachedWriteChar = null;
      setIsBtConnected(false);
      setBluetoothDeviceName(null);
      toast.success("Koneksi printer diputuskan.");
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memutuskan koneksi printer");
    }
  };

  const connectUsbPrinter = async (forceNewScan = false) => {
    if (!(navigator as any).usb) {
      throw new Error("Browser Anda tidak mendukung WebUSB. Silakan gunakan Google Chrome.");
    }

    let device = cachedUsbDevice;

    if (forceNewScan || !device || !device.opened) {
      cachedUsbDevice = null;
      setIsUsbConnected(false);
      setUsbDeviceName(null);

      if (!forceNewScan) {
        try {
          const pairedDevices = await (navigator as any).usb.getDevices();
          if (pairedDevices.length > 0) {
            device = pairedDevices[0];
          }
        } catch (e) {
          console.warn("Gagal membaca daftar perangkat USB terpasang:", e);
        }
      }

      if (!device) {
        device = await (navigator as any).usb.requestDevice({
          filters: []
        });
      }
      cachedUsbDevice = device;
    }

    if (!device.opened) {
      await device.open();
    }

    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    let interfaceNumber: number | null = null;
    let endpointNumber: number | null = null;

    for (const config of device.configurations) {
      for (const iface of config.interfaces) {
        for (const alternate of iface.alternates) {
          if (alternate.interfaceClass === 7) {
            interfaceNumber = iface.interfaceNumber;
            const outEndpoint = alternate.endpoints.find(
              (ep: any) => ep.direction === "out" && ep.type === "bulk"
            );
            if (outEndpoint) {
              endpointNumber = outEndpoint.endpointNumber;
              break;
            }
          }
        }
        if (interfaceNumber !== null) break;
      }
      if (interfaceNumber !== null) break;
    }

    if (interfaceNumber === null || endpointNumber === null) {
      console.warn("Printer class 7 not found, trying fallback to any bulk-out endpoint...");
      for (const config of device.configurations) {
        for (const iface of config.interfaces) {
          for (const alternate of iface.alternates) {
            const outEndpoint = alternate.endpoints.find(
              (ep: any) => ep.direction === "out" && ep.type === "bulk"
            );
            if (outEndpoint) {
              interfaceNumber = iface.interfaceNumber;
              endpointNumber = outEndpoint.endpointNumber;
              break;
            }
          }
          if (interfaceNumber !== null) break;
        }
        if (interfaceNumber !== null) break;
      }
    }

    if (interfaceNumber === null || endpointNumber === null) {
      throw new Error("Tidak dapat menemukan interface/endpoint bulk out printer pada perangkat USB ini.");
    }

    try {
      await device.claimInterface(interfaceNumber);
    } catch (claimErr: any) {
      console.warn("Claim interface failed, attempting anyway:", claimErr);
    }

    setIsUsbConnected(true);
    setUsbDeviceName(device.productName || "USB Printer");

    return { device, endpointNumber, interfaceNumber };
  };

  const handleConnectUsbManual = async () => {
    try {
      setIsPrintingUsb(true);
      await connectUsbPrinter(true);
      toast.success("Printer USB berhasil dihubungkan!");
    } catch (err: any) {
      console.error(err);
      if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("dibatalkan")) return;
      toast.error(`Gagal menghubungkan printer USB: ${err.message || err}`);
    } finally {
      setIsPrintingUsb(false);
    }
  };

  const handleDisconnectUsbManual = async () => {
    try {
      if (cachedUsbDevice && cachedUsbDevice.opened) {
        await cachedUsbDevice.close();
      }
      cachedUsbDevice = null;
      setIsUsbConnected(false);
      setUsbDeviceName(null);
      toast.success("Koneksi printer USB diputuskan.");
    } catch (err: any) {
      console.error(err);
      toast.error("Gagal memutuskan koneksi printer USB");
    }
  };

  const handlePrintUsbDirect = async () => {
    if (!lastTransaction) return;
    try {
      setIsPrintingUsb(true);

      if (!(navigator as any).usb) {
        toast.error("Browser Anda tidak mendukung WebUSB. Silakan gunakan Google Chrome.");
        return;
      }

      const { device, endpointNumber } = await connectUsbPrinter(false);

      const encoder = new TextEncoder();
      const ESC = "\x1b";
      const GS = "\x1d";
      const LF = "\n";

      let data = "";
      data += ESC + "@";
      data += ESC + "a" + "\x01";
      data += ESC + "!" + "\x10";
      data += (profile.business_name || "TOKO UMKM").toUpperCase() + LF;
      data += ESC + "!" + "\x00";

      const activeBranchName = branches.find(b => b.id === selectedBranchId)?.name || "Cabang Utama";
      data += activeBranchName + LF;
      if (profile.address) {
        data += profile.address + LF;
      }
      data += "--------------------------------" + LF;

      data += ESC + "a" + "\x00";
      data += `Nota : #${lastTransaction.reference_number}` + LF;
      data += `Tgl  : ${new Date(lastTransaction.transaction_date || "").toLocaleDateString("id-ID")}` + LF;
      data += `Cust : ${lastTransaction.customer_name}` + LF;
      data += `Bayar: ${lastTransaction.payment_method}` + LF;
      data += "--------------------------------" + LF;

      lastTransaction.items.forEach((item: CartItem) => {
        const origPrice = item.product.sell_price;
        const effPrice = item.effective_price ?? origPrice;
        const hasDisc = origPrice > effPrice;

        const origFmt = formatCurrency(origPrice).replace("Rp", "").trim();
        const effFmt = formatCurrency(effPrice).replace("Rp", "").trim();
        const subtotalFmt = formatCurrency(effPrice * item.quantity).replace("Rp", "").trim();

        const nameLines = wrapText(item.product.name, 32);
        nameLines.forEach((line) => {
          data += line + LF;
        });

        if (hasDisc) {
          data += `${item.quantity} x ${origFmt}` + LF;
          const discText = `      -> ${effFmt}`;
          const spacesCount = 32 - discText.length - subtotalFmt.length;
          if (spacesCount >= 1) {
            data += discText + " ".repeat(spacesCount) + subtotalFmt + LF;
          } else {
            data += discText + LF;
            data += " ".repeat(Math.max(0, 32 - subtotalFmt.length)) + subtotalFmt + LF;
          }
        } else {
          const qtyText = `${item.quantity} x ${effFmt}`;
          const spacesCount = 32 - qtyText.length - subtotalFmt.length;
          if (spacesCount >= 1) {
            data += qtyText + " ".repeat(spacesCount) + subtotalFmt + LF;
          } else {
            data += qtyText + LF;
            data += " ".repeat(Math.max(0, 32 - subtotalFmt.length)) + subtotalFmt + LF;
          }
        }
      });

      data += "--------------------------------" + LF;

      const subtotalVal = lastTransaction.items.reduce((sum: number, i: CartItem) => sum + (i.product.sell_price * i.quantity), 0);
      const prodDiscountVal = lastTransaction.items.reduce((sum: number, i: CartItem) => sum + (Math.max(0, i.product.sell_price - (i.effective_price ?? i.product.sell_price)) * i.quantity), 0);
      const globalDiscountVal = lastTransaction.applied_discount ? lastTransaction.applied_discount.discount_amount : 0;
      const finalTotalVal = Math.max(0, subtotalVal - prodDiscountVal - globalDiscountVal);

      const subText = "Subtotal:";
      const subStr = formatCurrency(subtotalVal).replace("Rp", "").trim();
      data += subText + " ".repeat(Math.max(1, 32 - subText.length - subStr.length)) + subStr + LF;

      if (prodDiscountVal > 0) {
        const prodDiscText = "Diskon Produk:";
        const prodDiscStr = "-" + formatCurrency(prodDiscountVal).replace("Rp", "").trim();
        data += prodDiscText + " ".repeat(Math.max(1, 32 - prodDiscText.length - prodDiscStr.length)) + prodDiscStr + LF;
      }

      if (globalDiscountVal > 0) {
        const discName = (lastTransaction.applied_discount?.name || "Global").slice(0, 10);
        const discText = `Diskon (${discName}):`;
        const discStr = "-" + formatCurrency(globalDiscountVal).replace("Rp", "").trim();
        data += discText + " ".repeat(Math.max(1, 32 - discText.length - discStr.length)) + discStr + LF;
      }

      const totalText = "TOTAL BAYAR:";
      const totalVal = formatCurrency(finalTotalVal).replace("Rp", "").trim();
      const totalSpaces = 32 - totalText.length - totalVal.length;
      data += totalText + " ".repeat(Math.max(1, totalSpaces)) + totalVal + LF;

      if (lastTransaction.cash_paid !== undefined && lastTransaction.cash_paid > 0) {
        const bayarText = "BAYAR :";
        const bayarVal = formatCurrency(lastTransaction.cash_paid).replace("Rp", "").trim();
        const bayarSpaces = 32 - bayarText.length - bayarVal.length;
        data += bayarText + " ".repeat(Math.max(1, bayarSpaces)) + bayarVal + LF;

        const kembaliText = "KEMBALI:";
        const kembaliVal = formatCurrency(lastTransaction.change || 0).replace("Rp", "").trim();
        const kembaliSpaces = 32 - kembaliText.length - kembaliVal.length;
        data += kembaliText + " ".repeat(Math.max(1, kembaliSpaces)) + kembaliVal + LF;
      }
      data += LF;

      data += ESC + "a" + "\x01";
      data += "terima kasih atas pesanan anda ." + LF;
      data += "dicetak dari Sippeto POS system" + LF;
      data += LF + LF + LF;

      data += GS + "V" + "\x41" + "\x03";

      const bytes = encoder.encode(data);
      const chunkSize = 64;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        await device.transferOut(endpointNumber, chunk);
      }

      toast.success("Nota berhasil dicetak via Kabel USB!");
    } catch (err: any) {
      console.error(err);
      if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("dibatalkan")) return;
      toast.error(`Gagal cetak Kabel USB: ${err.message || err}`);
    } finally {
      setIsPrintingUsb(false);
    }
  };

  const handlePrintBluetoothDirect = async () => {
    if (!lastTransaction) return;
    try {
      setIsPrintingBt(true);

      if (!(navigator as any).bluetooth) {
        toast.error("Browser Anda tidak mendukung Web Bluetooth. Silakan gunakan Google Chrome versi terbaru.");
        return;
      }

      // Jika cache writeChar ada tapi koneksi sudah terputus, paksa reset sebelum connect
      if (cachedWriteChar && cachedPrinterDevice && !cachedPrinterDevice.gatt?.connected) {
        console.log("Koneksi GATT terputus sejak cetak terakhir — reset cache sebelum reconnect");
        cachedGattServer = null;
        cachedWriteChar = null;
      }

      const writeChar = await connectBluetoothPrinter(false);

      const encoder = new TextEncoder();
      const ESC = "\x1b";
      const GS = "\x1d";
      const LF = "\n";

      let data = "";
      data += ESC + "@";
      data += ESC + "a" + "\x01";
      data += ESC + "!" + "\x10";
      data += (profile.business_name || "TOKO UMKM").toUpperCase() + LF;
      data += ESC + "!" + "\x00";

      const activeBranchName = branches.find(b => b.id === selectedBranchId)?.name || "Cabang Utama";
      data += activeBranchName + LF;
      if (profile.address) {
        data += profile.address + LF;
      }
      data += "--------------------------------" + LF;

      data += ESC + "a" + "\x00";
      data += `Nota : #${lastTransaction.reference_number}` + LF;
      data += `Tgl  : ${new Date(lastTransaction.transaction_date || "").toLocaleDateString("id-ID")}` + LF;
      data += `Cust : ${lastTransaction.customer_name}` + LF;
      data += `Bayar: ${lastTransaction.payment_method}` + LF;
      data += "--------------------------------" + LF;

      lastTransaction.items.forEach((item: CartItem) => {
        const origPrice = item.product.sell_price;
        const effPrice = item.effective_price ?? origPrice;
        const hasDisc = origPrice > effPrice;

        const origFmt = formatCurrency(origPrice).replace("Rp", "").trim();
        const effFmt = formatCurrency(effPrice).replace("Rp", "").trim();
        const subtotalFmt = formatCurrency(effPrice * item.quantity).replace("Rp", "").trim();

        const nameLines = wrapText(item.product.name, 32);
        nameLines.forEach((line) => {
          data += line + LF;
        });

        if (hasDisc) {
          data += `${item.quantity} x ${origFmt}` + LF;
          const discText = `   -> ${effFmt}`;
          const spacesCount = 32 - discText.length - subtotalFmt.length;
          if (spacesCount >= 1) {
            data += discText + " ".repeat(spacesCount) + subtotalFmt + LF;
          } else {
            data += discText + LF;
            data += " ".repeat(Math.max(0, 32 - subtotalFmt.length)) + subtotalFmt + LF;
          }
        } else {
          const qtyText = `${item.quantity} x ${effFmt}`;
          const spacesCount = 32 - qtyText.length - subtotalFmt.length;
          if (spacesCount >= 1) {
            data += qtyText + " ".repeat(spacesCount) + subtotalFmt + LF;
          } else {
            data += qtyText + LF;
            data += " ".repeat(Math.max(0, 32 - subtotalFmt.length)) + subtotalFmt + LF;
          }
        }
      });

      data += "--------------------------------" + LF;

      const subtotalValBt = lastTransaction.items.reduce((sum: number, i: CartItem) => sum + (i.product.sell_price * i.quantity), 0);
      const prodDiscountValBt = lastTransaction.items.reduce((sum: number, i: CartItem) => sum + (Math.max(0, i.product.sell_price - (i.effective_price ?? i.product.sell_price)) * i.quantity), 0);
      const globalDiscountValBt = lastTransaction.applied_discount ? lastTransaction.applied_discount.discount_amount : 0;
      const finalTotalValBt = Math.max(0, subtotalValBt - prodDiscountValBt - globalDiscountValBt);

      const subTextBt = "Subtotal:";
      const subStrBt = formatCurrency(subtotalValBt).replace("Rp", "").trim();
      data += subTextBt + " ".repeat(Math.max(1, 32 - subTextBt.length - subStrBt.length)) + subStrBt + LF;

      if (prodDiscountValBt > 0) {
        const prodDiscTextBt = "Diskon Produk:";
        const prodDiscStrBt = "-" + formatCurrency(prodDiscountValBt).replace("Rp", "").trim();
        data += prodDiscTextBt + " ".repeat(Math.max(1, 32 - prodDiscTextBt.length - prodDiscStrBt.length)) + prodDiscStrBt + LF;
      }

      if (globalDiscountValBt > 0) {
        const discNameBt = (lastTransaction.applied_discount?.name || "Global").slice(0, 10);
        const discTextBt = `Diskon (${discNameBt}):`;
        const discStrBt = "-" + formatCurrency(globalDiscountValBt).replace("Rp", "").trim();
        data += discTextBt + " ".repeat(Math.max(1, 32 - discTextBt.length - discStrBt.length)) + discStrBt + LF;
      }

      const totalTextBt = "TOTAL BAYAR:";
      const totalValBt = formatCurrency(finalTotalValBt).replace("Rp", "").trim();
      const totalSpacesBt = 32 - totalTextBt.length - totalValBt.length;
      data += totalTextBt + " ".repeat(Math.max(1, totalSpacesBt)) + totalValBt + LF;

      if (lastTransaction.cash_paid !== undefined && lastTransaction.cash_paid > 0) {
        const bayarText = "BAYAR :";
        const bayarVal = formatCurrency(lastTransaction.cash_paid).replace("Rp", "").trim();
        const bayarSpaces = 32 - bayarText.length - bayarVal.length;
        data += bayarText + " ".repeat(Math.max(1, bayarSpaces)) + bayarVal + LF;

        const kembaliText = "KEMBALI:";
        const kembaliVal = formatCurrency(lastTransaction.change || 0).replace("Rp", "").trim();
        const kembaliSpaces = 32 - kembaliText.length - kembaliVal.length;
        data += kembaliText + " ".repeat(Math.max(1, kembaliSpaces)) + kembaliVal + LF;
      }
      data += LF;

      data += ESC + "a" + "\x01";
      data += "terima kasih atas pesanan anda ." + LF;
      data += "dicetak dari Sippeto POS system" + LF;
      data += LF + LF + LF;

      data += GS + "V" + "\x41" + "\x03";

      const bytes = encoder.encode(data);
      const chunkSize = 100;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.slice(i, i + chunkSize);
        try {
          if (writeChar.writeWithoutResponse) {
            await writeChar.writeWithoutResponse(chunk);
          } else if (writeChar.writeValueWithResponse) {
            await writeChar.writeValueWithResponse(chunk);
          } else {
            await writeChar.writeValue(chunk);
          }
        } catch {
          await writeChar.writeValue(chunk);
        }
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      toast.success("Nota berhasil dicetak via Bluetooth!");
    } catch (err: any) {
      console.error(err);
      if (err.name === "NotFoundError" || err.message?.includes("cancelled") || err.message?.includes("dibatalkan")) return;
      toast.error(`Gagal cetak Bluetooth: ${err.message || err}`);
    } finally {
      setIsPrintingBt(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  const selectedPaymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
  const isCashPayment = selectedPaymentMethod?.name.toLowerCase().includes("tunai") || selectedPaymentMethod?.name.toLowerCase().includes("cash");
  const numericCashPaid = Number(cashPaid) || 0;
  const changeAmount = numericCashPaid > cartFinalTotal ? numericCashPaid - cartFinalTotal : 0;
  const isPaymentEnough = !isCashPayment || numericCashPaid >= cartFinalTotal;

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col pb-4" style={{ fontFamily: "var(--font-jakarta), sans-serif" }}>
      <div className="max-w-[1600px] mx-auto w-full px-2 lg:px-3 pt-1 pb-1.5 space-y-2">
        
        {/* Header POS - Ultra Compact Aesthetic */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 bg-white border border-zinc-200 p-2 px-3 rounded-xl shadow-sm">
           <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3c39d6] to-[#1e1b8b] flex items-center justify-center text-white shadow-sm shrink-0">
                 <Store className="w-4 h-4" />
              </div>
              <div>
                 <div className="flex items-center gap-2">
                    <h1 className="text-base font-black text-[#030037] tracking-tight flex items-center gap-1.5 leading-none">
                       {editId ? 'Edit' : 'Kasir'} & <span className="text-[#3c39d6]">{editId ? 'Koreksi Transaksi' : 'Penjualan'}</span>
                    </h1>
                    <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                       editId 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                       <span className={`w-1 h-1 rounded-full ${editId ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
                       {editId ? 'Edit' : 'POS'}
                    </span>
                 </div>
                 {profile && (
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-600 font-semibold">
                       <span className="font-black text-black uppercase tracking-wide flex items-center gap-1">
                          {profile.business_name || "TOKO UMKM"}
                       </span>
                       {profile.address && (
                          <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                             <span className="text-zinc-300">•</span>
                             <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                             {profile.address}
                          </span>
                       )}
                    </div>
                 )}
              </div>
           </div>

           {/* Header Right: Branch Selector + Riwayat */}
           <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
              {!editId && (
                <button
                  onClick={() => router.push('/backend/tenant/sales/history')}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 bg-zinc-50 hover:bg-white border border-zinc-200 text-zinc-700 hover:text-[#3c39d6] hover:border-indigo-200 rounded-xl shadow-sm text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Receipt className="w-3.5 h-3.5 text-[#3c39d6]" />
                  Riwayat
                </button>
              )}

              {/* Branch Selector */}
               <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl shadow-sm min-w-[180px]">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#3c39d6] shrink-0">
                     <Store className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Cabang Aktif</span>
                     <select
                       disabled={!!profile.userBranchId}
                       className="w-full bg-transparent border-0 p-0 text-xs font-bold text-black focus:ring-0 outline-none cursor-pointer appearance-none disabled:bg-transparent truncate"
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} {profile.userBranchId === b.id ? "(Anda)" : ""}
                        </option>
                      ))}
                    </select>
                 </div>
                 {!profile.userBranchId && <ChevronDown className="w-3 h-3 text-zinc-400 shrink-0" />}
              </div>
           </div>
        </div>

         {/* Edit Mode Banner */}
         {editId && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 p-2.5 rounded-xl shadow-sm">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Edit2 className="w-3 h-3 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-amber-600 leading-none">Mode Koreksi Aktif</p>
                <p className="text-xs font-bold text-amber-750 truncate mt-0.5">
                  Mengedit nota <span className="font-black">#{reference}</span>. Simpan perubahan untuk update.
                </p>
              </div>
              <button
                onClick={() => router.push('/backend/tenant/sales/history')}
                title="Batal Edit"
                className="p-1.5 bg-amber-100 border border-amber-200 text-amber-700 hover:bg-amber-200 rounded-lg transition-all shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
         )}

         {/* Layout Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            {/* LEFT COLUMN: Detail Transaksi & Keranjang Belanja */}
            <div className="lg:col-span-5 space-y-4">
               {/* Card 1: Detail Transaksi */}
               <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
                  <h3 className="text-sm font-black text-[#030037] uppercase tracking-widest border-b border-zinc-200 pb-3">
                     Detail Transaksi
                  </h3>

                  <div className="space-y-4">
                     {/* Row 1: Nota & Tanggal */}
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                           <label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest block pl-0.5">No. Nota</label>
                           <input 
                              type="text"
                              className="w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-bold text-black outline-none focus:bg-white focus:border-[#10b981] focus:ring-2 focus:ring-emerald-500/10 shadow-sm transition-all"
                              value={reference}
                              onChange={(e) => setReference(e.target.value)}
                           />
                        </div>
                        <div className="space-y-1">
                           <div className="flex items-center justify-between pl-0.5 mb-1">
                              <label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest block">Tanggal</label>
                              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                 <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">Otomatis</span>
                                 <div className="relative flex items-center">
                                    <input 
                                       type="checkbox"
                                       className="sr-only peer"
                                       checked={isAutoDate}
                                       onChange={(e) => {
                                          setIsAutoDate(e.target.checked);
                                          if (e.target.checked) {
                                             setDate(new Date().toISOString().split("T")[0]);
                                          }
                                       }}
                                    />
                                    <div className="w-[32px] h-[18px] bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-[14px] after:w-[14px] after:transition-all peer-checked:bg-[#10b981] shadow-inner relative"></div>
                                 </div>
                              </label>
                           </div>
                           <input 
                              type="date"
                              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold outline-none shadow-sm transition-all text-black ${
                                 isAutoDate 
                                    ? "bg-zinc-50 border-zinc-200 text-zinc-700 cursor-not-allowed" 
                                    : "bg-white border-zinc-300 focus:bg-white focus:border-[#10b981] focus:ring-2 focus:ring-emerald-500/10"
                              }`}
                              value={date}
                              onChange={(e) => {
                                 if (!isAutoDate) {
                                    setDate(e.target.value);
                                 }
                              }}
                              disabled={isAutoDate}
                           />
                        </div>
                     </div>

                    {/* Row 2: Nama Pelanggan */}
                     <div className="space-y-1">
                        <label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest block pl-0.5">Pelanggan</label>
                        <div className="relative flex items-center">
                           <User className="absolute left-3 w-4 h-4 text-zinc-400" />
                           <input 
                              type="text" 
                              placeholder="Pembeli Umum (Default)" 
                              className="w-full pl-9 pr-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-[#10b981] focus:ring-2 focus:ring-emerald-500/10 text-black shadow-sm transition-all"
                              value={customerName}
                              onChange={(e) => setCustomerName(e.target.value)}
                           />
                        </div>
                     </div>

                    {/* Row 3: Metode Pembayaran */}
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest block pl-0.5">Metode Bayar</label>
                        <div className="grid grid-cols-3 gap-2">
                          {paymentMethods.map(pm => {
                            const isActive = paymentMethodId === pm.id;
                            return (
                               <button
                                 key={pm.id}
                                 type="button"
                                 onClick={() => setPaymentMethodId(pm.id)}
                                 className={`px-1.5 py-2.5 min-h-[56px] rounded-xl text-sm font-bold border transition-all duration-200 flex flex-col items-center justify-center gap-1 select-none ${
                                   isActive 
                                     ? "bg-[#10b981] border-[#10b981] text-white shadow-md shadow-emerald-500/20" 
                                     : "bg-white border-zinc-300 text-zinc-900 hover:bg-zinc-50 hover:text-zinc-800 shadow-sm"
                                 }`}
                               >
                                 <CreditCard className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-zinc-400"}`} />
                                 <span className="text-[10px] text-center leading-tight font-black line-clamp-2 max-w-full">{pm.name}</span>
                               </button>
                            );
                          })}
                        </div>
                     </div>

                    {/* Uang Dibayar & Kembalian (Khusus Pembayaran Tunai) */}
                     {isCashPayment && (
                        <div className="space-y-2 border-t border-zinc-200/50 pt-3">
                           <label className="text-[10px] font-black text-zinc-800 uppercase tracking-widest block pl-0.5">Uang Dibayar (Tunai)</label>
                           <div className="relative flex items-center">
                              <span className="absolute left-3 text-sm font-black text-zinc-900">Rp</span>
                              <input 
                                 type="number" 
                                 placeholder="0" 
                                 className="w-full pl-9 pr-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-mono font-bold outline-none text-black shadow-sm transition-all focus:bg-white focus:border-[#10b981] focus:ring-2 focus:ring-emerald-500/10"
                                 value={cashPaid}
                                 onChange={(e) => setCashPaid(e.target.value)}
                              />
                           </div>
                           
                           {/* Tombol Pintas Uang */}
                           <div className="flex flex-wrap gap-1.5">
                              <button 
                                 type="button" 
                                 onClick={() => setCashPaid(cartFinalTotal.toString())} 
                                 className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded text-xs font-black text-zinc-900 transition-colors uppercase tracking-wider"
                              >
                                 Uang Pas
                              </button>
                              {getQuickCashPresets(cartFinalTotal).map((preset) => (
                                 <button 
                                    key={preset}
                                    type="button" 
                                    onClick={() => setCashPaid(preset.toString())} 
                                    className="px-3 py-1.5 bg-zinc-100 hover:bg-[#10b981] hover:text-white border border-zinc-300 rounded text-xs font-black text-zinc-900 transition-colors"
                                 >
                                    {formatCurrency(preset).replace("Rp", "").trim()}
                                 </button>
                              ))}
                           </div>

                           {/* Info Kembalian */}
                           <div className="flex justify-between items-center text-xs font-black uppercase tracking-wider pl-0.5 pt-2 border-t border-zinc-100">
                              <span className="text-zinc-500">Kembalian:</span>
                              <span className={`font-mono text-lg font-black ${isPaymentEnough ? "text-emerald-600" : "text-red-500"}`}>
                                 {formatCurrency(changeAmount)}
                              </span>
                           </div>
                        </div>
                     )}

                                         {/* Tombol Pemicu Modal Diskon & Promo Toko */}
                      <div className="pt-0.5">
                         <button
                            type="button"
                            onClick={() => setIsDiscountModalOpen(true)}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-black transition-all shadow-sm cursor-pointer ${
                               appliedDiscount
                                  ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 text-emerald-950 hover:border-emerald-400"
                                  : "bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-indigo-50/90 border-indigo-200/90 text-indigo-950 hover:border-indigo-400 hover:shadow-md"
                            }`}
                         >
                            <div className="flex items-center gap-2 truncate">
                               <Ticket className={`w-4 h-4 shrink-0 ${appliedDiscount ? "text-emerald-600" : "text-indigo-600 animate-pulse"}`} />
                               <span className="truncate font-black tracking-tight">
                                  {appliedDiscount
                                     ? `Promo "${appliedDiscount.name}"`
                                     : "Pilih Diskon / Kupon Promo"}
                               </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                               {appliedDiscount ? (
                                  <span className="font-mono font-black text-white bg-emerald-600 px-2 py-0.5 rounded-lg text-[11px] shadow-2xs">
                                     -{formatCurrency(appliedDiscount.discount_amount)}
                                  </span>
                               ) : (
                                  <span className="text-[10px] font-black text-white bg-indigo-600 px-2.5 py-0.5 rounded-lg shadow-2xs">
                                     + Diskon
                                  </span>
                               )}
                            </div>
                         </button>
                      </div>

                     {/* Total Summary */}
                     <div className="bg-gradient-to-br from-[#030037] to-[#120f4c] text-white p-4.5 rounded-2xl flex justify-between items-center shadow-sm border border-white/5">
                        <div>
                           <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block leading-none mb-1">Total Bayar</span>
                           <span className="text-xs font-bold text-white/50">
                              {cart.reduce((sum, item) => sum + item.quantity, 0)} produk
                           </span>
                        </div>
                        <div className="text-right">
                           {appliedDiscount && (
                              <span className="text-xs text-zinc-400 line-through block font-mono">
                                 {formatCurrency(cartSubtotal)}
                              </span>
                           )}
                           <span className="text-2xl font-black font-mono text-emerald-400">
                              {formatCurrency(cartFinalTotal)}
                           </span>
                        </div>
                     </div>

                    {/* Actions */}
                     <div className="flex gap-2 pt-2.5">
                        <button 
                           disabled={isSubmitting}
                           onClick={() => {
                              if (editId) {
                                router.push('/backend/tenant/sales/history');
                              } else if (cart.length > 0 && confirm("Kosongkan keranjang?")) {
                                setCart([]);
                              }
                           }}
                           className="px-4.5 py-3.5 bg-zinc-150 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-900 transition-colors font-bold text-xs uppercase tracking-wider rounded-xl border border-zinc-300 disabled:opacity-50 shadow-sm"
                        >
                           {editId ? "Batal Edit" : "Reset"}
                        </button>
                        <button
                           onClick={handleSubmitTransaction}
                           disabled={cart.length === 0 || isSubmitting || (isCashPayment && !isPaymentEnough)}
                           className={`flex-1 py-3.5 text-white transition-all font-black text-xs uppercase tracking-widest rounded-xl shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                             editId 
                               ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/10" 
                               : "bg-[#10b981] hover:bg-[#059669] shadow-emerald-500/15"
                           }`}
                        >
                           {isSubmitting ? <Check className="w-4 h-4 animate-pulse" /> : (editId ? <Edit2 className="w-4 h-4" /> : <Check className="w-4 h-4" />)}
                           {isSubmitting ? "Memproses..." : (editId ? "Simpan Perubahan" : "Bayar & Selesaikan")}
                        </button>
                     </div>
                 </div>
               </div>

               {/* Card 2: Daftar Keranjang Belanja */}
               <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
                  <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-black text-[#030037] uppercase tracking-widest flex items-center gap-2">
                         <ShoppingCart className="w-4.5 h-4.5 text-[#3c39d6]" /> Keranjang Belanja
                      </h3>
                      <span className="text-[10px] font-black bg-[#3c39d6]/10 text-[#3c39d6] px-2.5 py-1 rounded-full">
                         {cart.length} produk terpilih
                      </span>
                   </div>

                   <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50/30 shadow-sm">
                      <div data-lenis-prevent className="max-h-[380px] overflow-y-auto scrollbar-thin">
                         <table className="w-full text-left border-collapse">
                            <thead>
                               <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                  <th className="px-4 py-3">Produk</th>
                                  <th className="px-4 py-3 text-right">Harga</th>
                                  <th className="px-4 py-3 text-center">Qty</th>
                                  <th className="px-4 py-3 text-right">Subtotal</th>
                                  <th className="px-4 py-3 text-center">Aksi</th>
                               </tr>
                            </thead>
                           <tbody className="divide-y divide-zinc-150">
                              {cart.length === 0 ? (
                                 <tr>
                                    <td colSpan={5} className="py-16 text-center text-zinc-400 bg-white">
                                       <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30 text-zinc-400" />
                                       <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Keranjang masih kosong</p>
                                    </td>
                                 </tr>
                              ) : (
                                  cart.map((item) => (
                                     <tr key={item.product.id} className="hover:bg-zinc-100/50 bg-white transition-all text-xs font-bold text-zinc-900 border-b border-zinc-100">
                                        <td className="px-4 py-4">
                                           <div className="whitespace-normal break-words max-w-[180px] sm:max-w-[240px]" title={item.product.name}>
                                              {item.product.name}
                                           </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono">
                                            {item.effective_price < item.product.sell_price ? (
                                               <div>
                                                  <span className="text-[#10b981] font-bold block">{formatCurrency(item.effective_price)}</span>
                                                  <span className="text-[10px] text-zinc-400 line-through block">{formatCurrency(item.product.sell_price)}</span>
                                               </div>
                                            ) : (
                                               formatCurrency(item.product.sell_price)
                                            )}
                                         </td>
                                         <td className="px-4 py-4">
                                             <div className="flex items-center justify-center gap-0.5 bg-white border border-zinc-300 px-1.5 py-0.5 rounded-md w-16 mx-auto">
                                              <button 
                                                 type="button"
                                                 onClick={() => updateQuantity(item.product.id, -1)}
                                                 className="p-0.5 text-zinc-700 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                                              >
                                                 <Minus className="w-2.5 h-2.5" />
                                              </button>
                                              <input 
                                                 type="text" 
                                                 className="w-6 border-none bg-transparent text-center text-[10px] font-bold focus:ring-0 p-0 text-zinc-900"
                                                 value={item.quantity}
                                                 onChange={(e) => handleQtyInput(item.product.id, e.target.value)}
                                              />
                                              <button 
                                                 type="button"
                                                 onClick={() => updateQuantity(item.product.id, 1)}
                                                 className="p-0.5 text-zinc-700 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                                              >
                                                 <Plus className="w-2.5 h-2.5" />
                                              </button>
                                           </div>
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-emerald-600">
                                           {formatCurrency(item.effective_price * item.quantity)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                           <button 
                                              type="button"
                                              onClick={() => removeFromCart(item.product.id)}
                                              className="p-1.5 text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 rounded-md transition-all shadow-sm"
                                           >
                                              <Trash2 className="w-3.5 h-3.5" />
                                           </button>
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                   </div>
                </div>
             </div>

            {/* RIGHT COLUMN: Pilih Produk */}
             <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-5">
                
                {/* 1. Pilih Produk Ke Keranjang (Grid Visual optimized) */}
                <div className="space-y-4">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100">
                      <h3 className="text-sm font-black text-[#030037] uppercase tracking-widest pl-0.5">
                         Pilih Produk Ke Keranjang
                      </h3>
                      <span className="text-[10px] font-black bg-[#10b981]/10 text-[#10b981] px-2.5 py-1 rounded-full uppercase tracking-wider">
                         {filteredProducts.length} Produk Tersedia
                      </span>
                   </div>
                   
                   {/* Baris Filter: Search + Dropdown Tipe Kategori + Dropdown Spesifik Kategori */}
                   <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      
                      {/* Search Bar (6 cols) */}
                      <div className="relative sm:col-span-6">
                         <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                         <input 
                            type="text" 
                            placeholder="Cari produk berdasarkan nama..." 
                            value={searchQuery}
                            onChange={(e) => {
                               setSearchQuery(e.target.value);
                               setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-9 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black outline-none focus:bg-white focus:border-[#10b981] shadow-xs transition-all"
                         />
                         {searchQuery && (
                            <button
                               type="button"
                               onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                               className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                            >
                               <X className="w-4 h-4" />
                            </button>
                         )}
                      </div>

                      {/* Dropdown Tipe Kategori (Pusat vs Tenant) (3 cols) */}
                      <div className="relative sm:col-span-3">
                         <select
                            className="w-full pl-3 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black appearance-none cursor-pointer focus:outline-none focus:border-primary transition-all"
                            value={categoryScope}
                            onChange={(e) => {
                               setCategoryScope(e.target.value as "all" | "pusat" | "tenant");
                               setSelectedCategoryId("all");
                               setCurrentPage(1);
                            }}
                         >
                            <option value="all" className="text-black">Semua Tipe</option>
                            <option value="pusat" className="text-black">🏢 Kategori Pusat</option>
                            <option value="tenant" className="text-black">🏪 Kategori Tenant</option>
                         </select>
                         <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                      </div>

                      {/* Dropdown Spesifik Kategori (3 cols) */}
                      <div className="relative sm:col-span-3">
                         <select
                            className="w-full pl-3 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-black appearance-none cursor-pointer focus:outline-none focus:border-primary transition-all"
                            value={selectedCategoryId}
                            onChange={(e) => {
                               setSelectedCategoryId(e.target.value);
                               setCurrentPage(1);
                            }}
                         >
                            <option value="all" className="text-black">Semua Kategori</option>
                            {pusatCategories.length > 0 && (
                               <optgroup label="🏢 Kategori Pusat (Admin)">
                                  {pusatCategories.map((c) => (
                                     <option key={c.id} value={c.id} className="text-black">
                                        {c.name}
                                     </option>
                                  ))}
                               </optgroup>
                            )}
                            {tenantCategories.length > 0 && (
                               <optgroup label="🏪 Kategori Tenant (Milik Saya)">
                                  {tenantCategories.map((c) => (
                                     <option key={c.id} value={c.id} className="text-black">
                                        {c.name}
                                     </option>
                                  ))}
                               </optgroup>
                            )}
                         </select>
                         <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                      </div>
                   </div>

                   {/* Kategori Tabs / Pills (Tergolong & Terpisah) */}
                   <div className="flex gap-2 overflow-x-auto pb-1.5 shrink-0 select-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      <button
                         type="button"
                         onClick={() => { setSelectedCategoryId("all"); setCurrentPage(1); }}
                         className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border whitespace-nowrap cursor-pointer ${
                            selectedCategoryId === "all"
                               ? "bg-[#3c39d6] text-white border-transparent shadow-xs"
                               : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                         }`}
                      >
                         📂 Semua Kategori
                      </button>
                      {filteredCategoryList.map((c) => {
                         const isPusat = !c.profile_id;
                         return (
                            <button
                               key={c.id}
                               type="button"
                               onClick={() => { setSelectedCategoryId(c.id); setCurrentPage(1); }}
                               className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                                  selectedCategoryId === c.id
                                     ? "bg-[#3c39d6] text-white border-transparent shadow-xs"
                                     : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                               }`}
                            >
                               <span className="text-[10px]">{isPusat ? "🏢" : "🏪"}</span>
                               <span>{c.name}</span>
                            </button>
                         );
                      })}
                   </div>

                   {/* Grid Produk */}
                   {paginatedProducts.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center gap-2 bg-zinc-50/50 rounded-2xl border border-zinc-150">
                         <Package className="w-10 h-10 text-zinc-300" />
                         <span className="text-xs font-bold text-zinc-400">Tidak ada produk ditemukan</span>
                      </div>
                   ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                         {paginatedProducts.map((p) => {
                            const stock = p.current_branch_stock ?? 0;
                            const isOutOfStock = stock <= 0;
                            const priceInfo = getEffectivePriceInfo(p);
                            const hasDisc = priceInfo.discount !== null;
                            return (
                               <div
                                  key={p.id}
                                  onClick={() => !isOutOfStock && addToCart(p)}
                                  className={`group relative p-2.5 bg-white border border-zinc-200 rounded-2xl flex flex-col justify-between overflow-hidden transition-all duration-200 shadow-sm ${
                                     isOutOfStock
                                        ? "opacity-50 cursor-not-allowed bg-zinc-50"
                                        : "cursor-pointer hover:border-[#10b981] hover:shadow-md hover:scale-[1.01]"
                                  }`}
                               >
                                  {/* Gambar */}
                                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-50/80 border border-zinc-100 flex items-center justify-center mb-2 shrink-0">
                                     {hasDisc && !isOutOfStock && (
                                         <span className="absolute top-1.5 left-1.5 text-[8px] font-black uppercase bg-[#3c39d6] text-white px-1.5 py-0.5 rounded-md shadow-sm z-10">
                                            🏷️ Promo {priceInfo.discount.type === "PERCENTAGE" ? `${priceInfo.discount.value}%` : ""}
                                         </span>
                                     )}
                                     {p.image_url ? (
                                        <img 
                                           src={p.image_url} 
                                           alt={p.name}
                                           loading="lazy"
                                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                     ) : (
                                        <Package className="w-7 h-7 text-zinc-300 group-hover:scale-110 transition-transform duration-300" />
                                     )}

                                     {/* Overlay Stock / Badge */}
                                     {isOutOfStock ? (
                                        <div className="absolute inset-0 bg-black/45 flex items-center justify-center p-1">
                                           <span className="text-[8px] font-black uppercase tracking-wider text-white bg-rose-600 px-1.5 py-0.5 rounded-md">
                                              Habis
                                           </span>
                                        </div>
                                     ) : stock < 10 ? (
                                        <span className="absolute top-1.5 right-1.5 text-[8px] font-black uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-full shadow-sm">
                                           Stok: {stock}
                                        </span>
                                     ) : null}
                                  </div>

                                  {/* Info Produk */}
                                  <div className="space-y-1.5">
                                     <h4 className="text-[10px] font-bold text-zinc-900 leading-tight line-clamp-2 h-7" title={p.name}>
                                        {p.name}
                                     </h4>
                                     <div className="flex items-center justify-between pt-1.5 border-t border-zinc-100">
                                        {hasDisc ? (
                                           <div className="flex flex-col">
                                              <span className="text-[11px] font-black text-emerald-600 font-mono">
                                                 {formatCurrency(priceInfo.effectivePrice).replace("Rp", "").trim()}
                                              </span>
                                              <span className="text-[9px] font-bold text-zinc-400 line-through font-mono">
                                                 {formatCurrency(priceInfo.originalPrice).replace("Rp", "").trim()}
                                              </span>
                                           </div>
                                        ) : (
                                           <span className="text-[11px] font-black text-emerald-600 font-mono">
                                              {formatCurrency(p.sell_price).replace("Rp", "").trim()}
                                           </span>
                                        )}
                                        {!isOutOfStock && stock >= 10 && (
                                           <span className="text-[9px] font-bold text-zinc-400">
                                              Stok: {stock}
                                           </span>
                                        )}
                                     </div>
                                  </div>
                               </div>
                            );
                         })}
                      </div>
                   )}

                   {/* Pagination Controls */}
                   {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 mt-1.5">
                         <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-0.5">
                            Hal {currentPage} / {totalPages} ({filteredProducts.length} Produk)
                         </span>
                         <div className="flex gap-2">
                            <button
                               type="button"
                               disabled={currentPage === 1}
                               onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                               className="px-3.5 py-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl text-[9px] font-black uppercase tracking-wider disabled:opacity-40 transition-all cursor-pointer"
                            >
                               Prev
                            </button>
                            <button
                               type="button"
                               disabled={currentPage === totalPages}
                               onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                               className="px-3.5 py-1.5 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-600 rounded-xl text-[9px] font-black uppercase tracking-wider disabled:opacity-40 transition-all cursor-pointer"
                            >
                               Next
                            </button>
                         </div>
                      </div>
                   )}
                </div>
             </div>
            {/* Success Modal Receipt using shared ReceiptModal */}
      {lastTransaction && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            if (editId) {
              router.push('/backend/tenant/sales');
            }
          }}
          profile={{
            business_name: profile?.business_name,
            branch_name: branches.find(b => b.id === selectedBranchId)?.name || "Cabang Utama",
            address: profile?.address,
            avatar_url: profile?.avatar_url,
          }}
          data={{
            reference_number: lastTransaction.reference_number,
            transaction_date: lastTransaction.transaction_date || new Date().toISOString(),
            customer_name: lastTransaction.customer_name || "Pembeli Umum",
            payment_method: lastTransaction.payment_method || "Tunai",
            items: (lastTransaction.items || []).map((it: any) => ({
              name: it.product?.name || it.name || "Produk",
              quantity: it.quantity || 1,
              sell_price: it.product?.sell_price || it.sell_price || 0,
              effective_price: it.effective_price ?? (it.product?.sell_price ?? 0),
              subtotal: (it.effective_price ?? (it.product?.sell_price ?? 0)) * (it.quantity || 1),
            })),
            subtotal: (lastTransaction.items || []).reduce((sum: number, it: any) => sum + ((it.product?.sell_price || 0) * (it.quantity || 1)), 0),
            product_discount: (lastTransaction.items || []).reduce((sum: number, it: any) => sum + (Math.max(0, (it.product?.sell_price || 0) - (it.effective_price ?? (it.product?.sell_price || 0))) * (it.quantity || 1)), 0),
            global_discount: lastTransaction.applied_discount ? {
              name: lastTransaction.applied_discount.name,
              amount: lastTransaction.applied_discount.discount_amount,
            } : null,
            total_income: Math.max(0,
              ((lastTransaction.items || []).reduce((sum: number, it: any) => sum + ((it.product?.sell_price || 0) * (it.quantity || 1)), 0)) -
              ((lastTransaction.items || []).reduce((sum: number, it: any) => sum + (Math.max(0, (it.product?.sell_price || 0) - (it.effective_price ?? (it.product?.sell_price || 0))) * (it.quantity || 1)), 0)) -
              (lastTransaction.applied_discount ? lastTransaction.applied_discount.discount_amount : 0)
            ),
            cash_paid: lastTransaction.cash_paid,
            change: lastTransaction.change,
          }}
          title="Transaksi Berhasil!"
          subtitle="Nota siap dicetak atau disimpan ke riwayat"
          showSuccessBadge={true}
          onViewHistory={() => {
            setShowReceiptModal(false);
            router.push('/backend/tenant/sales/history');
          }}
        />
      )}
      {/* MODAL DISKON & KUPON PROMO */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-3xl shadow-2xl border border-zinc-100 w-full max-w-md p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-[#3c39d6]">
                  <Ticket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#030037]">Diskon & Kupon Promo Toko</h3>
                  <p className="text-[10px] text-zinc-500 font-medium">Pilih promo toko atau ketik kode kupon</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="w-7 h-7 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* 1. Select Available Store Discounts */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">
                  Pilih Promo Aktif
                </label>
                {availableDiscounts.length > 0 ? (
                  <div className="flex gap-2">
                    <select
                      value={selectedDiscountId}
                      onChange={(e) => setSelectedDiscountId(e.target.value)}
                      className="flex-1 min-w-0 px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs font-bold text-black outline-none focus:border-[#3c39d6] cursor-pointer truncate"
                    >
                      <option value="">-- Pilih Promo Diskon --</option>
                      {availableDiscounts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} {d.code ? `(${d.code})` : ""} - {d.type === "PERCENTAGE" ? `${d.value}%` : formatCurrency(d.value)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleSelectDiscount(selectedDiscountId)}
                      disabled={!selectedDiscountId}
                      className="px-4 py-2.5 bg-[#3c39d6] text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-[#3c39d6]/90 transition-all shrink-0 cursor-pointer shadow-2xs"
                    >
                      Terapkan
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">Belum ada promo diskon aktif.</p>
                )}
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-zinc-200 w-full"></div>
                <span className="bg-white px-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider absolute">ATAU</span>
              </div>

              {/* 2. Manual Coupon Code Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">
                  Ketik Kode Kupon Promo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: KUPON50K"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 min-w-0 px-3 py-2.5 bg-white border border-zinc-300 rounded-xl text-xs font-mono font-bold text-black outline-none focus:border-[#3c39d6]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    className="px-4 py-2.5 bg-[#3c39d6] text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-[#3c39d6]/90 transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    {isValidatingCoupon ? "Memeriksa..." : "Terapkan"}
                  </button>
                </div>
              </div>

              {/* Active Discount Badge */}
              {appliedDiscount && (
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-3.5 py-3 rounded-xl shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block">Promo &quot;{appliedDiscount.name}&quot; Aktif!</span>
                      <span className="text-[10px] text-emerald-600 font-normal">Potongan berhasil diterapkan ke total belanja.</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-emerald-700 block text-sm">-{formatCurrency(appliedDiscount.discount_amount)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedDiscount(null);
                        setSelectedDiscountId("");
                        setCouponCode("");
                        toast.info("Promo diskon dibatalkan");
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Hapus Promo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer / Close */}
            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 font-bold">
                {appliedDiscount ? `Hemat ${formatCurrency(appliedDiscount.discount_amount)}!` : "Pilih atau ketik kode promo..."}
              </span>
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="px-5 py-2 bg-[#030037] text-white rounded-xl text-xs font-bold hover:bg-[#030037]/90 transition-colors shadow-2xs cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>
);
}
