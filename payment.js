/* =====================================================
   11:11 PIZZA CAFE
   PAYMENT.JS
   FRESH REPLACEMENT
   REAL PAYMENT READY STRUCTURE
   NO FAKE PAYMENT
   EXISTING NAVBAR.HTML
   ===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =================================================
       STORAGE
       ================================================= */

    const CART_KEY = "1111_cart";
    const CHECKOUT_KEY = "1111_checkout_order";
    const PAYMENT_KEY = "1111_payment_request";
    const LOCATION_KEY = "1111_user_location";


    /* =================================================
       DELIVERY SETTINGS
       ================================================= */

    const BASE_DELIVERY = 20;
    const PER_KM_CHARGE = 10;
    const MAX_DELIVERY_KM = 5;


    /* =================================================
       ELEMENTS
       ================================================= */

    const navbar = document.getElementById("navbar");

    const paymentMethods =
        document.querySelectorAll(".payment-method");

    const paymentDetails =
        document.getElementById("paymentDetails");

    const orderItems =
        document.getElementById("orderItems");

    const subtotalElement =
        document.getElementById("paymentSubtotal");

    const discountElement =
        document.getElementById("paymentDiscount");

    const deliveryElement =
        document.getElementById("paymentDelivery");

    const extraFeeElement =
        document.getElementById("paymentExtraFee");

    const extraFeeRow =
        document.getElementById("extraFeeRow");

    const totalElement =
        document.getElementById("paymentTotal");

    const selectedMethodElement =
        document.getElementById("selectedMethod");

    const payButton =
        document.getElementById("payButton");

    const payButtonAmount =
        document.getElementById("payButtonAmount");


    /* =================================================
       DATA
       ================================================= */

    let cart = [];

    let checkoutOrder = null;

    let selectedMethod = "";

    let subtotal = 0;

    let discount = 0;

    let delivery = 0;

    let extraFee = 0;

    let total = 0;


    /* =================================================
       HELPERS
       ================================================= */

    function number(value) {

        const n = Number(value);

        return Number.isFinite(n) ? n : 0;
    }


    function money(value) {

        return `₹${Math.round(number(value))}`;
    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =================================================
       LOAD CART
       ================================================= */

    function loadCart() {

        try {

            const saved =
                localStorage.getItem(CART_KEY);

            if (!saved) {

                cart = [];

                return;
            }

            const parsed =
                JSON.parse(saved);

            cart =
                Array.isArray(parsed)
                    ? parsed
                    : [];

        } catch (error) {

            console.error(
                "11:11 Cart loading error:",
                error
            );

            cart = [];
        }
    }


    /* =================================================
       LOAD CHECKOUT
       ================================================= */

    function loadCheckout() {

        try {

            const saved =
                localStorage.getItem(CHECKOUT_KEY);

            if (!saved) {

                checkoutOrder = null;

                return;
            }

            checkoutOrder =
                JSON.parse(saved);

        } catch (error) {

            console.error(
                "11:11 Checkout loading error:",
                error
            );

            checkoutOrder = null;
        }
    }


    /* =================================================
       QUANTITY
       ================================================= */

    function getQuantity(item) {

        const quantity =
            number(
                item.quantity ??
                item.qty ??
                1
            );

        return quantity > 0
            ? quantity
            : 1;
    }


    /* =================================================
       ADDONS
       ================================================= */

    function getAddonTotal(item) {

        if (
            item.addonTotal !== undefined &&
            item.addonTotal !== null
        ) {

            return number(item.addonTotal);
        }


        if (!Array.isArray(item.addons)) {

            return 0;
        }


        return item.addons.reduce(
            (sum, addon) => {

                if (
                    addon &&
                    typeof addon === "object"
                ) {

                    return (
                        sum +
                        number(
                            addon.price ??
                            addon.amount ??
                            addon.value
                        )
                    );
                }


                return sum;

            },
            0
        );
    }


    /* =================================================
       UNIT PRICE
       ================================================= */

    function getUnitPrice(item) {

        if (
            item.unitPrice !== undefined &&
            item.unitPrice !== null
        ) {

            return number(item.unitPrice);
        }


        if (
            item.singlePrice !== undefined &&
            item.singlePrice !== null
        ) {

            return number(item.singlePrice);
        }


        if (
            item.basePrice !== undefined &&
            item.basePrice !== null
        ) {

            return (
                number(item.basePrice) +
                getAddonTotal(item)
            );
        }


        if (
            item.price !== undefined &&
            item.price !== null
        ) {

            return number(item.price);
        }


        if (
            item.totalPrice !== undefined &&
            item.totalPrice !== null
        ) {

            const quantity =
                getQuantity(item);

            return (
                number(item.totalPrice) /
                quantity
            );
        }


        return 0;
    }


    /* =================================================
       ITEM TOTAL
       ================================================= */

    function getItemTotal(item) {

        return (
            getUnitPrice(item) *
            getQuantity(item)
        );
    }


    /* =================================================
       ADDON TEXT
       ================================================= */

    function getAddonText(item) {

        if (!Array.isArray(item.addons)) {

            return "";
        }


        return item.addons
            .map(addon => {

                if (
                    addon &&
                    typeof addon === "object"
                ) {

                    return (
                        addon.name ??
                        addon.title ??
                        addon.label ??
                        ""
                    );
                }


                return String(addon);

            })
            .filter(Boolean)
            .join(", ");
    }


    /* =================================================
       ITEM META
       ================================================= */

    function getItemMeta(item) {

        const parts = [];


        if (item.size) {

            parts.push(
                `Size: ${item.size}`
            );
        }


        const addons =
            getAddonText(item);


        if (addons) {

            parts.push(addons);
        }


        parts.push(
            `Qty: ${getQuantity(item)}`
        );


        return parts.join(" • ");
    }


    /* =================================================
       SUBTOTAL
       ================================================= */

    function calculateSubtotal() {

        subtotal =
            cart.reduce(
                (sum, item) =>
                    sum + getItemTotal(item),
                0
            );

        return subtotal;
    }


    /* =================================================
       DISTANCE
       ================================================= */

    function getDistance() {

        if (!checkoutOrder) {

            return 0;
        }


        const possibleValues = [

            checkoutOrder.distanceKm,

            checkoutOrder.deliveryDistanceKm,

            checkoutOrder.distance,

            checkoutOrder.deliveryDistance
        ];


        for (
            const value
            of possibleValues
        ) {

            const km =
                number(value);


            if (
                km > 0 &&
                km <= MAX_DELIVERY_KM
            ) {

                return km;
            }
        }


        return 0;
    }


    /* =================================================
       DELIVERY
       =================================================
       
       IMPORTANT:
       User-confirmed rule:
       Below ₹150:
       ₹20 base + ₹10 per charged KM

       We do NOT assume that ₹150+ is free.
       If checkout already contains a delivery amount,
       use that amount.
       ================================================= */

    function calculateDelivery() {

        if (!checkoutOrder) {

            return 0;
        }


        /* ---------------------------------------------
           First preference:
           Use delivery amount calculated by checkout.
           --------------------------------------------- */

        const checkoutDeliveryValues = [

            checkoutOrder.delivery,

            checkoutOrder.deliveryCharge,

            checkoutOrder.deliveryFee,

            checkoutOrder.deliveryAmount
        ];


        for (
            const value
            of checkoutDeliveryValues
        ) {

            if (
                value !== undefined &&
                value !== null &&
                Number.isFinite(Number(value))
            ) {

                return Math.max(
                    0,
                    number(value)
                );
            }
        }


        /* ---------------------------------------------
           Fallback calculation only when checkout
           does not contain delivery amount.
           --------------------------------------------- */

        if (subtotal <= 0) {

            return 0;
        }


        if (subtotal < 150) {

            const distance =
                getDistance();


            if (distance <= 0) {

                return BASE_DELIVERY;
            }


            const chargedKm =
                Math.min(
                    Math.ceil(distance),
                    MAX_DELIVERY_KM
                );


            return (
                BASE_DELIVERY +
                (
                    chargedKm *
                    PER_KM_CHARGE
                )
            );
        }


        /*
           ₹150+ delivery rule was not confirmed
           as free delivery.

           Therefore fallback is ₹0 only when
           checkout did not provide a delivery amount.
        */

        return 0;
    }


    /* =================================================
       DISCOUNT
       ================================================= */

    function getCheckoutDiscount() {

        if (!checkoutOrder) {

            return 0;
        }


        return Math.max(
            0,
            number(
                checkoutOrder.discount ??
                checkoutOrder.discountAmount ??
                0
            )
        );
    }


    /* =================================================
       EXTRA FEE
       ================================================= */

    function getCheckoutExtraFee() {

        if (!checkoutOrder) {

            return 0;
        }


        return Math.max(
            0,
            number(
                checkoutOrder.extraFee ??
                checkoutOrder.handlingFee ??
                0
            )
        );
    }


    /* =================================================
       TOTALS
       ================================================= */

    function calculateTotals() {

        calculateSubtotal();

        discount =
            getCheckoutDiscount();

        delivery =
            calculateDelivery();

        extraFee =
            getCheckoutExtraFee();


        total =
            subtotal -
            discount +
            delivery +
            extraFee;


        if (total < 0) {

            total = 0;
        }
    }


    /* =================================================
       RENDER ORDER ITEMS
       ================================================= */

    function renderItems() {

        if (!orderItems) {

            return;
        }


        if (!cart.length) {

            orderItems.innerHTML = `

                <div class="order-empty">

                    <i class="fa-solid fa-cart-shopping"></i>

                    <p>Your cart is empty.</p>

                    <a href="menu.html">
                        Go to Menu
                    </a>

                </div>

            `;

            return;
        }


        orderItems.innerHTML =
            cart.map(item => {

                const image =
                    item.image ||
                    item.imageUrl ||
                    "";


                const name =
                    item.name ||
                    "Food Item";


                const meta =
                    getItemMeta(item);


                const itemTotal =
                    getItemTotal(item);


                return `

                    <div class="order-item">

                        <div class="order-item-image">

                            ${
                                image

                                ?

                                `
                                <img
                                    src="${escapeHTML(image)}"
                                    alt="${escapeHTML(name)}"
                                >
                                `

                                :

                                `
                                <div class="order-item-placeholder">

                                    <i class="fa-solid fa-pizza-slice"></i>

                                </div>
                                `
                            }

                        </div>


                        <div class="order-item-info">

                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                            <span>
                                ${escapeHTML(meta)}
                            </span>

                        </div>


                        <div class="order-item-price">

                            ${money(itemTotal)}

                        </div>

                    </div>

                `;

            }).join("");
    }


    /* =================================================
       UPDATE SUMMARY
       ================================================= */

    function updateSummary() {

        calculateTotals();


        if (subtotalElement) {

            subtotalElement.textContent =
                money(subtotal);
        }


        if (discountElement) {

            discountElement.textContent =
                `−${money(discount)}`;
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


        if (payButtonAmount) {

            payButtonAmount.textContent =
                money(total);
        }


        if (extraFeeRow) {

            extraFeeRow.style.display =
                extraFee > 0
                    ? "flex"
                    : "none";
        }


        updatePayButton();
    }


    /* =================================================
       PAYMENT METHOD NAME
       ================================================= */

    function methodName(method) {

        const names = {

            "upi-qr":
                "UPI QR",

            "upi":
                "UPI ID",

            "card":
                "Credit / Debit Card",

            "netbanking":
                "Net Banking",

            "wallet":
                "Wallet",

            "cod":
                "Cash on Delivery"
        };


        return (
            names[method] ||
            "Not selected"
        );
    }


    /* =================================================
       EMPTY PAYMENT DETAILS
       ================================================= */

    function showEmptyDetails() {

        if (!paymentDetails) {

            return;
        }


        paymentDetails.innerHTML = `

            <div class="payment-details-empty">

                <div class="details-empty-icon">

                    <i class="fa-solid fa-lock"></i>

                </div>

                <h3>
                    Select a Payment Method
                </h3>

                <p>
                    Choose a payment method above to continue.
                </p>

            </div>

        `;
    }


    /* =================================================
       PAYMENT DETAILS
       ================================================= */

    function showPaymentDetails(method) {

        if (!paymentDetails) {

            return;
        }


        /* =============================================
           UPI QR
           ============================================= */

        if (method === "upi-qr") {

            paymentDetails.innerHTML = `

                <div class="gateway-panel">

                    <div class="gateway-icon">

                        <i class="fa-solid fa-qrcode"></i>

                    </div>


                    <div class="gateway-content">

                        <span>
                            UPI QR PAYMENT
                        </span>

                        <h3>
                            Dynamic UPI QR
                        </h3>

                        <p>
                            The genuine payment gateway will generate a QR containing your exact payable amount.
                        </p>


                        <div class="gateway-status">

                            <i class="fa-solid fa-shield-halved"></i>

                            <span>
                                No fake QR or fake payment confirmation is used.
                            </span>

                        </div>

                    </div>

                </div>

            `;

            return;
        }


        /* =============================================
           UPI ID
           ============================================= */

        if (method === "upi") {

            paymentDetails.innerHTML = `

                <div class="gateway-panel">

                    <div class="gateway-icon">

                        <i class="fa-solid fa-mobile-screen-button"></i>

                    </div>


                    <div class="gateway-content">

                        <span>
                            UPI PAYMENT
                        </span>

                        <h3>
                            Pay with UPI
                        </h3>

                        <p>
                            Payment will be handled by the genuine payment gateway.
                        </p>


                        <div class="gateway-status">

                            <i class="fa-solid fa-lock"></i>

                            <span>
                                Your UPI PIN is never stored on this website.
                            </span>

                        </div>

                    </div>

                </div>

            `;

            return;
        }


        /* =============================================
           CARD
           ============================================= */

        if (method === "card") {

            paymentDetails.innerHTML = `

                <div class="gateway-panel">

                    <div class="gateway-icon">

                        <i class="fa-solid fa-credit-card"></i>

                    </div>


                    <div class="gateway-content">

                        <span>
                            CARD PAYMENT
                        </span>

                        <h3>
                            Credit / Debit Card
                        </h3>

                        <p>
                            Card payment will open through the genuine payment gateway.
                        </p>


                        <div class="gateway-status">

                            <i class="fa-solid fa-shield-halved"></i>

                            <span>
                                Card number, CVV and OTP are not stored here.
                            </span>

                        </div>

                    </div>

                </div>

            `;

            return;
        }


        /* =============================================
           NET BANKING
           ============================================= */

        if (method === "netbanking") {

            paymentDetails.innerHTML = `

                <div class="gateway-panel">

                    <div class="gateway-icon">

                        <i class="fa-solid fa-building-columns"></i>

                    </div>


                    <div class="gateway-content">

                        <span>
                            NET BANKING
                        </span>

                        <h3>
                            Secure Bank Payment
                        </h3>

                        <p>
                            You will be redirected to the genuine payment gateway.
                        </p>


                        <div class="gateway-status">

                            <i class="fa-solid fa-shield-halved"></i>

                            <span>
                                Bank authentication is handled securely by the gateway.
                            </span>

                        </div>

                    </div>

                </div>

            `;

            return;
        }


        /* =============================================
           WALLET
           ============================================= */

        if (method === "wallet") {

            paymentDetails.innerHTML = `

                <div class="gateway-panel">

                    <div class="gateway-icon">

                        <i class="fa-solid fa-wallet"></i>

                    </div>


                    <div class="gateway-content">

                        <span>
                            WALLET PAYMENT
                        </span>

                        <h3>
                            Digital Wallet
                        </h3>

                        <p>
                            Supported wallet options will be provided by the genuine payment gateway.
                        </p>


                        <div class="gateway-status">

                            <i class="fa-solid fa-shield-halved"></i>

                            <span>
                                Payment is processed securely by the gateway.
                            </span>

                        </div>

                    </div>

                </div>

            `;

            return;
        }


        /* =============================================
           COD
           ============================================= */

        if (method === "cod") {

            paymentDetails.innerHTML = `

                <div class="cod-panel">

                    <div class="cod-icon">

                        <i class="fa-solid fa-money-bill-wave"></i>

                    </div>


                    <div class="cod-content">

                        <span>
                            CASH ON DELIVERY
                        </span>

                        <h3>
                            Pay When Delivered
                        </h3>

                        <p>
                            Pay the order amount when your order is delivered.
                        </p>


                        <div class="cod-total">

                            <span>
                                Amount to Pay
                            </span>

                            <strong>
                                ${money(total)}
                            </strong>

                        </div>

                    </div>

                </div>

            `;
        }
    }


    /* =================================================
       UPDATE PAY BUTTON
       ================================================= */

    function updatePayButton() {

        if (!payButton) {

            return;
        }


        const disabled =
            !cart.length ||
            total <= 0 ||
            !selectedMethod;


        payButton.disabled =
            disabled;
    }


    /* =================================================
       SELECT PAYMENT METHOD
       ================================================= */

    function selectMethod(method) {

        selectedMethod =
            method || "";


        paymentMethods.forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.method ===
                selectedMethod
            );

        });


        if (selectedMethodElement) {

            selectedMethodElement.textContent =
                methodName(selectedMethod);
        }


        showPaymentDetails(
            selectedMethod
        );


        updatePayButton();
    }


    /* =================================================
       PAYMENT METHOD EVENTS
       ================================================= */

    paymentMethods.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const method =
                    button.dataset.method;


                if (!method) {

                    return;
                }


                selectMethod(method);
            }
        );

    });


    /* =================================================
       CART COUNT
       ================================================= */

    function updateCartCount() {

        const count =
            cart.reduce(
                (sum, item) =>
                    sum + getQuantity(item),
                0
            );


        const desktopCount =
            document.getElementById(
                "cartCount"
            );


        const mobileCount =
            document.getElementById(
                "mobileCartCount"
            );


        if (desktopCount) {

            desktopCount.textContent =
                count;
        }


        if (mobileCount) {

            mobileCount.textContent =
                count;
        }
    }


    /* =================================================
       SEARCH
       ================================================= */

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


        function search(input) {

            if (!input) {

                return;
            }


            const query =
                input.value.trim();


            if (!query) {

                return;
            }


            window.location.href =
                `menu.html?search=${encodeURIComponent(query)}`;
        }


        if (desktopForm) {

            desktopForm.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    search(desktopInput);
                }
            );
        }


        if (mobileForm) {

            mobileForm.addEventListener(
                "submit",
                event => {

                    event.preventDefault();

                    search(mobileInput);
                }
            );
        }
    }


    /* =================================================
       LOCATION
       ================================================= */

    function setupLocation() {

        const desktopButton =
            document.getElementById(
                "locationButton"
            );


        const mobileButton =
            document.getElementById(
                "mobileLocationButton"
            );


        const locationText =
            document.getElementById(
                "locationText"
            );


        function locate() {

            if (!navigator.geolocation) {

                alert(
                    "Location is not supported by this browser."
                );

                return;
            }


            if (locationText) {

                locationText.textContent =
                    "Locating...";
            }


            navigator.geolocation.getCurrentPosition(

                position => {

                    const locationData = {

                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude,

                        accuracy:
                            position.coords.accuracy,

                        savedAt:
                            new Date().toISOString()
                    };


                    localStorage.setItem(
                        LOCATION_KEY,
                        JSON.stringify(
                            locationData
                        )
                    );


                    if (locationText) {

                        locationText.textContent =
                            "Located";
                    }
                },


                error => {

                    console.error(
                        "11:11 Location error:",
                        error
                    );


                    if (locationText) {

                        locationText.textContent =
                            "Location";
                    }


                    alert(
                        "Please allow location permission."
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
                locate
            );
        }


        if (mobileButton) {

            mobileButton.addEventListener(
                "click",
                locate
            );
        }
    }


    /* =================================================
       LOAD EXISTING NAVBAR.HTML
       ================================================= */

    async function loadNavbar() {

        if (!navbar) {

            console.error(
                "11:11 Payment: #navbar element not found."
            );

            return;
        }


        try {

            const navbarURL =
                new URL(
                    "navbar.html",
                    document.baseURI
                ).href;


            console.log(
                "11:11 Loading navbar:",
                navbarURL
            );


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
                    `navbar.html HTTP ${response.status}`
                );
            }


            const html =
                await response.text();


            if (!html.trim()) {

                throw new Error(
                    "navbar.html is empty."
                );
            }


            navbar.innerHTML =
                html;


            updateCartCount();

            setupSearch();

            setupLocation();


            console.log(
                "11:11 Navbar loaded successfully."
            );

        } catch (error) {

            console.error(
                "11:11 Navbar loading failed:",
                error
            );


            /*
               Do not create another navbar.
               Existing navbar.html is the only navbar.
            */

            navbar.innerHTML = "";
        }
    }


    /* =================================================
       CREATE PAYMENT REQUEST
       ================================================= */

    function createPaymentRequest() {

        calculateTotals();


        return {

            orderId:
                `1111-${Date.now()}`,

            items:
                cart,

            subtotal:
                subtotal,

            discount:
                discount,

            delivery:
                delivery,

            extraFee:
                extraFee,

            total:
                total,

            paymentMethod:
                selectedMethod,

            paymentMethodName:
                methodName(
                    selectedMethod
                ),

            status:
                selectedMethod === "cod"
                    ? "cod_pending"
                    : "payment_pending",

            createdAt:
                new Date().toISOString()
        };
    }


    /* =================================================
       CONTINUE SECURELY
       ================================================= */

    if (payButton) {

        payButton.addEventListener(
            "click",
            () => {

                if (!selectedMethod) {

                    alert(
                        "Please select a payment method."
                    );

                    return;
                }


                if (!cart.length) {

                    alert(
                        "Your cart is empty."
                    );

                    return;
                }


                calculateTotals();


                if (total <= 0) {

                    alert(
                        "Invalid order amount."
                    );

                    return;
                }


                const paymentRequest =
                    createPaymentRequest();


                localStorage.setItem(
                    PAYMENT_KEY,
                    JSON.stringify(
                        paymentRequest
                    )
                );


                /* =====================================
                   COD
                   ===================================== */

                if (
                    selectedMethod ===
                    "cod"
                ) {

                    alert(
                        "Cash on Delivery selected. The real order confirmation system will confirm the order after the order backend is connected."
                    );


                    return;
                }


                /* =====================================
                   ONLINE PAYMENT
                   ===================================== */

                alert(
                    "Real payment gateway is not connected yet. No payment has been taken."
                );
            }
        );
    }


    /* =================================================
       INITIALIZE
       ================================================= */

    loadCart();

    loadCheckout();

    calculateTotals();

    renderItems();

    updateSummary();

    updateCartCount();

    showEmptyDetails();

    loadNavbar();

});