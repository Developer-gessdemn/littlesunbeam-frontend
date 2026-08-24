import { useState, useEffect, useMemo, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderTree,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ShieldCheck,
  LogOut,
  Store,
  Eye,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Boxes,
  Truck,
  IndianRupee,
  Layers,
  X,
  Check,
  CheckCheck,
  Upload,
  Image as ImageIcon,
  FolderPlus,
  Loader2,
  Megaphone,
  MapPin,
  Phone,
  Mail,
  Copy,
  UserCheck,
  Navigation,
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  ChevronDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { adminService, getAdminAuth, clearAdminAuth } from "@/lib/adminService";
import { useShop } from "@/context/ShopContext.jsx";
import InvoiceModal from "@/components/InvoiceModal.jsx";
import {
  exportOrdersToExcel,
  exportOrdersToPdf,
  exportCustomersToExcel,
  exportCustomersToPdf,
  generateInvoicePdf,
  printInvoice,
} from "@/lib/exportUtils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Little Sunbeam Baby Clothing" },
      { name: "description", content: "Little Sunbeam store administration console" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const {
    refreshProducts,
    refreshPrints,
    refreshCategories,
    bannerText,
    setBannerText,
    footerInfo,
    setFooterInfo,
    heroBanners,
    setHeroBanners,
    prints,
    setPrints,
    isShopByPrintEnabled,
    setShopByPrintEnabled,
  } = useShop();

  // Print management state
  const [newPrintName, setNewPrintName] = useState("");
  const [newPrintIcon, setNewPrintIcon] = useState("");

  // Banner editor state
  const [editingBannerText, setEditingBannerText] = useState(bannerText || "");
  useEffect(() => {
    if (bannerText) setEditingBannerText(bannerText);
  }, [bannerText]);

  // Footer editor state
  const [editingFooter, setEditingFooter] = useState({
    email: footerInfo?.email || "littlesunbeamkidswear@gmail.com",
    phone: footerInfo?.phone || "+91 93615 03943",
    address: footerInfo?.address || "1/95m Bandari Nagar, Veerapandi, Tirupur, Tamil Nadu - 641605",
  });
  useEffect(() => {
    if (footerInfo) {
      setEditingFooter({
        email: footerInfo.email || "littlesunbeamkidswear@gmail.com",
        phone: footerInfo.phone || "+91 93615 03943",
        address: footerInfo.address || "1/95m Bandari Nagar, Veerapandi, Tirupur, Tamil Nadu - 641605",
      });
    }
  }, [footerInfo]);

  // Hero Banner Slides editor state
  const [editingBanners, setEditingBanners] = useState(() =>
    heroBanners && heroBanners.length > 0
      ? JSON.parse(JSON.stringify(heroBanners))
      : []
  );
  const [selectedSlideIdx, setSelectedSlideIdx] = useState(0);
  useEffect(() => {
    if (heroBanners && heroBanners.length > 0) {
      setEditingBanners(JSON.parse(JSON.stringify(heroBanners)));
    }
  }, [heroBanners]);

  const updateSlide = (idx, field, value) => {
    setEditingBanners((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addSlide = () => {
    const newSlide = {
      id: Date.now(),
      badge: "New",
      heading: "New Slide Heading",
      subtext: "Add your promotional text here.",
      primaryBtnLabel: "Shop Now",
      primaryBtnTo: "/shop",
      secondaryBtnLabel: "",
      secondaryBtnTo: "/shop",
      image: "/src/assets/hero-baby.jpg",
      imageAlt: "Banner image",
      bgColor: "",
    };
    setEditingBanners((prev) => {
      const next = [...prev, newSlide];
      setSelectedSlideIdx(next.length - 1);
      return next;
    });
  };

  const removeSlide = (idx) => {
    setEditingBanners((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setSelectedSlideIdx(Math.max(0, idx - 1));
      return next;
    });
  };

  const saveHeroBanners = () => {
    if (setHeroBanners) setHeroBanners(editingBanners);
    showNotification("Hero banner slides saved and updated live!");
  };

  // Auth State
  const [auth, setAuth] = useState(() => getAdminAuth());
  const [loginEmail, setLoginEmail] = useState("admin@littlesunbeam.com");
  const [loginPass, setLoginPass] = useState("Admin@123456");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Navigation Tab
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | products | orders | categories | users

  // Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [notification, setNotification] = useState(null);

  // Upload States
  const [productImageUploading, setProductImageUploading] = useState(false);
  const [categoryImageUploading, setCategoryImageUploading] = useState(false);
  const productFileInputRef = useRef(null);
  const categoryFileInputRef = useRef(null);

  // Filters & Search
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("All");
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerRoleFilter, setCustomerRoleFilter] = useState("All");
  const [customerAddressFilter, setCustomerAddressFilter] = useState("All");

  // Modal States
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orderDetailModalOpen, setOrderDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [copiedAddressId, setCopiedAddressId] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ open: false, product: null });

  // Category Modal State
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    image: "",
    subCategories: [],
    order: 1,
  });
  const [inlineSubName, setInlineSubName] = useState("");

  // Subcategory Management Modal & States
  const [subCategoryModalOpen, setSubCategoryModalOpen] = useState(false);
  const [subCategoryParentCat, setSubCategoryParentCat] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [subCategoryForm, setSubCategoryForm] = useState({
    name: "",
    description: "",
    image: "",
    order: 1,
  });
  const [subCategoryFilterParent, setSubCategoryFilterParent] = useState("All");
  const [subCategorySearch, setSubCategorySearch] = useState("");

  const allSubCategories = useMemo(() => {
    const list = [];
    (categoriesList || []).forEach((cat) => {
      (cat.subCategories || []).forEach((sub) => {
        const subObj = typeof sub === "string" ? { name: sub, slug: sub.toLowerCase().replace(/\s+/g, "-") } : sub;
        list.push({
          ...subObj,
          parentCategory: cat,
          parentCatId: cat._id || cat.id || cat.slug,
          parentCatName: cat.name,
        });
      });
    });
    return list;
  }, [categoriesList]);

  const filteredSubCategories = useMemo(() => {
    return allSubCategories.filter((sub) => {
      const matchParent =
        subCategoryFilterParent === "All" ||
        String(sub.parentCatId) === subCategoryFilterParent ||
        sub.parentCatName?.toLowerCase() === subCategoryFilterParent.toLowerCase();
      const matchSearch =
        !subCategorySearch ||
        sub.name?.toLowerCase().includes(subCategorySearch.toLowerCase()) ||
        sub.parentCatName?.toLowerCase().includes(subCategorySearch.toLowerCase());
      return matchParent && matchSearch;
    });
  }, [allSubCategories, subCategoryFilterParent, subCategorySearch]);

  // Product Modal Active Tab & Error State
  const [productModalTab, setProductModalTab] = useState("basic"); // basic | clothing | pricing | images | variants | extra
  const [formError, setFormError] = useState("");
  const [formErrorTarget, setFormErrorTarget] = useState({ tab: "basic", fieldId: "input-product-name", tabLabel: "Basic Info" });
  const [productSaving, setProductSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null); // 'main' | 'front' | 'back' | 'side' | 'model' | 'additional'

  // Helper to jump and focus directly on the error section/input
  const goToErrorSection = (tab, fieldId) => {
    if (tab) setProductModalTab(tab);
    setTimeout(() => {
      if (fieldId) {
        const el = document.getElementById(fieldId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          if (typeof el.focus === "function") {
            try { el.focus(); } catch { }
          }
          el.classList.add("ring-4", "ring-rose-500", "border-rose-500", "animate-pulse");
          setTimeout(() => {
            el.classList.remove("ring-4", "ring-rose-500", "border-rose-500", "animate-pulse");
          }, 3500);
        }
      }
    }, 150);
  };

  const GENDERS = ["Boy", "Girl", "Unisex"];
  const AGE_GROUPS = [
    "Newborn",
    "0 - 3 Months",
    "3 - 6 Months",
    "6 - 12 Months",
    "1 - 2 Years",
    "2 - 3 Years",
    "3 - 4 Years",
    "4 - 5 Years",
    "5 - 6 Years",
  ];
  const AVAILABLE_SIZES = [
    "Newborn",
    "0 - 3 Months",
    "3 - 6 Months",
    "6 - 12 Months",
    "1 - 2 Years",
    "2 - 3 Years",
    "3 - 4 Years",
    "4 - 5 Years",
    "5 - 6 Years",
  ];
  const POPULAR_COLORS = [
    { name: "Blue", hex: "#3B82F6" },
    { name: "Orange", hex: "#F97316" },
    { name: "Cream", hex: "#F5F2EB" },
    { name: "Soft Yellow", hex: "#FEF08A" },
    { name: "Baby Pink", hex: "#FBCFE8" },
    { name: "Mint Green", hex: "#A7F3D0" },
    { name: "Lavender", hex: "#E9D5FF" },
    { name: "Peach", hex: "#FFEDD5" },
    { name: "Pure White", hex: "#FFFFFF" },
    { name: "Warm Charcoal", hex: "#374151" },
  ];
  const SLEEVE_TYPES = ["", "Sleeveless", "Short Sleeve", "Long Sleeve", "Full Sleeve", "Half Sleeve", "Cap Sleeve", "Roll-up Sleeve"];
  const NECK_TYPES = ["", "Envelope Neck", "Round Neck", "Kimono / Wrap", "Henley", "Collar", "V-Neck", "Snap Button Neck"];
  const FIT_TYPES = ["", "Regular Fit", "Relaxed Fit", "Slim Fit", "Comfort Fit", "Loose Fit"];
  const SEASONS = ["", "All Season", "Summer", "Winter", "Spring", "Monsoon / Autumn"];
  const PRODUCT_STATUSES = ["Active", "Draft", "Out of Stock", "Archived"];

  const calcDiscount = (price, mrp) => {
    const p = Number(price);
    const m = Number(mrp);
    if (m > p && m > 0) {
      return Math.round(((m - p) / m) * 100);
    }
    return 0;
  };

  const getStockStatus = (stock, threshold = 10) => {
    const s = Number(stock);
    const t = Number(threshold);
    if (isNaN(s) || s <= 0) return "Out of Stock";
    if (s <= t) return "Low Stock";
    return "In Stock";
  };

  // Product Form State with Color-based Variant & Size Inventory Architecture
  const createInitialProductForm = () => {
    const initialCat = categoriesList[0]?.name?.toLowerCase() || categoriesList[0]?.id || "hospital";
    const initialSku = `SUN-${initialCat.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    return {
      name: "",
      sku: initialSku,
      brand: "Little Sunbeam",
      category: initialCat,
      categoryId: categoriesList[0]?._id ? String(categoriesList[0]._id) : "",
      subCategory: "",
      subCategoryId: "",
      description: "",
      details: "",
      gender: "Unisex",
      ageGroup: "0 - 3 Months",
      fabric: "100% GOTS Certified Organic Cotton",
      pattern: "",
      print: "",
      prints: [],
      sleeveType: "",
      neckType: "",
      fitType: "",
      season: "",
      price: "",
      mrp: "",
      discount: 0,
      gst: 5,
      lowStockThreshold: 10,
      stock: 0,
      stockStatus: "In Stock",
      image: "",
      gallery: [],
      // Color-based Product Variants (Color -> Images + Sizes + Size-wise Inventory)
      colorVariants: [
        {
          id: `cv-${Date.now()}-1`,
          name: "Blue",
          displayName: "Blue",
          hex: "#3B82F6",
          images: [],
          sizes: ["1 - 2 Years", "2 - 3 Years", "3 - 4 Years"],
          inventory: [
            { size: "1 - 2 Years", stock: 10, sku: `${initialSku}-BLU-12Y`, price: "", mrp: "" },
            { size: "2 - 3 Years", stock: 15, sku: `${initialSku}-BLU-23Y`, price: "", mrp: "" },
            { size: "3 - 4 Years", stock: 8, sku: `${initialSku}-BLU-34Y`, price: "", mrp: "" },
          ],
        },
      ],
      careInstructions: "Machine wash cold with gentle baby detergent. Do not bleach. Tumble dry low.",
      washCare: "Gentle Hand/Machine Wash",
      countryOfOrigin: "India",
      manufacturer: "Little Sunbeam Kidswear",
      productWeight: "150g",
      returnEligibility: "7-Day Return & Exchange Available",
      tags: "",
      badge: "New",
      status: "Active",
    };
  };

  const [productForm, setProductForm] = useState(createInitialProductForm);

  const showNotification = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch all admin data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dash, prodRes, catRes, ordRes, usrRes, printRes] = await Promise.all([
        adminService.getDashboard(),
        adminService.getProducts(),
        adminService.getCategories(),
        adminService.getOrders(),
        adminService.getUsers(),
        adminService.getPrints(),
      ]);

      setDashboardData(dash);
      setProductsList(prodRes.products || []);
      if (catRes?.categories && catRes.categories.length > 0) {
        setCategoriesList(catRes.categories);
      }
      if (printRes?.prints) {
        setPrints(printRes.prints, false);
      }
      setOrdersList(ordRes.orders || []);
      setUsersList(usrRes.users || []);
      setIsLiveBackend(Boolean(dash?.isLiveBackend || prodRes?.isLiveBackend));
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleAuthExpired = () => {
      setAuth(getAdminAuth());
      showNotification("Session expired. Please sign in again.", "error");
    };
    window.addEventListener("admin_auth_expired", handleAuthExpired);
    return () => window.removeEventListener("admin_auth_expired", handleAuthExpired);
  }, []);

  useEffect(() => {
    if (auth.isAuthenticated) {
      loadAllData();
    }
  }, [auth.isAuthenticated]);

  // Handle Admin Login
  const handleLogin = async (e) => {
    e?.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await adminService.login(loginEmail, loginPass);
      setAuth(getAdminAuth());
      showNotification(`Welcome back, ${res.user?.name || "Admin"}!`);
    } catch (err) {
      setAuthError(err.message || "Failed to authenticate as administrator.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminAuth();
    setAuth(getAdminAuth());
    showNotification("Logged out from admin console.", "info");
  };

  // --- COLOR-BASED VARIANT MANAGEMENT HANDLERS ---
  const handleAddColorVariant = () => {
    const nextIdx = (productForm.colorVariants?.length || 0) + 1;
    const parentSku = productForm.sku || "SUN-PROD";
    const availableColors = ["Orange", "Soft Yellow", "Baby Pink", "Mint Green", "Lavender", "Cream", "Pure White"];
    const chosenColor = availableColors[nextIdx % availableColors.length] || `Color ${nextIdx}`;
    const chosenHex = POPULAR_COLORS.find((c) => c.name === chosenColor)?.hex || "#F97316";
    const colorSlug = chosenColor.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "");

    const newCv = {
      id: `cv-${Date.now()}-${nextIdx}`,
      name: chosenColor,
      displayName: chosenColor,
      hex: chosenHex,
      images: [],
      sizes: ["1 - 2 Years", "2 - 3 Years"],
      inventory: [
        { size: "1 - 2 Years", stock: 10, sku: `${parentSku}-${colorSlug}-12Y`, price: "", mrp: "" },
        { size: "2 - 3 Years", stock: 10, sku: `${parentSku}-${colorSlug}-23Y`, price: "", mrp: "" },
      ],
    };

    setProductForm((prev) => ({
      ...prev,
      colorVariants: [...(prev.colorVariants || []), newCv],
    }));
    showNotification(`Added ${chosenColor} color variant!`);
  };

  const handleRemoveColorVariant = (cvIdx) => {
    if ((productForm.colorVariants?.length || 0) <= 1) {
      alert("At least one color variant is required for a baby clothing product.");
      return;
    }
    setProductForm((prev) => ({
      ...prev,
      colorVariants: prev.colorVariants.filter((_, i) => i !== cvIdx),
    }));
  };

  const handleColorVariantChange = (cvIdx, field, val) => {
    setProductForm((prev) => {
      const nextCvs = [...(prev.colorVariants || [])];
      nextCvs[cvIdx] = { ...nextCvs[cvIdx], [field]: val };
      if (field === "name") {
        // Auto-match hex if known
        const found = POPULAR_COLORS.find((c) => c.name.toLowerCase() === val.toLowerCase());
        if (found) nextCvs[cvIdx].hex = found.hex;
      }
      return { ...prev, colorVariants: nextCvs };
    });
  };

  // Upload image(s) for a specific color variant
  const handleColorVariantImageUpload = async (e, cvIdx) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
        alert("Invalid file format. Please upload JPG, PNG, or WEBP images.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit. Please upload smaller images.");
        return;
      }
    }

    setProductImageUploading(true);
    setUploadingSlot(`color-${cvIdx}`);
    try {
      for (const file of files) {
        const url = await adminService.uploadImage(file);
        setProductForm((prev) => {
          const nextCvs = [...(prev.colorVariants || [])];
          const targetCv = { ...nextCvs[cvIdx] };
          const existingImgs = targetCv.images || [];
          const isPrimary = existingImgs.length === 0; // First image uploaded is primary
          targetCv.images = [...existingImgs, { url, isPrimary }];
          nextCvs[cvIdx] = targetCv;

          // Also add to global gallery
          const nextGallery = Array.from(new Set([...(prev.gallery || []), url]));
          const nextMain = prev.image || url;
          return { ...prev, colorVariants: nextCvs, gallery: nextGallery, image: nextMain };
        });
      }
      showNotification(`Uploaded ${files.length} image(s) for this color!`);
    } catch (err) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setProductImageUploading(false);
      setUploadingSlot(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleSetPrimaryColorImage = (cvIdx, imgIdx) => {
    setProductForm((prev) => {
      const nextCvs = [...(prev.colorVariants || [])];
      const targetCv = { ...nextCvs[cvIdx] };
      const updatedImgs = (targetCv.images || []).map((img, i) => ({
        ...img,
        isPrimary: i === imgIdx,
      }));
      targetCv.images = updatedImgs;
      nextCvs[cvIdx] = targetCv;

      // Update primary image of parent if this is color 0
      const primaryUrl = updatedImgs[imgIdx]?.url;
      return {
        ...prev,
        colorVariants: nextCvs,
        image: primaryUrl || prev.image,
      };
    });
  };

  const handleRemoveColorVariantImage = (cvIdx, imgIdx) => {
    setProductForm((prev) => {
      const nextCvs = [...(prev.colorVariants || [])];
      const targetCv = { ...nextCvs[cvIdx] };
      let updatedImgs = (targetCv.images || []).filter((_, i) => i !== imgIdx);
      if (updatedImgs.length > 0 && !updatedImgs.some((img) => img.isPrimary)) {
        updatedImgs[0].isPrimary = true;
      }
      targetCv.images = updatedImgs;
      nextCvs[cvIdx] = targetCv;
      return { ...prev, colorVariants: nextCvs };
    });
  };

  const handleToggleSizeForColor = (cvIdx, size) => {
    setProductForm((prev) => {
      const nextCvs = [...(prev.colorVariants || [])];
      const targetCv = { ...nextCvs[cvIdx] };
      const currentSizes = targetCv.sizes || [];
      const isSelected = currentSizes.includes(size);
      const parentSku = prev.sku || "SUN-PROD";
      const colorSlug = (targetCv.name || "COL").substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "");
      const sizeSlug = size.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

      let nextSizes;
      let nextInventory;

      if (isSelected) {
        nextSizes = currentSizes.filter((s) => s !== size);
        nextInventory = (targetCv.inventory || []).filter((inv) => inv.size !== size);
      } else {
        nextSizes = [...currentSizes, size];
        const defaultStock = 10;
        nextInventory = [
          ...(targetCv.inventory || []),
          {
            size,
            stock: defaultStock,
            sku: `${parentSku}-${colorSlug}-${sizeSlug}`,
            price: "",
            mrp: "",
          },
        ];
      }

      targetCv.sizes = nextSizes;
      targetCv.inventory = nextInventory;
      nextCvs[cvIdx] = targetCv;
      return { ...prev, colorVariants: nextCvs };
    });
  };

  const handleUpdateSizeStock = (cvIdx, size, stockVal) => {
    setProductForm((prev) => {
      const nextCvs = [...(prev.colorVariants || [])];
      const targetCv = { ...nextCvs[cvIdx] };
      const nextInventory = (targetCv.inventory || []).map((inv) => {
        if (inv.size === size) {
          return { ...inv, stock: Math.max(0, parseInt(stockVal, 10) || 0) };
        }
        return inv;
      });
      targetCv.inventory = nextInventory;
      nextCvs[cvIdx] = targetCv;
      return { ...prev, colorVariants: nextCvs };
    });
  };

  const handleUpdateSizeSku = (cvIdx, size, skuVal) => {
    setProductForm((prev) => {
      const nextCvs = [...(prev.colorVariants || [])];
      const targetCv = { ...nextCvs[cvIdx] };
      const nextInventory = (targetCv.inventory || []).map((inv) => {
        if (inv.size === size) {
          return { ...inv, sku: skuVal.toUpperCase() };
        }
        return inv;
      });
      targetCv.inventory = nextInventory;
      nextCvs[cvIdx] = targetCv;
      return { ...prev, colorVariants: nextCvs };
    });
  };

  // Category Image Upload
  const handleCategoryImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCategoryImageUploading(true);
    try {
      const url = await adminService.uploadImage(file);
      setCategoryForm((prev) => ({ ...prev, image: url }));
      showNotification("Category image uploaded successfully!");
    } catch (err) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setCategoryImageUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  // Product Actions
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormError("");
    setProductModalTab("basic");
    setProductForm(createInitialProductForm());
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (p) => {
    setEditingProduct(p);
    setFormError("");
    setProductModalTab("basic");

    const existingPrints = Array.isArray(p.prints) && p.prints.length > 0
      ? p.prints.map((pr) => (typeof pr === "object" && pr !== null ? (pr._id || pr.id || pr.name) : String(pr)))
      : (p.print ? [p.print] : []);

    const rawImages = p.images || {};
    const mainImage = p.image || rawImages.main || (Array.isArray(p.gallery) ? p.gallery[0] : "") || "";

    const matchedCat = categoriesList.find(
      (c) =>
        (c.id && c.id.toLowerCase() === (p.category || "").toLowerCase()) ||
        (c.name && c.name.toLowerCase() === (p.category || "").toLowerCase()) ||
        (p.categoryId && String(c._id) === String(p.categoryId))
    );

    // Reconstruct or normalize colorVariants
    let loadedColorVariants = [];
    if (Array.isArray(p.colorVariants) && p.colorVariants.length > 0) {
      loadedColorVariants = p.colorVariants.map((cv, idx) => ({
        id: cv._id ? String(cv._id) : `cv-${Date.now()}-${idx}`,
        name: cv.name || "Default",
        displayName: cv.displayName || cv.name || "Default",
        hex: cv.hex || "#E5E7EB",
        images: Array.isArray(cv.images)
          ? cv.images.map((img, i) => (typeof img === "string" ? { url: img, isPrimary: i === 0 } : { url: img.url, isPrimary: Boolean(img.isPrimary) }))
          : [],
        sizes: Array.isArray(cv.sizes) && cv.sizes.length > 0 ? cv.sizes : (Array.isArray(cv.inventory) ? cv.inventory.map((inv) => inv.size) : ["0 - 3 Months"]),
        inventory: Array.isArray(cv.inventory)
          ? cv.inventory.map((inv) => ({
              size: inv.size || "Standard",
              stock: Number(inv.stock) || 0,
              sku: inv.sku || "",
              price: inv.price !== undefined ? inv.price : "",
              mrp: inv.mrp !== undefined ? inv.mrp : "",
            }))
          : [],
      }));
    } else {
      // Build from legacy product colors & variants
      const sourceColors = Array.isArray(p.colors) && p.colors.length > 0 ? p.colors : [{ name: "Default", hex: "#E5E7EB" }];
      const sourceSizes = Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ["0 - 3 Months", "3 - 6 Months", "6 - 12 Months"];
      const parentSku = p.sku || "SUN-PROD";

      loadedColorVariants = sourceColors.map((col, colIdx) => {
        const colorName = col.name || "Default";
        const colorSlug = colorName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "");

        const colorInventory = sourceSizes.map((sz) => {
          const matchedVariant = (p.variants || []).find(
            (v) => (v.color || "").toLowerCase() === colorName.toLowerCase() && (v.size || "").toLowerCase() === sz.toLowerCase()
          );
          const sizeSlug = sz.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

          return {
            size: sz,
            stock: matchedVariant ? Number(matchedVariant.stock) : Math.max(0, Math.floor((Number(p.stock) || 30) / sourceSizes.length)),
            sku: matchedVariant?.sku || `${parentSku}-${colorSlug}-${sizeSlug}`,
            price: matchedVariant?.price || "",
            mrp: matchedVariant?.mrp || "",
          };
        });

        const colorImgs = mainImage ? [{ url: mainImage, isPrimary: colIdx === 0 }] : [];

        return {
          id: `cv-${Date.now()}-${colIdx}`,
          name: colorName,
          displayName: colorName,
          hex: col.hex || "#E5E7EB",
          images: colorImgs,
          sizes: sourceSizes,
          inventory: colorInventory,
        };
      });
    }

    setProductForm({
      name: p.name || "",
      sku: p.sku || "",
      brand: p.brand || "Little Sunbeam",
      category: p.category || (matchedCat?.name?.toLowerCase() || "hospital"),
      categoryId: p.categoryId || (matchedCat?._id ? String(matchedCat._id) : ""),
      subCategory: p.subCategory || "",
      description: p.description || "",
      details: p.details || "",
      gender: p.gender || "Unisex",
      ageGroup: p.ageGroup || p.age || "0 - 3 Months",
      fabric: p.fabric || "",
      pattern: p.pattern || "",
      print: p.print || (existingPrints[0] || ""),
      prints: existingPrints,
      sleeveType: p.sleeveType || "",
      neckType: p.neckType || "",
      fitType: p.fitType || "",
      season: p.season || "",
      price: p.price !== undefined ? p.price : "",
      mrp: p.mrp !== undefined ? p.mrp : (p.price || ""),
      discount: p.discount || calcDiscount(p.price, p.mrp || p.price),
      gst: p.gst !== undefined ? p.gst : 5,
      stock: p.stock !== undefined ? p.stock : 0,
      lowStockThreshold: p.lowStockThreshold !== undefined ? p.lowStockThreshold : 10,
      stockStatus: p.stockStatus || getStockStatus(p.stock, p.lowStockThreshold),
      image: mainImage,
      gallery: Array.isArray(p.gallery) ? p.gallery : (mainImage ? [mainImage] : []),
      colorVariants: loadedColorVariants,
      careInstructions: p.careInstructions || "Machine wash cold with gentle baby detergent. Do not bleach. Tumble dry low.",
      washCare: p.washCare || "Gentle Hand/Machine Wash",
      countryOfOrigin: p.countryOfOrigin || "India",
      manufacturer: p.manufacturer || "Little Sunbeam Kidswear",
      productWeight: p.productWeight || "150g",
      returnEligibility: p.returnEligibility || "7-Day Return & Exchange Available",
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || ""),
      badge: p.badge || "",
      status: p.status || "Active",
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!productForm.name || !productForm.name.trim()) {
      setFormError("Product Name is required. Click here to fill in Basic Info.");
      setFormErrorTarget({ tab: "basic", fieldId: "input-product-name", tabLabel: "Basic Info" });
      goToErrorSection("basic", "input-product-name");
      return;
    }

    if (productForm.price === "" || isNaN(Number(productForm.price)) || Number(productForm.price) < 0) {
      setFormError("A valid positive Selling Price is required. Click here to fix in Pricing & Stock.");
      setFormErrorTarget({ tab: "pricing", fieldId: "input-product-price", tabLabel: "Pricing & Stock" });
      goToErrorSection("pricing", "input-product-price");
      return;
    }

    if (productForm.mrp !== "" && Number(productForm.mrp) < Number(productForm.price)) {
      setFormError("MRP cannot be lower than Selling Price. Click here to adjust in Pricing & Stock.");
      setFormErrorTarget({ tab: "pricing", fieldId: "input-product-mrp", tabLabel: "Pricing & Stock" });
      goToErrorSection("pricing", "input-product-mrp");
      return;
    }

    if (!productForm.category) {
      setFormError("Please select a Category. Click here to select in Basic Info.");
      setFormErrorTarget({ tab: "basic", fieldId: "input-product-category", tabLabel: "Basic Info" });
      goToErrorSection("basic", "input-product-category");
      return;
    }

    if (!productForm.description || !productForm.description.trim()) {
      setFormError("Product description is required. Click here to fill in Basic Info.");
      setFormErrorTarget({ tab: "basic", fieldId: "input-product-description", tabLabel: "Basic Info" });
      goToErrorSection("basic", "input-product-description");
      return;
    }

    if (!Array.isArray(productForm.colorVariants) || productForm.colorVariants.length === 0) {
      setFormError("Please add at least one Color Variant for this product. Click here to add in Colors & Variants.");
      setFormErrorTarget({ tab: "variants", fieldId: "section-product-variants", tabLabel: "Colors & Variants" });
      goToErrorSection("variants", "section-product-variants");
      return;
    }

    // Collect all color variant images
    const allColorImages = [];
    productForm.colorVariants.forEach((cv) => {
      (cv.images || []).forEach((img) => {
        const u = typeof img === "string" ? img : img.url;
        if (u && u.trim()) allColorImages.push(u.trim());
      });
    });

    const mainImage = productForm.image || allColorImages[0] || "";
    if (!mainImage) {
      setFormError("Please upload at least one image for a color variant. Click here to upload.");
      setFormErrorTarget({ tab: "variants", fieldId: "color-variant-upload-0", tabLabel: "Colors & Variants" });
      goToErrorSection("variants", "color-variant-upload-0");
      return;
    }

    // Compute total inventory from all color variants
    const totalCalculatedStock = productForm.colorVariants.reduce((sum, cv) => {
      const cvInv = Array.isArray(cv.inventory) ? cv.inventory : [];
      return sum + cvInv.reduce((iSum, inv) => iSum + (Math.max(0, parseInt(inv.stock, 10) || 0)), 0);
    }, 0);

    const uniqueGallery = Array.from(new Set([mainImage, ...allColorImages, ...(productForm.gallery || [])])).filter(Boolean);

    setProductSaving(true);
    try {
      const selectedCatObj = categoriesList.find((c) => {
        const cVal = (c.id || c.slug || c._id || c.name || "").toLowerCase();
        return cVal === (productForm.category || "").toLowerCase() || (productForm.categoryId && String(c._id) === String(productForm.categoryId));
      });

      const selectedSubCatObj = (selectedCatObj?.subCategories || []).find((s) => {
        if (typeof s === "string") return s.toLowerCase() === (productForm.subCategory || "").toLowerCase();
        return (
          (s._id && productForm.subCategoryId && String(s._id) === String(productForm.subCategoryId)) ||
          (s.name && s.name.toLowerCase() === (productForm.subCategory || "").toLowerCase()) ||
          (s.slug && s.slug.toLowerCase() === (productForm.subCategory || "").toLowerCase())
        );
      });

      const payload = {
        ...productForm,
        name: productForm.name.trim(),
        price: Number(productForm.price),
        mrp: Number(productForm.mrp || productForm.price),
        discount: calcDiscount(productForm.price, productForm.mrp || productForm.price),
        gst: Number(productForm.gst || 5),
        stock: totalCalculatedStock,
        lowStockThreshold: Number(productForm.lowStockThreshold || 10),
        category: (selectedCatObj?.name || productForm.category || "").toLowerCase(),
        categoryId: selectedCatObj?._id || (productForm.categoryId || undefined),
        categoryPill: selectedCatObj?.name || productForm.category || "",
        subCategory: typeof selectedSubCatObj === "object" ? selectedSubCatObj.name : (productForm.subCategory ? productForm.subCategory.trim() : ""),
        subCategoryId: typeof selectedSubCatObj === "object" && selectedSubCatObj._id ? selectedSubCatObj._id : (productForm.subCategoryId || undefined),
        image: mainImage,
        gallery: uniqueGallery.length > 0 ? uniqueGallery : [mainImage],
        colorVariants: productForm.colorVariants,
        prints: Array.isArray(productForm.prints) ? productForm.prints : [],
        print: (productForm.prints && productForm.prints.length > 0 ? String(productForm.prints[0]) : productForm.print) || "",
        sleeveType: productForm.sleeveType ? productForm.sleeveType.trim() : "",
        neckType: productForm.neckType ? productForm.neckType.trim() : "",
        fitType: productForm.fitType ? productForm.fitType.trim() : "",
        season: productForm.season ? productForm.season.trim() : "",
        fabric: productForm.fabric ? productForm.fabric.trim() : "",
        pattern: productForm.pattern ? productForm.pattern.trim() : "",
        tags: Array.isArray(productForm.tags)
          ? productForm.tags
          : typeof productForm.tags === "string"
            ? productForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
            : [],
      };

      if (editingProduct) {
        const prodId = editingProduct._id || editingProduct.id;
        await adminService.updateProduct(prodId, payload);
        showNotification("Product updated successfully!");
      } else {
        await adminService.createProduct(payload);
        showNotification("New baby clothing product created successfully!");
      }

      setProductModalOpen(false);
      await loadAllData();
      if (refreshProducts) await refreshProducts();
    } catch (err) {
      const errMsg = err.message || "Failed to save product. Please check the entered data.";
      setFormError(errMsg);
      if (errMsg.toLowerCase().includes("price") || errMsg.toLowerCase().includes("mrp") || errMsg.toLowerCase().includes("stock")) {
        setFormErrorTarget({ tab: "pricing", fieldId: "input-product-price", tabLabel: "Pricing & Stock" });
        goToErrorSection("pricing", "input-product-price");
      } else if (errMsg.toLowerCase().includes("variant") || errMsg.toLowerCase().includes("color") || errMsg.toLowerCase().includes("image")) {
        setFormErrorTarget({ tab: "variants", fieldId: "section-product-variants", tabLabel: "Colors & Variants" });
        goToErrorSection("variants", "section-product-variants");
      } else {
        setFormErrorTarget({ tab: "basic", fieldId: "input-product-name", tabLabel: "Basic Info" });
        goToErrorSection("basic", "input-product-name");
      }
    } finally {
      setProductSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirmModal.product) return;
    try {
      const prodId = deleteConfirmModal.product._id || deleteConfirmModal.product.id;
      await adminService.deleteProduct(prodId);
      showNotification("Product removed successfully!");
      setDeleteConfirmModal({ open: false, product: null });
      await loadAllData();
      if (refreshProducts) await refreshProducts();
    } catch (err) {
      alert(err.message || "Failed to delete product");
    }
  };

  // --- Category & Subcategory Actions ---
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80",
      subCategories: [],
      order: categoriesList.length + 1,
    });
    setInlineSubName("");
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name || "",
      description: cat.description || "",
      image: cat.image || "",
      subCategories: Array.isArray(cat.subCategories) ? [...cat.subCategories] : [],
      order: cat.order !== undefined ? cat.order : 1,
    });
    setInlineSubName("");
    setCategoryModalOpen(true);
  };

  const handleAddInlineSubCategory = () => {
    const trimmed = inlineSubName.trim();
    if (!trimmed) return;
    const exists = (categoryForm.subCategories || []).some(
      (s) => (typeof s === "string" ? s : s.name).toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      alert("This subcategory already exists in this category.");
      return;
    }
    setCategoryForm({
      ...categoryForm,
      subCategories: [
        ...(categoryForm.subCategories || []),
        {
          name: trimmed,
          slug: trimmed.toLowerCase().replace(/\s+/g, "-"),
          isActive: true,
          order: (categoryForm.subCategories?.length || 0) + 1,
        },
      ],
    });
    setInlineSubName("");
  };

  const handleRemoveInlineSubCategory = (idxToRemove) => {
    setCategoryForm({
      ...categoryForm,
      subCategories: (categoryForm.subCategories || []).filter((_, idx) => idx !== idxToRemove),
    });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.name.trim()) {
      alert("Please enter a category name");
      return;
    }

    try {
      if (editingCategory) {
        const catId = editingCategory._id || editingCategory.id || editingCategory.slug;
        await adminService.updateCategory(catId, categoryForm);
        showNotification("Category updated successfully!");
      } else {
        await adminService.createCategory(categoryForm);
        showNotification("New category created successfully!");
      }
      setCategoryModalOpen(false);
      await loadAllData();
      if (refreshCategories) await refreshCategories();
      if (refreshProducts) await refreshProducts();
    } catch (err) {
      alert(err.message || "Failed to save category");
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}" and all its subcategories?`)) return;
    try {
      const catId = cat._id || cat.id || cat.slug;
      await adminService.deleteCategory(catId);
      showNotification("Category deleted successfully!");
      await loadAllData();
      if (refreshCategories) await refreshCategories();
      if (refreshProducts) await refreshProducts();
    } catch (err) {
      alert(err.message || "Failed to delete category");
    }
  };

  // Subcategory Standalone Actions
  const handleOpenAddSubCategory = (parentCat = null) => {
    const targetCat = parentCat || categoriesList[0] || null;
    setSubCategoryParentCat(targetCat);
    setEditingSubCategory(null);
    setSubCategoryForm({
      name: "",
      description: "",
      image: "",
      order: (targetCat?.subCategories?.length || 0) + 1,
    });
    setSubCategoryModalOpen(true);
  };

  const handleOpenEditSubCategory = (parentCat, sub) => {
    setSubCategoryParentCat(parentCat);
    setEditingSubCategory(sub);
    setSubCategoryForm({
      name: typeof sub === "string" ? sub : sub.name || "",
      description: typeof sub === "object" ? sub.description || "" : "",
      image: typeof sub === "object" ? sub.image || "" : "",
      order: typeof sub === "object" && sub.order !== undefined ? sub.order : 1,
    });
    setSubCategoryModalOpen(true);
  };

  const handleSaveSubCategory = async (e) => {
    e.preventDefault();
    if (!subCategoryForm.name || !subCategoryForm.name.trim()) {
      alert("Please enter a subcategory name");
      return;
    }
    if (!subCategoryParentCat) {
      alert("Please select a parent category");
      return;
    }

    try {
      const catId = subCategoryParentCat._id || subCategoryParentCat.id || subCategoryParentCat.slug;
      if (editingSubCategory) {
        const subId =
          typeof editingSubCategory === "object" && editingSubCategory._id
            ? editingSubCategory._id
            : typeof editingSubCategory === "string"
            ? editingSubCategory
            : editingSubCategory.name;
        await adminService.updateSubCategory(catId, subId, subCategoryForm);
        showNotification(`Subcategory "${subCategoryForm.name}" updated successfully!`);
      } else {
        await adminService.addSubCategory(catId, subCategoryForm);
        showNotification(`Subcategory "${subCategoryForm.name}" added to "${subCategoryParentCat.name}"!`);
      }
      setSubCategoryModalOpen(false);
      await loadAllData();
      if (refreshCategories) await refreshCategories();
      if (refreshProducts) await refreshProducts();
    } catch (err) {
      alert(err.message || "Failed to save subcategory");
    }
  };

  const handleDeleteSubCategory = async (parentCat, sub) => {
    const subName = typeof sub === "string" ? sub : sub.name;
    const subId = typeof sub === "object" && sub._id ? sub._id : typeof sub === "string" ? sub : sub.name;
    if (!window.confirm(`Are you sure you want to delete subcategory "${subName}" from "${parentCat.name}"?`)) return;

    try {
      const catId = parentCat._id || parentCat.id || parentCat.slug;
      await adminService.deleteSubCategory(catId, subId);
      showNotification(`Subcategory "${subName}" removed successfully!`);
      await loadAllData();
      if (refreshCategories) await refreshCategories();
      if (refreshProducts) await refreshProducts();
    } catch (err) {
      alert(err.message || "Failed to delete subcategory");
    }
  };

  // --- Order Actions ---
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await adminService.updateOrderStatus(orderId, { orderStatus: newStatus });
      showNotification(`Order status updated to "${newStatus}"`);
      if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.orderNumber === orderId)) {
        setSelectedOrder((prev) => ({ ...prev, orderStatus: newStatus }));
      }
      loadAllData();
    } catch (err) {
      alert(err.message || "Failed to update order status");
    }
  };

  const handleUpdatePaymentStatus = async (orderId, newPaymentStatus) => {
    try {
      await adminService.updateOrderStatus(orderId, { paymentStatus: newPaymentStatus });
      showNotification(`Payment status marked as "${newPaymentStatus}"`);
      if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.orderNumber === orderId)) {
        setSelectedOrder((prev) => ({ ...prev, paymentStatus: newPaymentStatus }));
      }
      loadAllData();
    } catch (err) {
      alert(err.message || "Failed to update payment status");
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      const matchSearch =
        !productSearch.trim() ||
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category?.toLowerCase().includes(productSearch.toLowerCase());

      const matchCat =
        productCategoryFilter === "All" ||
        p.category?.toLowerCase() === productCategoryFilter.toLowerCase();

      return matchSearch && matchCat;
    });
  }, [productsList, productSearch, productCategoryFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return ordersList.filter((o) => {
      const matchStatus =
        orderStatusFilter === "All" || o.orderStatus?.toLowerCase() === orderStatusFilter.toLowerCase();

      const matchSearch =
        !orderSearch.trim() ||
        o.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.user?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.shippingAddress?.name?.toLowerCase().includes(orderSearch.toLowerCase());

      return matchStatus && matchSearch;
    });
  }, [ordersList, orderStatusFilter, orderSearch]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return usersList.filter((u) => {
      const matchRole =
        customerRoleFilter === "All" ||
        u.role?.toLowerCase() === customerRoleFilter.toLowerCase();

      const addr = u.shippingAddress || u.address || {};
      const hasAddr = Boolean(
        addr.street ||
        addr.address ||
        addr.city ||
        addr.pincode
      );

      const matchAddress =
        customerAddressFilter === "All" ||
        (customerAddressFilter === "with_address" && hasAddr) ||
        (customerAddressFilter === "no_address" && !hasAddr);

      const s = customerSearch.trim().toLowerCase();
      const matchSearch =
        !s ||
        u.name?.toLowerCase().includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.phone?.toLowerCase().includes(s) ||
        addr.street?.toLowerCase().includes(s) ||
        addr.address?.toLowerCase().includes(s) ||
        addr.city?.toLowerCase().includes(s) ||
        addr.state?.toLowerCase().includes(s) ||
        addr.pincode?.toLowerCase().includes(s);

      return matchRole && matchAddress && matchSearch;
    });
  }, [usersList, customerSearch, customerRoleFilter, customerAddressFilter]);

  // Helper to copy complete formatted address to clipboard
  const copyAddressToClipboard = (customerObj, idKey) => {
    const addr = customerObj?.shippingAddress || customerObj?.address || {};
    const name = addr.name || customerObj?.name || "";
    const phone = addr.phone || customerObj?.phone || "";
    const email = addr.email || customerObj?.email || "";
    const street = addr.street || addr.address || "";
    const city = addr.city || "";
    const state = addr.state || "";
    const pincode = addr.pincode || "";
    const country = addr.country || "India";

    const formatted = [
      name ? `Name: ${name}` : "",
      phone ? `Phone: ${phone}` : "",
      email ? `Email: ${email}` : "",
      street ? `Address: ${street}` : "",
      city || state || pincode ? `City/State/PIN: ${[city, state, pincode].filter(Boolean).join(", ")}` : "",
      country ? `Country: ${country}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (!formatted) {
      showNotification("No address details to copy", "error");
      return;
    }

    navigator.clipboard.writeText(formatted).then(() => {
      setCopiedAddressId(idKey || customerObj._id || customerObj.email);
      showNotification("Complete Shipping Address copied to clipboard!");
      setTimeout(() => setCopiedAddressId(null), 2500);
    });
  };

  // ─── EXPORT & INVOICE HANDLERS ──────────────────────────────────────────
  const [exportOrdersMenuOpen, setExportOrdersMenuOpen] = useState(false);
  const [exportCustomersMenuOpen, setExportCustomersMenuOpen] = useState(false);

  const handleExportOrders = async (format = "excel") => {
    try {
      const listToExport = filteredOrders.length > 0 ? filteredOrders : ordersList;
      if (!listToExport || listToExport.length === 0) {
        showNotification("No orders found to export", "error");
        return;
      }
      const filterLabel = orderStatusFilter !== "All" ? `${orderStatusFilter} Orders` : "All Orders";
      if (format === "excel") {
        exportOrdersToExcel(
          listToExport,
          `little_sunbeam_orders_${orderStatusFilter.toLowerCase()}_${Date.now()}.xlsx`
        );
        showNotification(`Exported ${listToExport.length} order(s) to Excel (.xlsx)!`);
      } else {
        await exportOrdersToPdf(listToExport, filterLabel, footerInfo);
        showNotification(`Exported ${listToExport.length} order(s) to PDF report!`);
      }
      setExportOrdersMenuOpen(false);
    } catch (err) {
      showNotification(err.message || "Failed to export orders", "error");
    }
  };

  const handleExportCustomers = async (format = "excel") => {
    try {
      const listToExport = filteredCustomers.length > 0 ? filteredCustomers : usersList;
      if (!listToExport || listToExport.length === 0) {
        showNotification("No customers found to export", "error");
        return;
      }
      if (format === "excel") {
        exportCustomersToExcel(listToExport, `little_sunbeam_customers_${Date.now()}.xlsx`);
        showNotification(`Exported ${listToExport.length} customer(s) to Excel (.xlsx)!`);
      } else {
        await exportCustomersToPdf(listToExport, footerInfo);
        showNotification(`Exported ${listToExport.length} customer(s) to PDF report!`);
      }
      setExportCustomersMenuOpen(false);
    } catch (err) {
      showNotification(err.message || "Failed to export customers", "error");
    }
  };

  const handleViewInvoice = (order) => {
    if (!order) return;
    setInvoiceOrder(order);
    setInvoiceModalOpen(true);
  };

  const handleDownloadInvoice = async (order) => {
    try {
      await generateInvoicePdf(order, footerInfo);
      showNotification(`Tax Invoice PDF downloaded for #${order.orderNumber || ""}`);
    } catch (err) {
      showNotification(err.message || "Failed to generate invoice PDF", "error");
    }
  };

  const handlePrintInvoice = (order) => {
    try {
      printInvoice(order, footerInfo);
    } catch (err) {
      showNotification(err.message || "Failed to print invoice", "error");
    }
  };

  // ─── AUTHENTICATION GATE ──────────────────────────────────────────────────
  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50/60 via-background to-orange-50/40 p-4">
        <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Admin Portal Access</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with your Little Sunbeam administrator credentials to manage products, orders, and sales.
            </p>
          </div>

          {authError && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@littlesunbeam.com"
                className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-50"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Sign In to Admin Console
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Preset Button */}
          <div className="mt-6 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => {
                setLoginEmail("admin@littlesunbeam.com");
                setLoginPass("Admin@123456");
                handleLogin();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/10"
            >
              <Sparkles className="h-4 w-4" /> 1-Click Fill & Instant Demo Admin Login
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground">
              <Store className="h-3.5 w-3.5" /> Return to Customer Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── ADMIN DASHBOARD SHELL ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex overflow-hidden">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-xl transition-all animate-in fade-in slide-in-from-bottom-5 ${notification.type === "success"
            ? "bg-emerald-600 text-white"
            : notification.type === "info"
              ? "bg-blue-600 text-white"
              : "bg-destructive text-white"
            }`}
        >
          <CheckCheck className="h-4 w-4" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/80 bg-card/95 backdrop-blur-md z-40">
        <div className="p-4 border-b border-border/80">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-black text-primary-foreground shadow-sm">
              ☀️
            </div>
            <div>
              <span className="text-base font-black tracking-tight block">Little Sunbeam</span>
              <span className="mt-0.5 block w-max rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Admin Console
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "banner", label: "Banner & Footer", icon: Megaphone },
            { id: "products", label: "Products", count: productsList.length, icon: Package },
            { id: "orders", label: "Orders", count: ordersList.length, icon: ShoppingBag },
            { id: "categories", label: "Categories", icon: FolderTree },
            { id: "users", label: "Customers", count: usersList.length, icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition ${active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-border/80 space-y-3">
          <div
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold border ${isLiveBackend
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}
            title={
              isLiveBackend
                ? "Connected to live Express & MongoDB Backend at http://localhost:5000"
                : "Using local sync state with real-time fallbacks"
            }
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className={`h-2.5 w-2.5 rounded-full shrink-0 ${isLiveBackend ? "bg-emerald-500 animate-pulse ring-2 ring-emerald-400/30" : "bg-amber-500"
                  }`}
              />
              <span className="truncate">{isLiveBackend ? "Live Sync Active" : "Demo Sync Active"}</span>
            </div>
            <button
              onClick={loadAllData}
              title="Refresh connection status & data"
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition text-[10px]"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          <Link
            to="/"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold hover:bg-muted transition"
          >
            <Store className="h-3.5 w-3.5" /> View Store
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-muted/60 px-3.5 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Mobile/Header Bar */}
        <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur-md">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 md:hidden">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary font-black text-primary-foreground shadow-sm">
                ☀️
              </div>
              <span className="text-sm font-black tracking-tight">Admin Console</span>
            </div>

            {/* Mobile Navigation Dropdown */}
            <div className="flex items-center gap-3 md:hidden">
              <select
                className="rounded-xl border border-border bg-card px-2 py-1.5 text-sm font-bold"
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
              >
                <option value="dashboard">Dashboard</option>
                <option value="banner">Banner & Footer</option>
                <option value="products">Products</option>
                <option value="orders">Orders</option>
                <option value="categories">Categories</option>
                <option value="users">Customers</option>
              </select>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={loadAllData}
                disabled={loading}
                className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                title="Refresh Data"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl bg-muted/60 px-2 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition md:hidden"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* 1. DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                {/* Quick Top Banner Announcement Control */}
                <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Megaphone className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Live Storefront Top Banner
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Green animated header banner active across all pages
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("banner")}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 px-3 py-1 text-xs font-bold text-primary transition self-start sm:self-auto"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit Banner Text
                    </button>
                  </div>

                  {/* Live interactive mini-banner */}
                  <div className="mt-3 relative overflow-hidden rounded-xl bg-primary py-2 px-4 text-center text-xs font-medium text-primary-foreground select-none shadow-xs">
                    {[
                      { emoji: "👶", dur: 18, delay: -0 },
                      { emoji: "🍼", dur: 16, delay: -3 },
                      { emoji: "👕", dur: 20, delay: -6 },
                      { emoji: "🧸", dur: 15, delay: -9 },
                      { emoji: "👗", dur: 19, delay: -12 },
                      { emoji: "🌟", dur: 21, delay: -15 },
                    ].map((item, idx) => (
                      <span
                        key={idx}
                        className="banner-item-drifter"
                        style={{
                          animationDuration: `${item.dur}s`,
                          animationDelay: `${item.delay}s`,
                        }}
                      >
                        {item.emoji}
                      </span>
                    ))}
                    <div className="relative z-20 flex items-center justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-0.5 shadow-xs ring-1 ring-white/15">
                        <span className="text-amber-200">✨</span>
                        <span className="font-extrabold tracking-wide drop-shadow-xs">{bannerText}</span>
                        <span className="text-amber-200">✨</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI Metric Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Total Revenue
                      </span>
                      <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600">
                        <IndianRupee className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-black">
                      ₹{dashboardData?.summary?.totalSales?.toLocaleString("en-IN") || "7,442"}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>+18.4% this week</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Total Orders
                      </span>
                      <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-black">
                      {dashboardData?.summary?.totalOrders || ordersList.length}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-bold text-amber-600">
                        {dashboardData?.summary?.pendingOrders || 1} Pending
                      </span>
                      <span>•</span>
                      <span className="font-bold text-emerald-600">
                        {dashboardData?.summary?.deliveredOrders || 1} Delivered
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Active Products
                      </span>
                      <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600">
                        <Boxes className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-black">
                      {dashboardData?.summary?.totalProducts || productsList.length}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-muted-foreground">
                      {dashboardData?.lowStockProducts?.length || 2} items low stock
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Registered Users
                      </span>
                      <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="mt-3 text-2xl font-black">
                      {dashboardData?.summary?.totalUsers || usersList.length || 48}
                    </div>
                    <div className="mt-2 text-xs font-semibold text-muted-foreground">
                      98.2% customer satisfaction
                    </div>
                  </div>
                </div>

                {/* Sales Trend Chart & Status Distribution */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* 7-Day Revenue Trend */}
                  <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-extrabold">Sales Revenue Performance</h2>
                        <p className="text-xs text-muted-foreground">
                          Daily order revenue trajectory (Last 7 Days)
                        </p>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        Live Trend
                      </span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dashboardData?.salesTrends || []}>
                          <defs>
                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis dataKey="day" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                          <Tooltip
                            formatter={(val) => [`₹${val}`, "Revenue"]}
                            contentStyle={{
                              backgroundColor: "#18181b",
                              color: "#fff",
                              borderRadius: "12px",
                              border: "none",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="sales"
                            stroke="#f59e0b"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#salesGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Order Status Breakdown */}
                  <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                    <h2 className="text-base font-extrabold">Order Status Breakdown</h2>
                    <p className="text-xs text-muted-foreground">Current pipeline overview</p>

                    <div className="mt-5 space-y-3">
                      {[
                        {
                          label: "Pending Verification",
                          count: dashboardData?.summary?.pendingOrders || 1,
                          color: "bg-amber-500",
                        },
                        {
                          label: "Processing / Packaging",
                          count: dashboardData?.summary?.processingOrders || 1,
                          color: "bg-blue-500",
                        },
                        {
                          label: "Shipped & In-Transit",
                          count: dashboardData?.summary?.shippedOrders || 1,
                          color: "bg-indigo-500",
                        },
                        {
                          label: "Delivered",
                          count: dashboardData?.summary?.deliveredOrders || 1,
                          color: "bg-emerald-500",
                        },
                        {
                          label: "Cancelled",
                          count: dashboardData?.summary?.cancelledOrders || 0,
                          color: "bg-rose-500",
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="flex items-center justify-between rounded-xl bg-muted/40 p-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                            <span className="text-xs font-bold text-foreground">{s.label}</span>
                          </div>
                          <span className="text-sm font-black">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Orders & Low Stock Alerts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Recent Orders */}
                  <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-base font-extrabold">Recent Orders</h2>
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        View All
                      </button>
                    </div>

                    <div className="divide-y divide-border">
                      {(ordersList || []).slice(0, 4).map((ord) => (
                        <div key={ord._id || ord.orderNumber} className="flex items-center justify-between py-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{ord.orderNumber}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${ord.orderStatus === "Delivered"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : ord.orderStatus === "Shipped"
                                    ? "bg-blue-500/10 text-blue-600"
                                    : "bg-amber-500/10 text-amber-600"
                                  }`}
                              >
                                {ord.orderStatus}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {ord.user?.name || ord.shippingAddress?.name} • ₹{ord.totalAmount}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setOrderDetailModalOpen(true);
                            }}
                            className="rounded-lg border border-border px-3 py-1 text-xs font-bold hover:bg-muted"
                          >
                            Details
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Low Stock Alerts */}
                  <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-base font-extrabold flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" /> Low Stock Inventory
                      </h2>
                      <button
                        onClick={() => setActiveTab("products")}
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        Manage Stock
                      </button>
                    </div>

                    <div className="divide-y divide-border">
                      {productsList.filter((p) => (p.stock !== undefined ? p.stock <= 30 : false)).slice(0, 4).map((prod) => (
                        <div key={prod._id || prod.id} className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="h-10 w-10 rounded-lg object-cover border border-border"
                            />
                            <div>
                              <p className="text-xs font-bold line-clamp-1">{prod.name}</p>
                              <p className="text-[11px] text-muted-foreground">SKU: {prod.sku}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-extrabold text-amber-600">
                              {prod.stock} left
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PRODUCTS MANAGEMENT TAB */}
            {activeTab === "products" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-black">Products Management</h1>
                    <p className="text-xs text-muted-foreground">
                      Add, update prices, manage stock quantities, and categorize baby clothing.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenAddProduct}
                    className="flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition"
                  >
                    <Plus className="h-4 w-4" /> Add New Product
                  </button>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search products by name, SKU, category..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/30 py-2 pl-9 pr-4 text-xs outline-none focus:border-primary"
                    />
                  </div>

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs font-bold outline-none"
                  >
                    <option value="All">All Categories ({productsList.length})</option>
                    {categoriesList.map((c) => {
                      const count = productsList.filter(
                        (p) => (p.category || "").toLowerCase() === (c.name || c.id || "").toLowerCase()
                      ).length;
                      return (
                        <option key={c._id || c.id || c.name} value={c.name || c.id}>
                          {c.name} {count > 0 ? `(${count})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Products Table */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3">Product Info</th>
                          <th className="px-4 py-3">Category &amp; Subcategory</th>
                          <th className="px-4 py-3">Specs</th>
                          <th className="px-4 py-3">Price &amp; MRP</th>
                          <th className="px-4 py-3">Stock &amp; Status</th>
                          <th className="px-4 py-3">Variants</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {filteredProducts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-xs text-muted-foreground">
                              No baby clothing products found matching your search and filter criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredProducts.map((p) => {
                            const discount = p.discount || (p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);
                            const stockCount = p.stock !== undefined ? p.stock : 0;
                            const stockStatus = p.stockStatus || (stockCount <= 0 ? "Out of Stock" : (stockCount <= 10 ? "Low Stock" : "In Stock"));

                            return (
                              <tr key={p._id || p.id} className="hover:bg-muted/20 transition">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    {p.image ? (
                                      <img
                                        src={p.image}
                                        alt={p.name}
                                        className="h-12 w-12 rounded-xl object-cover border border-border shrink-0 bg-background"
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                          e.target.parentElement.innerHTML = '<div class="h-12 w-12 rounded-xl bg-muted/60 grid place-items-center text-xs font-bold text-muted-foreground border border-border">📦</div>';
                                        }}
                                      />
                                    ) : (
                                      <div className="h-12 w-12 rounded-xl bg-muted/60 grid place-items-center text-xs font-bold text-muted-foreground border border-border shrink-0">
                                        📦
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-foreground line-clamp-1">{p.name}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[11px] font-mono text-muted-foreground">{p.sku || "NO-SKU"}</span>
                                        {p.badge && (
                                          <span className="rounded-full bg-primary/10 px-2 py-0.2 text-[9px] font-black text-primary uppercase">
                                            {p.badge}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="space-y-0.5">
                                    <span className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold capitalize">
                                      {p.category}
                                    </span>
                                    {p.subCategory && (
                                      <p className="text-[11px] text-muted-foreground font-medium pl-1">
                                        ↳ {p.subCategory}
                                      </p>
                                    )}
                                  </div>
                                </td>

                                <td className="px-4 py-3 text-xs">
                                  <div className="space-y-0.5 text-muted-foreground">
                                    <p className="font-semibold text-foreground">
                                      {p.gender || "Unisex"} • {p.ageGroup || p.age || "All Ages"}
                                    </p>
                                    <p className="text-[11px] truncate max-w-[140px]">
                                      {p.fabric || (Array.isArray(p.sizes) ? p.sizes.join(", ") : "Standard")}
                                    </p>
                                  </div>
                                </td>

                                <td className="px-4 py-3 font-semibold">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-foreground font-black">₹{p.price}</span>
                                    {p.mrp > p.price && (
                                      <span className="text-xs text-muted-foreground line-through">
                                        ₹{p.mrp}
                                      </span>
                                    )}
                                  </div>
                                  {discount > 0 && (
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                                      {discount}% OFF
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <span
                                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase ${stockStatus === "In Stock"
                                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                        : stockStatus === "Low Stock"
                                          ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                                          : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                                        }`}
                                    >
                                      {stockStatus} ({stockCount})
                                    </span>
                                    {p.status && p.status !== "Active" && (
                                      <p className="text-[10px] text-muted-foreground font-semibold">
                                        [{p.status}]
                                      </p>
                                    )}
                                  </div>
                                </td>

                                <td className="px-4 py-3">
                                  {Array.isArray(p.variants) && p.variants.length > 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[11px] font-bold text-foreground">
                                      <Boxes className="h-3 w-3 text-primary" />
                                      <span>{p.variants.length} Variants</span>
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </td>

                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenEditProduct(p)}
                                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                                      title="Edit Product"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmModal({ open: true, product: p })}
                                      className="rounded-lg p-1.5 text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition"
                                      title="Delete Product"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
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

            {/* 3. ORDERS MANAGEMENT TAB */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-black">Customer Orders</h1>
                    <p className="text-xs text-muted-foreground">
                      Track, fulfill, update status, and manage shipping for customer purchases.
                      {ordersList.length > 0 && (
                        <span className="ml-2 font-bold text-foreground">{filteredOrders.length} of {ordersList.length} orders</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Export Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setExportOrdersMenuOpen((prev) => !prev)}
                        disabled={ordersList.length === 0}
                        className="flex items-center gap-2 rounded-xl bg-card border border-border px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted/70 transition shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-primary" />
                        <span>Export Orders</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </button>

                      {exportOrdersMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-card p-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={() => handleExportOrders("excel")}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition text-left cursor-pointer"
                          >
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div>
                              <p className="font-bold">Export to Excel (.xlsx)</p>
                              <p className="text-[10px] text-muted-foreground">
                                {filteredOrders.length} order(s) with items & address
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => handleExportOrders("pdf")}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-rose-500/10 hover:text-rose-600 transition text-left cursor-pointer"
                          >
                            <FileText className="h-4 w-4 text-rose-600 shrink-0" />
                            <div>
                              <p className="font-bold">Export to PDF (.pdf)</p>
                              <p className="text-[10px] text-muted-foreground">
                                Formatted summary table & metrics
                              </p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={loadAllData}
                      disabled={loading}
                      className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                      Refresh Orders
                    </button>
                  </div>
                </div>


                {/* Filter Tabs & Search */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {["All", "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"].map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => setOrderStatusFilter(st)}
                          className={`rounded-full px-3.5 py-1 text-xs font-bold transition ${orderStatusFilter === st
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                          {st}
                        </button>
                      )
                    )}
                  </div>

                  <div className="relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search order #, customer..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full rounded-full border border-border bg-muted/30 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Orders Table */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm font-semibold">Loading orders from database...</p>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 opacity-20" />
                      <p className="text-sm font-bold">No orders found</p>
                      <p className="text-xs">
                        {orderSearch || orderStatusFilter !== "All"
                          ? "Try clearing your search or filter."
                          : "Orders placed by customers will appear here automatically."}
                      </p>
                      <button
                        onClick={loadAllData}
                        className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
                      >
                        <RefreshCw className="h-3 w-3" /> Refresh Now
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-border bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3">Order Number</th>
                            <th className="px-4 py-3">Customer</th>
                            <th className="px-4 py-3">Total Amount</th>
                            <th className="px-4 py-3">Payment</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredOrders.map((o) => (
                            <tr key={o._id || o.orderNumber} className="hover:bg-muted/20 transition">
                              <td className="px-4 py-3">
                                <span className="font-extrabold text-foreground">{o.orderNumber}</span>
                                <p className="text-[11px] text-muted-foreground">
                                  {new Date(o.createdAt).toLocaleDateString("en-IN", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold">{o.user?.name || o.shippingAddress?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {o.shippingAddress?.city}, {o.shippingAddress?.state}
                                </p>
                              </td>
                              <td className="px-4 py-3 font-bold">₹{o.totalAmount}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${o.paymentStatus === "Paid"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-amber-500/10 text-amber-600"
                                    }`}
                                >
                                  {o.paymentStatus} ({o.paymentMethod})
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={o.orderStatus}
                                  onChange={(e) =>
                                    handleUpdateOrderStatus(o._id || o.orderNumber, e.target.value)
                                  }
                                  className={`rounded-xl px-2.5 py-1 text-xs font-extrabold outline-none border ${o.orderStatus === "Delivered"
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                    : o.orderStatus === "Shipped"
                                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                                      : o.orderStatus === "Processing"
                                        ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
                                        : o.orderStatus === "Cancelled"
                                          ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                          : "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                    }`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Confirmed">Confirmed</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Shipped">Shipped</option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleViewInvoice(o)}
                                    title="View Tax Invoice"
                                    className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition cursor-pointer shadow-2xs"
                                  >
                                    <FileText className="h-3 w-3 text-primary" />
                                    <span className="hidden sm:inline">Invoice</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedOrder(o);
                                      setOrderDetailModalOpen(true);
                                    }}
                                    className="rounded-lg bg-muted px-3 py-1 text-xs font-bold hover:bg-muted/80 transition cursor-pointer"
                                  >
                                    View
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* 4. CATEGORIES & SUBCATEGORIES TAB */}
            {activeTab === "categories" && (
              <div className="space-y-8">
                {/* Header with Stats & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
                  <div>
                    <h1 className="text-2xl font-black flex items-center gap-2.5">
                      <span>Store Categories & Subcategories</span>
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fully dynamic database categorization. Navbar and storefront filter update automatically in real-time.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenAddSubCategory()}
                      className="flex items-center gap-1.5 rounded-full bg-secondary hover:bg-secondary/80 border border-border px-4 py-2 text-xs font-bold text-foreground shadow-xs transition"
                    >
                      <Plus className="h-4 w-4 text-primary" /> Add Subcategory
                    </button>
                    <button
                      onClick={handleOpenAddCategory}
                      className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition"
                    >
                      <Plus className="h-4 w-4" /> Add Category
                    </button>
                  </div>
                </div>

                {/* Stat Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Parent Categories</p>
                    <p className="text-2xl font-black text-foreground mt-1">{categoriesList.length}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Subcategories</p>
                    <p className="text-2xl font-black text-primary mt-1">{allSubCategories.length}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 rounded-2xl border border-border bg-card p-4 shadow-xs">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Catalog Products</p>
                    <p className="text-2xl font-black text-foreground mt-1">{productsList.length}</p>
                  </div>
                </div>

                {/* Section 1: Categories Cards & Hierarchies */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-extrabold text-foreground">
                      Parent Categories & Linked Subcategories ({categoriesList.length})
                    </h2>
                    <span className="text-xs text-muted-foreground">Navbar items reflect these categories directly</span>
                  </div>

                  {categoriesList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                      <p className="text-sm font-bold text-muted-foreground">No categories created yet in the database.</p>
                      <button
                        onClick={handleOpenAddCategory}
                        className="mt-3 rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                      >
                        + Create Your First Category
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {categoriesList.map((c) => {
                        const count = productsList.filter((p) => {
                          const catId = c.id || c.slug || c._id;
                          return (
                            (p.category || "").toLowerCase() === catId?.toLowerCase() ||
                            (p.category || "").toLowerCase() === (c.name || "").toLowerCase() ||
                            (p.categoryId && String(p.categoryId) === String(c._id))
                          );
                        }).length;

                        const subs = (c.subCategories || []).filter(Boolean);

                        return (
                          <div
                            key={c._id || c.id || c.slug}
                            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-xs hover:shadow-md transition"
                          >
                            <div>
                              {/* Top Bar */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={
                                      c.image ||
                                      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80"
                                    }
                                    alt={c.name}
                                    className="h-12 w-12 rounded-xl object-cover border border-border shrink-0 bg-muted"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <h3 className="font-extrabold text-sm truncate">{c.name}</h3>
                                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                                        #{c.order || 1}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                      slug: <span className="font-mono">{c.slug || c.id || c.name?.toLowerCase()}</span> • {count} products
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => handleOpenEditCategory(c)}
                                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                                    title="Edit Category"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCategory(c)}
                                    className="rounded-lg p-1.5 text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition"
                                    title="Delete Category"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {c.description && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.description}</p>
                              )}

                              {/* Subcategories Container */}
                              <div className="mt-3.5 border-t border-border/70 pt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Subcategories ({subs.length})
                                  </span>
                                  <button
                                    onClick={() => handleOpenAddSubCategory(c)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                                  >
                                    <Plus className="h-3 w-3" /> Add Sub
                                  </button>
                                </div>

                                {subs.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">
                                    No subcategories yet. (Displays as single category in navbar)
                                  </p>
                                ) : (
                                  <div className="flex flex-wrap gap-1.5">
                                    {subs.map((sub, sIdx) => {
                                      const subName = typeof sub === "string" ? sub : sub.name;
                                      const subKey = typeof sub === "object" && sub._id ? sub._id : sIdx;

                                      return (
                                        <div
                                          key={subKey}
                                          className="group/sub inline-flex items-center gap-1 rounded-lg bg-secondary/80 hover:bg-secondary px-2 py-1 text-xs font-medium text-foreground border border-border transition"
                                        >
                                          <span>{subName}</span>
                                          <button
                                            type="button"
                                            onClick={() => handleOpenEditSubCategory(c, sub)}
                                            className="opacity-40 hover:opacity-100 hover:text-primary transition"
                                            title="Edit Subcategory"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteSubCategory(c, sub)}
                                            className="opacity-40 hover:opacity-100 hover:text-destructive transition"
                                            title="Delete Subcategory"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quick Card Action */}
                            <div className="mt-4 pt-2 border-t border-border flex items-center justify-between text-xs font-semibold text-muted-foreground">
                              <Link
                                to="/shop"
                                search={{ category: (c.slug || c.id || c.name).toLowerCase().replace(/\s+/g, "-") }}
                                target="_blank"
                                className="hover:text-primary transition flex items-center gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" /> View on Store
                              </Link>
                              <button
                                onClick={() => handleOpenAddSubCategory(c)}
                                className="text-primary hover:underline font-bold"
                              >
                                + Add Subcategory
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Section 2: Subcategory Explorer & Centralized Manager */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h2 className="text-base font-extrabold text-foreground">
                        Subcategory Master Directory ({allSubCategories.length})
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Manage all subcategories across categories in one unified place.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Filter by parent category */}
                      <select
                        value={subCategoryFilterParent}
                        onChange={(e) => setSubCategoryFilterParent(e.target.value)}
                        className="rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-bold outline-none"
                      >
                        <option value="All">All Categories</option>
                        {categoriesList.map((c) => (
                          <option key={c._id || c.id || c.name} value={String(c._id || c.id || c.slug)}>
                            {c.name}
                          </option>
                        ))}
                      </select>

                      {/* Search box */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={subCategorySearch}
                          onChange={(e) => setSubCategorySearch(e.target.value)}
                          placeholder="Search subcategories..."
                          className="rounded-xl border border-border bg-muted/40 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-primary w-44"
                        />
                      </div>

                      <button
                        onClick={() => handleOpenAddSubCategory()}
                        className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition"
                      >
                        <Plus className="h-3.5 w-3.5" /> New Subcategory
                      </button>
                    </div>
                  </div>

                  {filteredSubCategories.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-8 text-center">
                      <p className="text-xs text-muted-foreground">No subcategories match the selected filter.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                          <tr>
                            <th className="px-4 py-2.5 font-bold">Subcategory Name</th>
                            <th className="px-4 py-2.5 font-bold">Parent Category</th>
                            <th className="px-4 py-2.5 font-bold">Slug</th>
                            <th className="px-4 py-2.5 font-bold">Display Order</th>
                            <th className="px-4 py-2.5 font-bold">Status</th>
                            <th className="px-4 py-2.5 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredSubCategories.map((sub, idx) => {
                            const subName = typeof sub === "string" ? sub : sub.name;
                            const subSlug = typeof sub === "string" ? sub.toLowerCase().replace(/\s+/g, "-") : sub.slug || subName.toLowerCase().replace(/\s+/g, "-");

                            return (
                              <tr key={idx} className="hover:bg-muted/30 transition">
                                <td className="px-4 py-2.5 font-bold text-foreground">{subName}</td>
                                <td className="px-4 py-2.5">
                                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-bold text-primary">
                                    {sub.parentCatName}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[11px] text-muted-foreground">{subSlug}</td>
                                <td className="px-4 py-2.5 text-muted-foreground">{sub.order || 1}</td>
                                <td className="px-4 py-2.5">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3 w-3" /> Active
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right space-x-1">
                                  <button
                                    onClick={() => handleOpenEditSubCategory(sub.parentCategory, sub)}
                                    className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                                    title="Edit Subcategory"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubCategory(sub.parentCategory, sub)}
                                    className="rounded-lg p-1 text-destructive/70 hover:bg-destructive/10 hover:text-destructive transition"
                                    title="Delete Subcategory"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
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
            )}

            {/* 5. CUSTOMERS TAB */}
            {activeTab === "users" && (
              <div className="space-y-5">
                {/* Clean Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" /> Customer Accounts & Addresses
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      View and manage registered customers, saved delivery addresses, and purchase history.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Export Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setExportCustomersMenuOpen((prev) => !prev)}
                        disabled={usersList.length === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-card border border-border px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted/70 transition shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-primary" />
                        <span>Export Customers</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </button>

                      {exportCustomersMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-card p-1.5 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            onClick={() => handleExportCustomers("excel")}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition text-left cursor-pointer"
                          >
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div>
                              <p className="font-bold">Export to Excel (.xlsx)</p>
                              <p className="text-[10px] text-muted-foreground">
                                {filteredCustomers.length} customer(s) & address data
                              </p>
                            </div>
                          </button>
                          <button
                            onClick={() => handleExportCustomers("pdf")}
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-foreground hover:bg-rose-500/10 hover:text-rose-600 transition text-left cursor-pointer"
                          >
                            <FileText className="h-4 w-4 text-rose-600 shrink-0" />
                            <div>
                              <p className="font-bold">Export to PDF (.pdf)</p>
                              <p className="text-[10px] text-muted-foreground">
                                Formatted customer directory report
                              </p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={loadAllData}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-muted/60 transition shadow-xs cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-primary ${loading ? "animate-spin" : ""}`} />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* 4 Summary Stats Cards - Clean & Compact */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Customers</span>
                      <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="text-2xl font-black mt-2 text-foreground">{usersList.length}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Registered accounts</p>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">With Address</span>
                      <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="text-2xl font-black mt-2 text-emerald-600">
                      {usersList.filter((u) => u.shippingAddress?.street || u.shippingAddress?.address || u.address?.street || u.address?.address).length}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Delivery addresses saved</p>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Orders</span>
                      <div className="h-7 w-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600">
                        <ShoppingBag className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="text-2xl font-black mt-2 text-sky-600">
                      {usersList.reduce((sum, u) => sum + (u.ordersCount || (u.orders?.length || 0)), 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Orders placed by users</p>
                  </div>

                  <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Spent</span>
                      <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <IndianRupee className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <p className="text-2xl font-black mt-2 text-amber-600">
                      ₹{usersList.reduce((sum, u) => sum + (u.totalSpent || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Customer order volume</p>
                  </div>
                </div>

                {/* Clean Filter and Search Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border/80 shadow-xs">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by customer name, email, phone, city, state, or PIN code..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/30 pl-10 pr-8 py-2 text-xs text-foreground outline-none focus:border-primary transition"
                    />
                    {customerSearch && (
                      <button
                        onClick={() => setCustomerSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <select
                      value={customerRoleFilter}
                      onChange={(e) => setCustomerRoleFilter(e.target.value)}
                      className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="All">All Roles</option>
                      <option value="user">Customers Only</option>
                      <option value="admin">Admins Only</option>
                    </select>

                    <select
                      value={customerAddressFilter}
                      onChange={(e) => setCustomerAddressFilter(e.target.value)}
                      className="rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="All">All Addresses</option>
                      <option value="with_address">With Saved Address</option>
                      <option value="no_address">Without Address</option>
                    </select>

                    <span className="text-xs font-bold text-muted-foreground whitespace-nowrap px-1">
                      {filteredCustomers.length} {filteredCustomers.length === 1 ? "Customer" : "Customers"}
                    </span>
                  </div>
                </div>

                {/* Table Container - Clean & Proper Structure */}
                <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-xs">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm font-bold">Loading customer directory...</p>
                    </div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground text-center px-4">
                      <Users className="h-12 w-12 opacity-20" />
                      <p className="text-sm font-bold text-foreground">No customer accounts found</p>
                      <p className="text-xs max-w-md text-muted-foreground">
                        No matching customer records found for your current filter.
                      </p>
                      {(customerSearch || customerRoleFilter !== "All" || customerAddressFilter !== "All") && (
                        <button
                          onClick={() => {
                            setCustomerSearch("");
                            setCustomerRoleFilter("All");
                            setCustomerAddressFilter("All");
                          }}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-border bg-muted/40 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3.5 w-10 text-center">#</th>
                            <th className="px-4 py-3.5 min-w-[200px]">Customer Profile</th>
                            <th className="px-4 py-3.5 min-w-[180px]">Contact Info</th>
                            <th className="px-4 py-3.5 min-w-[260px]">Shipping Address</th>
                            <th className="px-4 py-3.5 min-w-[130px]">Orders & Spent</th>
                            <th className="px-4 py-3.5 min-w-[120px]">Joined Date</th>
                            <th className="px-4 py-3.5 text-right min-w-[140px]">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {filteredCustomers.map((u, idx) => {
                            const addr = u.shippingAddress || u.address || {};
                            const street = addr.street || addr.address || "";
                            const city = addr.city || "";
                            const state = addr.state || "";
                            const pincode = addr.pincode || "";
                            const country = addr.country || "India";
                            const hasAddress = Boolean(street || city || pincode);
                            const customerIdKey = u._id || u.email;
                            const isCopied = copiedAddressId === customerIdKey;

                            const initials = (u.name || "C")
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2);

                            return (
                              <tr
                                key={customerIdKey}
                                className="hover:bg-muted/20 transition group"
                              >
                                {/* Index */}
                                <td className="px-4 py-3 text-center text-muted-foreground font-mono text-[11px]">
                                  {idx + 1}
                                </td>

                                {/* Customer Profile */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 border border-primary/20">
                                      {initials}
                                    </div>
                                    <div>
                                      <p className="font-extrabold text-foreground text-xs leading-tight">
                                        {u.name || "Customer"}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{u.email}</p>
                                      <div className="mt-1">
                                        <span
                                          className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                            u.role === "admin"
                                              ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                                              : "bg-muted text-foreground border border-border"
                                          }`}
                                        >
                                          {u.role === "admin" ? "Admin" : "Customer"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Contact Info */}
                                <td className="px-4 py-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-foreground font-semibold">
                                      <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                                      <span>{u.phone || addr.phone || "—"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                      <span className="truncate max-w-[150px]">{u.email}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Shipping Address */}
                                <td className="px-4 py-3">
                                  {hasAddress ? (
                                    <div className="space-y-1">
                                      <div className="flex items-start gap-1.5">
                                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                        <div className="leading-snug">
                                          {street && <p className="font-bold text-foreground">{street}</p>}
                                          <p className="text-muted-foreground text-[11px]">
                                            {[city, state].filter(Boolean).join(", ")}
                                            {pincode ? ` - ${pincode}` : ""}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border">
                                      No address added
                                    </span>
                                  )}
                                </td>

                                {/* Orders & Spent */}
                                <td className="px-4 py-3">
                                  <div>
                                    <span className="inline-block font-black text-foreground">
                                      {u.ordersCount !== undefined ? u.ordersCount : u.orders?.length || 0} Orders
                                    </span>
                                    <p className="text-emerald-700 font-extrabold text-[11px] mt-0.5">
                                      ₹{(u.totalSpent || 0).toLocaleString()} Spent
                                    </p>
                                  </div>
                                </td>

                                {/* Joined Date */}
                                <td className="px-4 py-3 text-muted-foreground">
                                  <p className="font-semibold text-foreground">
                                    {new Date(u.createdAt || Date.now()).toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </p>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {hasAddress && (
                                      <button
                                        onClick={() => copyAddressToClipboard(u, customerIdKey)}
                                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                          isCopied
                                            ? "bg-emerald-600 text-white border-emerald-600"
                                            : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                                        }`}
                                        title="Copy Address"
                                      >
                                        {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        setSelectedCustomer(u);
                                        setCustomerModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 rounded-xl bg-primary/10 border border-primary/20 px-2.5 py-1.5 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition cursor-pointer shadow-xs"
                                    >
                                      <Eye className="h-3.5 w-3.5" /> View Profile
                                    </button>
                                  </div>
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
            )}

            {/* 6. TOP BANNER EDITOR TAB */}
            {activeTab === "banner" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-black">Top Announcement Banner</h1>
                  <p className="text-xs text-muted-foreground">
                    Customize the animated green header banner that appears across the top of your entire storefront.
                  </p>
                </div>

                {/* Live Interactive Preview Card */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      🔴 Real-time Live Preview
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Live on Storefront
                    </span>
                  </div>

                  <div className="relative overflow-hidden rounded-xl bg-primary py-2.5 px-4 text-center text-xs font-medium text-primary-foreground shadow-inner select-none" style={{ minHeight: "2.5rem" }}>
                    {/* Floating animated baby items in preview */}
                    {[
                      { emoji: "👶", dur: 18, delay: -0 },
                      { emoji: "🍼", dur: 16, delay: -2 },
                      { emoji: "👕", dur: 20, delay: -4 },
                      { emoji: "🧸", dur: 15, delay: -6 },
                      { emoji: "👗", dur: 19, delay: -8 },
                      { emoji: "🧦", dur: 17, delay: -10 },
                      { emoji: "🌟", dur: 21, delay: -12 },
                      { emoji: "🎈", dur: 16, delay: -14 },
                    ].map((item, idx) => (
                      <span
                        key={idx}
                        className="banner-item-drifter"
                        style={{
                          animationDuration: `${item.dur}s`,
                          animationDelay: `${item.delay}s`,
                        }}
                      >
                        {item.emoji}
                      </span>
                    ))}
                    <div className="relative z-20 flex items-center justify-center">
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-0.5 shadow-xs ring-1 ring-white/15">
                        <span className="text-amber-200">✨</span>
                        <span className="font-extrabold tracking-wide drop-shadow-xs">
                          {editingBannerText || "Your announcement message here..."}
                        </span>
                        <span className="text-amber-200">✨</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner Text Form */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Banner Text Message
                    </label>
                    <textarea
                      rows={3}
                      value={editingBannerText}
                      onChange={(e) => setEditingBannerText(e.target.value)}
                      placeholder="e.g. Use code SUNNY10 for 10% off orders above ₹1999 · Free shipping over ₹2499"
                      className="w-full rounded-xl border border-border bg-muted/40 p-3.5 text-sm font-medium outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setBannerText(editingBannerText.trim());
                        showNotification("Top banner saved and updated live across the store!");
                      }}
                      className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition active:scale-95"
                    >
                      <Check className="h-4 w-4" /> Save & Publish Banner
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const defaultText = "Use code SUNNY10 for 10% off orders above ₹1999 · Free shipping over ₹2499";
                        setEditingBannerText(defaultText);
                        setBannerText(defaultText);
                        showNotification("Reset banner to default promotion!");
                      }}
                      className="rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs font-bold hover:bg-muted transition"
                    >
                      Reset to Default
                    </button>
                  </div>

                  {/* Promotion Presets */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Quick 1-Click Promotional Presets
                    </h3>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {[
                        {
                          label: "🏷️ 10% Discount + Free Shipping",
                          text: "Use code SUNNY10 for 10% off orders above ₹1999 · Free shipping over ₹2499",
                        },
                        {
                          label: "🎉 Festive Special (Buy 2 Get 1)",
                          text: "🎉 Festive Season Sale: Buy 2 Get 1 FREE on all Muslin Swaddles & Towels!",
                        },
                        {
                          label: "🚚 Free Express Delivery Day",
                          text: "🚚 FREE Express Shipping on all baby orders above ₹999 today only!",
                        },
                        {
                          label: "👶 Newborn Kits Announcement",
                          text: "👶 Newborn Hospital Essentials Kit is back in stock! Extra 15% off with code BABY15",
                        },
                        {
                          label: "☀️ Summer Collection Launch",
                          text: "☀️ Summer Organic Cotton Collection is LIVE · Flat 20% OFF sitewide!",
                        },
                        {
                          label: "🎁 Special Gift with Purchase",
                          text: "🎁 Get a FREE Organic Cotton Bib with every hospital kit purchase!",
                        },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setEditingBannerText(preset.text);
                            setBannerText(preset.text);
                            showNotification(`Applied preset: ${preset.label}`);
                          }}
                          className="flex flex-col items-start rounded-xl border border-border/80 bg-muted/20 p-3 text-left hover:border-primary hover:bg-primary/5 transition"
                        >
                          <span className="text-xs font-bold text-foreground">{preset.label}</span>
                          <span className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                            {preset.text}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Contact Details Editor Card */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">Footer Contact Details</h2>
                    <p className="text-xs text-muted-foreground">
                      Update the official customer support email, phone number, and physical store address displayed in the website footer.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Customer Support Email
                      </label>
                      <input
                        type="email"
                        value={editingFooter.email}
                        onChange={(e) => setEditingFooter({ ...editingFooter, email: e.target.value })}
                        placeholder="support@littlesunbeam.com"
                        className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Customer Support Phone
                      </label>
                      <input
                        type="text"
                        value={editingFooter.phone}
                        onChange={(e) => setEditingFooter({ ...editingFooter, phone: e.target.value })}
                        placeholder="+91 93615 03943"
                        className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Store Physical Address
                    </label>
                    <textarea
                      rows={2}
                      value={editingFooter.address}
                      onChange={(e) => setEditingFooter({ ...editingFooter, address: e.target.value })}
                      placeholder="No 4, Sundaram Nagar, Chandrapuram Extn, Dharapuram Road, Tiruppur, Tamil Nadu - 641604, India"
                      className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (setFooterInfo) setFooterInfo(editingFooter);
                        showNotification("Footer contact details updated live across the site!");
                      }}
                      className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition active:scale-95"
                    >
                      <Check className="h-4 w-4" /> Save Footer Contact Info
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const defaultFooter = {
                          email: "littlesunbeamkidswear@gmail.com",
                          phone: "+91 93615 03943",
                          address: "1/95m Bandari Nagar, Veerapandi, Tirupur, Tamil Nadu - 641605",
                        };
                        setEditingFooter(defaultFooter);
                        if (setFooterInfo) setFooterInfo(defaultFooter);
                        showNotification("Reset footer details to Little Sunbeam defaults!");
                      }}
                      className="rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-xs font-bold hover:bg-muted transition"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>

                {/* ─── Hero Banner Slides Editor ─────────────────────────────── */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-foreground">Hero Banner Slides</h2>
                      <p className="text-xs text-muted-foreground">
                        Manage the sliding banners in the home page hero section. Changes are published live.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addSlide}
                      className="flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
                    >
                      + Add Slide
                    </button>
                  </div>

                  {/* Slide Tab Picker */}
                  <div className="flex gap-2 flex-wrap">
                    {editingBanners.map((slide, idx) => (
                      <button
                        key={slide.id || idx}
                        type="button"
                        onClick={() => setSelectedSlideIdx(idx)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${idx === selectedSlideIdx
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 border-border text-foreground hover:border-primary"
                          }`}
                      >
                        Slide {idx + 1}
                      </button>
                    ))}
                  </div>

                  {/* Slide Editor Form */}
                  {editingBanners[selectedSlideIdx] && (
                    <div className="grid gap-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Badge Label
                          </label>
                          <input
                            type="text"
                            value={editingBanners[selectedSlideIdx].badge || ""}
                            onChange={(e) => updateSlide(selectedSlideIdx, "badge", e.target.value)}
                            placeholder="e.g. New Arrival"
                            className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Background Color (CSS)
                          </label>
                          <input
                            type="text"
                            value={editingBanners[selectedSlideIdx].bgColor || ""}
                            onChange={(e) => updateSlide(selectedSlideIdx, "bgColor", e.target.value)}
                            placeholder="e.g. #fff8f0 or leave blank for default"
                            className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Heading <span className="normal-case text-muted-foreground/70 font-normal">(wrap a keyword in {`<span class="sun-underline">`} for the orange underline effect)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={editingBanners[selectedSlideIdx].heading || ""}
                          onChange={(e) => updateSlide(selectedSlideIdx, "heading", e.target.value)}
                          placeholder='Soft muslin days for your <span class="sun-underline">little sunbeam</span>'
                          className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Subtext / Description
                        </label>
                        <textarea
                          rows={2}
                          value={editingBanners[selectedSlideIdx].subtext || ""}
                          onChange={(e) => updateSlide(selectedSlideIdx, "subtext", e.target.value)}
                          placeholder="Short promotional description shown below the heading"
                          className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Primary Button Label
                          </label>
                          <input
                            type="text"
                            value={editingBanners[selectedSlideIdx].primaryBtnLabel || ""}
                            onChange={(e) => updateSlide(selectedSlideIdx, "primaryBtnLabel", e.target.value)}
                            placeholder="e.g. Shop Now"
                            className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Primary Button Link
                          </label>
                          <input
                            type="text"
                            value={editingBanners[selectedSlideIdx].primaryBtnTo || ""}
                            onChange={(e) => updateSlide(selectedSlideIdx, "primaryBtnTo", e.target.value)}
                            placeholder="/shop"
                            className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Secondary Button Label
                          </label>
                          <input
                            type="text"
                            value={editingBanners[selectedSlideIdx].secondaryBtnLabel || ""}
                            onChange={(e) => updateSlide(selectedSlideIdx, "secondaryBtnLabel", e.target.value)}
                            placeholder="Leave empty to hide"
                            className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Secondary Button Link
                          </label>
                          <input
                            type="text"
                            value={editingBanners[selectedSlideIdx].secondaryBtnTo || ""}
                            onChange={(e) => updateSlide(selectedSlideIdx, "secondaryBtnTo", e.target.value)}
                            placeholder="/shop"
                            className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Banner Image
                        </label>

                        {/* Drag-and-drop / click-to-upload zone */}
                        <label
                          htmlFor={`banner-img-upload-${selectedSlideIdx}`}
                          className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 py-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          {editingBanners[selectedSlideIdx].image ? (
                            <div className="flex flex-col items-center gap-3">
                              <img
                                src={editingBanners[selectedSlideIdx].image}
                                alt="Banner preview"
                                className="h-36 max-w-full object-contain rounded-xl border border-border bg-white shadow"
                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                              />
                              <span className="text-xs font-bold text-primary group-hover:underline">
                                📷 Click to replace image
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <span className="text-3xl">🖼️</span>
                              <p className="text-xs font-bold text-center">
                                <span className="text-primary">Click to upload</span> or drag &amp; drop
                              </p>
                              <p className="text-[11px] text-center">
                                PNG, JPG, WebP · Recommended: 800×600px or wider
                              </p>
                            </div>
                          )}
                          <input
                            id={`banner-img-upload-${selectedSlideIdx}`}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="sr-only"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                updateSlide(selectedSlideIdx, "image", ev.target.result);
                              };
                              reader.readAsDataURL(file);
                              e.target.value = ""; // reset so same file can be re-uploaded
                            }}
                          />
                        </label>

                        {/* OR: paste URL fallback */}
                        <div className="mt-3 flex items-center gap-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[11px] font-bold text-muted-foreground">OR PASTE IMAGE URL</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                        <input
                          type="text"
                          value={editingBanners[selectedSlideIdx].image?.startsWith("data:") ? "" : (editingBanners[selectedSlideIdx].image || "")}
                          onChange={(e) => updateSlide(selectedSlideIdx, "image", e.target.value)}
                          placeholder="https://example.com/banner.jpg"
                          className="mt-2 w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs font-medium outline-none focus:border-primary"
                        />
                        {editingBanners[selectedSlideIdx].image && (
                          <button
                            type="button"
                            onClick={() => updateSlide(selectedSlideIdx, "image", "")}
                            className="mt-2 text-[11px] font-bold text-red-500 hover:text-red-700 transition"
                          >
                            ✕ Remove image
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <button
                          type="button"
                          onClick={saveHeroBanners}
                          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition active:scale-95"
                        >
                          <Check className="h-4 w-4" /> Save All Slides
                        </button>
                        {editingBanners.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSlide(selectedSlideIdx)}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition"
                          >
                            🗑 Delete Slide {selectedSlideIdx + 1}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ─── MANAGE SHOP BY PRINT ────────────────────────────────────── */}
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
                  {/* Card Header & Master ON/OFF Toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base font-black">🎨 Manage Shop By Print</h2>
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                          {prints.length} Configured {prints.length === 1 ? "Print" : "Prints"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all ${isShopByPrintEnabled
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${isShopByPrintEnabled ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                              }`}
                          />
                          {isShopByPrintEnabled ? "Section Active (Visible on Website)" : "Section OFF (Hidden on Website)"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-xl">
                        Control the visibility of the "Shop By Print" section on the Homepage and the Print filter panel on the Shop page.
                      </p>
                    </div>

                    {/* Master Switch ON / OFF */}
                    <div className="flex items-center gap-3 bg-muted/40 p-2.5 sm:p-3 rounded-2xl border border-border shrink-0 self-start sm:self-center shadow-xs">
                      <div className="text-right">
                        <p className="text-xs font-black leading-tight">
                          {isShopByPrintEnabled ? "Section is ON" : "Section is OFF"}
                        </p>
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          {isShopByPrintEnabled ? "Showing on Storefront" : "Hidden from Storefront"}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isShopByPrintEnabled}
                        onClick={() => {
                          const nextState = !isShopByPrintEnabled;
                          setShopByPrintEnabled(nextState);
                          showNotification(
                            nextState
                              ? "✅ Shop By Print section is now ON (Visible on Home & Shop filter)"
                              : "⏸️ Shop By Print section is now OFF (Hidden from Home & Shop filter)"
                          );
                        }}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isShopByPrintEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"
                          }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isShopByPrintEnabled ? "translate-x-7" : "translate-x-0"
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Notification banner if OFF */}
                  {!isShopByPrintEnabled && (
                    <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
                      <span className="text-base shrink-0">⚠️</span>
                      <p>
                        <strong>Shop By Print section is currently turned OFF.</strong> The print carousel will NOT appear on the Homepage and the Print filter will NOT appear on the Shop page. Turn ON the toggle above whenever you want it visible.
                      </p>
                    </div>
                  )}

                  {/* Current prints list */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Configured Print Patterns ({prints.length})
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        {prints.filter((p) => p.isActive !== false).length} active · {prints.filter((p) => p.isActive === false).length} hidden
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {prints.map((p, idx) => {
                        const printId = p._id || p.id || p.name;
                        const printSymbol = p.emoji || p.icon || "✨";
                        const isPrintActive = p.isActive !== false;

                        return (
                          <div
                            key={printId || idx}
                            className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${isPrintActive
                                ? "border-border bg-muted/40 hover:bg-muted/60"
                                : "border-border/60 bg-muted/10 opacity-75"
                              }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-2xl shrink-0">{printSymbol}</span>
                              <div className="min-w-0">
                                <span className="text-xs font-bold truncate block">{p.name}</span>
                                <span
                                  className={`text-[10px] font-semibold ${isPrintActive ? "text-emerald-600" : "text-muted-foreground"
                                    }`}
                                >
                                  {isPrintActive ? "Active" : "Hidden"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Individual Print Active Toggle */}
                              <button
                                type="button"
                                title={isPrintActive ? "Click to hide this print" : "Click to activate this print"}
                                onClick={async () => {
                                  const nextActive = !isPrintActive;
                                  const updated = prints.map((item, i) =>
                                    i === idx ? { ...item, isActive: nextActive } : item
                                  );
                                  setPrints(updated);
                                  try {
                                    await adminService.syncPrints(updated);
                                    if (refreshPrints) await refreshPrints();
                                    showNotification(
                                      `Print "${p.name}" is now ${nextActive ? "Active" : "Hidden"}`
                                    );
                                  } catch {
                                    showNotification(`Print "${p.name}" updated`);
                                  }
                                }}
                                className={`rounded-lg border px-2 py-1 text-[10px] font-bold transition ${isPrintActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
                                  }`}
                              >
                                {isPrintActive ? "🟢 Active" : "⚪ Hidden"}
                              </button>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={async () => {
                                  const idToDelete = p._id || p.id || p.name;
                                  const updated = prints.filter((_, i) => i !== idx);
                                  setPrints(updated);
                                  try {
                                    await adminService.deletePrint(idToDelete);
                                    if (refreshPrints) await refreshPrints();
                                    showNotification(`Removed print: ${p.name}`);
                                  } catch {
                                    showNotification(`Removed print: ${p.name}`);
                                  }
                                }}
                                className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600 hover:bg-red-100 transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {prints.length === 0 && (
                        <div className="col-span-full rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                          No prints configured right now. Add your first print below.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add new print form */}
                  <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add New Print Option</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-muted-foreground">Print Name</label>
                        <input
                          type="text"
                          value={newPrintName}
                          onChange={(e) => setNewPrintName(e.target.value)}
                          placeholder="e.g. Dinosaur"
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-muted-foreground">Emoji / Icon</label>
                        <input
                          type="text"
                          value={newPrintIcon}
                          onChange={(e) => setNewPrintIcon(e.target.value)}
                          placeholder="e.g. 🦕"
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Quick emoji picker */}
                    <div>
                      <p className="mb-2 text-[11px] font-bold text-muted-foreground">Quick Pick Emoji:</p>
                      <div className="flex flex-wrap gap-2">
                        {["🍓", "🍬", "🐘", "💖", "☁️", "🌸", "⭐", "🌈", "🦕", "🦋", "🐶", "🐱", "🌺", "🍭", "🎀", "🐠", "🦁", "🐯", "🐼", "🌻", "🍦", "🎈", "🌙", "🐸", "🦄", "🐝", "🍀", "🌿", "🎵", "🧸"].map((em) => (
                          <button
                            key={em}
                            type="button"
                            onClick={() => setNewPrintIcon(em)}
                            className={`h-9 w-9 rounded-xl border text-lg transition hover:scale-110 active:scale-95 ${newPrintIcon === em
                                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                                : "border-border bg-background hover:border-primary"
                              }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const name = newPrintName.trim();
                        const icon = newPrintIcon.trim() || "✨";
                        if (!name) { alert("Please enter a print name"); return; }
                        const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");

                        if (prints.some((p) => (p.id && p.id === id) || p.name?.toLowerCase() === name.toLowerCase())) {
                          alert("A print with this name is already configured");
                          return;
                        }

                        const tempPrintObj = { id, name, emoji: icon, icon, isActive: true };
                        setPrints([...prints, tempPrintObj]);
                        setNewPrintName("");
                        setNewPrintIcon("");

                        try {
                          const res = await adminService.addPrint({ name, emoji: icon, icon, isActive: true });
                          if (res?.print) {
                            const updated = [...prints.filter((p) => p.id !== id && p.name !== name), res.print];
                            setPrints(updated);
                          }
                          if (refreshPrints) await refreshPrints();
                          showNotification(`Print "${name}" added successfully!`);
                        } catch {
                          showNotification(`Print "${name}" added successfully!`);
                        }
                      }}
                      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Print Option
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* ─── ADD/EDIT PRODUCT MODAL ─────────────────────────────────────── */}
        {productModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span>{editingProduct ? "Edit Baby Clothing Product" : "Add New Baby Clothing Product"}</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {editingProduct ? `Updating SKU: ${productForm.sku}` : "Configure product details, baby clothing specs, pricing, stock, images & variants."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Navigation Tabs */}
              <div className="flex items-center gap-1 border-b border-border bg-muted/40 px-6 py-2 overflow-x-auto text-xs font-bold scrollbar-none">
                {[
                  { id: "basic", label: "Basic Info *", icon: Package },
                  { id: "clothing", label: "Baby Specs", icon: Layers },
                  { id: "variants", label: `Colors & Variants * (${productForm.colorVariants?.length || 1})`, icon: Boxes },
                  { id: "pricing", label: "Pricing & Stock *", icon: IndianRupee },
                  { id: "extra", label: "Additional Info", icon: CheckCircle2 },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = productModalTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setProductModalTab(tab.id)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 transition whitespace-nowrap ${isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Form Error Banner with One-Click Redirection */}
              {formError && (
                <div
                  onClick={() => {
                    if (formErrorTarget?.tab) {
                      goToErrorSection(formErrorTarget.tab, formErrorTarget.fieldId);
                    }
                  }}
                  className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 p-3.5 text-xs font-bold text-rose-700 dark:text-rose-400 cursor-pointer shadow-sm hover:bg-rose-500/15 hover:border-rose-500 transition-all duration-200 group"
                  title="Click to jump directly to this error section"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-xs group-hover:scale-110 transition-transform">
                      <AlertTriangle className="h-4 w-4 animate-bounce" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-black text-xs sm:text-sm">{formError}</p>
                      <p className="text-[11px] font-semibold text-rose-600/90 dark:text-rose-400/90 flex items-center gap-1 mt-0.5">
                        <span>Click anywhere here to jump to {formErrorTarget?.tabLabel || "error section"}</span>
                        <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-xl bg-rose-500 text-white px-3 py-1.5 text-[11px] font-black shadow-xs group-hover:bg-rose-600 transition flex items-center gap-1">
                      Fix Now →
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormError("");
                      }}
                      className="rounded-lg p-1 text-rose-500/70 hover:bg-rose-500/20 hover:text-rose-700 transition"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Modal Body / Tabs Content */}
              <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* ── TAB 1: BASIC INFORMATION ── */}
                {productModalTab === "basic" && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                        Product Name *
                      </label>
                      <input
                        id="input-product-name"
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="e.g. Organic Muslin Baby Romper"
                        className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:bg-background transition"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Product SKU / Product Code
                        </label>
                        <input
                          id="input-product-sku"
                          type="text"
                          value={productForm.sku}
                          onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                          placeholder="e.g. SUN-ROMP-01"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm font-mono uppercase outline-none focus:border-primary focus:bg-background transition"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Brand
                        </label>
                        <input
                          id="input-product-brand"
                          type="text"
                          value={productForm.brand}
                          onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                          placeholder="e.g. Little Sunbeam"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-background transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Dynamic Category Selector */}
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Category * (Dynamic from DB)
                        </label>
                        <select
                          id="input-product-category"
                          required
                          value={productForm.category}
                          onChange={(e) => {
                            const selectedVal = e.target.value;
                            const foundCat = categoriesList.find(
                              (c) =>
                                (c.id || c.slug || c.name || "").toLowerCase() === selectedVal.toLowerCase() ||
                                String(c._id) === selectedVal
                            );
                            setProductForm({
                              ...productForm,
                              category: selectedVal,
                              categoryId: foundCat?._id ? String(foundCat._id) : "",
                              subCategory: "", // reset subcategory on category change
                              subCategoryId: "",
                            });
                          }}
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:bg-background transition"
                        >
                          <option value="" disabled>Select Category</option>
                          {categoriesList.map((c) => {
                            const val = (c.slug || c.name || c.id || "").toLowerCase();
                            return (
                              <option key={c._id || c.id || c.name} value={val}>
                                {c.name}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Sub Category (Strictly Linked to Selected Category) */}
                      <div>
                        <label className="mb-1 flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
                          <span>Sub Category (Optional)</span>
                          {productForm.category && (
                            <span className="text-[10px] lowercase font-normal text-primary">
                              linked to selected category
                            </span>
                          )}
                        </label>
                        {(() => {
                          const currentCatObj = categoriesList.find(
                            (c) =>
                              (c.slug || c.name || c.id || "").toLowerCase() === (productForm.category || "").toLowerCase() ||
                              (productForm.categoryId && String(c._id) === String(productForm.categoryId))
                          );
                          const dbSubs = (currentCatObj?.subCategories || []).filter(Boolean);

                          if (!productForm.category) {
                            return (
                              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-2.5 text-center text-xs text-muted-foreground font-medium">
                                Please select a Category first
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              <select
                                id="input-product-subcategory"
                                value={productForm.subCategory || ""}
                                onChange={(e) => {
                                  const chosenVal = e.target.value;
                                  const foundSub = dbSubs.find((s) => {
                                    const sName = typeof s === "string" ? s : s.name;
                                    return sName === chosenVal;
                                  });
                                  setProductForm({
                                    ...productForm,
                                    subCategory: chosenVal,
                                    subCategoryId: typeof foundSub === "object" && foundSub?._id ? String(foundSub._id) : "",
                                  });
                                }}
                                className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:bg-background transition"
                              >
                                <option value="">None / Main Category Only</option>
                                {dbSubs.map((sc, sIdx) => {
                                  const subName = typeof sc === "string" ? sc : sc.name;
                                  const subKey = typeof sc === "object" && sc._id ? sc._id : sIdx;
                                  return (
                                    <option key={subKey} value={subName}>
                                      {subName}
                                    </option>
                                  );
                                })}
                              </select>

                              {/* Quick Click Badges or Add Subcategory Prompt */}
                              {dbSubs.length > 0 ? (
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <span className="text-[11px] text-muted-foreground font-semibold">Quick Pick:</span>
                                  {dbSubs.map((sc, sIdx) => {
                                    const subName = typeof sc === "string" ? sc : sc.name;
                                    const subKey = typeof sc === "object" && sc._id ? sc._id : sIdx;
                                    const isSelected = productForm.subCategory === subName;

                                    return (
                                      <button
                                        key={subKey}
                                        type="button"
                                        onClick={() => {
                                          setProductForm({
                                            ...productForm,
                                            subCategory: isSelected ? "" : subName,
                                            subCategoryId: !isSelected && typeof sc === "object" && sc._id ? String(sc._id) : "",
                                          });
                                        }}
                                        className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold border transition ${
                                          isSelected
                                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                            : "bg-background text-foreground border-border hover:border-primary/60"
                                        }`}
                                      >
                                        {subName}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex items-center justify-between rounded-xl border border-dashed border-border/80 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
                                  <span>No subcategories for "{currentCatObj?.name || productForm.category}".</span>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddSubCategory(currentCatObj)}
                                    className="text-xs font-bold text-primary hover:underline ml-2"
                                  >
                                    + Add Subcategory
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                        Description *
                      </label>
                      <textarea
                        id="input-product-description"
                        rows={3}
                        required
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Detailed description e.g. Made with ultra-soft GOTS-certified double-layer organic cotton, designed for delicate newborn skin. Breathable, hypoallergenic and comfortable for all-day wear."
                        className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-background transition"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                        Product Details / Highlights (Optional)
                      </label>
                      <textarea
                        id="input-product-details"
                        rows={3}
                        value={productForm.details || ""}
                        onChange={(e) => setProductForm({ ...productForm, details: e.target.value })}
                        placeholder="Key product highlights, craftsmanship details, or feature bullets e.g. Crafted with pure breathable fabric, snap-button closure for easy diaper changes, smooth interior lining, and certified non-toxic baby-safe dyes."
                        className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:bg-background transition"
                      />
                    </div>
                  </div>
                )}

                {/* ── TAB 2: BABY CLOTHING SPECIFICS (OPTIONAL ATTRIBUTES) ── */}
                {productModalTab === "clothing" && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    {/* Gender & Age Group */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
                          Gender
                        </label>
                        <div className="flex rounded-xl border border-border bg-muted/30 p-1">
                          {GENDERS.map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => setProductForm({ ...productForm, gender: g })}
                              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${productForm.gender === g
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
                          Primary Age Group
                        </label>
                        <select
                          value={productForm.ageGroup}
                          onChange={(e) => setProductForm({ ...productForm, ageGroup: e.target.value })}
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-sm font-semibold outline-none focus:border-primary focus:bg-background"
                        >
                          {AGE_GROUPS.map((ag) => (
                            <option key={ag} value={ag}>
                              {ag}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Fabric, Pattern */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Fabric / Material <span className="normal-case font-normal text-muted-foreground/70">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={productForm.fabric}
                          onChange={(e) => setProductForm({ ...productForm, fabric: e.target.value })}
                          placeholder="e.g. 100% GOTS Certified Organic Cotton"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-sm outline-none focus:border-primary focus:bg-background"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Pattern Style <span className="normal-case font-normal text-muted-foreground/70">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={productForm.pattern}
                          onChange={(e) => setProductForm({ ...productForm, pattern: e.target.value })}
                          placeholder="e.g. Floral, Polka Dots, Solid"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-sm outline-none focus:border-primary focus:bg-background"
                        />
                      </div>
                    </div>

                    {/* Dynamic Prints Multi-Select (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold uppercase text-muted-foreground">
                          Print / Pattern <span className="normal-case font-normal text-muted-foreground/70">(Optional — Select one, multiple, or none)</span>
                        </label>
                        <span className="text-[11px] text-muted-foreground">
                          {productForm.prints?.length || 0} selected
                        </span>
                      </div>

                      {prints.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No prints found in database.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-muted/20 p-3">
                          {prints.map((pr) => {
                            const pId = String(pr._id || pr.id || pr.name);
                            const isSelected = Array.isArray(productForm.prints) && productForm.prints.some((id) => String(id) === pId || String(id) === pr.id || String(id) === pr._id);
                            return (
                              <button
                                key={pId}
                                type="button"
                                onClick={() => {
                                  const current = Array.isArray(productForm.prints) ? [...productForm.prints] : [];
                                  const idx = current.findIndex((id) => String(id) === pId || String(id) === pr.id || String(id) === pr._id);
                                  let updated;
                                  if (idx >= 0) {
                                    updated = current.filter((_, i) => i !== idx);
                                  } else {
                                    updated = [...current, pr._id || pr.id];
                                  }
                                  setProductForm({
                                    ...productForm,
                                    prints: updated,
                                    print: updated[0] ? String(updated[0]) : "",
                                  });
                                }}
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${isSelected
                                  ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-105"
                                  : "border-border bg-card text-foreground hover:border-primary"
                                  }`}
                              >
                                <span>{pr.emoji || pr.icon || "✨"}</span>
                                <span>{pr.name}</span>
                                {isSelected && <Check className="h-3 w-3" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Optional Attributes: Sleeve, Neck, Fit, Season */}
                    <div className="rounded-2xl border border-border bg-muted/10 p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Optional Clothing Attributes (Do not block product creation if empty)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
                            Sleeve Type
                          </label>
                          <select
                            value={productForm.sleeveType}
                            onChange={(e) => setProductForm({ ...productForm, sleeveType: e.target.value })}
                            className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-semibold outline-none focus:border-primary"
                          >
                            <option value="">None / Not Specified</option>
                            {SLEEVE_TYPES.filter(Boolean).map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
                            Neck Type
                          </label>
                          <select
                            value={productForm.neckType}
                            onChange={(e) => setProductForm({ ...productForm, neckType: e.target.value })}
                            className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-semibold outline-none focus:border-primary"
                          >
                            <option value="">None / Not Specified</option>
                            {NECK_TYPES.filter(Boolean).map((nt) => (
                              <option key={nt} value={nt}>{nt}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
                            Fit Type
                          </label>
                          <select
                            value={productForm.fitType}
                            onChange={(e) => setProductForm({ ...productForm, fitType: e.target.value })}
                            className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-semibold outline-none focus:border-primary"
                          >
                            <option value="">None / Not Specified</option>
                            {FIT_TYPES.filter(Boolean).map((ft) => (
                              <option key={ft} value={ft}>{ft}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase text-muted-foreground">
                            Season
                          </label>
                          <select
                            value={productForm.season}
                            onChange={(e) => setProductForm({ ...productForm, season: e.target.value })}
                            className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-semibold outline-none focus:border-primary"
                          >
                            <option value="">None / Not Specified</option>
                            {SEASONS.filter(Boolean).map((sn) => (
                              <option key={sn} value={sn}>{sn}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 3: COLOR-BASED PRODUCT VARIANTS & INVENTORY (THE MAIN ARCHITECTURE) ── */}
                {productModalTab === "variants" && (
                  <div id="section-product-variants" className="space-y-6 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
                      <div>
                        <h3 className="text-sm font-black uppercase text-foreground flex items-center gap-2">
                          <Boxes className="h-4 w-4 text-primary" />
                          <span>Color-Based Product Variants &amp; Inventory</span>
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Each color has its own photos, selectable sizes, and exact size-wise inventory.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddColorVariant}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition active:scale-95 shrink-0"
                      >
                        <Plus className="h-4 w-4" />
                        <span>+ Add Another Color</span>
                      </button>
                    </div>

                    {/* Color Variant Cards List */}
                    <div className="space-y-6">
                      {(productForm.colorVariants || []).map((cv, cvIdx) => {
                        const totalCvStock = (cv.inventory || []).reduce((acc, inv) => acc + (Number(inv.stock) || 0), 0);

                        return (
                          <div
                            key={cv.id || cvIdx}
                            id={`color-variant-card-${cvIdx}`}
                            className="rounded-2xl border-2 border-border bg-card p-5 space-y-5 shadow-sm transition hover:border-primary/40"
                          >
                            {/* Color Card Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                              <div className="flex items-center gap-3">
                                <span
                                  className="h-8 w-8 rounded-full border-2 border-white shadow-md shrink-0"
                                  style={{ backgroundColor: cv.hex || "#E5E7EB" }}
                                />
                                <div>
                                  <h4 className="text-sm font-black text-foreground">
                                    Color #{cvIdx + 1}: <span className="text-primary">{cv.displayName || cv.name}</span>
                                  </h4>
                                  <p className="text-[11px] text-muted-foreground">
                                    {cv.images?.length || 0} image(s) · {cv.sizes?.length || 0} size(s) · {totalCvStock} units in stock
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {(productForm.colorVariants?.length || 0) > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveColorVariant(cvIdx)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete Color</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Color Selector & Custom Hex */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                                  Color Name *
                                </label>
                                <select
                                  value={POPULAR_COLORS.some((c) => c.name.toLowerCase() === cv.name.toLowerCase()) ? cv.name : "__custom__"}
                                  onChange={(e) => {
                                    if (e.target.value === "__custom__") {
                                      handleColorVariantChange(cvIdx, "name", "Custom Color");
                                    } else {
                                      handleColorVariantChange(cvIdx, "name", e.target.value);
                                    }
                                  }}
                                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                                >
                                  {POPULAR_COLORS.map((pc) => (
                                    <option key={pc.name} value={pc.name}>{pc.name}</option>
                                  ))}
                                  <option value="__custom__">+ Custom Color Name...</option>
                                </select>
                                {!POPULAR_COLORS.some((c) => c.name.toLowerCase() === cv.name.toLowerCase()) && (
                                  <input
                                    type="text"
                                    value={cv.name}
                                    onChange={(e) => handleColorVariantChange(cvIdx, "name", e.target.value)}
                                    placeholder="e.g. Royal Navy Blue"
                                    className="mt-1.5 w-full rounded-xl border border-primary bg-background px-3 py-1.5 text-xs font-semibold outline-none"
                                  />
                                )}
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                                  Color Display Name
                                </label>
                                <input
                                  type="text"
                                  value={cv.displayName || cv.name}
                                  onChange={(e) => handleColorVariantChange(cvIdx, "displayName", e.target.value)}
                                  placeholder="e.g. Sky Blue"
                                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                                />
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                                  Color Hex Code
                                </label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={cv.hex || "#3B82F6"}
                                    onChange={(e) => handleColorVariantChange(cvIdx, "hex", e.target.value)}
                                    className="h-9 w-10 cursor-pointer rounded-lg border border-border p-0.5 bg-background"
                                  />
                                  <input
                                    type="text"
                                    value={cv.hex || "#3B82F6"}
                                    onChange={(e) => handleColorVariantChange(cvIdx, "hex", e.target.value)}
                                    placeholder="#3B82F6"
                                    className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs font-mono uppercase outline-none focus:border-primary"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Color Specific Images Section */}
                            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <span className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                                    <ImageIcon className="h-4 w-4 text-primary" />
                                    <span>{cv.displayName || cv.name} Photos &amp; Angles</span>
                                  </span>
                                  <p className="text-[11px] text-muted-foreground">
                                    Upload any number of images for this color. Click ★ Primary to set the thumbnail.
                                  </p>
                                </div>

                                <label
                                  id={`color-variant-upload-${cvIdx}`}
                                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition shrink-0"
                                >
                                  {uploadingSlot === `color-${cvIdx}` && productImageUploading ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      <span>Uploading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-3.5 w-3.5" />
                                      <span>Upload Images for this Color</span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    disabled={productImageUploading}
                                    onChange={(e) => handleColorVariantImageUpload(e, cvIdx)}
                                  />
                                </label>
                              </div>

                              {/* Uploaded Images Grid */}
                              {(!cv.images || cv.images.length === 0) ? (
                                <div className="rounded-xl border border-dashed border-border bg-background/50 p-6 text-center text-xs text-muted-foreground space-y-1">
                                  <p className="font-bold">No images uploaded for {cv.displayName || cv.name} yet.</p>
                                  <p className="text-[11px]">Click "Upload Images for this Color" above to upload photos.</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                                  {cv.images.map((imgObj, imgIdx) => {
                                    const imgUrl = typeof imgObj === "string" ? imgObj : imgObj.url;
                                    const isPrimary = typeof imgObj === "object" ? Boolean(imgObj.isPrimary) : imgIdx === 0;

                                    return (
                                      <div
                                        key={imgIdx}
                                        className={`group relative rounded-xl overflow-hidden border-2 bg-background shadow-xs transition ${isPrimary ? "border-primary ring-2 ring-primary/30" : "border-border"
                                          }`}
                                      >
                                        <img src={imgUrl} alt={`${cv.name} ${imgIdx}`} className="h-24 w-full object-cover" />

                                        {/* Primary Badge or Set Primary button */}
                                        {isPrimary ? (
                                          <span className="absolute top-1 left-1 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-black text-primary-foreground shadow-xs">
                                            ★ Primary
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleSetPrimaryColorImage(cvIdx, imgIdx)}
                                            className="absolute top-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 group-hover:opacity-100 hover:bg-primary transition"
                                            title="Set as primary image for this color"
                                          >
                                            Set Primary
                                          </button>
                                        )}

                                        {/* Remove Button */}
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveColorVariantImage(cvIdx, imgIdx)}
                                          className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100 hover:bg-destructive transition"
                                          title="Remove Image"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Available Sizes Selection for this Color */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-bold uppercase text-muted-foreground">
                                  Available Sizes for {cv.displayName || cv.name}
                                </label>
                                <span className="text-[11px] text-muted-foreground">Check/uncheck sizes available in this color</span>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {AVAILABLE_SIZES.map((sz) => {
                                  const isChecked = Array.isArray(cv.sizes) && cv.sizes.includes(sz);
                                  return (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() => handleToggleSizeForColor(cvIdx, sz)}
                                      className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${isChecked
                                        ? "border-primary bg-primary text-primary-foreground shadow-xs scale-105"
                                        : "border-border bg-muted/20 text-foreground hover:border-primary"
                                        }`}
                                    >
                                      {sz} {isChecked && "✓"}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Size-wise Inventory Table for this Color */}
                            {Array.isArray(cv.inventory) && cv.inventory.length > 0 && (
                              <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase text-muted-foreground">
                                  Size-Wise Stock &amp; SKUs for {cv.displayName || cv.name}
                                </label>
                                <div className="overflow-x-auto rounded-xl border border-border">
                                  <table className="w-full text-left text-xs">
                                    <thead className="border-b border-border bg-muted/40 font-black uppercase text-muted-foreground text-[10px]">
                                      <tr>
                                        <th className="px-3 py-2">Size</th>
                                        <th className="px-3 py-2">Stock / Inventory *</th>
                                        <th className="px-3 py-2">Variant SKU</th>
                                        <th className="px-3 py-2">Stock Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-card">
                                      {cv.inventory.map((inv, invIdx) => {
                                        const stockNum = Number(inv.stock) || 0;
                                        const invStatus = stockNum <= 0 ? "Out of Stock" : (stockNum <= 5 ? "Low Stock" : "In Stock");

                                        return (
                                          <tr key={inv.size || invIdx} className="hover:bg-muted/10">
                                            <td className="px-3 py-2 font-black text-foreground">
                                              {inv.size}
                                            </td>
                                            <td className="px-3 py-2">
                                              <input
                                                type="number"
                                                min="0"
                                                value={inv.stock}
                                                onChange={(e) => handleUpdateSizeStock(cvIdx, inv.size, e.target.value)}
                                                className="w-24 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold outline-none focus:border-primary"
                                              />
                                            </td>
                                            <td className="px-3 py-2">
                                              <input
                                                type="text"
                                                value={inv.sku}
                                                onChange={(e) => handleUpdateSizeSku(cvIdx, inv.size, e.target.value)}
                                                className="w-44 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-mono uppercase outline-none focus:border-primary"
                                              />
                                            </td>
                                            <td className="px-3 py-2">
                                              <span
                                                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${invStatus === "In Stock"
                                                  ? "bg-emerald-500/10 text-emerald-600"
                                                  : invStatus === "Low Stock"
                                                    ? "bg-amber-500/10 text-amber-600"
                                                    : "bg-rose-500/10 text-rose-600"
                                                  }`}
                                              >
                                                {invStatus}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── TAB 4: PRICING & STOCK CALCULATION ── */}
                {productModalTab === "pricing" && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        <span>Base Pricing &amp; Auto Discount</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                            Selling Price (₹) *
                          </label>
                          <input
                            id="input-product-price"
                            type="number"
                            required
                            min="0"
                            value={productForm.price}
                            onChange={(e) => {
                              const newPrice = e.target.value;
                              const newMrp = productForm.mrp || newPrice;
                              setProductForm({
                                ...productForm,
                                price: newPrice,
                                discount: calcDiscount(newPrice, newMrp),
                              });
                            }}
                            placeholder="599"
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-bold outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                            MRP / Original Price (₹)
                          </label>
                          <input
                            id="input-product-mrp"
                            type="number"
                            min="0"
                            value={productForm.mrp}
                            onChange={(e) => {
                              const newMrp = e.target.value;
                              setProductForm({
                                ...productForm,
                                mrp: newMrp,
                                discount: calcDiscount(productForm.price, newMrp),
                              });
                            }}
                            placeholder="799"
                            className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-bold outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                            Calculated Discount
                          </label>
                          <div className="flex items-center h-[38px] px-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs font-black text-emerald-600">
                            {calcDiscount(productForm.price, productForm.mrp || productForm.price)}% OFF
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                            GST / Tax Rate (%)
                          </label>
                          <input
                            id="input-product-gst"
                            type="number"
                            min="0"
                            value={productForm.gst}
                            onChange={(e) => setProductForm({ ...productForm, gst: Number(e.target.value) })}
                            placeholder="5"
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                            Product Badge (Optional)
                          </label>
                          <input
                            id="input-product-badge"
                            type="text"
                            value={productForm.badge}
                            onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                            placeholder="e.g. New, Organic, Best Seller"
                            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Auto-Calculated Total Inventory Stock Box */}
                    {(() => {
                      const totalCalculatedStock = (productForm.colorVariants || []).reduce((sum, cv) => {
                        const cvInv = Array.isArray(cv.inventory) ? cv.inventory : [];
                        return sum + cvInv.reduce((iSum, inv) => iSum + (Math.max(0, parseInt(inv.stock, 10) || 0)), 0);
                      }, 0);

                      const totalVariantsCount = (productForm.colorVariants || []).reduce((sum, cv) => sum + (cv.inventory?.length || 0), 0);
                      const computedStockStatus = getStockStatus(totalCalculatedStock, productForm.lowStockThreshold);

                      return (
                        <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-wider text-primary flex items-center gap-1.5">
                              <Boxes className="h-4 w-4" />
                              <span>Total Product Inventory (Auto-Computed)</span>
                            </h3>
                            <span
                              className={`rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wide border ${computedStockStatus === "In Stock"
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : computedStockStatus === "Low Stock"
                                  ? "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                  : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                }`}
                            >
                              {computedStockStatus}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-border bg-background p-3.5">
                              <p className="text-[11px] font-bold text-muted-foreground uppercase">Sum of Variant Stocks</p>
                              <p className="text-2xl font-black text-foreground mt-0.5">
                                {totalCalculatedStock} <span className="text-xs font-normal text-muted-foreground">total units</span>
                              </p>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                Across {productForm.colorVariants?.length || 0} colors &amp; {totalVariantsCount} size combinations
                              </p>
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                                Low Stock Alert Threshold
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={productForm.lowStockThreshold}
                                onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: Number(e.target.value) })}
                                placeholder="10"
                                className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-bold outline-none focus:border-primary"
                              />
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Triggers "Low Stock" badge when total quantity falls below this value.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Publishing Status
                        </label>
                        <select
                          value={productForm.status}
                          onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none focus:border-primary"
                        >
                          {PRODUCT_STATUSES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAB 5: ADDITIONAL SPECIFICATIONS ── */}
                {productModalTab === "extra" && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Care Instructions
                        </label>
                        <input
                          type="text"
                          value={productForm.careInstructions}
                          onChange={(e) => setProductForm({ ...productForm, careInstructions: e.target.value })}
                          placeholder="Machine wash cold with gentle detergent..."
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Wash Care
                        </label>
                        <input
                          type="text"
                          value={productForm.washCare}
                          onChange={(e) => setProductForm({ ...productForm, washCare: e.target.value })}
                          placeholder="Gentle Hand/Machine Wash"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Country of Origin
                        </label>
                        <input
                          type="text"
                          value={productForm.countryOfOrigin}
                          onChange={(e) => setProductForm({ ...productForm, countryOfOrigin: e.target.value })}
                          placeholder="India"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Manufacturer
                        </label>
                        <input
                          type="text"
                          value={productForm.manufacturer}
                          onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value })}
                          placeholder="Little Sunbeam Kidswear"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Product Weight
                        </label>
                        <input
                          type="text"
                          value={productForm.productWeight}
                          onChange={(e) => setProductForm({ ...productForm, productWeight: e.target.value })}
                          placeholder="e.g. 150g"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Return / Exchange Eligibility
                        </label>
                        <input
                          type="text"
                          value={productForm.returnEligibility}
                          onChange={(e) => setProductForm({ ...productForm, returnEligibility: e.target.value })}
                          placeholder="7-Day Return & Exchange Available"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                          Search Tags (Comma separated)
                        </label>
                        <input
                          type="text"
                          value={productForm.tags}
                          onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                          placeholder="romper, organic, newborn, summer"
                          className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2 text-xs outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Footer Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-border mt-6">
                  <button
                    type="button"
                    onClick={() => setProductModalOpen(false)}
                    className="rounded-full px-5 py-2 text-xs font-bold hover:bg-muted transition"
                  >
                    Cancel
                  </button>

                  <div className="flex items-center gap-2">
                    {productModalTab !== "basic" && (
                      <button
                        type="button"
                        onClick={() => {
                          const tabs = ["basic", "clothing", "pricing", "images", "variants", "extra"];
                          const currIdx = tabs.indexOf(productModalTab);
                          if (currIdx > 0) setProductModalTab(tabs[currIdx - 1]);
                        }}
                        className="rounded-full border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition"
                      >
                        Back
                      </button>
                    )}

                    {productModalTab !== "extra" ? (
                      <button
                        type="button"
                        onClick={() => {
                          const tabs = ["basic", "clothing", "pricing", "images", "variants", "extra"];
                          const currIdx = tabs.indexOf(productModalTab);
                          if (currIdx < tabs.length - 1) setProductModalTab(tabs[currIdx + 1]);
                        }}
                        className="rounded-full bg-secondary px-5 py-2 text-xs font-bold text-foreground hover:bg-secondary/80 transition"
                      >
                        Next Step →
                      </button>
                    ) : null}

                    <button
                      type="submit"
                      disabled={productSaving}
                      className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-black text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition disabled:opacity-50"
                    >
                      {productSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>{editingProduct ? "Save Changes" : "Create Product"}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── ADD/EDIT CATEGORY MODAL ────────────────────────────────────── */}
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h2 className="text-lg font-black">
                  {editingCategory ? "Edit Category" : "Add New Store Category"}
                </h2>
                <button
                  onClick={() => setCategoryModalOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g. Organic Sleepwear"
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Ultra-soft newborn nightsuits and sleep bags..."
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                {/* Category Image Upload */}
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase text-muted-foreground">
                    Category Image
                  </label>
                  <input
                    type="file"
                    ref={categoryFileInputRef}
                    accept="image/*"
                    onChange={handleCategoryImageUpload}
                    className="hidden"
                  />

                  <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-3.5">
                    <div className="flex items-center gap-3">
                      {categoryForm.image ? (
                        <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border shrink-0 bg-background">
                          <img
                            src={categoryForm.image}
                            alt="Category preview"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setCategoryForm({ ...categoryForm, image: "" })}
                            className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="grid h-14 w-14 place-items-center rounded-xl border border-dashed border-border bg-muted/50 text-muted-foreground shrink-0">
                          <ImageIcon className="h-5 w-5" />
                        </div>
                      )}

                      <div className="flex-1 space-y-1">
                        <button
                          type="button"
                          disabled={categoryImageUploading}
                          onClick={() => categoryFileInputRef.current?.click()}
                          className="flex items-center gap-2 rounded-xl bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground border border-border transition disabled:opacity-50"
                        >
                          {categoryImageUploading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="h-3.5 w-3.5 text-primary" />
                              <span>Upload Image File</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={categoryForm.image}
                      onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                      placeholder="Or paste category image URL..."
                      className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Inline Subcategories Manager */}
                <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-muted-foreground">
                      Subcategories ({(categoryForm.subCategories || []).length})
                    </label>
                    <span className="text-[10px] text-muted-foreground">Optional, dropdown in navbar</span>
                  </div>

                  {/* Add inline subcategory input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inlineSubName}
                      onChange={(e) => setInlineSubName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddInlineSubCategory();
                        }
                      }}
                      placeholder="e.g. Newborn Swaddles..."
                      className="flex-1 rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddInlineSubCategory}
                      className="rounded-xl bg-secondary hover:bg-secondary/80 px-3 py-1.5 text-xs font-bold text-foreground border border-border transition shrink-0"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Current Subcategories list */}
                  {(categoryForm.subCategories || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(categoryForm.subCategories || []).map((sub, sIdx) => {
                        const subName = typeof sub === "string" ? sub : sub.name;
                        return (
                          <div
                            key={sIdx}
                            className="inline-flex items-center gap-1 rounded-lg bg-card border border-border px-2.5 py-1 text-xs font-semibold text-foreground shadow-2xs"
                          >
                            <span>{subName}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveInlineSubCategory(sIdx)}
                              className="text-muted-foreground hover:text-destructive transition ml-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">
                      No subcategories added yet. Type above and press Add.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={categoryForm.order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, order: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(false)}
                    className="rounded-full px-5 py-2 text-xs font-bold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90"
                  >
                    {editingCategory ? "Save Category" : "Create Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── ADD/EDIT SUBCATEGORY MODAL ──────────────────────────────────── */}
        {subCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-lg font-black">
                    {editingSubCategory ? "Edit Subcategory" : "Add New Subcategory"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Link subcategory to parent category for dynamic navbar dropdowns and filtering.
                  </p>
                </div>
                <button
                  onClick={() => setSubCategoryModalOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSubCategory} className="mt-5 space-y-4">
                {/* Parent Category Selector */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Parent Category *
                  </label>
                  <select
                    required
                    value={subCategoryParentCat?._id || subCategoryParentCat?.id || subCategoryParentCat?.slug || ""}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const found = categoriesList.find(
                        (c) =>
                          String(c._id) === selectedVal ||
                          c.id === selectedVal ||
                          c.slug === selectedVal ||
                          c.name === selectedVal
                      );
                      setSubCategoryParentCat(found || null);
                    }}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-sm font-semibold outline-none focus:border-primary"
                  >
                    <option value="" disabled>Select Parent Category</option>
                    {categoriesList.map((c) => (
                      <option key={c._id || c.id || c.name} value={c._id || c.id || c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Name */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Subcategory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={subCategoryForm.name}
                    onChange={(e) => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })}
                    placeholder="e.g. Muslin Swaddles, Hospital Delivery Box"
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                {/* Subcategory Description */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={subCategoryForm.description}
                    onChange={(e) => setSubCategoryForm({ ...subCategoryForm, description: e.target.value })}
                    placeholder="Brief description of this subcategory..."
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                {/* Display Order */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-muted-foreground">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={subCategoryForm.order}
                    onChange={(e) => setSubCategoryForm({ ...subCategoryForm, order: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setSubCategoryModalOpen(false)}
                    className="rounded-full px-5 py-2 text-xs font-bold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90"
                  >
                    {editingSubCategory ? "Save Subcategory" : "Create Subcategory"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── ORDER DETAILS MODAL ────────────────────────────────────────── */}
        {orderDetailModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-lg font-black">{selectedOrder.orderNumber}</h2>
                  <p className="text-xs text-muted-foreground">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <button
                  onClick={() => setOrderDetailModalOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-6">
                {/* Order Status Controller */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/40 p-4">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase">
                      Order Status
                    </span>
                    <p className="text-sm font-extrabold text-foreground mt-0.5">
                      {selectedOrder.orderStatus}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"].map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() =>
                            handleUpdateOrderStatus(
                              selectedOrder._id || selectedOrder.orderNumber,
                              st
                            )
                          }
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${selectedOrder.orderStatus === st
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border hover:bg-muted"
                            }`}
                        >
                          {st}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Purchased Items
                  </h3>
                  <div className="divide-y divide-border rounded-2xl border border-border bg-card p-4">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-12 w-12 rounded-xl object-cover border border-border shrink-0"
                          />
                          <div>
                            <p className="text-sm font-bold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ""}{" "}
                              {item.color ? `• Color: ${item.color}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className="font-extrabold text-sm">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <h4 className="text-xs font-black uppercase text-muted-foreground mb-2">
                      Shipping Address
                    </h4>
                    <p className="font-bold text-sm">
                      {selectedOrder.shippingAddress?.name || selectedOrder.user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedOrder.shippingAddress?.address}
                      <br />
                      {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} -{" "}
                      {selectedOrder.shippingAddress?.pincode}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      📞 {selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-muted-foreground mb-2">
                        Payment Info
                      </h4>
                      <p className="text-xs font-semibold">Method: {selectedOrder.paymentMethod}</p>
                      <p className="text-xs font-semibold mt-1">
                        Status:{" "}
                        <span
                          className={`font-bold ${selectedOrder.paymentStatus === "Paid"
                            ? "text-emerald-600"
                            : "text-amber-600"
                            }`}
                        >
                          {selectedOrder.paymentStatus}
                        </span>
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                      <span className="font-bold text-sm">Grand Total:</span>
                      <span className="text-lg font-black text-primary">
                        ₹{selectedOrder.totalAmount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tax Invoice Generation Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-muted/40 p-4 border border-border">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Tax Invoice & Documentation
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Download or print official GST-compliant tax invoice for this order.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleViewInvoice(selectedOrder)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Tax Invoice</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintInvoice(selectedOrder)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition cursor-pointer shadow-2xs"
                    >
                      <Printer className="h-4 w-4 text-muted-foreground" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── CUSTOMER DETAILS & SHIPPING ADDRESS MODAL ────────────────── */}
        {customerModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center border border-primary/20">
                    {(selectedCustomer.name || "C")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground">{selectedCustomer.name || "Customer"}</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selectedCustomer.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setCustomerModalOpen(false);
                    setSelectedCustomer(null);
                  }}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6 pt-6">
                {/* 2-Grid: Customer Info & Shipping Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account Overview */}
                  <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-primary" /> Customer Account
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Full Name</span>
                        <p className="font-bold text-foreground">{selectedCustomer.name || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Email Address</span>
                        <p className="font-semibold text-foreground">{selectedCustomer.email || "—"}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Phone Number</span>
                        <p className="font-semibold text-foreground">
                          {selectedCustomer.phone || selectedCustomer.shippingAddress?.phone || selectedCustomer.address?.phone || "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Role</span>
                        <span
                          className={`inline-block mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-black uppercase ${
                            selectedCustomer.role === "admin"
                              ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                              : "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                          }`}
                        >
                          {selectedCustomer.role === "admin" ? "Administrator" : "Customer"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase font-bold">Registered On</span>
                        <p className="text-muted-foreground">
                          {new Date(selectedCustomer.createdAt || Date.now()).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Complete Shipping Address Card */}
                  {(() => {
                    const addr = selectedCustomer.shippingAddress || selectedCustomer.address || {};
                    const street = addr.street || addr.address || "";
                    const city = addr.city || "";
                    const state = addr.state || "";
                    const pincode = addr.pincode || "";
                    const country = addr.country || "India";
                    const recipientName = addr.name || selectedCustomer.name || "";
                    const recipientPhone = addr.phone || selectedCustomer.phone || "";
                    const recipientEmail = addr.email || selectedCustomer.email || "";
                    const hasAddr = Boolean(street || city || pincode);
                    const modalCopied = copiedAddressId === "modal_" + (selectedCustomer._id || selectedCustomer.email);

                    return (
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-emerald-600" /> Complete Shipping Address
                          </h3>
                          {hasAddr && (
                            <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider">
                              Verified
                            </span>
                          )}
                        </div>

                        {hasAddr ? (
                          <div className="space-y-2 text-xs">
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Full Name</span>
                              <p className="font-bold text-foreground">{recipientName || "—"}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Phone Number</span>
                                <p className="font-semibold text-foreground">{recipientPhone || "—"}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Email</span>
                                <p className="font-semibold text-foreground truncate">{recipientEmail || "—"}</p>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Street Address / House No.</span>
                              <p className="font-bold text-foreground">{street || "—"}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">City</span>
                                <p className="font-semibold text-foreground">{city || "—"}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">State</span>
                                <p className="font-semibold text-foreground">{state || "—"}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px] uppercase font-bold">PIN Code</span>
                                <p className="font-black text-foreground">{pincode || "—"}</p>
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px] uppercase font-bold">Country</span>
                              <p className="font-semibold text-foreground">{country}</p>
                            </div>

                            <button
                              onClick={() => copyAddressToClipboard(selectedCustomer, "modal_" + (selectedCustomer._id || selectedCustomer.email))}
                              className={`w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                                modalCopied
                                  ? "bg-emerald-600 text-white"
                                  : "bg-card border border-border text-foreground hover:bg-muted"
                              }`}
                            >
                              {modalCopied ? (
                                <>
                                  <Check className="h-3.5 w-3.5" /> Address Copied to Clipboard!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5 text-emerald-600" /> Copy Complete Shipping Address
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="py-6 text-center text-muted-foreground space-y-1">
                            <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto opacity-70" />
                            <p className="text-xs font-bold text-foreground">No Shipping Address on File</p>
                            <p className="text-[11px]">This customer has not saved a shipping address yet.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Orders History Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4 text-primary" /> Order History ({selectedCustomer.orders?.length || 0})
                    </h3>
                    <span className="text-xs font-extrabold text-emerald-700">
                      Total Spent: ₹{(selectedCustomer.totalSpent || 0).toLocaleString()}
                    </span>
                  </div>

                  {(!selectedCustomer.orders || selectedCustomer.orders.length === 0) ? (
                    <div className="rounded-2xl border border-border bg-muted/20 p-6 text-center text-muted-foreground">
                      <p className="text-xs font-semibold">No orders placed by this customer yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-border bg-card">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted/50 border-b border-border text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          <tr>
                            <th className="px-3.5 py-2.5">Order ID</th>
                            <th className="px-3.5 py-2.5">Date</th>
                            <th className="px-3.5 py-2.5">Items</th>
                            <th className="px-3.5 py-2.5">Total</th>
                            <th className="px-3.5 py-2.5">Status</th>
                            <th className="px-3.5 py-2.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {selectedCustomer.orders.map((ord) => (
                            <tr key={ord._id || ord.orderNumber} className="hover:bg-muted/20 transition">
                              <td className="px-3.5 py-2.5 font-bold font-mono text-primary">
                                {ord.orderNumber}
                              </td>
                              <td className="px-3.5 py-2.5 text-muted-foreground">
                                {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="px-3.5 py-2.5 text-foreground font-semibold">
                                {ord.itemsCount} {ord.itemsCount === 1 ? "item" : "items"}
                              </td>
                              <td className="px-3.5 py-2.5 font-black text-foreground">
                                ₹{ord.totalAmount}
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                                    ord.orderStatus === "Delivered"
                                      ? "bg-emerald-500/10 text-emerald-600"
                                      : ord.orderStatus === "Cancelled"
                                      ? "bg-destructive/10 text-destructive"
                                      : ord.orderStatus === "Shipped"
                                      ? "bg-purple-500/10 text-purple-600"
                                      : "bg-amber-500/10 text-amber-600"
                                  }`}
                                >
                                  {ord.orderStatus}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 text-right">
                                <button
                                  onClick={() => {
                                    const fullOrd = ordersList.find(
                                      (o) => String(o._id) === String(ord._id) || o.orderNumber === ord.orderNumber
                                    );
                                    if (fullOrd) {
                                      setSelectedOrder(fullOrd);
                                      setCustomerModalOpen(false);
                                      setOrderDetailModalOpen(true);
                                    }
                                  }}
                                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                >
                                  View Order →
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── DELETE PRODUCT CONFIRMATION MODAL ─────────────────────────── */}
        {deleteConfirmModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black">Delete Product?</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Are you sure you want to delete "{deleteConfirmModal.product?.name}"? This action cannot
                be undone.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirmModal({ open: false, product: null })}
                  className="rounded-full border border-border px-5 py-2 text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteProduct}
                  className="rounded-full bg-destructive px-5 py-2 text-xs font-bold text-destructive-foreground shadow hover:bg-destructive/90"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── INVOICE PREVIEW MODAL ──────────────────────────────────────── */}
        <InvoiceModal
          isOpen={invoiceModalOpen}
          order={invoiceOrder}
          onClose={() => {
            setInvoiceModalOpen(false);
            setInvoiceOrder(null);
          }}
          storeInfo={footerInfo}
        />
      </div>
    </div>
  );
}
