/* =========================================================
   11:11 PIZZA CAFE
   ORDER SUCCESS JS
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const CART_KEY = "1111_cart";
    const CHECKOUT_KEY = "1111_checkout_order";
    const PAYMENT_KEY = "1111_payment_request";


    /* =====================================================
       HELPERS
    ===================================================== */

    function safeJSON(value, fallback) {

        try {

            return JSON.parse(value);

        } catch (error) {

            return fallback;

        }

    }


    function readStorage(key, fallback) {

        try {

            const value = localStorage.getItem(key);

            if (!value) {
                return fallback;
            }

            return safeJSON(value, fallback);

        } catch (error) {

            return fallback;

        }

    }


    function money(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "₹0";
        }

        return "₹" + Math.round(number).toLocaleString("en-IN");

    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function getNumber(...values) {

        for (const value of values) {

            const number = Number(value);

            if (Number.isFinite(number)) {
                return number;
            }

        }

        return 0;
    }


    /* =====================================================
       NORMALIZE ADDONS
    ===================================================== */

    function normalizeAddons(addons) {

        if (!Array.isArray(addons)) {
            return [];
        }

        return addons.map(function (addon) {

            if (typeof addon === "string") {

                return {
                    name: addon,
                    price: 0
                };

            }

            if (addon && typeof addon === "object") {

                return {
                    name:
                        addon.name ||
                        addon.title ||
                        addon.label ||
                        "Add-on",

                    price: getNumber(
                        addon.price,
                        addon.amount,
                        addon.cost
                    )
                };

            }

            return null;

        }).filter(Boolean);
    }


    /* =====================================================
       NORMALIZE CART ITEM
    ===================================================== */

    function normalizeItem(item, index) {

        const quantity = Math.max(
            1,
            Math.floor(
                getNumber(
                    item.quantity,
                    item.qty,
                    1
                )
            )
        );


        const addons = normalizeAddons(item.addons);


        const addonTotal = getNumber(
            item.addonTotal,
            item.addonsTotal
        );


        let unitPrice = getNumber(
            item.unitPrice,
            item.singlePrice
        );


        if (!unitPrice) {

            unitPrice = getNumber(
                item.price,
                item.basePrice,
                item.totalPrice
            );

        }


        /*
         * If old cart stores total price,
         * try to convert it into unit price.
         */

        if (
            item.totalPrice &&
            quantity > 1 &&
            !item.unitPrice &&
            !item.singlePrice
        ) {

            const totalPrice = getNumber(item.totalPrice);

            if (totalPrice > 0) {

                unitPrice = totalPrice / quantity;

            }

        }


        const total = getNumber(
            item.total,
            item.totalPrice
        ) || (
            (unitPrice + addonTotal) * quantity
        );


        return {

            id:
                item.id ||
                ("success-item-" + index),

            name:
                item.name ||
                item.title ||
                "Food Item",

            description:
                item.description ||
                "",

            image:
                item.image ||
                "",

            size:
                item.size ||
                "",

            addons: addons,

            addonTotal: addonTotal,

            quantity: quantity,

            unitPrice: unitPrice,

            total: total

        };

    }


    /* =====================================================
       LOAD DATA
    ===================================================== */

    const cartRaw = readStorage(CART_KEY, []);

    const checkoutOrder = readStorage(
        CHECKOUT_KEY,
        {}
    );

    const paymentRequest = readStorage(
        PAYMENT_KEY,
        {}
    );


    const cart = Array.isArray(cartRaw)
        ? cartRaw.map(normalizeItem)
        : [];


    /* =====================================================
       GET CHECKOUT DATA
    ===================================================== */

    const customerName =
        checkoutOrder.customerName ||
        checkoutOrder.name ||
        "";

    const customerPhone =
        checkoutOrder.customerPhone ||
        checkoutOrder.phone ||
        "";

    const deliveryAddress =
        checkoutOrder.deliveryAddress ||
        checkoutOrder.address ||
        "";

    const landmark =
        checkoutOrder.landmark ||
        "";


    /* =====================================================
       CALCULATE SUBTOTAL
    ===================================================== */

    let calculatedSubtotal = 0;

    cart.forEach(function (item) {

        calculatedSubtotal += Number(item.total) || 0;

    });


    const subtotal = getNumber(
        checkoutOrder.subtotal,
        paymentRequest.subtotal,
        calculatedSubtotal
    );


    /* =====================================================
       DISCOUNT
    ===================================================== */

    const discount = getNumber(
        checkoutOrder.discount,
        checkoutOrder.discountAmount,
        paymentRequest.discount
    );


    /* =====================================================
       DELIVERY
    ===================================================== */

    let delivery = getNumber(
        checkoutOrder.deliveryCharge,
        checkoutOrder.delivery,
        paymentRequest.delivery
    );


    /*
     * If checkout did not save delivery charge,
     * use the agreed below-₹150 rule:
     *
     * ₹20 base + ₹10 per charged KM
     *
     * Maximum delivery radius = 5 KM
     */

    if (
        !checkoutOrder.deliveryCharge &&
        !checkoutOrder.delivery &&
        !paymentRequest.delivery
    ) {

        const distanceKm = Math.min(
            5,
            Math.max(
                1,
                Math.ceil(
                    getNumber(
                        checkoutOrder.distanceKm,
                        paymentRequest.distanceKm,
                        1
                    )
                )
            )
        );


        if (subtotal < 150) {

            delivery = 20 + (10 * distanceKm);

        } else {

            /*
             * No assumption about free delivery.
             * If checkout has not stored a charge,
             * leave it as ₹0.
             */

            delivery = 0;

        }

    }


    /* =====================================================
       EXTRA FEE
    ===================================================== */

    const extraFee = getNumber(
        checkoutOrder.extraFee,
        checkoutOrder.handlingFee,
        paymentRequest.extraFee
    );


    /* =====================================================
       TOTAL
    ===================================================== */

    const calculatedTotal =
        subtotal -
        discount +
        delivery +
        extraFee;


    const total = getNumber(
        checkoutOrder.total,
        checkoutOrder.grandTotal,
        paymentRequest.total,
        calculatedTotal
    );


    /* =====================================================
       ORDER ID
    ===================================================== */

    let orderId =
        checkoutOrder.orderId ||
        paymentRequest.orderId ||
        "";


    if (!orderId) {

        const now = new Date();

        const datePart =
            now.getFullYear().toString().slice(-2) +
            String(now.getMonth() + 1).padStart(2, "0") +
            String(now.getDate()).padStart(2, "0");


        const randomPart =
            Math.floor(
                1000 +
                Math.random() * 9000
            );


        orderId =
            "1111-" +
            datePart +
            "-" +
            randomPart;

    }


    /* =====================================================
       PAYMENT METHOD
    ===================================================== */

    const paymentMethod =
        paymentRequest.method ||
        paymentRequest.paymentMethod ||
        checkoutOrder.paymentMethod ||
        "Payment";


    /* =====================================================
       RENDER BASIC DATA
    ===================================================== */

    const orderIdElement =
        document.getElementById("orderId");

    const customerNameElement =
        document.getElementById("customerName");

    const customerPhoneElement =
        document.getElementById("customerPhone");

    const deliveryAddressElement =
        document.getElementById("deliveryAddress");

    const deliveryLandmarkElement =
        document.getElementById("deliveryLandmark");


    if (orderIdElement) {

        orderIdElement.textContent = orderId;

    }


    if (customerNameElement) {

        customerNameElement.textContent =
            customerName || "Not provided";

    }


    if (customerPhoneElement) {

        customerPhoneElement.textContent =
            customerPhone || "Not provided";

    }


    if (deliveryAddressElement) {

        deliveryAddressElement.textContent =
            deliveryAddress || "Not provided";

    }


    if (deliveryLandmarkElement) {

        deliveryLandmarkElement.textContent =
            landmark || "Not provided";

    }


    /* =====================================================
       PRICE RENDER
    ===================================================== */

    const subtotalElement =
        document.getElementById("successSubtotal");

    const discountElement =
        document.getElementById("successDiscount");

    const deliveryElement =
        document.getElementById("successDelivery");

    const extraFeeElement =
        document.getElementById("successExtraFee");

    const totalElement =
        document.getElementById("successTotal");


    if (subtotalElement) {

        subtotalElement.textContent =
            money(subtotal);

    }


    if (discountElement) {

        discountElement.textContent =
            "−" + money(discount);

    }


    if (deliveryElement) {

        deliveryElement.textContent =
            money(delivery);

    }


    if (extraFeeElement) {

        extraFeeElement.textContent =
            money(extraFee);

    }


    if (totalElement) {

        totalElement.textContent =
            money(total);

    }


    /* =====================================================
       EXTRA FEE VISIBILITY
    ===================================================== */

    const extraFeeRow =
        document.getElementById("successExtraFeeRow");


    if (extraFeeRow) {

        if (extraFee > 0) {

            extraFeeRow.style.display = "flex";

        } else {

            extraFeeRow.style.display = "none";

        }

    }


    /* =====================================================
       RENDER ITEMS
    ===================================================== */

    const successItems =
        document.getElementById("successItems");


    if (successItems) {

        if (!cart.length) {

            successItems.innerHTML = `
                <div class="success-item">
                    <div class="success-item-info">
                        <strong>No item information available</strong>
                        <span>Please check your order details.</span>
                    </div>
                </div>
            `;

        } else {

            successItems.innerHTML =
                cart.map(function (item) {

                    const sizeText =
                        item.size
                            ? "Size: " + escapeHTML(item.size)
                            : "";


                    const addonText =
                        item.addons.length
                            ? " • " +
                              item.addons
                                  .map(function (addon) {
                                      return escapeHTML(addon.name);
                                  })
                                  .join(", ")
                            : "";


                    const metaText =
                        sizeText +
                        addonText;


                    const imageHTML =
                        item.image
                            ? `
                                <img
                                    src="${escapeHTML(item.image)}"
                                    alt="${escapeHTML(item.name)}"
                                    loading="lazy"
                                >
                              `
                            : `
                                <div
                                    style="
                                        width:100%;
                                        height:100%;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        font-size:22px;
                                    "
                                >
                                    🍕
                                </div>
                              `;


                    return `
                        <div class="success-item">

                            <div class="success-item-image">
                                ${imageHTML}
                            </div>

                            <div class="success-item-info">

                                <strong>
                                    ${escapeHTML(item.name)}
                                </strong>

                                <span>
                                    Qty ${item.quantity}
                                    ${metaText}
                                </span>

                            </div>

                            <div class="success-item-price">

                                <strong>
                                    ${money(item.total)}
                                </strong>

                                <span>
                                    ${money(item.unitPrice)} each
                                </span>

                            </div>

                        </div>
                    `;

                }).join("");

        }

    }


    /* =====================================================
       PAYMENT STATUS
    ===================================================== */

    const paymentMethodElement =
        document.getElementById("paymentMethod");

    const paymentStatusText =
        document.getElementById("paymentStatusText");


    const methodLabels = {

        "upi-qr": "UPI QR",
        "upi": "UPI ID",
        "card": "Credit / Debit Card",
        "netbanking": "Net Banking",
        "wallet": "Wallet",
        "cod": "Cash on Delivery"

    };


    const readablePaymentMethod =
        methodLabels[paymentMethod] ||
        paymentMethod;


    if (paymentMethodElement) {

        paymentMethodElement.textContent =
            readablePaymentMethod;

    }


    if (paymentStatusText) {

        if (
            paymentMethod === "cod" ||
            paymentMethod === "Cash on Delivery"
        ) {

            paymentStatusText.textContent =
                "Cash on Delivery selected. Payment will be collected on delivery.";

        } else {

            paymentStatusText.textContent =
                "Payment information has been recorded. Final confirmation will come from the payment gateway.";

        }

    }


    /* =====================================================
       COPY ORDER ID
    ===================================================== */

    const copyButton =
        document.getElementById("copyOrderId");


    if (copyButton) {

        copyButton.addEventListener(
            "click",
            async function () {

                try {

                    await navigator.clipboard.writeText(orderId);

                    copyButton.innerHTML =
                        '<i class="fa-solid fa-check"></i>';

                    setTimeout(function () {

                        copyButton.innerHTML =
                            '<i class="fa-regular fa-copy"></i>';

                    }, 1500);

                } catch (error) {

                    /*
                     * Clipboard may be blocked
                     * on some browsers.
                     */

                    window.prompt(
                        "Copy your Order ID:",
                        orderId
                    );

                }

            }
        );

    }


    /* =====================================================
       TRACK ORDER BUTTON
    ===================================================== */

    const trackButton =
        document.getElementById("trackOrderButton");


    if (trackButton) {

        trackButton.addEventListener(
            "click",
            function () {

                /*
                 * track-order.html will be created next.
                 */

                window.location.href =
                    "track-order.html";

            }
        );

    }


    /* =====================================================
       SAVE CONFIRMED ORDER
    ===================================================== */

    const confirmedOrder = {

        orderId: orderId,

        status: "confirmed",

        createdAt:
            checkoutOrder.createdAt ||
            new Date().toISOString(),

        customer: {

            name: customerName,

            phone: customerPhone,

            address: deliveryAddress,

            landmark: landmark

        },

        items: cart,

        subtotal: subtotal,

        discount: discount,

        delivery: delivery,

        extraFee: extraFee,

        total: total,

        paymentMethod: paymentMethod

    };


    try {

        localStorage.setItem(
            "1111_confirmed_order",
            JSON.stringify(confirmedOrder)
        );

    } catch (error) {

        console.warn(
            "Could not save confirmed order.",
            error
        );

    }


    /* =====================================================
       IMPORTANT
       DO NOT CLEAR CART HERE YET
       ===================================================== */

    /*
     * Cart is intentionally not cleared in this page.
     *
     * Real payment gateway/backend integration should
     * clear the cart only after verified payment/order
     * creation.
     */


    /* =====================================================
       NAVBAR
    ===================================================== */

    async function loadNavbar() {

        const navbarContainer =
            document.getElementById("navbar");


        if (!navbarContainer) {
            return;
        }


        try {

            const navbarURL =
                new URL(
                    "navbar.html",
                    document.baseURI
                ).href;


            const response =
                await fetch(
                    navbarURL,
                    {
                        method: "GET",
                        cache: "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Navbar could not be loaded."
                );

            }


            const navbarHTML =
                await response.text();


            navbarContainer.innerHTML =
                navbarHTML;


            initializeNavbar();

        } catch (error) {

            console.error(
                "Navbar loading error:",
                error
            );

        }

    }


    /* =====================================================
       NAVBAR FUNCTIONS
    ===================================================== */

    function initializeNavbar() {

        updateCartCount();

        setupSearch();

        setupLocation();

        markCurrentPage();

    }


    /* =====================================================
       CART COUNT
    ===================================================== */

    function updateCartCount() {

        const cart =
            readStorage(
                CART_KEY,
                []
            );


        let count = 0;


        if (Array.isArray(cart)) {

            cart.forEach(function (item) {

                count += Math.max(
                    1,
                    Math.floor(
                        getNumber(
                            item.quantity,
                            item.qty,
                            1
                        )
                    )
                );

            });

        }


        const desktopCount =
            document.getElementById("cartCount");

        const mobileCount =
            document.getElementById("mobileCartCount");


        if (desktopCount) {

            desktopCount.textContent =
                count;

        }


        if (mobileCount) {

            mobileCount.textContent =
                count;

        }

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    function performSearch(value) {

        const query =
            String(value || "")
                .trim()
                .toLowerCase();


        if (!query) {
            return;
        }


        window.location.href =
            "menu.html?search=" +
            encodeURIComponent(query);

    }


    function setupSearch() {

        const desktopForm =
            document.getElementById(
                "desktopSearchForm"
            );

        const desktopInput =
            document.getElementById(
                "desktopSearch"
            );


        const mobileForm =
            document.getElementById(
                "mobileSearchForm"
            );

        const mobileInput =
            document.getElementById(
                "mobileSearch"
            );


        if (desktopForm && desktopInput) {

            desktopForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    performSearch(
                        desktopInput.value
                    );

                }
            );

        }


        if (mobileForm && mobileInput) {

            mobileForm.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    performSearch(
                        mobileInput.value
                    );

                }
            );

        }

    }


    /* =====================================================
       LOCATION
    ===================================================== */

    function setupLocation() {

        const desktopButton =
            document.getElementById(
                "locationButton"
            );

        const mobileButton =
            document.getElementById(
                "mobileLocationButton"
            );


        function detectLocation() {

            if (!navigator.geolocation) {

                alert(
                    "Location detection is not supported by this browser."
                );

                return;

            }


            navigator.geolocation.getCurrentPosition(

                function (position) {

                    const lat =
                        position.coords.latitude;

                    const lng =
                        position.coords.longitude;


                    try {

                        localStorage.setItem(
                            "1111_user_location",
                            JSON.stringify({
                                latitude: lat,
                                longitude: lng
                            })
                        );

                    } catch (error) {
                        console.warn(error);
                    }


                    const text =
                        document.getElementById(
                            "locationText"
                        );


                    if (text) {

                        text.textContent =
                            "Location Set";

                    }


                    alert(
                        "Your location has been detected."
                    );

                },

                function () {

                    alert(
                        "Please allow location access to detect your delivery location."
                    );

                },

                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }

            );

        }


        if (desktopButton) {

            desktopButton.addEventListener(
                "click",
                detectLocation
            );

        }


        if (mobileButton) {

            mobileButton.addEventListener(
                "click",
                detectLocation
            );

        }

    }


    /* =====================================================
       CURRENT PAGE
    ===================================================== */

    function markCurrentPage() {

        const currentPage =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        document
            .querySelectorAll(
                ".bottom-nav-item"
            )
            .forEach(function (item) {

                const href =
                    item.getAttribute("href");


                if (!href) {
                    return;
                }


                const cleanHref =
                    href
                        .split("?")[0]
                        .split("#")[0]
                        .toLowerCase();


                if (
                    cleanHref === currentPage
                ) {

                    item.classList.add(
                        "active"
                    );

                } else {

                    item.classList.remove(
                        "active"
                    );

                }

            });

    }


    /* =====================================================
       START
    ===================================================== */

    loadNavbar();

})();