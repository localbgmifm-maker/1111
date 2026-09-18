/* =========================================================
   11:11 PIZZA CAFE
   CHECKOUT JS
   ---------------------------------------------------------
   GPS / LOCATION VERIFICATION REMOVED

   FLOW:

   CART
      ↓
   CHECKOUT
      ↓
   CUSTOMER DETAILS
      ↓
   PAYMENT
      ↓
   PAYMENT PAGE

   No fake GPS
   No fake distance
   No fake payment success
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    "use strict";


    /* =====================================================
       CONFIG
       ===================================================== */

    const CART_KEY = "1111_cart";
    const CHECKOUT_ORDER_KEY = "1111_checkout_order";


    /* =====================================================
       ELEMENTS
       ===================================================== */

    const checkoutForm =
        document.getElementById("checkoutForm");

    const checkoutItems =
        document.getElementById("checkoutItems");

    const checkoutSubtotal =
        document.getElementById("checkoutSubtotal");

    const checkoutDiscount =
        document.getElementById("checkoutDiscount");

    const checkoutDelivery =
        document.getElementById("checkoutDelivery");

    const checkoutExtraFee =
        document.getElementById("checkoutExtraFee");

    const checkoutTotal =
        document.getElementById("checkoutTotal");

    const placeOrderBtn =
        document.getElementById("placeOrderBtn");

    const placeOrderBtnMobile =
        document.getElementById("placeOrderBtnMobile");

    const customerName =
        document.getElementById("customerName");

    const customerPhone =
        document.getElementById("customerPhone");

    const deliveryAddress =
        document.getElementById("deliveryAddress");

    const landmark =
        document.getElementById("landmark");

    const onlinePayment =
        document.getElementById("onlinePayment");

    const codPayment =
        document.getElementById("codPayment");


    /* =====================================================
       CART
       ===================================================== */

    function getCart() {

        try {

            const raw =
                localStorage.getItem(CART_KEY);

            if (!raw) {
                return [];
            }

            const cart =
                JSON.parse(raw);

            return Array.isArray(cart)
                ? cart
                : [];

        } catch (error) {

            console.error(
                "Cart read error:",
                error
            );

            return [];
        }
    }


    /* =====================================================
       NUMBER
       ===================================================== */

    function number(value, fallback = 0) {

        const parsed =
            Number(value);

        return Number.isFinite(parsed)
            ? parsed
            : fallback;
    }


    /* =====================================================
       PRICE
       ===================================================== */

    function getBasePrice(item) {

        const values = [

            item.basePrice,
            item.singlePrice,
            item.price,
            item.unitPrice

        ];


        for (const value of values) {

            const parsed =
                Number(value);

            if (
                Number.isFinite(parsed) &&
                parsed >= 0
            ) {

                return parsed;

            }

        }


        return 0;
    }


    /* =====================================================
       QUANTITY
       ===================================================== */

    function getQuantity(item) {

        const quantity =
            Number(
                item.quantity ??
                item.qty ??
                1
            );


        if (
            Number.isFinite(quantity) &&
            quantity > 0
        ) {

            return Math.floor(quantity);

        }


        return 1;
    }


    /* =====================================================
       ADDONS
       ===================================================== */

    function getAddonTotal(item) {

        if (
            Number.isFinite(
                Number(item.addonTotal)
            )
        ) {

            return Number(
                item.addonTotal
            );

        }


        if (!Array.isArray(item.addons)) {

            return 0;

        }


        return item.addons.reduce(
            (total, addon) => {

                if (
                    typeof addon === "number"
                ) {

                    return total + addon;

                }


                if (
                    typeof addon === "object" &&
                    addon !== null
                ) {

                    const price =
                        Number(
                            addon.price ??
                            addon.amount ??
                            addon.value ??
                            0
                        );


                    if (
                        Number.isFinite(price)
                    ) {

                        return total + price;

                    }

                }


                return total;

            },
            0
        );

    }


    /* =====================================================
       UNIT PRICE
       ===================================================== */

    function getUnitPrice(item) {

        const basePrice =
            getBasePrice(item);

        const addonTotal =
            getAddonTotal(item);


        const storedUnitPrice =
            Number(item.unitPrice);


        /*
          If unitPrice already contains addons,
          don't add them again.
        */

        if (
            Number.isFinite(storedUnitPrice) &&
            storedUnitPrice >=
                basePrice + addonTotal
        ) {

            return storedUnitPrice;

        }


        return basePrice + addonTotal;

    }


    /* =====================================================
       ITEM TOTAL
       ===================================================== */

    function getItemTotal(item) {

        return (
            getUnitPrice(item) *
            getQuantity(item)
        );

    }


    /* =====================================================
       SUBTOTAL
       ===================================================== */

    function getSubtotal(cart) {

        return cart.reduce(
            (total, item) => {

                return total +
                    getItemTotal(item);

            },
            0
        );

    }


    /* =====================================================
       MONEY
       ===================================================== */

    function money(value) {

        return `₹${number(value).toFixed(0)}`;

    }


    /* =====================================================
       ESCAPE HTML
       ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       ADDON NAMES
       ===================================================== */

    function addonNames(item) {

        if (!Array.isArray(item.addons)) {

            return "";

        }


        return item.addons
            .map(addon => {

                if (
                    typeof addon === "string"
                ) {

                    return addon;

                }


                if (
                    typeof addon === "object" &&
                    addon !== null
                ) {

                    return (
                        addon.name ||
                        addon.title ||
                        addon.label ||
                        ""
                    );

                }


                return "";

            })
            .filter(Boolean)
            .join(", ");

    }


    /* =====================================================
       RENDER ITEMS
       ===================================================== */

    function renderItems(cart) {

        if (!checkoutItems) {
            return;
        }


        if (!cart.length) {

            checkoutItems.innerHTML = `

                <div class="checkout-empty">

                    <i class="fa-solid fa-cart-shopping"></i>

                    <p>
                        Your cart is empty.
                    </p>

                    <a href="menu.html">
                        Browse Menu
                    </a>

                </div>

            `;

            return;

        }


        checkoutItems.innerHTML =
            cart.map(item => {

                const quantity =
                    getQuantity(item);

                const unitPrice =
                    getUnitPrice(item);

                const total =
                    getItemTotal(item);

                const addons =
                    addonNames(item);

                const image =
                    item.image || "";


                return `

                    <div class="checkout-item">


                        <div class="checkout-item-image">

                            ${
                                image
                                    ? `
                                        <img
                                            src="${escapeHTML(image)}"
                                            alt="${escapeHTML(item.name || "Food item")}"
                                            loading="lazy"
                                        >
                                      `
                                    : `
                                        <i class="fa-solid fa-pizza-slice"></i>
                                      `
                            }

                        </div>


                        <div class="checkout-item-info">

                            <h3>
                                ${escapeHTML(
                                    item.name ||
                                    "Food Item"
                                )}
                            </h3>


                            ${
                                item.size
                                    ? `
                                        <div class="checkout-item-size">
                                            Size:
                                            ${escapeHTML(item.size)}
                                        </div>
                                      `
                                    : ""
                            }


                            ${
                                addons
                                    ? `
                                        <div class="checkout-item-addons">
                                            Add-ons:
                                            ${escapeHTML(addons)}
                                        </div>
                                      `
                                    : ""
                            }


                            <div class="checkout-item-qty">
                                Qty: ${quantity}
                            </div>

                        </div>


                        <div class="checkout-item-price">

                            <small>
                                ${money(unitPrice)}
                                ×
                                ${quantity}
                            </small>

                            <strong>
                                ${money(total)}
                            </strong>

                        </div>

                    </div>

                `;

            }).join("");

    }


    /* =====================================================
       DELIVERY
       =====================================================

       IMPORTANT:

       Automatic address → distance system is NOT faked.

       Until a real delivery API/backend is connected,
       delivery is shown as "—".

       Later:

       Address
          ↓
       Geocoding
          ↓
       Route distance
          ↓
       Delivery charge
          ↓
       Total

       can be connected without changing this UI.
       ===================================================== */

    let deliveryDistanceKm = null;
    let deliveryCharge = 0;


    /* =====================================================
       SUMMARY
       ===================================================== */

    function renderSummary(cart) {

        const subtotal =
            getSubtotal(cart);

        const discount =
            0;

        const extraFee =
            0;


        /*
          No fake delivery distance.
        */

        deliveryCharge =
            0;


        const total =
            subtotal -
            discount +
            deliveryCharge +
            extraFee;


        if (checkoutSubtotal) {

            checkoutSubtotal.textContent =
                money(subtotal);

        }


        if (checkoutDiscount) {

            checkoutDiscount.textContent =
                money(discount);

        }


        if (checkoutDelivery) {

            if (
                deliveryDistanceKm === null
            ) {

                checkoutDelivery.textContent =
                    "—";

            } else {

                checkoutDelivery.textContent =
                    money(deliveryCharge);

            }

        }


        if (checkoutExtraFee) {

            checkoutExtraFee.textContent =
                money(extraFee);

        }


        if (checkoutTotal) {

            checkoutTotal.textContent =
                money(total);

        }


        return {

            subtotal,
            discount,
            delivery:
                deliveryCharge,
            extraFee,
            total

        };

    }


    /* =====================================================
       PHONE
       ===================================================== */

    function validPhone(value) {

        const phone =
            String(value || "")
                .replace(/\D/g, "");


        return /^[6-9]\d{9}$/
            .test(phone);

    }


    /* =====================================================
       FORM VALIDATION
       ===================================================== */

    function validateForm() {

        const name =
            customerName?.value.trim() || "";

        const phone =
            customerPhone?.value.trim() || "";

        const address =
            deliveryAddress?.value.trim() || "";


        if (!name) {

            alert(
                "Please enter your name."
            );

            customerName?.focus();

            return false;

        }


        if (!validPhone(phone)) {

            alert(
                "Please enter a valid 10-digit mobile number."
            );

            customerPhone?.focus();

            return false;

        }


        if (!address) {

            alert(
                "Please enter your delivery address."
            );

            deliveryAddress?.focus();

            return false;

        }


        return true;

    }


    /* =====================================================
       PAYMENT METHOD
       ===================================================== */

    function getPaymentMethod() {

        if (codPayment?.checked) {

            return "cod";

        }


        return "online";

    }


    /* =====================================================
       BUTTON STATE
       ===================================================== */

    function updateButtonState() {

        const cart =
            getCart();

        const name =
            customerName?.value.trim() || "";

        const phone =
            customerPhone?.value.trim() || "";

        const address =
            deliveryAddress?.value.trim() || "";


        const valid =
            cart.length > 0 &&
            name.length > 0 &&
            validPhone(phone) &&
            address.length > 0;


        if (placeOrderBtn) {

            placeOrderBtn.disabled =
                !valid;

        }


        if (placeOrderBtnMobile) {

            placeOrderBtnMobile.disabled =
                !valid;

        }

    }


    /* =====================================================
       SAVE ORDER
       ===================================================== */

    function saveOrder(summary) {

        const cart =
            getCart();


        const order = {

            orderId:
                `1111-${Date.now()}`,

            createdAt:
                new Date().toISOString(),


            customer: {

                name:
                    customerName?.value.trim() || "",

                phone:
                    customerPhone?.value.trim() || "",

                address:
                    deliveryAddress?.value.trim() || "",

                landmark:
                    landmark?.value.trim() || ""

            },


            delivery: {

                distanceKm:
                    deliveryDistanceKm,

                deliveryCharge:
                    summary.delivery,

                status:
                    "pending-address-verification"

            },


            payment: {

                method:
                    getPaymentMethod(),

                status:
                    "pending"

            },


            cart,


            pricing: {

                subtotal:
                    summary.subtotal,

                discount:
                    summary.discount,

                delivery:
                    summary.delivery,

                extraFee:
                    summary.extraFee,

                total:
                    summary.total

            }

        };


        try {

            localStorage.setItem(
                CHECKOUT_ORDER_KEY,
                JSON.stringify(order)
            );


            return order;

        } catch (error) {

            console.error(
                "Order save error:",
                error
            );


            alert(
                "Unable to save your order. Please try again."
            );


            return null;

        }

    }


    /* =====================================================
       CONTINUE TO PAYMENT
       ===================================================== */

    async function continueToPayment(event) {

        if (event) {

            event.preventDefault();

        }


        const cart =
            getCart();


        if (!cart.length) {

            alert(
                "Your cart is empty."
            );

            window.location.href =
                new URL(
                    "menu.html",
                    document.baseURI
                ).href;

            return;

        }


        if (!validateForm()) {

            return;

        }


        const summary =
            renderSummary(cart);


        const order =
            saveOrder(summary);


        if (!order) {

            return;

        }


        /*
          IMPORTANT:

          We are NOT marking payment successful.

          payment.html handles the actual payment flow.
        */

        window.location.href =
            new URL(
                "payment.html",
                document.baseURI
            ).href;

    }


    /* =====================================================
       INPUT EVENTS
       ===================================================== */

    [
        customerName,
        customerPhone,
        deliveryAddress,
        landmark,
        onlinePayment,
        codPayment

    ].forEach(element => {

        if (!element) {
            return;
        }


        element.addEventListener(
            "input",
            updateButtonState
        );


        element.addEventListener(
            "change",
            updateButtonState
        );

    });


    /* =====================================================
       FORM SUBMIT
       ===================================================== */

    if (checkoutForm) {

        checkoutForm.addEventListener(
            "submit",
            continueToPayment
        );

    }


    /* =====================================================
       DESKTOP BUTTON
       ===================================================== */

    if (placeOrderBtn) {

        placeOrderBtn.addEventListener(
            "click",
            continueToPayment
        );

    }


    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    const cart =
        getCart();


    renderItems(cart);

    renderSummary(cart);

    updateButtonState();


    /* =====================================================
       NAVBAR
       ===================================================== */

    async function loadNavbar() {

        const navbar =
            document.getElementById("navbar");


        if (!navbar) {

            return;

        }


        try {

            const response =
                await fetch(
                    new URL(
                        "navbar.html",
                        document.baseURI
                    ).href,
                    {
                        cache: "no-cache"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `Navbar HTTP ${response.status}`
                );

            }


            navbar.innerHTML =
                await response.text();


            /*
              navbar.js may already be loaded
            */

            if (
                typeof window.initializeNavbarJS ===
                "function"
            ) {

                window.initializeNavbarJS();

                return;

            }


            /*
              Otherwise load navbar.js once.
            */

            const alreadyLoaded =
                document.querySelector(
                    'script[data-navbar-js="true"]'
                );


            if (alreadyLoaded) {

                return;

            }


            const script =
                document.createElement("script");


            script.src =
                new URL(
                    "navbar.js",
                    document.baseURI
                ).href;


            script.dataset.navbarJs =
                "true";


            script.onload = () => {

                if (
                    typeof window.initializeNavbarJS ===
                    "function"
                ) {

                    window.initializeNavbarJS();

                }

            };


            script.onerror = () => {

                console.error(
                    "navbar.js could not be loaded."
                );

            };


            document.body.appendChild(
                script
            );


        } catch (error) {

            console.error(
                "Navbar load error:",
                error
            );

        }

    }


    loadNavbar();


    /* =====================================================
       DEBUG
       ===================================================== */

    window.checkout1111 = {

        getCart,

        getSubtotal: () =>
            getSubtotal(getCart()),

        getPaymentMethod,

        getOrder: () => {

            try {

                return JSON.parse(
                    localStorage.getItem(
                        CHECKOUT_ORDER_KEY
                    ) || "null"
                );

            } catch {

                return null;

            }

        }

    };


    console.log(
        "11:11 Checkout loaded successfully."
    );

});