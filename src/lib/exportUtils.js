import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import lsbLogo from "@/assets/LSB_Logo1.jpg";

const DEFAULT_STORE_INFO = {
  name: "Little Sunbeam Baby Clothing",
  tagline: "Premium Organic Essentials for Newborns & Toddlers",
  email: "littlesunbeamkidswear@gmail.com",
  phone: "+91 93615 03943",
  address: "1/95m Bandari Nagar, Veerapandi, Tirupur, Tamil Nadu - 641605",
  website: "www.littlesunbeam.com",
  gstin: "33AAAAA0000A1Z5",
};

/**
 * Format currency helper
 */
export const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `₹${num.toLocaleString("en-IN")}`;
};

/**
 * Format date helper
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateStr);
  }
};

/**
 * Helper to safely convert an image URL or asset into a base64 Data URL for jsPDF
 */
const loadImageDataUrl = (src) => {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 300;
        canvas.height = img.naturalHeight || img.height || 180;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        resolve({ dataUrl, width: canvas.width, height: canvas.height });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. EXPORT ORDERS TO EXCEL (.xlsx)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const exportOrdersToExcel = (orders = [], filename = "orders_export.xlsx") => {
  if (!orders || orders.length === 0) {
    throw new Error("No orders to export.");
  }

  const rows = orders.map((ord, idx) => {
    const customerName =
      ord.shippingAddress?.name ||
      ord.user?.name ||
      ord.customerName ||
      "Guest Customer";
    const customerEmail = ord.shippingAddress?.email || ord.user?.email || "N/A";
    const customerPhone =
      ord.shippingAddress?.phone || ord.user?.phone || ord.customerPhone || "N/A";

    const fullAddress = [
      ord.shippingAddress?.address || ord.shippingAddress?.street,
      ord.shippingAddress?.city,
      ord.shippingAddress?.state,
      ord.shippingAddress?.pincode,
    ]
      .filter(Boolean)
      .join(", ");

    const itemsSummary = (ord.items || [])
      .map(
        (it) =>
          `${it.name} (x${it.quantity || 1}${it.size ? ` / ${it.size}` : ""}${
            it.color ? ` / ${it.color}` : ""
          } @ ₹${it.price})`
      )
      .join("; ");

    return {
      "S.No": idx + 1,
      "Order Number": ord.orderNumber || `ORD-${ord._id?.slice(-6) || idx + 1}`,
      "Order Date": formatDate(ord.createdAt),
      "Customer Name": customerName,
      "Customer Email": customerEmail,
      "Customer Phone": customerPhone,
      "Shipping Address": fullAddress || "N/A",
      "Total Items": (ord.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0),
      "Items Details": itemsSummary,
      "Payment Method": ord.paymentMethod || "Online",
      "Payment Status": ord.paymentStatus || "Paid",
      "Order Status": ord.orderStatus || "Processing",
      "Subtotal (₹)": ord.subtotal || ord.itemsPrice || ord.totalAmount || 0,
      "Shipping Fee (₹)": ord.shippingPrice || 0,
      "Discount (₹)": ord.discount || 0,
      "Total Amount (₹)": ord.totalAmount || 0,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = [
    { wch: 6 },  // S.No
    { wch: 18 }, // Order Number
    { wch: 20 }, // Order Date
    { wch: 22 }, // Customer Name
    { wch: 26 }, // Customer Email
    { wch: 16 }, // Customer Phone
    { wch: 38 }, // Shipping Address
    { wch: 12 }, // Total Items
    { wch: 45 }, // Items Details
    { wch: 16 }, // Payment Method
    { wch: 15 }, // Payment Status
    { wch: 15 }, // Order Status
    { wch: 14 }, // Subtotal
    { wch: 16 }, // Shipping Fee
    { wch: 14 }, // Discount
    { wch: 16 }, // Total Amount
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
  return true;
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. EXPORT ORDERS TO PDF (.pdf)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const exportOrdersToPdf = async (
  orders = [],
  filterLabel = "All Orders",
  storeInfo = DEFAULT_STORE_INFO
) => {
  if (!orders || orders.length === 0) {
    throw new Error("No orders to export.");
  }

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const info = { ...DEFAULT_STORE_INFO, ...storeInfo };

  // 1. Top Decorative Brand Bar
  doc.setFillColor(249, 115, 22); // Little Sunbeam Warm Orange
  doc.rect(0, 0, 297, 26, "F");

  // Logo integration
  const logoObj = await loadImageDataUrl(lsbLogo);
  if (logoObj?.dataUrl) {
    try {
      doc.addImage(logoObj.dataUrl, "PNG", 14, 3, 30, 20);
    } catch { }
  }

  const textStartX = logoObj?.dataUrl ? 48 : 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(info.name.toUpperCase(), textStartX, 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 245, 235);
  doc.text(`${info.tagline}  •  ${info.phone}  •  ${info.email}`, textStartX, 18);

  // Report Info Bar
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Orders Report: ${filterLabel}`, 14, 35);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const nowStr = new Date().toLocaleString("en-IN");
  doc.text(`Generated on: ${nowStr}  |  Total Orders: ${orders.length}`, 14, 41);

  // Summary Metrics Cards
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const deliveredCount = orders.filter((o) => (o.orderStatus || "").toLowerCase() === "delivered").length;
  const pendingCount = orders.filter(
    (o) =>
      (o.orderStatus || "").toLowerCase() === "pending" ||
      (o.orderStatus || "").toLowerCase() === "processing"
  ).length;

  const drawCard = (x, y, w, h, label, val, color, bg = [255, 251, 235]) => {
    doc.setFillColor(...bg);
    doc.setDrawColor(253, 230, 138); // Golden amber border
    doc.roundedRect(x, y, w, h, 2, 2, "FD");

    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), x + 4, y + 6);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(val, x + 4, y + 13);
  };

  drawCard(14, 45, 62, 16, "Total Orders", `${orders.length}`, [30, 41, 59], [248, 250, 252]);
  drawCard(80, 45, 65, 16, "Total Revenue", `₹${totalRevenue.toLocaleString("en-IN")}`, [234, 88, 12]);
  drawCard(149, 45, 64, 16, "Delivered", `${deliveredCount} Orders`, [16, 185, 129], [240, 253, 244]);
  drawCard(217, 45, 66, 16, "Pending / Processing", `${pendingCount} Orders`, [217, 119, 6]);

  // Table Data
  const tableData = orders.map((ord, idx) => {
    const custName = ord.shippingAddress?.name || ord.user?.name || "Guest";
    const custPhone = ord.shippingAddress?.phone || ord.user?.phone || "";
    const itemsCount = (ord.items || []).reduce((s, it) => s + (it.quantity || 1), 0);
    const dateFormatted = new Date(ord.createdAt || Date.now()).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return [
      idx + 1,
      ord.orderNumber || `ORD-${idx + 1}`,
      dateFormatted,
      `${custName}\n${custPhone}`,
      `${itemsCount} item(s)`,
      ord.paymentMethod || "Online",
      ord.paymentStatus || "Paid",
      ord.orderStatus || "Processing",
      `₹${(ord.totalAmount || 0).toLocaleString("en-IN")}`,
    ];
  });

  autoTable(doc, {
    startY: 65,
    head: [
      [
        "#",
        "Order No",
        "Date",
        "Customer",
        "Items",
        "Payment",
        "Pay Status",
        "Order Status",
        "Amount",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42], // Deep Charcoal Navy
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 32, fontStyle: "bold" },
      2: { cellWidth: 26 },
      3: { cellWidth: 50 },
      4: { cellWidth: 25, halign: "center" },
      5: { cellWidth: 30 },
      6: { cellWidth: 26, halign: "center" },
      7: { cellWidth: 30, halign: "center" },
      8: { cellWidth: 35, halign: "right", fontStyle: "bold", textColor: [234, 88, 12] },
    },
    alternateRowStyles: {
      fillColor: [255, 251, 235], // Soft cream highlight
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()} • Little Sunbeam Baby Clothing Report`,
        14,
        202
      );
    },
  });

  const cleanLabel = filterLabel.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  doc.save(`little_sunbeam_orders_${cleanLabel}_${Date.now()}.pdf`);
  return true;
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. EXPORT CUSTOMERS TO EXCEL (.xlsx)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const exportCustomersToExcel = (
  customers = [],
  filename = "customers_export.xlsx"
) => {
  if (!customers || customers.length === 0) {
    throw new Error("No customers to export.");
  }

  const rows = customers.map((c, idx) => {
    const primaryAddr =
      c.shippingAddress?.address ||
      c.shippingAddress?.street ||
      c.address?.street ||
      c.address?.address ||
      c.street ||
      "";
    const city = c.shippingAddress?.city || c.address?.city || c.city || "";
    const state = c.shippingAddress?.state || c.address?.state || c.state || "";
    const pincode = c.shippingAddress?.pincode || c.address?.pincode || c.pincode || "";

    const fullAddress = [primaryAddr, city, state, pincode].filter(Boolean).join(", ");

    return {
      "S.No": idx + 1,
      "Customer Name": c.name || "Customer",
      "Email Address": c.email || "N/A",
      "Phone Number": c.phone || "N/A",
      "Role": (c.role || "user").toUpperCase(),
      "Total Orders": c.ordersCount ?? (c.orders?.length || 0),
      "Total Spent (₹)": c.totalSpent || 0,
      "Primary Address": fullAddress || "No saved address",
      "City": city || "N/A",
      "State": state || "N/A",
      "PIN Code": pincode || "N/A",
      "Joined Date": formatDate(c.createdAt),
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = [
    { wch: 6 },  // S.No
    { wch: 24 }, // Name
    { wch: 28 }, // Email
    { wch: 16 }, // Phone
    { wch: 10 }, // Role
    { wch: 14 }, // Total Orders
    { wch: 16 }, // Total Spent
    { wch: 42 }, // Address
    { wch: 18 }, // City
    { wch: 18 }, // State
    { wch: 12 }, // Pincode
    { wch: 20 }, // Joined Date
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

  XLSX.writeFile(
    workbook,
    filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
  );
  return true;
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 4. EXPORT CUSTOMERS TO PDF (.pdf)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const exportCustomersToPdf = async (
  customers = [],
  storeInfo = DEFAULT_STORE_INFO
) => {
  if (!customers || customers.length === 0) {
    throw new Error("No customers to export.");
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const info = { ...DEFAULT_STORE_INFO, ...storeInfo };

  // Header Banner with Little Sunbeam warm color
  doc.setFillColor(249, 115, 22);
  doc.rect(0, 0, 210, 24, "F");

  // Logo integration
  const logoObj = await loadImageDataUrl(lsbLogo);
  if (logoObj?.dataUrl) {
    try {
      doc.addImage(logoObj.dataUrl, "PNG", 14, 3, 26, 18);
    } catch { }
  }

  const textStartX = logoObj?.dataUrl ? 44 : 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(info.name.toUpperCase(), textStartX, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 245, 235);
  doc.text(`Customer Directory & Accounts • Little Sunbeam`, textStartX, 16);

  // Subhead
  doc.setTextColor(30, 41, 59);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Registered Customers Summary", 14, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}  |  Total: ${customers.length} Accounts`, 14, 37);

  // Summary Metrics
  const totalSpentAll = customers.reduce((s, c) => s + (Number(c.totalSpent) || 0), 0);
  const totalOrdersAll = customers.reduce(
    (s, c) => s + (c.ordersCount ?? (c.orders?.length || 0)),
    0
  );

  const drawCard = (x, y, w, h, label, val, color) => {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(x, y, w, h, 2, 2, "FD");

    doc.setFontSize(7);
    doc.setTextColor(146, 64, 14);
    doc.setFont("helvetica", "bold");
    doc.text(label.toUpperCase(), x + 3, y + 5);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...color);
    doc.text(val, x + 3, y + 11);
  };

  drawCard(14, 41, 56, 14, "Total Customers", `${customers.length}`, [30, 41, 59]);
  drawCard(74, 41, 58, 14, "Total Orders", `${totalOrdersAll}`, [2, 132, 199]);
  drawCard(136, 41, 60, 14, "Total Customer Spend", `₹${totalSpentAll.toLocaleString("en-IN")}`, [234, 88, 12]);

  // Table Data
  const tableData = customers.map((c, idx) => {
    const city =
      c.shippingAddress?.city || c.address?.city || c.city || "N/A";
    const state =
      c.shippingAddress?.state || c.address?.state || c.state || "";
    const loc = state ? `${city}, ${state}` : city;
    const ordersCount = c.ordersCount ?? (c.orders?.length || 0);

    return [
      idx + 1,
      c.name || "Customer",
      `${c.email || "N/A"}\n${c.phone || "N/A"}`,
      loc,
      ordersCount,
      `₹${(c.totalSpent || 0).toLocaleString("en-IN")}`,
      c.createdAt
        ? new Date(c.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "N/A",
    ];
  });

  autoTable(doc, {
    startY: 59,
    head: [["#", "Customer Name", "Contact", "Location", "Orders", "Total Spent", "Joined Date"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85],
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center" },
      1: { cellWidth: 36, fontStyle: "bold" },
      2: { cellWidth: 46 },
      3: { cellWidth: 32 },
      4: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      5: { cellWidth: 24, halign: "right", fontStyle: "bold", textColor: [234, 88, 12] },
      6: { cellWidth: 20, halign: "center" },
    },
    alternateRowStyles: {
      fillColor: [255, 251, 235],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()} • Little Sunbeam Customer Report`,
        14,
        290
      );
    },
  });

  doc.save(`little_sunbeam_customers_${Date.now()}.pdf`);
  return true;
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 5. GENERATE TAX INVOICE PDF (.pdf) - With Little Sunbeam Logo & Theme Colors
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const generateInvoicePdf = async (order, storeInfo = DEFAULT_STORE_INFO) => {
  if (!order) {
    throw new Error("Order data is required to generate an invoice.");
  }

  const info = { ...DEFAULT_STORE_INFO, ...storeInfo };
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const invoiceNo =
    order.invoiceNumber ||
    `INV-${order.orderNumber?.replace(/[^a-zA-Z0-9]/g, "") || Date.now()}`;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  // 1. Top Decorative Brand Bar (Gradient Warm Orange)
  doc.setFillColor(249, 115, 22); // #F97316
  doc.rect(0, 0, 210, 5, "F");

  // 2. Header: Logo & Store Details (Left) + Tax Invoice & Meta (Right)
  const logoObj = await loadImageDataUrl(lsbLogo);
  if (logoObj?.dataUrl) {
    try {
      // Rounded Card Backing for Logo
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(254, 215, 170); // #FED7AA
      doc.roundedRect(14, 10, 32, 22, 2, 2, "FD");
      doc.addImage(logoObj.dataUrl, "PNG", 15, 11, 30, 20);
    } catch { }
  }

  const storeX = logoObj?.dataUrl ? 50 : 14;

  // Store Brand & Contact Information (Left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(234, 88, 12); // Warm Brand Orange
  doc.text(info.name.toUpperCase(), storeX, 15);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(info.tagline, storeX, 19.5, { maxWidth: 74 });
  doc.text(info.address, storeX, 23.5, { maxWidth: 74 });
  doc.text(`Phone: ${info.phone}  •  Email: ${info.email}`, storeX, 27.5, { maxWidth: 74 });
  doc.text(`GSTIN: ${info.gstin}  •  ${info.website}`, storeX, 31.5, { maxWidth: 74 });

  // TAX INVOICE Header & Metadata (Right Aligned to Margin 196)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(15, 23, 42); // Charcoal Navy
  doc.text("TAX INVOICE", 196, 16, { align: "right" });

  doc.setFontSize(8.5);
  doc.setTextColor(234, 88, 12);
  doc.setFont("helvetica", "bold");
  doc.text("Invoice #:", 160, 21.5, { align: "right" });
  doc.setTextColor(15, 23, 42);
  doc.text(invoiceNo, 196, 21.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`Order #: ${order.orderNumber || "ORD-DEFAULT"}`, 196, 26, { align: "right" });
  doc.text(`Date: ${orderDate}`, 196, 30.5, { align: "right" });

  // Payment Status Pill (Right Aligned)
  const isPaid = (order.paymentStatus || "").toLowerCase() === "paid";
  const pillText = isPaid
    ? `${(order.paymentStatus || "PAID").toUpperCase()} • ${(order.paymentMethod || "ONLINE").toUpperCase()}`
    : `${(order.paymentStatus || "PENDING").toUpperCase()} • ${(order.paymentMethod || "COD").toUpperCase()}`;

  if (isPaid) {
    doc.setFillColor(220, 252, 231); // emerald-100
    doc.setDrawColor(187, 247, 208); // emerald-200
    doc.roundedRect(154, 32.5, 42, 5.5, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(22, 101, 52); // emerald-800
    doc.text(pillText, 175, 36.3, { align: "center" });
  } else {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.setDrawColor(253, 230, 138); // amber-200
    doc.roundedRect(154, 32.5, 42, 5.5, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(180, 83, 9); // amber-800
    doc.text(pillText, 175, 36.3, { align: "center" });
  }

  // Divider Line in warm gold accent
  doc.setDrawColor(254, 215, 170); // Warm orange-200
  doc.setLineWidth(0.6);
  doc.line(14, 40, 196, 40);

  // 3. Customer Billing & Shipping Info (Two Equal Symmetrical Cards)
  const custName =
    order.shippingAddress?.name ||
    order.user?.name ||
    order.customerName ||
    "Valued Customer";
  const custEmail = order.shippingAddress?.email || order.user?.email || "N/A";
  const custPhone =
    order.shippingAddress?.phone || order.user?.phone || order.customerPhone || "N/A";
  const custStreet =
    order.shippingAddress?.address ||
    order.shippingAddress?.street ||
    order.address?.street ||
    "";
  const custCity = order.shippingAddress?.city || order.address?.city || "";
  const custState = order.shippingAddress?.state || order.address?.state || "";
  const custPin =
    order.shippingAddress?.pincode ||
    order.shippingAddress?.postalCode ||
    order.address?.pincode ||
    "";
  const fullAddress = [
    custStreet,
    custCity,
    custState,
    custPin,
  ]
    .filter(Boolean)
    .join(", ");

  // Left Card: Billed To / Customer Details
  doc.setFillColor(255, 251, 235); // #FFFBEB
  doc.setDrawColor(253, 230, 138); // #FDE68A
  doc.roundedRect(14, 44, 88, 33, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9); // #B45309 Warm Gold
  doc.text("BILLED TO / CUSTOMER DETAILS", 18, 49.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(custName, 18, 54.5, { maxWidth: 80 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Phone: ${custPhone}`, 18, 59.5, { maxWidth: 80 });
  doc.text(`Email: ${custEmail}`, 18, 64.5, { maxWidth: 80 });
  doc.text(
    custCity ? `${[custCity, custState].filter(Boolean).join(", ")}${custPin ? ` - ${custPin}` : ""}` : "India",
    18,
    69.5,
    { maxWidth: 80 }
  );

  // Right Card: Shipping & Delivery Info
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(108, 44, 88, 33, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text("SHIPPING & DELIVERY INFO", 112, 49.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Deliver to: ${fullAddress || "Standard Delivery Address"}`, 112, 54.5, { maxWidth: 80 });
  doc.text(
    `Payment Method: ${order.paymentMethod || "Online"} (${order.paymentStatus || "Paid"})`,
    112,
    62.5,
    { maxWidth: 80 }
  );
  doc.text(
    `Fulfillment Status: ${order.orderStatus || "Confirmed"}`,
    112,
    68.5,
    { maxWidth: 80 }
  );

  // 4. Line Items Table
  const items = order.items || [];
  const tableRows = items.map((it, idx) => {
    const qty = it.quantity || 1;
    const price = Number(it.price) || 0;
    const total = qty * price;
    const variantStr = [
      it.size ? `Size: ${it.size}` : "",
      it.color ? `Color: ${it.color}` : "",
    ]
      .filter(Boolean)
      .join(" • ");

    return [
      idx + 1,
      `${it.name}${variantStr ? `\n${variantStr}` : ""}`,
      `HSN-6111`, // Standard Baby Apparel HSN
      qty,
      `₹${price.toLocaleString("en-IN")}`,
      `₹${total.toLocaleString("en-IN")}`,
    ];
  });

  autoTable(doc, {
    startY: 81,
    head: [["#", "Item Description", "HSN Code", "Qty", "Unit Price", "Total Amount"]],
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [15, 23, 42], // Deep Charcoal
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 82, halign: "left" },
      2: { cellWidth: 24, halign: "center", textColor: [100, 116, 139] },
      3: { cellWidth: 16, halign: "center", fontStyle: "bold" },
      4: { cellWidth: 25, halign: "right" },
      5: { cellWidth: 25, halign: "right", fontStyle: "bold", textColor: [234, 88, 12] },
    },
    alternateRowStyles: {
      fillColor: [255, 251, 235], // Soft cream
    },
    margin: { left: 14, right: 14 },
  });

  // 5. Calculations Summary Box (Right Aligned below table)
  const finalY = doc.lastAutoTable?.finalY || 140;

  // Subtotals
  const subtotal = order.subtotal || order.itemsPrice || order.totalAmount || 0;
  const shippingFee = Number(order.shippingPrice) || 0;
  const discount = Number(order.discount) || 0;
  const grandTotal = Number(order.totalAmount) || subtotal + shippingFee - discount;
  const gstAmount = Math.round((grandTotal * 5) / 105);

  let curY = finalY + 6;

  // Page Overflow Guard
  if (curY + 50 > 275) {
    doc.addPage();
    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, 210, 5, "F");
    curY = 16;
  }

  const summaryX = 118;
  const summaryWidth = 78;
  const boxHeight = discount > 0 ? 36 : 32;

  // Notes Box on left with warm yellow styling (Matches Modal)
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(14, curY, 96, boxHeight, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.text("CUSTOMER NOTE & CARE PROMISE", 18, curY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  doc.text(
    "• 7-day hassle-free exchange on baby clothing with tags intact.",
    18,
    curY + 11.5
  );
  doc.text(
    "• Crafted with 100% pure breathable organic cotton for delicate baby skin.",
    18,
    curY + 16.5
  );
  doc.text(
    `• Need help? Contact customer support at ${info.phone}.`,
    18,
    curY + 21.5
  );
  doc.text(
    "• This is a computer-generated tax invoice. No signature required.",
    18,
    curY + 26.5
  );

  // Right Calculations Container Box (Matches Modal)
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(summaryX, curY, summaryWidth, boxHeight, 2, 2, "FD");

  let rY = curY + 6;
  const drawRow = (label, val, isBold = false, isHighlight = false, color = [71, 85, 105]) => {
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(isHighlight ? 9.5 : 8);
    doc.setTextColor(...color);
    doc.text(label, summaryX + 4, rY);
    doc.text(val, 192, rY, { align: "right" });
    rY += 5.5;
  };

  drawRow("Subtotal:", `₹${Number(subtotal).toLocaleString("en-IN")}`);
  if (shippingFee > 0) {
    drawRow("Shipping Fee:", `₹${shippingFee.toLocaleString("en-IN")}`);
  } else {
    drawRow("Shipping Fee:", "FREE", false, false, [22, 101, 52]);
  }
  if (discount > 0) {
    drawRow("Discount:", `-₹${discount.toLocaleString("en-IN")}`, false, false, [22, 163, 74]);
  }

  // Tax line (GST included)
  drawRow("GST (5% Included):", `₹${gstAmount.toLocaleString("en-IN")}`, false, false, [180, 83, 9]);

  // Divider
  doc.setDrawColor(254, 215, 170);
  doc.line(summaryX + 2, rY - 1.5, 194, rY - 1.5);
  rY += 1.5;

  // Grand Total Box in Little Sunbeam Highlight Color
  doc.setFillColor(255, 237, 213); // #FFEDD5
  doc.setDrawColor(249, 115, 22); // #F97316
  doc.roundedRect(summaryX + 2, rY - 2.5, summaryWidth - 4, 8, 1.5, 1.5, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(194, 65, 12); // #C2410C
  doc.text("Grand Total:", summaryX + 5, rY + 3);
  doc.text(`₹${Number(grandTotal).toLocaleString("en-IN")}`, 192, rY + 3, {
    align: "right",
  });

  curY += boxHeight + 8;

  // 6. Signatory / Footer Note
  if (curY < 265) {
    doc.setDrawColor(203, 213, 225);
    doc.line(140, curY + 12, 196, curY + 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text("Authorized Signatory", 168, curY + 17, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(info.name, 168, curY + 21, { align: "center" });
  }

  // Bottom Footer
  doc.setFillColor(255, 251, 235);
  doc.rect(0, 285, 210, 12, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Thank you for choosing ${info.name}! ❤️ Keep your baby cozy and smiling.`,
    14,
    291
  );
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Computer generated invoice • No signature required",
    196,
    291,
    { align: "right" }
  );

  doc.save(`invoice_${invoiceNo}.pdf`);
  return true;
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 6. PRINT INVOICE IN BROWSER (HTML Clean Print View with Logo & Colors)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const printInvoice = (order, storeInfo = DEFAULT_STORE_INFO) => {
  if (!order) return;

  const info = { ...DEFAULT_STORE_INFO, ...storeInfo };
  const invoiceNo =
    order.invoiceNumber ||
    `INV-${order.orderNumber?.replace(/[^a-zA-Z0-9]/g, "") || Date.now()}`;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  const custName =
    order.shippingAddress?.name ||
    order.user?.name ||
    order.customerName ||
    "Valued Customer";
  const custPhone =
    order.shippingAddress?.phone || order.user?.phone || order.customerPhone || "N/A";
  const custEmail = order.shippingAddress?.email || order.user?.email || "N/A";
  const custStreet =
    order.shippingAddress?.address ||
    order.shippingAddress?.street ||
    order.address?.street ||
    "";
  const custCity = order.shippingAddress?.city || order.address?.city || "";
  const custState = order.shippingAddress?.state || order.address?.state || "";
  const custPin =
    order.shippingAddress?.pincode ||
    order.shippingAddress?.postalCode ||
    order.address?.pincode ||
    "";
  const fullAddress = [
    custStreet,
    custCity,
    custState,
    custPin,
  ]
    .filter(Boolean)
    .join(", ");

  const items = order.items || [];
  const subtotal = order.subtotal || order.itemsPrice || order.totalAmount || 0;
  const shippingFee = Number(order.shippingPrice) || 0;
  const discount = Number(order.discount) || 0;
  const grandTotal = Number(order.totalAmount) || subtotal + shippingFee - discount;
  const gstAmount = Math.round((grandTotal * 5) / 105);
  const isPaid = (order.paymentStatus || "").toLowerCase() === "paid";

  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (!printWindow) {
    alert("Please allow pop-ups in your browser to print the invoice.");
    return;
  }

  const itemsHtml = items
    .map(
      (it, idx) => `
      <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#fffbeb'};">
        <td style="padding: 10px 12px; border-bottom: 1px solid #fed7aa; text-align: center; color: #64748b; font-family: monospace; font-weight: 600;">${idx + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #fed7aa;">
          <strong style="color: #0f172a; font-size: 13px; display: block;">${it.name}</strong>
          ${
            it.size || it.color
              ? `<div style="font-size: 11px; color: #ea580c; margin-top: 3px; font-weight: 700;">${[
                  it.size ? `Size: ${it.size}` : "",
                  it.color ? `Color: ${it.color}` : "",
                ]
                  .filter(Boolean)
                  .join(" • ")}</div>`
              : ""
          }
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #fed7aa; text-align: center; color: #64748b; font-family: monospace; font-size: 11px;">HSN-6111</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #fed7aa; text-align: center; font-weight: bold; color: #0f172a; font-size: 13px;">${it.quantity || 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #fed7aa; text-align: right; color: #334155; white-space: nowrap;">₹${(it.price || 0).toLocaleString("en-IN")}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #fed7aa; text-align: right; font-weight: 900; color: #ea580c; white-space: nowrap; font-size: 13px;">₹${((it.price || 0) * (it.quantity || 1)).toLocaleString("en-IN")}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Tax Invoice - ${invoiceNo}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 14mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
          background: #f8fafc;
          padding: 24px;
          color: #1e293b;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 32px;
          background: #ffffff;
          border: 1px solid #fed7aa;
          border-radius: 20px;
          box-shadow: 0 4px 12px -2px rgba(249, 115, 22, 0.08);
        }
        .top-stripe {
          height: 6px;
          background: linear-gradient(90deg, #f97316, #f59e0b, #ea580c);
          border-radius: 6px 6px 0 0;
          margin: -32px -32px 24px -32px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #fed7aa;
          margin-bottom: 20px;
        }
        .brand-section {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          flex: 1;
          min-width: 0;
        }
        .brand-logo-card {
          width: 100px;
          height: 64px;
          background: #ffffff;
          border: 1px solid #fed7aa;
          border-radius: 12px;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .brand-logo {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        .store-name {
          font-size: 18px;
          font-weight: 900;
          color: #ea580c;
          letter-spacing: -0.3px;
          text-transform: uppercase;
        }
        .store-tagline {
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
          margin-top: 2px;
        }
        .store-sub {
          font-size: 11px;
          color: #64748b;
          margin-top: 5px;
          line-height: 1.5;
        }
        .invoice-title-box {
          text-align: right;
          flex-shrink: 0;
          min-width: 200px;
        }
        .invoice-title-box h1 {
          font-size: 24px;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: -0.5px;
        }
        .invoice-meta {
          font-size: 12px;
          color: #475569;
          margin-top: 6px;
          line-height: 1.6;
        }
        .paid-badge {
          display: inline-block;
          background: ${isPaid ? '#dcfce7' : '#fef3c7'};
          color: ${isPaid ? '#166534' : '#b45309'};
          border: 1px solid ${isPaid ? '#bbf7d0' : '#fde68a'};
          font-weight: 800;
          font-size: 11px;
          padding: 3px 12px;
          border-radius: 20px;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .info-card {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .info-card h3 {
          font-size: 10px;
          font-weight: 900;
          color: #b45309;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 8px;
        }
        .info-card .cust-name {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .info-card p {
          font-size: 12px;
          color: #475569;
          line-height: 1.5;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          font-size: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #fed7aa;
        }
        th {
          background: #0f172a;
          color: #ffffff;
          padding: 11px 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 11px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
          align-items: start;
          margin-bottom: 24px;
        }
        .notes-box {
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 14px;
          padding: 16px;
          font-size: 11px;
          color: #92400e;
          line-height: 1.6;
        }
        .notes-box strong {
          display: block;
          margin-bottom: 6px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #b45309;
        }
        .calc-box {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 14px;
          padding: 16px;
        }
        .calc-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 8px;
          color: #475569;
        }
        .calc-row span:last-child {
          white-space: nowrap;
          font-weight: 600;
          color: #0f172a;
        }
        .grand-total-box {
          background: #ffedd5;
          border: 1.5px solid #f97316;
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }
        .grand-total-box span:first-child {
          font-size: 13px;
          font-weight: 900;
          color: #c2410c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .grand-total-box span:last-child {
          font-size: 18px;
          font-weight: 900;
          color: #ea580c;
          white-space: nowrap;
        }
        .signatory-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px dashed #fed7aa;
          margin-top: 16px;
        }
        .signatory-box {
          text-align: right;
        }
        .signatory-line {
          width: 160px;
          border-top: 1.5px solid #cbd5e1;
          margin-left: auto;
          margin-bottom: 4px;
        }
        .footer {
          margin-top: 16px;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
        }
        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
          }
          .invoice-box {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .top-stripe {
            margin: 0 0 20px 0 !important;
            border-radius: 0 !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .summary-grid, .info-grid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      </style>
    </head>
    <body>
      <div style="max-width: 800px; margin: 0 auto 12px; text-align: right;" class="no-print">
        <button onclick="window.print()" style="background: #f97316; color: white; border: none; padding: 10px 22px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 13px; box-shadow: 0 2px 6px rgba(249,115,22,0.35);">
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div class="invoice-box">
        <div class="top-stripe"></div>

        <div class="header">
          <div class="brand-section">
            <div class="brand-logo-card">
              <img src="${lsbLogo}" alt="Little Sunbeam Logo" class="brand-logo" />
            </div>
            <div>
              <div class="store-name">${info.name}</div>
              <div class="store-tagline">${info.tagline}</div>
              <div class="store-sub">
                ${info.address}<br/>
                Phone: <strong style="color: #0f172a;">${info.phone}</strong> • Email: <strong style="color: #0f172a;">${info.email}</strong><br/>
                <strong>GSTIN:</strong> ${info.gstin} • <span style="color: #ea580c; font-weight: 600;">${info.website}</span>
              </div>
            </div>
          </div>
          <div class="invoice-title-box">
            <h1>TAX INVOICE</h1>
            <div class="invoice-meta">
              <strong style="color: #ea580c;">Invoice #:</strong> <span style="font-family: monospace; font-weight: bold; color: #0f172a;">${invoiceNo}</span><br/>
              <strong>Order #:</strong> <span style="font-family: monospace; font-weight: 600;">${order.orderNumber || "ORD-DEFAULT"}</span><br/>
              <strong>Date:</strong> ${orderDate}<br/>
              <span class="paid-badge">${(order.paymentStatus || "PAID").toUpperCase()} • ${(order.paymentMethod || "ONLINE").toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <div>
              <h3>Billed To (Customer Details)</h3>
              <div class="cust-name">${custName}</div>
              <p>
                📞 Phone: ${custPhone}<br/>
                ✉️ Email: ${custEmail}<br/>
                📍 ${custCity ? `${[custCity, custState].filter(Boolean).join(", ")}${custPin ? ` - ${custPin}` : ""}` : "India"}
              </p>
            </div>
          </div>
          <div class="info-card">
            <div>
              <h3>Shipping & Delivery Info</h3>
              <p style="font-weight: 600; color: #0f172a; margin-bottom: 6px;">
                📍 Deliver to: ${fullAddress || "Standard Shipping"}
              </p>
              <div style="padding-top: 8px; border-top: 1px solid #fde68a; font-size: 11.5px; color: #64748b;">
                <strong>Payment:</strong> ${order.paymentMethod || "Online"} (${order.paymentStatus || "Paid"})<br/>
                <strong>Fulfillment:</strong> ${order.orderStatus || "Confirmed"}
              </div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">#</th>
              <th style="text-align: left;">Item Description</th>
              <th style="width: 90px; text-align: center;">HSN Code</th>
              <th style="width: 60px; text-align: center;">Qty</th>
              <th style="width: 100px; text-align: right;">Unit Price</th>
              <th style="width: 110px; text-align: right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary-grid">
          <div class="notes-box">
            <strong>Customer Note & Care Promise</strong>
            • 7-day hassle-free exchange on baby clothing with tags intact.<br/>
            • Crafted with 100% pure organic breathable cotton safe for delicate newborn skin.<br/>
            • Need assistance? Contact customer support at <strong style="color: #0f172a;">${info.phone}</strong>.<br/>
            • This is a computer-generated tax invoice and requires no physical signature.
          </div>

          <div class="calc-box">
            <div class="calc-row">
              <span>Subtotal:</span>
              <span>₹${Number(subtotal).toLocaleString("en-IN")}</span>
            </div>
            <div class="calc-row">
              <span>Shipping Fee:</span>
              <span style="${shippingFee === 0 ? 'color: #16a34a; font-weight: bold;' : ''}">${shippingFee > 0 ? `₹${shippingFee.toLocaleString("en-IN")}` : "FREE"}</span>
            </div>
            ${
              discount > 0
                ? `<div class="calc-row" style="color: #16a34a;">
                    <span>Discount:</span>
                    <span>-₹${discount.toLocaleString("en-IN")}</span>
                  </div>`
                : ""
            }
            <div class="calc-row" style="color: #b45309; font-size: 11.5px;">
              <span>GST (5% Included):</span>
              <span>₹${gstAmount.toLocaleString("en-IN")}</span>
            </div>
            <div class="grand-total-box">
              <span>Grand Total:</span>
              <span>₹${Number(grandTotal).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div class="signatory-row">
          <p style="font-size: 12px; color: #475569; font-weight: 500;">
            Thank you for choosing <strong style="color: #ea580c;">${info.name}</strong>! ❤️ Keep your baby cozy and smiling.
          </p>
          <div class="signatory-box">
            <div class="signatory-line"></div>
            <div style="font-size: 11px; font-weight: bold; color: #334155;">Authorized Signatory</div>
            <div style="font-size: 10px; color: #94a3b8;">${info.name}</div>
          </div>
        </div>

        <div class="footer">
          Computer generated tax invoice • No physical signature required
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
