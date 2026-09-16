import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const products = [
  {
    id: 1,
    name: "iPhone 15 Pro Max",
    category: "iPhone",
    price: 159999,
    oldPrice: 179999,
    discount: 11,
    cost: 145000,
    stock: 10,
    emoji: "📱",
    image: "",
  },
  {
    id: 2,
    name: "Samsung Galaxy S25 Ultra",
    category: "Android",
    price: 139999,
    oldPrice: 159999,
    discount: 13,
    cost: 125000,
    stock: 10,
    emoji: "📱",
    image: "",
  },
  {
    id: 3,
    name: "MacBook Air M3",
    category: "Mac",
    price: 149999,
    oldPrice: 169999,
    discount: 12,
    cost: 135000,
    stock: 8,
    emoji: "💻",
    image: "",
  },
  {
    id: 4,
    name: "Dell Inspiron Laptop",
    category: "Laptop",
    price: 89999,
    oldPrice: 99999,
    discount: 10,
    cost: 78000,
    stock: 8,
    emoji: "💻",
    image: "",
  },
  {
    id: 5,
    name: "Gaming PC Ryzen 5",
    category: "PC",
    price: 115000,
    oldPrice: 130000,
    discount: 12,
    cost: 100000,
    stock: 6,
    emoji: "🖥️",
    image: "",
  },
  {
    id: 6,
    name: "AirPods Pro 2",
    category: "Accessories",
    price: 32999,
    oldPrice: 39999,
    discount: 18,
    cost: 27000,
    stock: 15,
    emoji: "🎧",
    image: "",
  },
  {
    id: 7,
    name: "Mechanical Gaming Keyboard",
    category: "Accessories",
    price: 5999,
    oldPrice: 7999,
    discount: 25,
    cost: 4500,
    stock: 20,
    emoji: "⌨️",
    image: "",
  },
  {
    id: 8,
    name: "65W Fast Charger",
    category: "Accessories",
    price: 2499,
    oldPrice: 3499,
    discount: 29,
    cost: 1700,
    stock: 30,
    emoji: "🔌",
    image: "",
  },
];

const categories = [
  ["📱", "iPhone"],
  ["📱", "Android"],
  ["💻", "Laptop"],
  ["🖥️", "PC"],
  ["🍎", "Mac"],
  ["🎧", "Accessories"],
];

const DEFAULT_STORE_SETTINGS = {
  storeName: "Anuraj Store", panNumber: "", vatNumber: "", registrationNumber: "",
  address: "", email: "", contactNumber: "", whatsappNumber: "",
  deliveryCharge: 150, freeDeliveryAbove: 0, deliveryTime: "2–5 business days",
  insideKathmanduDelivery: "150", outsideKathmanduDelivery: "As applicable",
  codEnabled: true, bankTransferEnabled: true, esewaEnabled: false, khaltiEnabled: false,
  bankName: "", accountName: "ANURAJ STORE", accountNumber: "", branch: "",
  returnPolicy: "", refundPolicy: "", cancellationPolicy: "", privacyPolicy: "", terms: ""
};

function formatPrice(number) {
  return `Rs. ${number.toLocaleString("en-IN")}`;
}

/* =========================================================
   CHECKOUT
========================================================= */

function Checkout({
  
  cart,
  subtotal,
  deliveryCharge,
  storeSettings,
  onBack,
  onOrderSuccess,
}) {
  const [form, setForm] = useState({
    fullName: "",
    mobile: "",
    province: "",
    district: "",
    municipality: "",
    ward: "",
    address: "",
    notes: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [transactionId, setTransactionId] = useState("");

  const [paymentScreenshot, setPaymentScreenshot] = useState(null);

  const [screenshotPreview, setScreenshotPreview] = useState("");

  const [errors, setErrors] = useState({});

  const [placingOrder, setPlacingOrder] = useState(false);

  const effectiveDeliveryCharge = Number(storeSettings?.freeDeliveryAbove || 0) > 0 && subtotal >= Number(storeSettings.freeDeliveryAbove) ? 0 : deliveryCharge;
  const grandTotal = subtotal + effectiveDeliveryCharge;

  function updateField(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  }

  function handleScreenshot(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((previous) => ({
        ...previous,
        screenshot: "Please select an image file.",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((previous) => ({
        ...previous,
        screenshot: "Image must be smaller than 5MB.",
      }));
      return;
    }

    setPaymentScreenshot(file);

    setScreenshotPreview(URL.createObjectURL(file));

    setErrors((previous) => ({
      ...previous,
      screenshot: "",
    }));
  }

  function validateForm() {
    const newErrors = {};

    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (!form.mobile.trim()) {
      newErrors.mobile = "Mobile number is required.";
    } else if (!/^(98|97)\d{8}$/.test(form.mobile.trim())) {
      newErrors.mobile = "Enter a valid 10-digit Nepali mobile number.";
    }

    if (!form.province) {
      newErrors.province = "Select province.";
    }

    if (!form.district.trim()) {
      newErrors.district = "District is required.";
    }

    if (!form.municipality.trim()) {
      newErrors.municipality = "Municipality is required.";
    }

    if (!form.ward.trim()) {
      newErrors.ward = "Ward is required.";
    }

    if (!form.address.trim()) {
      newErrors.address = "Full address is required.";
    }

    if (paymentMethod === "bank") {
      if (!transactionId.trim()) {
        newErrors.transactionId = "Transaction ID is required.";
      }

      if (!paymentScreenshot) {
        newErrors.screenshot =
          "Please upload your bank payment screenshot.";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function placeOrder(e) {
    e.preventDefault();
  
    if (!validateForm()) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }
  
    if (cart.length === 0) {
      setErrors({
        general: "Your cart is empty.",
      });
      return;
    }
  
    setPlacingOrder(true);
    setErrors({});
  
    try {
      const formData = new FormData();
  
      // Customer information
      formData.append("customer_name", form.fullName);
      formData.append("mobile", form.mobile);
      formData.append("province", form.province);
      formData.append("district", form.district);
      formData.append("city", form.municipality);
      formData.append("ward", form.ward);
      formData.append("address", form.address);
      formData.append("notes", form.notes);
  
      // Payment
      formData.append("payment_method", paymentMethod);
      formData.append(
        "transaction_id",
        paymentMethod === "bank" ? transactionId : ""
      );
  
      // Cart items
      const orderItems = cart.map((item) => ({
        product_id: String(item.id),
        name: item.name,
        price: Number(item.price),
        cost: Number(item.cost || 0),
        quantity: Number(item.quantity),
      }));
  
      formData.append(
        "items",
        JSON.stringify(orderItems)
      );
  
      // Price
      formData.append(
        "subtotal",
        String(subtotal)
      );
  
      formData.append(
        "delivery_charge",
        String(effectiveDeliveryCharge)
      );
  
      formData.append(
        "total",
        String(grandTotal)
      );
  
      // Bank payment screenshot
      if (
        paymentMethod === "bank" &&
        paymentScreenshot
      ) {
        formData.append(
          "payment_screenshot",
          paymentScreenshot
        );
      }
  
      const response = await fetch(
        "https://anuraj-store.onrender.com/api/orders",
        {
          method: "POST",
          body: formData,
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to place order."
        );
      }
      
      console.log("REAL ORDER:", data);
      // Backend order number use गर्ने
      const order = {
        orderId: data.order_number,
  
        customer: form,
  
        paymentMethod,
  
        transactionId:
          paymentMethod === "bank"
            ? transactionId
            : null,
  
        items: cart,
  
        subtotal,
  
        deliveryCharge: effectiveDeliveryCharge,
  
        total: grandTotal,
  
        createdAt: new Date().toISOString(),
      };
  
      setPlacingOrder(false);
  
      onOrderSuccess(order);
  
    } catch (error) {
      console.error("ORDER ERROR:", error);
  
      setPlacingOrder(false);
  
      setErrors({
        general:
          error.message ||
          "Something went wrong while placing your order.",
      });
    }
  }

  return (
    <main className="checkoutPage">

      {/* CHECKOUT HEADER */}
      <div className="checkoutTop">
        <button
          className="backButton"
          onClick={onBack}
        >
          ← Back to Cart
        </button>

        <h1>Checkout</h1>

        <div className="secureCheckout">
          🔒 Secure Checkout
        </div>
      </div>
      {errors.general && (
  <div className="checkoutError">
    ⚠️ {errors.general}
  </div>
)}
      <form
        className="checkoutLayout"
        onSubmit={placeOrder}
      >

        {/* LEFT SIDE */}
        <div className="checkoutMain">

          {/* CUSTOMER INFORMATION */}
          <section className="checkoutCard">
            <div className="checkoutCardTitle">
              <span className="stepNumber">1</span>

              <div>
                <h2>Delivery Information</h2>
                <p>Where should we deliver your order?</p>
              </div>
            </div>

            <div className="formGrid">

              <div className="formGroup full">
                <label>Full Name *</label>

                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={updateField}
                  placeholder="Enter your full name"
                />

                {errors.fullName && (
                  <small className="error">
                    {errors.fullName}
                  </small>
                )}
              </div>

              <div className="formGroup">
                <label>Mobile Number *</label>

                <input
                  name="mobile"
                  value={form.mobile}
                  onChange={updateField}
                  placeholder="98XXXXXXXX"
                  maxLength="10"
                />

                {errors.mobile && (
                  <small className="error">
                    {errors.mobile}
                  </small>
                )}
              </div>

              <div className="formGroup">
                <label>Province *</label>

                <select
                  name="province"
                  value={form.province}
                  onChange={updateField}
                >
                  <option value="">
                    Select Province
                  </option>

                  <option value="Koshi">
                    Koshi Province
                  </option>

                  <option value="Madhesh">
                    Madhesh Province
                  </option>

                  <option value="Bagmati">
                    Bagmati Province
                  </option>

                  <option value="Gandaki">
                    Gandaki Province
                  </option>

                  <option value="Lumbini">
                    Lumbini Province
                  </option>

                  <option value="Karnali">
                    Karnali Province
                  </option>

                  <option value="Sudurpashchim">
                    Sudurpashchim Province
                  </option>
                </select>

                {errors.province && (
                  <small className="error">
                    {errors.province}
                  </small>
                )}
              </div>

              <div className="formGroup">
                <label>District *</label>

                <input
                  name="district"
                  value={form.district}
                  onChange={updateField}
                  placeholder="e.g. Bhaktapur"
                />

                {errors.district && (
                  <small className="error">
                    {errors.district}
                  </small>
                )}
              </div>

              <div className="formGroup">
                <label>Municipality / City *</label>

                <input
                  name="municipality"
                  value={form.municipality}
                  onChange={updateField}
                  placeholder="e.g. Suryabinayak"
                />

                {errors.municipality && (
                  <small className="error">
                    {errors.municipality}
                  </small>
                )}
              </div>

              <div className="formGroup">
                <label>Ward No. *</label>

                <input
                  name="ward"
                  value={form.ward}
                  onChange={updateField}
                  placeholder="Ward number"
                  maxLength="2"
                />

                {errors.ward && (
                  <small className="error">
                    {errors.ward}
                  </small>
                )}
              </div>

              <div className="formGroup full">
                <label>Full Address *</label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  placeholder="House number, street, landmark..."
                  rows="3"
                />

                {errors.address && (
                  <small className="error">
                    {errors.address}
                  </small>
                )}
              </div>

              <div className="formGroup full">
                <label>
                  Order Notes{" "}
                  <span>(Optional)</span>
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  placeholder="Any special delivery instructions?"
                  rows="2"
                />
              </div>

            </div>
          </section>

          {/* PAYMENT */}
          <section className="checkoutCard">

            <div className="checkoutCardTitle">
              <span className="stepNumber">2</span>

              <div>
                <h2>Payment Method</h2>
                <p>Select your preferred payment option.</p>
              </div>
            </div>

            <div className="paymentMethods">

              {/* COD */}
              <label
                className={`paymentOption ${
                  paymentMethod === "cod"
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() =>
                    setPaymentMethod("cod")
                  }
                />

                <div className="paymentIcon">
                  💵
                </div>

                <div className="paymentText">
                  <strong>Cash on Delivery</strong>

                  <span>
                    Pay when your order arrives
                  </span>
                </div>

                <span className="radioCircle">
                  {paymentMethod === "cod"
                    ? "✓"
                    : ""}
                </span>
              </label>

              {/* BANK */}
              <label
                className={`paymentOption ${
                  paymentMethod === "bank"
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value="bank"
                  checked={paymentMethod === "bank"}
                  onChange={() =>
                    setPaymentMethod("bank")
                  }
                />

                <div className="paymentIcon">
                  🏦
                </div>

                <div className="paymentText">
                  <strong>Bank Transfer</strong>

                  <span>
                    Transfer to our bank account
                  </span>
                </div>

                <span className="radioCircle">
                  {paymentMethod === "bank"
                    ? "✓"
                    : ""}
                </span>
              </label>

              {/* ESEWA */}
              {storeSettings?.esewaEnabled ? <label
                className={`paymentOption`}
              >
                <input
                  type="radio"
                  name="payment"
                  disabled
                />

                <div className="paymentIcon">
                  🟢
                </div>

                <div className="paymentText">
                  <strong>eSewa</strong>

                  <span>
                    Online payment — coming soon
                  </span>
                </div>

                <span className="comingSoon">
                  SOON
                </span>
              </label> : null}

              {/* KHALTI */}
              {storeSettings?.khaltiEnabled ? <label
                className={`paymentOption`}
              >
                <input
                  type="radio"
                  name="payment"
                  disabled
                />

                <div className="paymentIcon">
                  🟣
                </div>

                <div className="paymentText">
                  <strong>Khalti</strong>

                  <span>
                    Online payment — coming soon
                  </span>
                </div>

                <span className="comingSoon">
                  SOON
                </span>
              </label> : null}

            </div>

            {/* BANK DETAILS */}
            {paymentMethod === "bank" && (
              <div className="bankBox">

                <h3>🏦 Bank Transfer Details</h3>

                <div className="bankWarning">
                  ⚠️ Replace these demo details with
                  your real bank details from the
                  Admin Panel.
                </div>

                <div className="bankDetails">

                  <div>
                    <span>Bank</span>
                    <strong>
                      {storeSettings?.bankName || "Bank details not set"}
                    </strong>
                  </div>

                  <div>
                    <span>Account Name</span>
                    <strong>
                      {storeSettings?.accountName || "ANURAJ STORE"}
                    </strong>
                  </div>

                  <div>
                    <span>Account Number</span>
                    <strong>
                      {storeSettings?.accountNumber || "Account number not set"}
                    </strong>
                  </div>

                  <div>
                    <span>Branch</span>
                    <strong>
                      {storeSettings?.branch || "Branch not set"}
                    </strong>
                  </div>

                </div>

                <div className="bankInstructions">
                  <strong>
                    How to pay:
                  </strong>

                  <ol>
                    <li>
                      Transfer the total amount
                      to the bank account above.
                    </li>

                    <li>
                      Enter your transaction ID.
                    </li>

                    <li>
                      Upload your payment
                      screenshot.
                    </li>
                  </ol>
                </div>

                {/* TRANSACTION ID */}
                <div className="formGroup full">
                  <label>
                    Transaction ID *
                  </label>

                  <input
                    value={transactionId}
                    onChange={(e) => {
                      setTransactionId(
                        e.target.value
                      );

                      setErrors(
                        (previous) => ({
                          ...previous,
                          transactionId: "",
                        })
                      );
                    }}
                    placeholder="Enter bank transaction ID"
                  />

                  {errors.transactionId && (
                    <small className="error">
                      {errors.transactionId}
                    </small>
                  )}
                </div>

                {/* SCREENSHOT */}
<div className="formGroup full">
  <label>
    Payment Screenshot *
  </label>

  <div className="uploadBox">
    <input
      id="paymentScreenshot"
      type="file"
      accept="image/*"
      onChange={handleScreenshot}
    />

    <label
      htmlFor="paymentScreenshot"
      className="uploadLabel"
    >
      📷 Choose Payment Screenshot
    </label>

    <small>
      JPG, PNG or WEBP — Maximum 5MB
    </small>
  </div>

  {screenshotPreview && (
    <div className="screenshotPreview">
      <img
        src={screenshotPreview}
        alt="Payment screenshot preview"
      />

      <button
        type="button"
        onClick={() => {
          setPaymentScreenshot(null);
          setScreenshotPreview("");
        }}
      >
        Remove
      </button>
    </div>
  )}

  {errors.screenshot && (
    <small className="error">
      {errors.screenshot}
    </small>
  )}
</div>

</div>
)}

          </section>

          {/* MOBILE SECURITY MESSAGE */}
          <div className="checkoutSecurity">
            🔒 Your information is used only to
            process and deliver your order.
          </div>

        </div>

        {/* RIGHT SIDE — ORDER SUMMARY */}
        <aside className="orderSummary">

          <h2>Order Summary</h2>

          <div className="summaryProducts">

            {cart.map((item) => (
              <div
                className="summaryProduct"
                key={item.id}
              >
                <div className="summaryProductImage">
                  {item.emoji}
                </div>

                <div className="summaryProductInfo">
                  <strong>
                    {item.name}
                  </strong>

                  <span>
                    Qty: {item.quantity}
                  </span>
                </div>

                <strong>
                  {formatPrice(
                    item.price *
                      item.quantity
                  )}
                </strong>
              </div>
            ))}

          </div>

          <div className="summaryLine">
            <span>Subtotal</span>

            <strong>
              {formatPrice(subtotal)}
            </strong>
          </div>

          <div className="summaryLine">
            <span>Delivery</span>

            <strong>
              {formatPrice(effectiveDeliveryCharge)}
            </strong>
          </div>

          <div className="summaryDivider"></div>

          <div className="summaryTotal">
            <span>Total</span>

            <strong>
              {formatPrice(grandTotal)}
            </strong>
          </div>

          <button
            type="submit"
            className="placeOrderButton"
            disabled={placingOrder}
          >
            {placingOrder
              ? "Placing Order..."
              : `Place Order • ${formatPrice(
                  grandTotal
                )}`}
          </button>

          <div className="orderTrust">

            <div>
              🚚
              <span>
                Delivery across Nepal
              </span>
            </div>

            <div>
              🔒
              <span>
                Secure checkout
              </span>
            </div>

            <div>
              📞
              <span>
                Customer support available
              </span>
            </div>

          </div>

        </aside>

      </form>
    </main>
  );
}

/* =========================================================
   ORDER SUCCESS
========================================================= */

function OrderSuccess({ order, onContinue }) {
  return (
    <main className="successPage">

      <div className="successCard">

        <div className="successIcon">
          ✓
        </div>

        <h1>Order Placed Successfully!</h1>

        <p>
          Thank you for shopping with
          <strong> Anuraj Store</strong>.
        </p>

        <div className="orderIdBox">
          <span>Order ID</span>

          <strong>
            {order.orderId}
          </strong>
        </div>

        <div className="successDetails">

          <div>
            <span>Customer</span>
            <strong>
              {order.customer.fullName}
            </strong>
          </div>

          <div>
            <span>Mobile</span>
            <strong>
              {order.customer.mobile}
            </strong>
          </div>

          <div>
            <span>Payment</span>
            <strong>
              {order.paymentMethod === "cod"
                ? "Cash on Delivery"
                : "Bank Transfer"}
            </strong>
          </div>

          <div>
            <span>Total</span>
            <strong>
              {formatPrice(order.total)}
            </strong>
          </div>

        </div>

        <div className="successMessage">

          📦 Your order has been received.

          <br />

          Our team will contact you on your
          mobile number to confirm the order.

        </div>

        <button
          className="continueShoppingButton"
          onClick={onContinue}
        >
          ← Continue Shopping
        </button>

      </div>

    </main>
  );
}

/* =========================================================
   PRODUCT MANAGEMENT
========================================================= */

function ProductManager({ products, onProductsChange }) {
  const emptyForm = {
    id: null,
    name: "",
    category: "Accessories",
    price: "",
    oldPrice: "",
    discount: "0",
    cost: "",
    stock: "0",
    emoji: "📦",
    image: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const categoriesForProducts = [
    "iPhone",
    "Android",
    "Laptop",
    "PC",
    "Mac",
    "Accessories",
  ];

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function updateForm(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function handleProductImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("⚠️ Please select a valid image file.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setMessage("⚠️ Product image must be below 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((previous) => ({
        ...previous,
        image: String(reader.result || ""),
      }));
      setMessage("📷 Product photo selected. Save the product to apply it.");
    };
    reader.readAsDataURL(file);
  }

  function removeProductImage() {
    setForm((previous) => ({ ...previous, image: "" }));
    setMessage("🗑️ Product photo removed. Save the product to apply it.");
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      id: product.id,
      name: product.name || "",
      category: product.category || "Accessories",
      price: product.price ?? "",
      oldPrice: product.oldPrice ?? "",
      discount: product.discount ?? 0,
      cost: product.cost ?? "",
      stock: product.stock ?? 0,
      emoji: product.emoji || "📦",
      image: product.image || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveProduct(e) {
    e.preventDefault();

    const name = form.name.trim();
    const price = Number(form.price);
    const cost = Number(form.cost);
    const stock = Math.max(0, Number(form.stock));
    const oldPrice = Number(form.oldPrice || form.price);
    const discount = Number(form.discount || 0);

    if (!name || !Number.isFinite(price) || price <= 0) {
      setMessage("⚠️ Product name and valid selling price are required.");
      return;
    }

    if (!Number.isFinite(cost) || cost < 0) {
      setMessage("⚠️ Enter a valid cost price.");
      return;
    }

    const product = {
      id: editingId ?? Date.now(),
      name,
      category: form.category,
      price,
      oldPrice: oldPrice > 0 ? oldPrice : price,
      discount: Math.max(0, discount),
      cost,
      stock,
      emoji: form.emoji || "📦",
      image: form.image.trim(),
    };

    const nextProducts = editingId
      ? products.map((item) => item.id === editingId ? product : item)
      : [...products, product];

    onProductsChange(nextProducts);
    setMessage(editingId ? "✅ Product updated successfully." : "✅ Product added successfully.");
    resetForm();
  }

  function deleteProduct(id) {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    if (!window.confirm(`Delete “${product.name}”?`)) return;

    onProductsChange(products.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
    setMessage("🗑️ Product deleted.");
  }

  const visibleProducts = products.filter((product) => {
    const q = search.trim().toLowerCase();
    return !q || product.name.toLowerCase().includes(q) || product.category.toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 420px) 1fr", gap: "20px", alignItems: "start" }}>
        <form onSubmit={saveProduct} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "20px" }}>
          <h2 style={{ margin: "0 0 4px" }}>{editingId ? "✏️ Edit Product" : "➕ Add Product"}</h2>
          <p style={{ margin: "0 0 18px", color: "#667085", fontSize: "13px" }}>Set selling price, cost price, stock and product details.</p>

          {message && <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 12px", borderRadius: "9px", marginBottom: "14px", fontSize: "13px" }}>{message}</div>}

          <div style={{ display: "grid", gap: "11px" }}>
            <AdminField label="Product Name *" value={form.name} onChange={(v) => updateForm("name", v)} placeholder="e.g. iPhone 16 Pro Max" />

            <label style={adminLabelStyle}>Category
              <select value={form.category} onChange={(e) => updateForm("category", e.target.value)} style={adminInputStyle}>
                {categoriesForProducts.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <AdminField label="Selling Price (Rs.) *" type="number" value={form.price} onChange={(v) => updateForm("price", v)} />
              <AdminField label="Cost Price (Rs.) *" type="number" value={form.cost} onChange={(v) => updateForm("cost", v)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <AdminField label="Old Price" type="number" value={form.oldPrice} onChange={(v) => updateForm("oldPrice", v)} />
              <AdminField label="Discount %" type="number" value={form.discount} onChange={(v) => updateForm("discount", v)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <AdminField label="Stock" type="number" value={form.stock} onChange={(v) => updateForm("stock", v)} />
              <AdminField label="Emoji" value={form.emoji} onChange={(v) => updateForm("emoji", v)} placeholder="📱" />
            </div>

            <div>
              <label style={adminLabelStyle}>Product Photo</label>
              <div style={{
                border: "1px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "12px",
                background: "#f8fafc",
              }}>
                {form.image ? (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "10px",
                  }}>
                    <img
                      src={form.image}
                      alt="Product preview"
                      style={{
                        width: "78px",
                        height: "78px",
                        objectFit: "contain",
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "10px",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: "block", fontSize: "13px" }}>Photo selected</strong>
                      <span style={{ color: "#667085", fontSize: "12px" }}>You can replace it with another photo.</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeProductImage}
                      style={{ ...adminButtonStyle, padding: "8px 10px" }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div style={{ color: "#667085", fontSize: "13px", marginBottom: "10px" }}>
                    No product photo selected.
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProductImage}
                  style={{ width: "100%" }}
                />
                <div style={{ marginTop: "6px", color: "#667085", fontSize: "11px" }}>
                  JPG, PNG, WEBP • Maximum 3 MB
                </div>
              </div>
            </div>

            <AdminField label="Or Product Image URL (optional)" value={form.image.startsWith("data:") ? "" : form.image} onChange={(v) => updateForm("image", v)} placeholder="https://..." />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <button type="submit" style={{ ...adminButtonStyle, background: "#111827", color: "white", flex: 1 }}>{editingId ? "Save Changes" : "Add Product"}</button>
            {editingId && <button type="button" onClick={resetForm} style={adminButtonStyle}>Cancel</button>}
          </div>
        </form>

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", gap: "12px", justifyContent: "space-between", flexWrap: "wrap", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "20px" }}>🛍️ Products ({visibleProducts.length})</h2>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." style={{ ...adminInputStyle, maxWidth: "260px" }} />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
              <thead><tr style={{ background: "#f9fafb" }}>
                <th style={adminThStyle}>Product</th><th style={adminThStyle}>Category</th><th style={adminThStyle}>Selling</th><th style={adminThStyle}>Cost</th><th style={adminThStyle}>Profit</th><th style={adminThStyle}>Stock</th><th style={adminThStyle}>Action</th>
              </tr></thead>
              <tbody>
                {visibleProducts.map((product) => {
                  const profit = Number(product.price || 0) - Number(product.cost || 0);
                  const stock = Number(product.stock || 0);
                  return <tr key={product.id}>
                    <td style={adminTdStyle}><strong>{product.emoji} {product.name}</strong></td>
                    <td style={adminTdStyle}>{product.category}</td>
                    <td style={adminTdStyle}>{formatPrice(product.price)}</td>
                    <td style={adminTdStyle}>{formatPrice(product.cost)}</td>
                    <td style={{ ...adminTdStyle, fontWeight: 700 }}>{formatPrice(profit)}</td>
                    <td style={{ ...adminTdStyle, fontWeight: 700, color: stock <= 3 ? "#b91c1c" : "#111827" }}>{stock}</td>
                    <td style={adminTdStyle}><div style={{ display: "flex", gap: "7px" }}><button type="button" onClick={() => startEdit(product)} style={adminButtonStyle}>Edit</button><button type="button" onClick={() => deleteProduct(product.id)} style={{ ...adminButtonStyle, color: "#b91c1c" }}>Delete</button></div></td>
                  </tr>;
                })}
              </tbody>
            </table>
            {visibleProducts.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "#667085" }}>No products found.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminField({ label, value, onChange, type = "text", placeholder = "" }) {
  return <label style={adminLabelStyle}>{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={adminInputStyle} /></label>;
}

const adminLabelStyle = { display: "grid", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#344054" };
const adminInputStyle = { width: "100%", boxSizing: "border-box", padding: "11px 12px", border: "1px solid #d1d5db", borderRadius: "9px", background: "white", fontSize: "14px", outline: "none" };


/* =========================================================
   SELLER / ADMIN LOGIN
========================================================= */

function SellerLogin({ onSuccess, onBack }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Please enter seller email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://anuraj-store.onrender.com/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Invalid seller login.");
      if (data.role !== "seller" && data.role !== "admin") {
        throw new Error("This account does not have seller/admin access.");
      }
      localStorage.setItem("anuraj_store_admin_token", data.access_token || "");
      localStorage.setItem("anuraj_store_admin_user", JSON.stringify(data.user || {}));
      onSuccess(data.user || {});
    } catch (err) {
      setError(err.message || "Seller login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 430, background: "white", border: "1px solid #e5e7eb", borderRadius: 20, padding: 30, boxShadow: "0 12px 40px rgba(0,0,0,.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 46 }}>🛍️</div>
          <h1 style={{ margin: "8px 0 4px" }}>Seller Login</h1>
          <p style={{ margin: 0, color: "#667085" }}>Anuraj Store Seller / Admin Panel</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 14 }}>
          <label style={adminLabelStyle}>
            Seller Email / Mobile
            <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="seller@anurajstore.com" autoComplete="username" style={adminInputStyle} />
          </label>
          <label style={adminLabelStyle}>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter seller password" autoComplete="current-password" style={adminInputStyle} />
          </label>

          {error && <div style={errorBox}>{error}</div>}

          <button type="submit" disabled={loading} style={{ border: 0, background: "#111827", color: "white", borderRadius: 10, padding: "13px 16px", fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1 }}>
            {loading ? "Signing in..." : "🔐 Sign in as Seller"}
          </button>

          <button type="button" onClick={onBack} style={{ border: "1px solid #d1d5db", background: "white", color: "#111827", borderRadius: 10, padding: "12px 16px", fontWeight: 700, cursor: "pointer" }}>
            ← Back to Store
          </button>
        </form>
      </div>
    </main>
  );
}

/* =========================================================
   ADMIN PANEL
========================================================= */

function AdminPanel({ onBack, products, onProductsChange }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState("");
  const [searchOrder, setSearchOrder] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("dashboard");

  const API_URL = "https://anuraj-store.onrender.com";

  const statuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/orders`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load orders.");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error("ADMIN ORDERS ERROR:", err);
      setError(
        err.message ||
          "Could not connect to the backend. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(orderNumber, newStatus) {
    setUpdatingOrder(orderNumber);
    setError("");

    try {
      const formData = new FormData();
      formData.append("status", newStatus);

      const response = await fetch(
        `${API_URL}/api/orders/${encodeURIComponent(orderNumber)}/status`,
        {
          method: "PATCH",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update order status.");
      }

      setOrders((previous) =>
        previous.map((order) =>
          order.order_number === orderNumber
            ? {
                ...order,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : order
        )
      );
    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err);
      setError(err.message || "Could not update order status.");
    } finally {
      setUpdatingOrder("");
    }
  }

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-NP", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function statusLabel(status) {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  const filteredOrders = orders.filter((order) => {
    const customer = order.customer || {};
    const search = searchOrder.trim().toLowerCase();

    const matchesSearch =
      !search ||
      String(order.order_number || "").toLowerCase().includes(search) ||
      String(customer.name || "").toLowerCase().includes(search) ||
      String(customer.mobile || "").toLowerCase().includes(search);

    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalSales = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const pendingCount = orders.filter(
    (order) => order.status === "pending"
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.status === "delivered"
  ).length;

  const productCostById = new Map(
    products.map((product) => [String(product.id), Number(product.cost || 0)])
  );

  const estimatedProfit = orders.reduce((sum, order) => {
    if (order.status === "cancelled") return sum;
    const items = Array.isArray(order.items) ? order.items : [];
    return sum + items.reduce((itemSum, item) => {
      const cost = Number(item.cost ?? productCostById.get(String(item.product_id)) ?? 0);
      const selling = Number(item.price || 0);
      const quantity = Number(item.quantity || 0);
      return itemSum + (selling - cost) * quantity;
    }, 0);
  }, 0);

  const lowStockCount = products.filter(
    (product) => Number(product.stock || 0) <= 3
  ).length;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        {/* ADMIN HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "30px" }}>
              🛠️ Anuraj Store Admin
            </h1>
            <p style={{ margin: "6px 0 0", color: "#667085" }}>
              Seller dashboard — manage your complete Anuraj Store business
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={loadOrders}
              style={adminButtonStyle}
            >
              🔄 Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("anuraj_store_admin_token");
                localStorage.removeItem("anuraj_store_admin_user");
                onBack();
              }}
              style={{
                ...adminButtonStyle,
                background: "#b42318",
                color: "white",
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* SELLER NAVIGATION */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: "8px", marginBottom: "20px", background: "white", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "8px" }}>
          {[
            ["dashboard", "📊 Dashboard"],
            ["orders", "📦 Orders"],
            ["products", "🛍️ Products"],
            ["sales", "💰 Sales & Profit"],
            ["support", "💬 Support Cases"],
            ["reports", "📈 Reports"],
            ["settings", "⚙️ Settings"],
          ].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setActiveTab(key)} style={{ ...adminButtonStyle, background: activeTab === key ? "#111827" : "white", color: activeTab === key ? "white" : "#111827", width: "100%" }}>{label}</button>
          ))}
        </div>

        {activeTab === "products" ? (
          <ProductManager products={products} onProductsChange={onProductsChange} />
        ) : activeTab === "support" ? (
          <AdminSupportCases />
        ) : activeTab === "reports" ? (
          <AdminReports orders={orders} products={products} />
        ) : activeTab === "settings" ? (
          <AdminSettings />
        ) : activeTab === "sales" ? (
          <AdminSales orders={orders} products={products} />
        ) : activeTab === "dashboard" ? (
          <AdminDashboardSummary orders={orders} products={products} totalSales={totalSales} estimatedProfit={estimatedProfit} pendingCount={pendingCount} deliveredCount={deliveredCount} lowStockCount={lowStockCount} onOrders={() => setActiveTab("orders")} onProducts={() => setActiveTab("products")} />
        ) : (
        <>
        {/* DASHBOARD CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          <AdminStat title="Total Orders" value={orders.length} icon="📦" />
          <AdminStat
            title="Total Sales"
            value={formatPrice(totalSales)}
            icon="💰"
          />
          <AdminStat title="Pending" value={pendingCount} icon="⏳" />
          <AdminStat title="Delivered" value={deliveredCount} icon="✅" />
          <AdminStat title="Est. Gross Profit" value={formatPrice(estimatedProfit)} icon="📈" />
          <AdminStat title="Low Stock" value={lowStockCount} icon="⚠️" />
        </div>

        {/* SEARCH + FILTER */}
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "16px",
            marginBottom: "20px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <input
            value={searchOrder}
            onChange={(e) => setSearchOrder(e.target.value)}
            placeholder="Search order ID, customer or mobile..."
            style={{
              flex: "1 1 280px",
              minWidth: "220px",
              padding: "12px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "9px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              flex: "0 1 190px",
              padding: "12px 14px",
              border: "1px solid #d1d5db",
              borderRadius: "9px",
              fontSize: "14px",
              background: "white",
            }}
          >
            <option value="all">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              padding: "14px 16px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ORDERS */}
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "20px" }}>
              📦 Orders ({filteredOrders.length})
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: "50px", textAlign: "center" }}>
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: "50px", textAlign: "center", color: "#667085" }}>
              {orders.length === 0
                ? "No orders found yet."
                : "No orders match your search/filter."}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "950px",
                }}
              >
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th style={adminThStyle}>Order</th>
                    <th style={adminThStyle}>Customer</th>
                    <th style={adminThStyle}>Items</th>
                    <th style={adminThStyle}>Payment</th>
                    <th style={adminThStyle}>Total</th>
                    <th style={adminThStyle}>Date</th>
                    <th style={adminThStyle}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const customer = order.customer || {};
                    const payment = order.payment || {};
                    const items = Array.isArray(order.items)
                      ? order.items
                      : [];

                    return (
                      <tr key={order.order_number}>
                        <td style={adminTdStyle}>
                          <strong>{order.order_number}</strong>
                        </td>

                        <td style={adminTdStyle}>
                          <strong>{customer.name || "-"}</strong>
                          <br />
                          <span style={{ color: "#667085", fontSize: "13px" }}>
                            {customer.mobile || "-"}
                          </span>
                          <br />
                          <span style={{ color: "#667085", fontSize: "12px" }}>
                            {customer.district || ""}
                            {customer.city ? `, ${customer.city}` : ""}
                          </span>
                        </td>

                        <td style={adminTdStyle}>
                          {items.map((item, index) => (
                            <div key={`${order.order_number}-${index}`} style={{ marginBottom: "5px" }}>
                              {item.name || "Product"} × {item.quantity || 1}
                            </div>
                          ))}
                        </td>

                        <td style={adminTdStyle}>
                          <strong>
                            {payment.method === "cod"
                              ? "Cash on Delivery"
                              : "Bank Transfer"}
                          </strong>
                          {payment.transaction_id && (
                            <div style={{ fontSize: "12px", color: "#667085", marginTop: "4px" }}>
                              TXN: {payment.transaction_id}
                            </div>
                          )}
                        </td>

                        <td style={adminTdStyle}>
                          <strong>{formatPrice(Number(order.total || 0))}</strong>
                        </td>

                        <td style={adminTdStyle}>
                          <span style={{ fontSize: "13px" }}>
                            {formatDate(order.created_at)}
                          </span>
                        </td>

                        <td style={adminTdStyle}>
                          <select
                            value={order.status || "pending"}
                            disabled={updatingOrder === order.order_number}
                            onChange={(e) =>
                              updateStatus(
                                order.order_number,
                                e.target.value
                              )
                            }
                            style={{
                              padding: "9px 10px",
                              borderRadius: "8px",
                              border: "1px solid #d1d5db",
                              background: "white",
                              minWidth: "135px",
                              fontWeight: 600,
                              cursor:
                                updatingOrder === order.order_number
                                  ? "wait"
                                  : "pointer",
                            }}
                          >
                            {statuses.map((status) => (
                              <option key={status} value={status}>
                                {statusLabel(status)}
                              </option>
                            ))}
                          </select>

                          {updatingOrder === order.order_number && (
                            <div style={{ fontSize: "11px", marginTop: "5px", color: "#667085" }}>
                              Updating...
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </main>
  );
}

function AdminDashboardSummary({ orders, products, totalSales, estimatedProfit, pendingCount, deliveredCount, lowStockCount, onOrders, onProducts }) {
  const recent = [...orders].sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0,5);
  return <div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:20 }}>
      <AdminStat title="Total Orders" value={orders.length} icon="📦" />
      <AdminStat title="Total Sales" value={formatPrice(totalSales)} icon="💰" />
      <AdminStat title="Gross Profit" value={formatPrice(estimatedProfit)} icon="📈" />
      <AdminStat title="Pending Orders" value={pendingCount} icon="⏳" />
      <AdminStat title="Delivered" value={deliveredCount} icon="✅" />
      <AdminStat title="Low Stock" value={lowStockCount} icon="⚠️" />
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:18 }}>
      <div style={adminPanelCardStyle}><h2 style={{marginTop:0}}>⚡ Quick Actions</h2><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button style={adminButtonStyle} onClick={onOrders}>📦 Manage Orders</button><button style={adminButtonStyle} onClick={onProducts}>🛍️ Manage Products</button></div></div>
      <div style={adminPanelCardStyle}><h2 style={{marginTop:0}}>📦 Recent Orders</h2>{recent.length===0?<p style={{color:"#667085"}}>No orders yet.</p>:recent.map(o=><div key={o.order_number} style={{padding:"10px 0",borderBottom:"1px solid #eee"}}><b>{o.order_number}</b> · {formatPrice(o.total)}<div style={{fontSize:12,color:"#667085"}}>{o.customer?.name || "Customer"} · {o.status || "pending"}</div></div>)}</div>
    </div>
  </div>;
}

function AdminSales({ orders, products }) {
  const valid=orders.filter(o=>o.status!=="cancelled");
  const sales=valid.reduce((s,o)=>s+Number(o.total||0),0);
  const cost=valid.reduce((s,o)=>s+(Array.isArray(o.items)?o.items.reduce((x,i)=>x+Number(i.cost||0)*Number(i.quantity||0),0):0),0);
  const profit=sales-cost;
  return <div style={{display:"grid",gap:18}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:14}}><AdminStat title="Sales" value={formatPrice(sales)} icon="💰"/><AdminStat title="Product Cost" value={formatPrice(cost)} icon="🏷️"/><AdminStat title="Gross Profit" value={formatPrice(profit)} icon="📈"/><AdminStat title="Profit Margin" value={`${sales ? ((profit/sales)*100).toFixed(1) : 0}%`} icon="📊"/></div>
    <div style={adminPanelCardStyle}><h2 style={{marginTop:0}}>💰 Sales & Profit Breakdown</h2><p>Total completed/active sales: <b>{formatPrice(sales)}</b></p><p>Estimated product cost: <b>{formatPrice(cost)}</b></p><p>Estimated gross profit: <b>{formatPrice(profit)}</b></p><p>Active products: <b>{products.length}</b></p></div>
  </div>;
}

function AdminSupportCases() {
  const [cases,setCases]=useState(()=>{try{return JSON.parse(localStorage.getItem("anuraj_store_support_cases")||"[]")}catch{return[]}});
  function update(id,status){const next=cases.map(c=>c.caseId===id?{...c,status}:c);setCases(next);localStorage.setItem("anuraj_store_support_cases",JSON.stringify(next));}
  return <div style={adminPanelCardStyle}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><h2 style={{marginTop:0}}>💬 Support Cases</h2><span style={{color:"#667085"}}>{cases.length} cases</span></div>{cases.length===0?<p style={{color:"#667085"}}>No customer support cases yet.</p>:cases.map(c=><div key={c.caseId} style={{border:"1px solid #e5e7eb",borderRadius:12,padding:16,marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><b>{c.caseId}</b><select value={c.status||"open"} onChange={e=>update(c.caseId,e.target.value)} style={{padding:8,borderRadius:8,border:"1px solid #d1d5db"}}><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option></select></div><p><b>{c.name}</b> · {c.mobile} · Order: {c.orderId||"-"}</p><p style={{marginBottom:0}}>{c.message}</p></div>)}</div>;
}

function AdminReports({ orders, products }) {
  const valid=orders.filter(o=>o.status!=="cancelled");
  const sales=valid.reduce((s,o)=>s+Number(o.total||0),0);
  const byStatus=orders.reduce((a,o)=>{a[o.status||"unknown"]=(a[o.status||"unknown"]||0)+1;return a},{});
  const topProducts={}; valid.forEach(o=>(o.items||[]).forEach(i=>{topProducts[i.name]=(topProducts[i.name]||0)+Number(i.quantity||0)}));
  const top=Object.entries(topProducts).sort((a,b)=>b[1]-a[1]).slice(0,10);
  return <div style={{display:"grid",gap:18}}><div style={adminPanelCardStyle}><h2 style={{marginTop:0}}>📈 Business Report</h2><p>Total products: <b>{products.length}</b></p><p>Total orders: <b>{orders.length}</b></p><p>Non-cancelled sales: <b>{formatPrice(sales)}</b></p><h3>Order Status</h3>{Object.entries(byStatus).map(([k,v])=><p key={k} style={{margin:"6px 0"}}>{k}: <b>{v}</b></p>)}</div><div style={adminPanelCardStyle}><h3 style={{marginTop:0}}>🔥 Top Products by Quantity Sold</h3>{top.length?top.map(([name,qty])=><p key={name}>{name} — <b>{qty}</b> units</p>):<p style={{color:"#667085"}}>No sales data yet.</p>}</div></div>;
}

function AdminSettings() {
  const API_URL = "https://anuraj-store.onrender.com";
  const [settings, setSettings] = useState(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("anuraj_store_admin_token") || "";
        const response = await fetch(`${API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (response.ok && data.settings) setSettings({ ...DEFAULT_STORE_SETTINGS, ...data.settings });
        else throw new Error(data.detail || "Could not load store settings.");
      } catch (error) {
        const saved = localStorage.getItem("anuraj_store_settings_v2");
        if (saved) { try { setSettings({ ...DEFAULT_STORE_SETTINGS, ...JSON.parse(saved) }); } catch {} }
        setMessage(`⚠️ ${error.message} Using local settings until backend is connected.`);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  function update(key, value) { setSettings(prev => ({ ...prev, [key]: value })); }

  async function save(e) {
    e.preventDefault();
    setSaving(true); setMessage("");
    try {
      const token = localStorage.getItem("anuraj_store_admin_token") || "";
      const response = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to save settings.");
      const next = { ...DEFAULT_STORE_SETTINGS, ...data.settings };
      setSettings(next);
      localStorage.setItem("anuraj_store_settings_v2", JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("anuraj-store-settings", { detail: next }));
      setMessage("✅ Store settings saved successfully.");
    } catch (error) {
      localStorage.setItem("anuraj_store_settings_v2", JSON.stringify(settings));
      setMessage(`⚠️ ${error.message} Saved locally as a temporary fallback.`);
    } finally { setSaving(false); }
  }

  if (loading) return <div style={adminPanelCardStyle}><p>Loading store settings...</p></div>;
  return <form onSubmit={save} style={{ display: "grid", gap: 18 }}>
    <div style={adminPanelCardStyle}>
      <h2 style={{ marginTop: 0 }}>⚙️ Store Information</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
        <AdminField label="Store Name" value={settings.storeName} onChange={v=>update("storeName",v)} />
        <AdminField label="PAN Number" value={settings.panNumber} onChange={v=>update("panNumber",v)} placeholder="Enter PAN number" />
        <AdminField label="VAT Number" value={settings.vatNumber} onChange={v=>update("vatNumber",v)} />
        <AdminField label="Business Registration Number" value={settings.registrationNumber} onChange={v=>update("registrationNumber",v)} />
        <AdminField label="Contact Number" value={settings.contactNumber} onChange={v=>update("contactNumber",v)} />
        <AdminField label="WhatsApp Number" value={settings.whatsappNumber} onChange={v=>update("whatsappNumber",v)} />
        <AdminField label="Store Email" value={settings.email} onChange={v=>update("email",v)} type="email" />
        <AdminField label="Store Address" value={settings.address} onChange={v=>update("address",v)} />
      </div>
    </div>

    <div style={adminPanelCardStyle}>
      <h2 style={{ marginTop: 0 }}>🚚 Delivery Settings</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
        <AdminField label="Default Delivery Charge (Rs.)" value={settings.deliveryCharge} onChange={v=>update("deliveryCharge",v)} type="number" />
        <AdminField label="Free Delivery Above (Rs.)" value={settings.freeDeliveryAbove} onChange={v=>update("freeDeliveryAbove",v)} type="number" />
        <AdminField label="Delivery Time" value={settings.deliveryTime} onChange={v=>update("deliveryTime",v)} />
        <AdminField label="Inside Kathmandu Charge" value={settings.insideKathmanduDelivery} onChange={v=>update("insideKathmanduDelivery",v)} />
        <AdminField label="Outside Kathmandu Charge" value={settings.outsideKathmanduDelivery} onChange={v=>update("outsideKathmanduDelivery",v)} />
      </div>
    </div>

    <div style={adminPanelCardStyle}>
      <h2 style={{ marginTop: 0 }}>💳 Payment Settings</h2>
      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        {[["codEnabled","Cash on Delivery"],["bankTransferEnabled","Bank Transfer"],["esewaEnabled","eSewa"],["khaltiEnabled","Khalti"]].map(([key,label]) => <label key={key} style={{ display:"flex",alignItems:"center",gap:10,fontWeight:700 }}><input type="checkbox" checked={!!settings[key]} onChange={e=>update(key,e.target.checked)} /> {label}</label>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
        <AdminField label="Bank Name" value={settings.bankName} onChange={v=>update("bankName",v)} />
        <AdminField label="Account Name" value={settings.accountName} onChange={v=>update("accountName",v)} />
        <AdminField label="Account Number" value={settings.accountNumber} onChange={v=>update("accountNumber",v)} />
        <AdminField label="Branch" value={settings.branch} onChange={v=>update("branch",v)} />
      </div>
    </div>

    <div style={adminPanelCardStyle}>
      <h2 style={{ marginTop: 0 }}>📜 Store Policies</h2>
      <div style={{ display:"grid",gap:14 }}>
        <label style={adminLabelStyle}>Return Policy<textarea rows="4" value={settings.returnPolicy} onChange={e=>update("returnPolicy",e.target.value)} style={{...adminInputStyle,resize:"vertical"}} /></label>
        <label style={adminLabelStyle}>Refund Policy<textarea rows="4" value={settings.refundPolicy} onChange={e=>update("refundPolicy",e.target.value)} style={{...adminInputStyle,resize:"vertical"}} /></label>
        <label style={adminLabelStyle}>Cancellation Policy<textarea rows="4" value={settings.cancellationPolicy} onChange={e=>update("cancellationPolicy",e.target.value)} style={{...adminInputStyle,resize:"vertical"}} /></label>
        <label style={adminLabelStyle}>Privacy Policy<textarea rows="4" value={settings.privacyPolicy} onChange={e=>update("privacyPolicy",e.target.value)} style={{...adminInputStyle,resize:"vertical"}} /></label>
        <label style={adminLabelStyle}>Terms & Conditions<textarea rows="4" value={settings.terms} onChange={e=>update("terms",e.target.value)} style={{...adminInputStyle,resize:"vertical"}} /></label>
      </div>
    </div>

    {message && <div style={{...adminPanelCardStyle, fontWeight:700}}>{message}</div>}
    <div style={{ display:"flex",justifyContent:"flex-end" }}><button type="submit" disabled={saving} style={{...adminButtonStyle,background:"#111827",color:"white",padding:"12px 20px"}}>{saving ? "Saving..." : "💾 Save All Settings"}</button></div>
  </form>;
}
const adminPanelCardStyle={background:"white",border:"1px solid #e5e7eb",borderRadius:14,padding:20};

function AdminStat({ title, value, icon }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "18px",
      }}
    >
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ color: "#667085", fontSize: "13px" }}>{title}</div>
      <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "4px" }}>
        {value}
      </div>
    </div>
  );
}

const adminButtonStyle = {
  border: "1px solid #d1d5db",
  background: "white",
  color: "#111827",
  borderRadius: "9px",
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const adminThStyle = {
  textAlign: "left",
  padding: "13px 14px",
  fontSize: "12px",
  color: "#667085",
  textTransform: "uppercase",
  borderBottom: "1px solid #e5e7eb",
  whiteSpace: "nowrap",
};

const adminTdStyle = {
  padding: "14px",
  verticalAlign: "top",
  borderBottom: "1px solid #eef0f3",
  fontSize: "13px",
};


/* =========================================================
   HELP CENTER
========================================================= */
function HelpCenter({ onBack, onTrackOrder, onSupport }) {
  const [query, setQuery] = useState("");
  const faqs = [
    ["How do I place an order?", "Add products to your cart, continue to checkout, enter your delivery details and choose a payment method."],
    ["How can I track my order?", "Open Track Order and enter the Order ID you received after checkout."],
    ["What payment methods are available?", "Cash on Delivery and Bank Transfer are currently available. eSewa and Khalti can be enabled later."],
    ["How long does delivery take?", "Delivery time depends on your location. Our team will contact you to confirm the order and delivery."],
    ["Can I cancel an order?", "Contact customer support as soon as possible with your Order ID. Cancellation depends on the current order status."],
    ["What if I receive a damaged or wrong product?", "Contact support with your Order ID and details of the issue so our team can assist you."],
  ];
  const filtered = faqs.filter(([q, a]) => `${q} ${a}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <main style={{ minHeight: "100vh", background: "#f6f7fb", padding: "24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <button onClick={onBack} style={featureBackButton}>← Back to Store</button>
        <div style={{ background: "linear-gradient(135deg,#111827,#2563eb)", color: "white", borderRadius: 20, padding: "42px 28px", marginTop: 16, textAlign: "center" }}>
          <div style={{ fontSize: 42 }}>🛟</div>
          <h1 style={{ margin: "8px 0", fontSize: 36 }}>Hi, how can we help?</h1>
          <p style={{ opacity: .9 }}>Find answers, track your order, or contact Anuraj Store support.</p>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search help topics..." style={featureSearch} />
        </div>
        <div style={featureGrid}>
          <button style={featureCard} onClick={onTrackOrder}><span style={featureIcon}>📦</span><strong>Track My Order</strong><small>Check your order status</small></button>
          <button style={featureCard} onClick={onSupport}><span style={featureIcon}>💬</span><strong>Customer Support</strong><small>Get help with your order</small></button>
          <div style={featureCardStatic}><span style={featureIcon}>💳</span><strong>Payment Help</strong><small>COD & Bank Transfer</small></div>
          <div style={featureCardStatic}><span style={featureIcon}>🚚</span><strong>Delivery Help</strong><small>Delivery and address questions</small></div>
        </div>
        <section style={featureSection}>
          <h2>❓ Top Questions</h2>
          {filtered.length ? filtered.map(([q,a]) => <details key={q} style={faqItem}><summary style={{ cursor: "pointer", fontWeight: 700 }}>{q}</summary><p style={{ color: "#4b5563", lineHeight: 1.6 }}>{a}</p></details>) : <p>No matching help topic found.</p>}
        </section>
        <section style={{ ...featureSection, textAlign: "center" }}>
          <h2>Still need help?</h2>
          <p style={{ color: "#6b7280" }}>Send us your question and our team can follow up with you.</p>
          <button onClick={onSupport} style={primaryFeatureButton}>Contact Customer Support →</button>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   TRACK ORDER
========================================================= */
function TrackOrder({ onBack, onHelp }) {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const API_URL = "https://anuraj-store.onrender.com";
  const statuses = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const labels = { pending: "Order Received", confirmed: "Confirmed", processing: "Processing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };

  async function track(e) {
    e.preventDefault();
    const id = orderNumber.trim();
    if (!id) { setError("Please enter your Order ID."); return; }
    setLoading(true); setError(""); setOrder(null);
    try {
      const response = await fetch(`${API_URL}/api/orders/${encodeURIComponent(id)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Order not found.");
      setOrder(data.order);
    } catch (err) {
      setError(err.message || "Could not connect to the order service.");
    } finally { setLoading(false); }
  }

  const current = order?.status || "pending";
  const currentIndex = statuses.indexOf(current);
  return (
    <main style={{ minHeight: "100vh", background: "#f6f7fb", padding: "24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <button onClick={onBack} style={featureBackButton}>← Back to Store</button>
        <section style={{ ...featureSection, marginTop: 16 }}>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: 44 }}>📦</div><h1>Track Your Order</h1><p style={{ color: "#6b7280" }}>Enter the Order ID shown after checkout.</p></div>
          <form onSubmit={track} style={{ display: "flex", gap: 10, maxWidth: 650, margin: "24px auto" }}>
            <input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="Example: AS-20260915-ABC123" style={{ ...featureSearch, color: "#111827", boxShadow: "none", border: "1px solid #d1d5db", margin: 0 }} />
            <button disabled={loading} style={primaryFeatureButton}>{loading ? "Checking..." : "Track"}</button>
          </form>
          {error && <div style={errorBox}>⚠️ {error}</div>}
          {order && (
            <div style={{ marginTop: 24 }}>
              <div style={orderSummaryBox}><div><span>Order ID</span><strong>{order.order_number}</strong></div><div><span>Status</span><strong>{labels[current] || current}</strong></div><div><span>Total</span><strong>{formatPrice(Number(order.total || 0))}</strong></div></div>
              {current !== "cancelled" ? <div style={{ marginTop: 30 }}>{statuses.map((status, i) => <div key={status} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}><div style={{ width: 34, height: 34, borderRadius: "50%", display: "grid", placeItems: "center", background: i <= currentIndex ? "#2563eb" : "#e5e7eb", color: i <= currentIndex ? "white" : "#6b7280", fontWeight: 800 }}>{i < currentIndex ? "✓" : i + 1}</div><div><strong>{labels[status]}</strong><div style={{ color: "#6b7280", fontSize: 13 }}>{i <= currentIndex ? "Completed / current" : "Pending"}</div></div></div>)}</div> : <div style={errorBox}>❌ This order has been cancelled. Contact support if you need assistance.</div>}
              <div style={{ marginTop: 26 }}><h3>Delivery</h3><p style={{ color: "#4b5563" }}>{order.customer?.city}, {order.customer?.district}, {order.customer?.province}<br />{order.customer?.address}</p></div>
              <button onClick={onHelp} style={secondaryFeatureButton}>Need help with this order?</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   CUSTOMER SUPPORT
========================================================= */
function CustomerSupport({ onBack }) {
  const [form, setForm] = useState({ name: "", mobile: "", orderId: "", topic: "Order issue", message: "" });
  const [sent, setSent] = useState(false);
  function submit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim() || !form.message.trim()) return;
    const cases = JSON.parse(localStorage.getItem("anuraj_store_support_cases") || "[]");
    const caseId = `CASE-${Date.now().toString().slice(-8)}`;
    cases.unshift({ caseId, ...form, createdAt: new Date().toISOString(), status: "open" });
    localStorage.setItem("anuraj_store_support_cases", JSON.stringify(cases));
    setSent(true);
  }
  return (
    <main style={{ minHeight: "100vh", background: "#f6f7fb", padding: "24px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <button onClick={onBack} style={featureBackButton}>← Back</button>
        <section style={{ ...featureSection, marginTop: 16 }}>
          {!sent ? <><div style={{ textAlign: "center" }}><div style={{ fontSize: 44 }}>💬</div><h1>Customer Support</h1><p style={{ color: "#6b7280" }}>Tell us what you need help with.</p></div><form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            <input required placeholder="Full name *" value={form.name} onChange={e => setForm({...form,name:e.target.value})} style={supportInput} />
            <input required placeholder="Mobile number *" value={form.mobile} onChange={e => setForm({...form,mobile:e.target.value})} style={supportInput} />
            <input placeholder="Order ID (optional)" value={form.orderId} onChange={e => setForm({...form,orderId:e.target.value})} style={supportInput} />
            <select value={form.topic} onChange={e => setForm({...form,topic:e.target.value})} style={supportInput}><option>Order issue</option><option>Delivery</option><option>Payment</option><option>Return / Refund</option><option>Product issue</option><option>Other</option></select>
            <textarea required rows="6" placeholder="Describe your issue *" value={form.message} onChange={e => setForm({...form,message:e.target.value})} style={supportInput} />
            <button style={primaryFeatureButton}>Submit Support Request</button>
          </form></> : <div style={{ textAlign: "center", padding: 30 }}><div style={{ fontSize: 58 }}>✅</div><h1>Request Received</h1><p style={{ color: "#4b5563" }}>Your support request has been saved successfully.</p><p><strong>Case ID:</strong> {JSON.parse(localStorage.getItem("anuraj_store_support_cases") || "[]")[0]?.caseId}</p><button onClick={onBack} style={primaryFeatureButton}>Back to Store</button></div>}
        </section>
      </div>
    </main>
  );
}

const featureBackButton = { border: "1px solid #d1d5db", background: "white", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" };
const featureSearch = { width: "100%", maxWidth: 650, margin: "20px auto 0", display: "block", boxSizing: "border-box", padding: "15px 18px", borderRadius: 12, border: "0", fontSize: 16, outline: "none" };
const featureGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16, margin: "22px 0" };
const featureCard = { border: "1px solid #e5e7eb", background: "white", borderRadius: 16, padding: 22, textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 7, boxShadow: "0 4px 16px rgba(0,0,0,.04)" };
const featureCardStatic = { ...featureCard, cursor: "default" };
const featureIcon = { fontSize: 30 };
const featureSection = { background: "white", borderRadius: 18, padding: 28, boxShadow: "0 4px 18px rgba(0,0,0,.05)", marginBottom: 20 };
const faqItem = { padding: "17px 0", borderBottom: "1px solid #e5e7eb" };
const primaryFeatureButton = { border: 0, background: "#2563eb", color: "white", borderRadius: 10, padding: "12px 18px", fontWeight: 800, cursor: "pointer" };
const secondaryFeatureButton = { border: "1px solid #2563eb", background: "white", color: "#2563eb", borderRadius: 10, padding: "11px 16px", fontWeight: 800, cursor: "pointer" };
const errorBox = { marginTop: 18, padding: 14, background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 10 };
const orderSummaryBox = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, background: "#f8fafc", borderRadius: 12, padding: 18 };
const supportInput = { width: "100%", boxSizing: "border-box", padding: "13px 14px", border: "1px solid #d1d5db", borderRadius: 10, fontSize: 15, fontFamily: "inherit" };

/* =========================================================
   MAIN STORE
========================================================= */

function App() {
  const [category, setCategory] =
    useState("All");

  const [search, setSearch] =
    useState("");

  const [cart, setCart] =
    useState([]);

  const [showCart, setShowCart] =
    useState(false);

  const [screen, setScreen] =
    useState(() => window.location.pathname === "/admin" ? "admin-login" : "home");

  const [adminUser, setAdminUser] = useState(() => {
    try {
      const token = localStorage.getItem("anuraj_store_admin_token");
      const user = JSON.parse(localStorage.getItem("anuraj_store_admin_user") || "null");
      return token && user ? user : null;
    } catch {
      return null;
    }
  });

  const [completedOrder, setCompletedOrder] =
    useState(null);

  const [storeSettings, setStoreSettings] = useState(() => {
    try { return { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(localStorage.getItem("anuraj_store_settings_v2") || "{}")} } catch { return DEFAULT_STORE_SETTINGS; }
  });

  useEffect(() => {
    const onSettings = (event) => {
      if (event.detail) {
        setStoreSettings({ ...DEFAULT_STORE_SETTINGS, ...event.detail });
      }
    };

    // Same-tab updates from the Admin Settings panel.
    window.addEventListener("anuraj-store-settings", onSettings);

    // Cross-tab updates: when Admin saves settings, an already-open
    // customer Store tab receives the localStorage "storage" event.
    const onStorage = (event) => {
      if (event.key === "anuraj_store_settings_v2" && event.newValue) {
        try {
          const next = {
            ...DEFAULT_STORE_SETTINGS,
            ...JSON.parse(event.newValue),
          };
          setStoreSettings(next);
        } catch (error) {
          console.error("SETTINGS SYNC ERROR:", error);
        }
      }
    };

    window.addEventListener("storage", onStorage);

    fetch("https://anuraj-store.onrender.com/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          const next = { ...DEFAULT_STORE_SETTINGS, ...data.settings };
          setStoreSettings(next);
          localStorage.setItem(
            "anuraj_store_settings_v2",
            JSON.stringify(next)
          );
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("anuraj-store-settings", onSettings);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const [storeProducts, setStoreProducts] = useState(() => {
    try {
      const saved = localStorage.getItem("anuraj_store_products");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.error("PRODUCT STORAGE ERROR:", error);
    }
    return products;
  });

  function handleProductsChange(nextProducts) {
    // Update the Store immediately in the current tab.
    setStoreProducts(nextProducts);

    try {
      // Persist so the Store keeps Admin changes after refresh/restart.
      localStorage.setItem(
        "anuraj_store_products",
        JSON.stringify(nextProducts)
      );

      // Notify other components/tabs opened on the same Store origin.
      window.dispatchEvent(
        new CustomEvent("anuraj-store-products", {
          detail: nextProducts,
        })
      );
    } catch (error) {
      console.error("PRODUCT SAVE ERROR:", error);
    }
  }

  useEffect(() => {
    // Same-tab product sync.
    const onProducts = (event) => {
      if (Array.isArray(event.detail)) {
        setStoreProducts(event.detail);
      }
    };

    // Cross-tab product sync. This fires when Admin changes products
    // in another tab/window of the same browser origin.
    const onStorage = (event) => {
      if (event.key === "anuraj_store_products" && event.newValue) {
        try {
          const nextProducts = JSON.parse(event.newValue);
          if (Array.isArray(nextProducts)) {
            setStoreProducts(nextProducts);
          }
        } catch (error) {
          console.error("PRODUCT SYNC ERROR:", error);
        }
      }
    };

    window.addEventListener("anuraj-store-products", onProducts);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("anuraj-store-products", onProducts);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const filteredProducts =
    storeProducts.filter((product) => {

      const categoryMatch =
        category === "All" ||
        product.category === category;

      const searchMatch =
        product.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      return (
        categoryMatch &&
        searchMatch
      );
    });

  function addToCart(product) {
    if (Number(product.stock ?? 999999) <= 0) {
      window.alert("This product is out of stock.");
      return;
    }

    setCart((previous) => {

      const existing =
        previous.find(
          (item) =>
            item.id === product.id
        );

      if (existing) {
        const stock = Number(product.stock ?? 999999);
        if (existing.quantity >= stock) {
          window.alert("Maximum available stock reached.");
          return previous;
        }
        return previous.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...previous,
        {
          ...product,
          quantity: 1,
        },
      ];
    });

    setShowCart(true);
  }

  function increaseQuantity(id) {
    setCart((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item
      )
    );
  }

  function decreaseQuantity(id) {
    setCart((previous) =>
      previous
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item
        )
        .filter(
          (item) => item.quantity > 0
        )
    );
  }

  function removeFromCart(id) {
    setCart((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );
  }

  const cartCount = cart.reduce(
    (sum, item) =>
      sum + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (sum, item) =>
      sum +
      item.price *
        item.quantity,
    0
  );

  function openCheckout() {
    if (cart.length === 0) {
      return;
    }

    setShowCart(false);
    setScreen("checkout");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleOrderSuccess(order) {
    // Reduce local inventory after a successful order.
    const orderedItems = Array.isArray(order.items) ? order.items : [];
    const nextProducts = storeProducts.map((product) => {
      const ordered = orderedItems.find((item) => String(item.id) === String(product.id));
      if (!ordered) return product;
      return {
        ...product,
        stock: Math.max(0, Number(product.stock || 0) - Number(ordered.quantity || 0)),
      };
    });
    handleProductsChange(nextProducts);

    setCompletedOrder(order);
    setCart([]);
    setScreen("success");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function continueShopping() {
    setCompletedOrder(null);
    setScreen("home");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* HELP CENTER */
  if (screen === "help") {
    return (
      <HelpCenter
        onBack={() => setScreen("home")}
        onTrackOrder={() => setScreen("track")}
        onSupport={() => setScreen("support")}
      />
    );
  }

  /* TRACK ORDER */
  if (screen === "track") {
    return (
      <TrackOrder
        onBack={() => setScreen("home")}
        onHelp={() => setScreen("support")}
      />
    );
  }

  /* CUSTOMER SUPPORT */
  if (screen === "support") {
    return <CustomerSupport onBack={() => setScreen("home")} />;
  }

  /* SELLER / ADMIN SCREEN */
  if (screen === "admin-login") {
    return (
      <SellerLogin
        onBack={() => setScreen("home")}
        onSuccess={(user) => {
          setAdminUser(user);
          setScreen("admin");
        }}
      />
    );
  }

  if (screen === "admin") {
    if (!adminUser || !localStorage.getItem("anuraj_store_admin_token")) {
      return <SellerLogin onBack={() => setScreen("home")} onSuccess={(user) => { setAdminUser(user); setScreen("admin"); }} />;
    }
    return (
      <AdminPanel
        onBack={() => setScreen("home")}
        products={storeProducts}
        onProductsChange={handleProductsChange}
      />
    );
  }

  /* CHECKOUT SCREEN */
  if (screen === "checkout") {
    return (
      <Checkout
        cart={cart}
        subtotal={subtotal}
        deliveryCharge={Number(storeSettings.deliveryCharge || 0)}
        storeSettings={storeSettings}
        onBack={() =>
          setScreen("home")
        }
        onOrderSuccess={
          handleOrderSuccess
        }
      />
    );
  }

  /* SUCCESS SCREEN */
  if (
    screen === "success" &&
    completedOrder
  ) {
    return (
      <OrderSuccess
        order={completedOrder}
        onContinue={
          continueShopping
        }
      />
    );
  }

  /* HOME */
  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">

        <div className="logo">
          Anuraj <span>Store</span>
        </div>

        <div className="search">

          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          <button>
            🔍
          </button>

        </div>

        <button
          className="cartButton"
          onClick={() =>
            setShowCart(true)
          }
        >
          🛒 Cart

          {cartCount > 0 && (
            <span className="cartCount">
              {cartCount}
            </span>
          )}
        </button>


      </header>

      {/* NAVIGATION */}
      <nav className="nav">

        <button type="button" onClick={() => setScreen("help")}>🛟 Help Center</button>
        <button type="button" onClick={() => setScreen("track")}>📦 Track Order</button>
        <button type="button" onClick={() => setScreen("support")}>💬 Support</button>

        <button
          className={
            category === "All"
              ? "active"
              : ""
          }
          onClick={() =>
            setCategory("All")
          }
        >
          All Products
        </button>

        {categories.map(
          ([icon, name]) => (
            <button
              key={name}
              className={
                category === name
                  ? "active"
                  : ""
              }
              onClick={() =>
                setCategory(name)
              }
            >
              {icon} {name}
            </button>
          )
        )}

      </nav>

      {/* HERO */}
      <section className="hero">

        <div>

          <p className="heroSmall">
            WELCOME TO ANURAJ STORE
          </p>

          <h1>
            Latest Technology.
            <br />
            <span>Best Price.</span>
          </h1>

          <p>
            Phones, laptops, computers
            and accessories at
            competitive prices.
          </p>

          <button
            className="shopButton"
            onClick={() =>
              document
                .getElementById(
                  "products"
                )
                ?.scrollIntoView({
                  behavior: "smooth",
                })
            }
          >
            Shop Now →
          </button>

        </div>

        <div className="heroImage">
          📱
        </div>

      </section>

      {/* CATEGORIES */}
      <section className="section">

        <h2>
          Shop by Category
        </h2>

        <div className="categoryGrid">

          {categories.map(
            ([icon, name]) => (

              <button
                className="categoryCard"
                key={name}
                onClick={() => {

                  setCategory(name);

                  document
                    .getElementById(
                      "products"
                    )
                    ?.scrollIntoView({
                      behavior:
                        "smooth",
                    });

                }}
              >
                <div>{icon}</div>

                <strong>
                  {name}
                </strong>

              </button>

            )
          )}

        </div>

      </section>

      {/* PRODUCTS */}
      <section
        className="section"
        id="products"
      >

        <div className="sectionTitle">

          <div>
            <h2>
              Featured Products
            </h2>

            <p>
              Best deals available
              at Anuraj Store
            </p>
          </div>

          <span>
            {filteredProducts.length}{" "}
            Products
          </span>

        </div>

        <div className="productGrid">

          {filteredProducts.map(
            (product) => (

              <div
                className="productCard"
                key={product.id}
              >

                <div className="discount">
                  -{product.discount}%
                </div>

                <div className="productImage">
                  {product.image ? (
                    <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : product.emoji}
                </div>

                <div className="productInfo">

                  <small>
                    {product.category}
                  </small>

                  <h3>
                    {product.name}
                  </h3>

                  <div className="price">
                    {formatPrice(
                      product.price
                    )}
                  </div>

                  <div className="oldPrice">
                    {formatPrice(product.oldPrice)}
                  </div>

                  <div style={{ margin: "6px 0 10px", fontSize: "12px", fontWeight: 700, color: Number(product.stock ?? 0) <= 3 ? "#b91c1c" : "#667085" }}>
                    {Number(product.stock ?? 0) > 0 ? `Stock: ${product.stock}` : "Out of stock"}
                  </div>

                  <button
                    className="addButton"
                    disabled={Number(product.stock ?? 0) <= 0}
                    onClick={() => addToCart(product)}
                    style={Number(product.stock ?? 0) <= 0 ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
                  >
                    {Number(product.stock ?? 0) > 0 ? "🛒 Add to Cart" : "Out of Stock"}
                  </button>

                </div>

              </div>

            )
          )}

        </div>

        {filteredProducts.length ===
          0 && (
          <div className="noProducts">
            No products found.
          </div>
        )}

      </section>

      {/* FEATURES */}
      <section className="features">

        <div>
          🚚
          <h3>
            Fast Delivery
          </h3>
          <p>
            Delivery across Nepal
          </p>
        </div>

        <div>
          💵
          <h3>
            Cash on Delivery
          </h3>
          <p>
            Pay when you receive
          </p>
        </div>

        <div>
          🏦
          <h3>
            Bank Payment
          </h3>
          <p>
            Secure bank transfer
          </p>
        </div>

        <div>
          📞
          <h3>
            Customer Support
          </h3>
          <p>
            We're here to help
          </p>
        </div>

      </section>

      {/* FOOTER */}
      <footer>

        <div className="footerLogo">
          Anuraj <span>Store</span>
        </div>

        <p>
          Your trusted online
          electronics store in Nepal.
        </p>

        <p>
          📞 Contact: 98XXXXXXXX
        </p>

        <p>
          © 2026 Anuraj Store.
          All rights reserved.
        </p>

      </footer>

      {/* CART */}
      {showCart && (

        <div
          className="overlay"
          onClick={() =>
            setShowCart(false)
          }
        >

          <div
            className="cartPanel"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="cartHeader">

              <h2>
                🛒 Your Cart
              </h2>

              <button
                onClick={() =>
                  setShowCart(false)
                }
              >
                ✕
              </button>

            </div>

            {cart.length === 0 ? (

              <div className="emptyCart">

                <div>🛒</div>

                <h3>
                  Your cart is empty
                </h3>

                <p>
                  Add some products
                  to continue.
                </p>

              </div>

            ) : (

              <>

                <div className="cartItems">

                  {cart.map(
                    (item) => (

                      <div
                        className="cartItem"
                        key={item.id}
                      >

                        <div className="cartEmoji">
                          {item.emoji}
                        </div>

                        <div className="cartItemInfo">

                          <strong>
                            {item.name}
                          </strong>

                          <p>
                            {formatPrice(
                              item.price
                            )}
                          </p>

                          <div className="quantity">

                            <button
                              onClick={() =>
                                decreaseQuantity(
                                  item.id
                                )
                              }
                            >
                              −
                            </button>

                            <span>
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                increaseQuantity(
                                  item.id
                                )
                              }
                            >
                              +
                            </button>

                          </div>

                        </div>

                        <button
                          className="removeCart"
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                        >
                          🗑️
                        </button>

                      </div>

                    )
                  )}

                </div>

                <div className="cartTotal">

                  <span>
                    Subtotal
                  </span>

                  <strong>
                    {formatPrice(
                      subtotal
                    )}
                  </strong>

                </div>

                <button
                  className="checkoutButton"
                  onClick={
                    openCheckout
                  }
                >
                  Proceed to Checkout →
                </button>

              </>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <App />
);
