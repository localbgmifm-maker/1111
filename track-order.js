/* =========================================================
   11:11 PIZZA CAFE
   TRACK ORDER.JS
   ========================================================= */

"use strict";


/* =========================================================
   SETTINGS
   ========================================================= */

const CART_KEY = "1111_cart";
const CHECKOUT_ORDER_KEY = "1111_checkout_order";

const MAX_DELIVERY_KM = 5;


/* =========================================================
   DOM
   ========================================================= */

const trackOrderForm =
    document.getElementById("trackOrderForm");

const trackOrderInput =
    document.getElementById("trackOrderInput");

const trackOrderButton =
    document.getElementById("trackOrderButton");

const trackSearchMessage =
    document.getElementById("trackSearchMessage");

const trackContent =
    document.getElementById("trackContent");

const trackEmptyState =
    document.getElementById("trackEmptyState");

const tryAgainButton =
    document.getElementById("tryAgainButton");

const refreshTrackButton =
    document.getElementById("refreshTrackButton");

const trackOrderId =
    document.getElementById("trackOrderId");

const trackOrderDate =
    document.getElementById("trackOrderDate");

const trackCurrentStatus =
    document.getElementById("trackCurrentStatus");

const trackStatusText =
    document.getElementById("trackStatusText");

const trackItems =
    document.getElementById("trackItems");

const trackCustomerName =
    document.getElementById("trackCustomerName");

const trackDeliveryAddress =
    document.getElementById("trackDeliveryAddress");

const trackLandmark =
    document.getElementById("trackLandmark");

const trackPhone =
    document.getElementById("trackPhone");

const liveStatusHeading =
    document.getElementById("liveStatusHeading");

const liveStatusIcon =
    document.getElementById("liveStatusIcon");

const liveStatusTitle =
    document.getElementById("liveStatusTitle");

const liveStatusDescription =
    document.getElementById("liveStatusDescription");

const estimatedDelivery =
    document.getElementById("estimatedDelivery");

const trackDistance =
    document.getElementById("trackDistance");

const trackPaymentMethod =
    document.getElementById("trackPaymentMethod");

const trackPaymentStatus =
    document.getElementById("trackPaymentStatus");

const paymentMethodIcon =
    document.getElementById("paymentMethodIcon");

const trackSubtotal =
    document.getElementById("trackSubtotal");

const trackDiscount =
    document.getElementById("trackDiscount");

const trackDeliveryCharge =
    document.getElementById("trackDeliveryCharge");

const trackExtraFee =
    document.getElementById("trackExtraFee");

const trackTotal =
    document.getElementById("trackTotal");


/* =========================================================
   TIMELINE ELEMENTS
   ========================================================= */

const timelineOrderCreated =
    document.getElementById("timelineOrderCreated");

const timelineConfirmed =
    document.getElementById("timelineConfirmed");

const timelinePreparing =
    document.getElementById("timelinePreparing");

const timelineOutForDelivery =
    document.getElementById("timelineOutForDelivery");

const timelineDelivered =
    document.getElementById("timelineDelivered");


/* =========================================================
   STATE
   ========================================================= */

let currentOrder = null;


/* =========================================================
   STATUS CONFIG
   ========================================================= */

const STATUS_ORDER = [
    "order_created",
    "confirmed",
    "preparing",
    "out_for_delivery",
    "delivered"
];


const STATUS_INFO = {

    order_created: {
        label: "Order Placed",
        icon: "fa-receipt",
        title: "We've received your order",
        description:
            "Your order has been successfully received by 11:11 Pizza Cafe.",
        delivery:
            "40 Minutes"
    },

    confirmed: {
        label: "Order Confirmed",
        icon: "fa-circle-check",
        title: "Your order is confirmed",
        description:
            "Our team has confirmed your order and is getting it ready.",
        delivery:
            "40 Minutes"
    },

    preparing: {
        label: "Preparing Your Food",
        icon: "fa-fire-burner",
        title: "Your food is being prepared",
        description:
            "Our kitchen is preparing your food fresh and hot.",
        delivery:
            "40 Minutes"
    },

    out_for_delivery: {
        label: "Out for Delivery",
        icon: "fa-motorcycle",
        title: "Your order is on the way",
        description:
            "Your food has left the cafe and is coming to your doorstep.",
        delivery:
            "On the Way"
    },

    delivered: {
        label: "Delivered",
        icon: "fa-house-circle-check",
        title: "Order delivered",
        description:
            "Your order has been delivered successfully. Enjoy your meal!",
        delivery:
            "Delivered"
    }

};


/* =========================================================
   HELPERS
   ========================================================= */

function money(value) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "₹0";
    }

    return `₹${Math.round(number)}`;
}


function safeNumber(value, fallback = 0) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getQuantity(item) {

    const quantity =
        safeNumber(
            item?.quantity ??
            item?.qty ??
            1,
            1
        );

    return Math.max(
        1,
        Math.round(quantity)
    );
}


function getAddonTotal(item) {

    if (!item) {
        return 0;
    }

    if (
        Number.isFinite(
            Number(item.addonTotal)
        )
    ) {
        return Number(item.addonTotal);
    }

    if (!Array.isArray(item.addons)) {
        return 0;
    }

    return item.addons.reduce(
        (total, addon) => {

            if (typeof addon === "number") {
                return total + safeNumber(addon);
            }

            if (
                addon &&
                typeof addon === "object"
            ) {

                return total + safeNumber(
                    addon.price ??
                    addon.amount ??
                    addon.total ??
                    0
                );
            }

            return total;

        },
        0
    );
}


function getUnitPrice(item) {

    if (!item) {
        return 0;
    }

    if (
        Number.isFinite(
            Number(item.unitPrice)
        )
    ) {
        return Number(item.unitPrice);
    }

    if (
        Number.isFinite(
            Number(item.singlePrice)
        )
    ) {
        return Number(item.singlePrice);
    }

    if (
        Number.isFinite(
            Number(item.basePrice)
        )
    ) {

        return (
            Number(item.basePrice) +
            getAddonTotal(item)
        );
    }

    if (
        Number.isFinite(
            Number(item.price)
        )
    ) {
        return Number(item.price);
    }

    return 0;
}


function getItemTotal(item) {

    if (
        Number.isFinite(
            Number(item?.totalPrice)
        )
    ) {
        return Number(item.totalPrice);
    }

    if (
        Number.isFinite(
            Number(item?.total)
        )
    ) {
        return Number(item.total);
    }

    return (
        getUnitPrice(item) *
        getQuantity(item)
    );
}


function getAddonNames(item) {

    if (!Array.isArray(item?.addons)) {
        return [];
    }

    return item.addons
        .map(addon => {

            if (typeof addon === "string") {
                return addon;
            }

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

            return "";

        })
        .filter(Boolean);
}


/* =========================================================
   DATE / TIME
   ========================================================= */

function formatDateTime(value) {

    if (!value) {
        return "Order time unavailable";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Order time unavailable";
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   READ SAVED ORDER
   ========================================================= */

function readSavedOrder() {

    try {

        const raw =
            localStorage.getItem(
                CHECKOUT_ORDER_KEY
            );

        if (!raw) {
            return null;
        }

        const order =
            JSON.parse(raw);

        if (
            !order ||
            typeof order !== "object"
        ) {
            return null;
        }

        return order;

    } catch (error) {

        console.error(
            "Order read error:",
            error
        );

        return null;
    }
}


/* =========================================================
   NORMALIZE STATUS
   ========================================================= */

function normalizeStatus(order) {

    const rawStatus =
        String(
            order?.status ??
            order?.orderStatus ??
            "order_created"
        )
            .trim()
            .toLowerCase();


    const aliases = {

        "created": "order_created",
        "placed": "order_created",
        "order placed": "order_created",

        "confirmed": "confirmed",
        "order confirmed": "confirmed",

        "preparing": "preparing",
        "preparing_food": "preparing",
        "food_preparing": "preparing",

        "out_for_delivery":
            "out_for_delivery",

        "out for delivery":
            "out_for_delivery",

        "on_the_way":
            "out_for_delivery",

        "on the way":
            "out_for_delivery",

        "delivered":
            "delivered"

    };


    return (
        aliases[rawStatus] ||
        (
            STATUS_ORDER.includes(rawStatus)
                ? rawStatus
                : "order_created"
        )
    );
}


/* =========================================================
   CALCULATE ORDER AMOUNTS
   ========================================================= */

function getOrderCart(order) {

    if (
        Array.isArray(order?.cart)
    ) {
        return order.cart;
    }

    if (
        Array.isArray(order?.items)
    ) {
        return order.items;
    }

    return [];
}


function calculateOrderSubtotal(order) {

    const items =
        getOrderCart(order);

    return items.reduce(
        (total, item) =>
            total + getItemTotal(item),
        0
    );
}


function getOrderSubtotal(order) {

    const saved =
        order?.amounts?.subtotal ??
        order?.subtotal;

    if (
        Number.isFinite(
            Number(saved)
        )
    ) {
        return Number(saved);
    }

    return calculateOrderSubtotal(order);
}


function getOrderDiscount(order) {

    const saved =
        order?.amounts?.discount ??
        order?.discount ??
        0;

    return safeNumber(saved);
}


function getOrderDeliveryCharge(order) {

    const saved =
        order?.amounts?.deliveryCharge ??
        order?.delivery?.charge ??
        order?.deliveryCharge ??
        0;

    return safeNumber(saved);
}


function getOrderExtraFee(order) {

    const saved =
        order?.amounts?.extraFee ??
        order?.extraFee ??
        0;

    return safeNumber(saved);
}


function getOrderTotal(order) {

    const saved =
        order?.amounts?.total ??
        order?.total;

    if (
        Number.isFinite(
            Number(saved)
        )
    ) {
        return Number(saved);
    }

    return Math.max(
        0,
        getOrderSubtotal(order) -
        getOrderDiscount(order) +
        getOrderDeliveryCharge(order) +
        getOrderExtraFee(order)
    );
}


/* =========================================================
   RENDER ORDER ITEMS
   ========================================================= */

function renderOrderItems(order) {

    if (!trackItems) {
        return;
    }

    const items =
        getOrderCart(order);


    if (!items.length) {

        trackItems.innerHTML = `
            <div class="empty-checkout">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>No item information available.</p>
            </div>
        `;

        return;
    }


    trackItems.innerHTML =
        items.map(item => {

            const name =
                escapeHTML(
                    item?.name ||
                    "Food Item"
                );

            const image =
                escapeHTML(
                    item?.image ||
                    "https://via.placeholder.com/120"
                );

            const quantity =
                getQuantity(item);

            const size =
                item?.size
                    ? escapeHTML(item.size)
                    : "";

            const addons =
                getAddonNames(item);

            const total =
                getItemTotal(item);


            return `
                <article class="track-item">

                    <div class="track-item-image">
                        <img
                            src="${image}"
                            alt="${name}"
                            loading="lazy"
                        >
                    </div>

                    <div class="track-item-info">

                        <h3>
                            ${name}
                        </h3>

                        <div class="track-item-meta">

                            ${
                                size
                                    ? `
                                        <span>
                                            Size: ${size}
                                        </span>
                                      `
                                    : ""
                            }

                            <span>
                                Qty: ${quantity}
                            </span>

                        </div>

                        ${
                            addons.length
                                ? `
                                    <div class="track-item-addons">
                                        ${
                                            addons
                                                .map(
                                                    addon =>
                                                        `<span>+ ${escapeHTML(addon)}</span>`
                                                )
                                                .join("")
                                        }
                                    </div>
                                  `
                                : ""
                        }

                    </div>

                    <div class="track-item-price">
                        ${money(total)}
                    </div>

                </article>
            `;

        }).join("");
}


/* =========================================================
   RENDER CUSTOMER
   ========================================================= */

function renderCustomer(order) {

    const customer =
        order?.customer || {};


    if (trackCustomerName) {

        trackCustomerName.textContent =
            customer.name ||
            "Customer";
    }


    if (trackDeliveryAddress) {

        trackDeliveryAddress.textContent =
            customer.address ||
            "Delivery address unavailable";
    }


    if (trackLandmark) {

        if (customer.landmark) {

            trackLandmark.textContent =
                `Landmark: ${customer.landmark}`;

            trackLandmark.style.display =
                "";

        } else {

            trackLandmark.textContent =
                "";

            trackLandmark.style.display =
                "none";
        }
    }


    if (trackPhone) {

        if (customer.phone) {

            trackPhone.textContent =
                customer.phone;

            trackPhone.style.display =
                "";

        } else {

            trackPhone.textContent =
                "";

            trackPhone.style.display =
                "none";
        }
    }
}


/* =========================================================
   RENDER PAYMENT
   ========================================================= */

function renderPayment(order) {

    const payment =
        order?.payment || {};


    const method =
        String(
            payment.method ||
            order?.paymentMethod ||
            "online"
        )
            .toLowerCase();


    let methodLabel =
        "Online Payment";

    let iconClass =
        "fa-credit-card";


    if (
        method === "cod" ||
        method === "cash" ||
        method === "cash_on_delivery"
    ) {

        methodLabel =
            "Cash on Delivery";

        iconClass =
            "fa-money-bill-wave";

    } else if (
        method === "upi"
    ) {

        methodLabel =
            "UPI";

        iconClass =
            "fa-mobile-screen-button";

    } else if (
        method === "card"
    ) {

        methodLabel =
            "Credit / Debit Card";

        iconClass =
            "fa-credit-card";

    } else if (
        method === "netbanking"
    ) {

        methodLabel =
            "Net Banking";

        iconClass =
            "fa-building-columns";

    } else if (
        method === "wallet"
    ) {

        methodLabel =
            "Wallet";

        iconClass =
            "fa-wallet";
    }


    const paymentStatus =
        String(
            payment.status ||
            order?.paymentStatus ||
            "pending"
        )
            .toLowerCase();


    let statusLabel =
        "Payment Pending";


    if (
        paymentStatus === "paid" ||
        paymentStatus === "success" ||
        paymentStatus === "successful" ||
        paymentStatus === "verified"
    ) {

        statusLabel =
            "Payment Successful";

    } else if (
        paymentStatus === "failed"
    ) {

        statusLabel =
            "Payment Failed";

    } else if (
        paymentStatus === "cancelled"
    ) {

        statusLabel =
            "Payment Cancelled";
    }


    if (trackPaymentMethod) {

        trackPaymentMethod.textContent =
            methodLabel;
    }


    if (trackPaymentStatus) {

        trackPaymentStatus.textContent =
            statusLabel;

        trackPaymentStatus.className =
            "";

        if (
            paymentStatus === "paid" ||
            paymentStatus === "success" ||
            paymentStatus === "successful" ||
            paymentStatus === "verified"
        ) {

            trackPaymentStatus.classList.add(
                "payment-success"
            );

        } else if (
            paymentStatus === "failed" ||
            paymentStatus === "cancelled"
        ) {

            trackPaymentStatus.classList.add(
                "payment-error"
            );

        } else {

            trackPaymentStatus.classList.add(
                "payment-pending"
            );
        }
    }


    if (paymentMethodIcon) {

        paymentMethodIcon.className =
            `fa-solid ${iconClass}`;
    }
}


/* =========================================================
   RENDER PRICE
   ========================================================= */

function renderPrice(order) {

    const orderSubtotal =
        getOrderSubtotal(order);

    const orderDiscount =
        getOrderDiscount(order);

    const orderDelivery =
        getOrderDeliveryCharge(order);

    const orderExtra =
        getOrderExtraFee(order);

    const orderTotal =
        getOrderTotal(order);


    if (trackSubtotal) {

        trackSubtotal.textContent =
            money(orderSubtotal);
    }


    if (trackDiscount) {

        trackDiscount.textContent =
            orderDiscount > 0
                ? `-${money(orderDiscount)}`
                : money(0);
    }


    if (trackDeliveryCharge) {

        trackDeliveryCharge.textContent =
            money(orderDelivery);
    }


    if (trackExtraFee) {

        trackExtraFee.textContent =
            money(orderExtra);
    }


    if (trackTotal) {

        trackTotal.textContent =
            money(orderTotal);
    }
}


/* =========================================================
   RENDER DELIVERY
   ========================================================= */

function renderDelivery(order) {

    const distance =
        order?.delivery?.verifiedDistanceKm ??
        order?.delivery?.distanceKm ??
        order?.verifiedDistance ??
        null;


    if (trackDistance) {

        if (
            distance !== null &&
            Number.isFinite(Number(distance))
        ) {

            trackDistance.textContent =
                `${Number(distance).toFixed(2)} KM`;

        } else {

            trackDistance.textContent =
                "Verified distance unavailable";
        }
    }
}


/* =========================================================
   TIMELINE
   ========================================================= */

function getStatusIndex(status) {

    const index =
        STATUS_ORDER.indexOf(status);

    return index >= 0
        ? index
        : 0;
}


function clearTimelineClasses() {

    const steps =
        document.querySelectorAll(
            ".timeline-step"
        );

    steps.forEach(step => {

        step.classList.remove(
            "completed",
            "active"
        );

    });
}


function updateTimeline(order) {

    const status =
        normalizeStatus(order);

    const currentIndex =
        getStatusIndex(status);


    clearTimelineClasses();


    const steps =
        document.querySelectorAll(
            ".timeline-step"
        );


    steps.forEach(step => {

        const stepStatus =
            step.dataset.status;

        const stepIndex =
            getStatusIndex(stepStatus);


        if (
            stepIndex <
            currentIndex
        ) {

            step.classList.add(
                "completed"
            );

        } else if (
            stepIndex ===
            currentIndex
        ) {

            step.classList.add(
                "active"
            );
        }

    });
}


/* =========================================================
   TIMELINE TIMES
   ========================================================= */

function getStatusTime(order, status) {

    const timestamps =
        order?.statusHistory ||
        order?.timeline ||
        order?.statusTimes ||
        {};


    const direct =
        timestamps?.[status];


    if (direct) {
        return formatDateTime(direct);
    }


    if (
        status === "order_created" &&
        order?.createdAt
    ) {

        return formatDateTime(
            order.createdAt
        );
    }


    return "Waiting for update";
}


function renderTimelineTimes(order) {

    if (timelineOrderCreated) {

        timelineOrderCreated.textContent =
            getStatusTime(
                order,
                "order_created"
            );
    }


    if (timelineConfirmed) {

        timelineConfirmed.textContent =
            getStatusTime(
                order,
                "confirmed"
            );
    }


    if (timelinePreparing) {

        timelinePreparing.textContent =
            getStatusTime(
                order,
                "preparing"
            );
    }


    if (timelineOutForDelivery) {

        timelineOutForDelivery.textContent =
            getStatusTime(
                order,
                "out_for_delivery"
            );
    }


    if (timelineDelivered) {

        timelineDelivered.textContent =
            getStatusTime(
                order,
                "delivered"
            );
    }
}


/* =========================================================
   CURRENT STATUS
   ========================================================= */

function renderCurrentStatus(order) {

    const status =
        normalizeStatus(order);

    const info =
        STATUS_INFO[status] ||
        STATUS_INFO.order_created;


    if (trackOrderId) {

        trackOrderId.textContent =
            order?.orderId ||
            order?.id ||
            "Order ID unavailable";
    }


    if (trackOrderDate) {

        trackOrderDate.textContent =
            formatDateTime(
                order?.createdAt ||
                order?.date ||
                order?.created
            );
    }


    if (trackStatusText) {

        trackStatusText.textContent =
            info.label;
    }


    if (trackCurrentStatus) {

        trackCurrentStatus.dataset.status =
            status;

        trackCurrentStatus.classList.remove(
            "status-order-created",
            "status-confirmed",
            "status-preparing",
            "status-out-for-delivery",
            "status-delivered"
        );

        trackCurrentStatus.classList.add(
            `status-${status.replace(
                /_/g,
                "-"
            )}`
        );
    }


    if (liveStatusHeading) {

        liveStatusHeading.textContent =
            info.label;
    }


    if (liveStatusIcon) {

        liveStatusIcon.innerHTML =
            `<i class="fa-solid ${info.icon}"></i>`;
    }


    if (liveStatusTitle) {

        liveStatusTitle.textContent =
            info.title;
    }


    if (liveStatusDescription) {

        liveStatusDescription.textContent =
            info.description;
    }


    if (estimatedDelivery) {

        estimatedDelivery.textContent =
            info.delivery;
    }


    updateTimeline(order);

    renderTimelineTimes(order);
}


/* =========================================================
   RENDER COMPLETE ORDER
   ========================================================= */

function renderOrder(order) {

    if (!order) {
        return;
    }


    currentOrder =
        order;


    renderCurrentStatus(order);

    renderOrderItems(order);

    renderCustomer(order);

    renderPayment(order);

    renderDelivery(order);

    renderPrice(order);


    if (trackContent) {
        trackContent.hidden = false;
    }

    if (trackEmptyState) {
        trackEmptyState.hidden = true;
    }


    setSearchMessage(
        "Order found successfully.",
        "success"
    );
}


/* =========================================================
   SEARCH MESSAGE
   ========================================================= */

function setSearchMessage(
    message,
    type = ""
) {

    if (!trackSearchMessage) {
        return;
    }

    trackSearchMessage.textContent =
        message;

    trackSearchMessage.className =
        "track-search-message";


    if (type) {

        trackSearchMessage.classList.add(
            type
        );
    }
}


/* =========================================================
   SHOW EMPTY STATE
   ========================================================= */

function showOrderNotFound() {

    currentOrder = null;


    if (trackContent) {
        trackContent.hidden = true;
    }


    if (trackEmptyState) {
        trackEmptyState.hidden = false;
    }


    setSearchMessage(
        "We couldn't find that order.",
        "error"
    );
}


/* =========================================================
   FIND ORDER
   ========================================================= */

function findOrder(orderId) {

    const savedOrder =
        readSavedOrder();


    if (!savedOrder) {
        return null;
    }


    const savedId =
        String(
            savedOrder.orderId ??
            savedOrder.id ??
            ""
        )
            .trim()
            .toLowerCase();


    const searchedId =
        String(orderId)
            .trim()
            .toLowerCase();


    if (
        savedId &&
        searchedId === savedId
    ) {

        return savedOrder;
    }


    /*
       If there is only one saved checkout order,
       do not expose it for a completely unrelated ID.
    */

    return null;
}


/* =========================================================
   SUBMIT SEARCH
   ========================================================= */

function handleTrackSearch(event) {

    event.preventDefault();


    const orderId =
        trackOrderInput?.value.trim() ||
        "";


    if (!orderId) {

        setSearchMessage(
            "Please enter your Order ID.",
            "error"
        );

        trackOrderInput?.focus();

        return;
    }


    if (trackOrderButton) {

        trackOrderButton.disabled =
            true;
    }


    setSearchMessage(
        "Searching for your order..."
    );


    /*
       Small timeout keeps the UI responsive
       and allows button state to render.
    */

    setTimeout(() => {

        const order =
            findOrder(orderId);


        if (order) {

            renderOrder(order);

        } else {

            showOrderNotFound();
        }


        if (trackOrderButton) {

            trackOrderButton.disabled =
                false;
        }

    }, 150);

}


/* =========================================================
   LOAD LAST ORDER
   ========================================================= */

function loadLastOrder() {

    const savedOrder =
        readSavedOrder();


    if (!savedOrder) {
        return;
    }


    const savedId =
        savedOrder.orderId ??
        savedOrder.id ??
        "";


    if (
        trackOrderInput &&
        savedId
    ) {

        trackOrderInput.value =
            savedId;
    }


    renderOrder(savedOrder);
}


/* =========================================================
   REFRESH ORDER
   ========================================================= */

function refreshOrder() {

    if (!refreshTrackButton) {
        return;
    }


    refreshTrackButton.classList.add(
        "loading"
    );


    setSearchMessage(
        "Refreshing order status..."
    );


    setTimeout(() => {

        const savedOrder =
            readSavedOrder();


        if (!savedOrder) {

            showOrderNotFound();

        } else {

            /*
               Refresh reads the latest locally
               saved order.

               When backend/database is connected,
               this function can be changed to
               fetch the real server order.
            */

            const currentId =
                currentOrder?.orderId ??
                savedOrder?.orderId ??
                "";


            if (
                currentId &&
                String(
                    savedOrder?.orderId ??
                    ""
                ).toLowerCase() !==
                String(
                    currentId
                ).toLowerCase()
            ) {

                showOrderNotFound();

            } else {

                renderOrder(savedOrder);
            }
        }


        refreshTrackButton.classList.remove(
            "loading"
        );

    }, 250);
}


/* =========================================================
   TRY AGAIN
   ========================================================= */

function tryAgain() {

    if (trackEmptyState) {
        trackEmptyState.hidden = true;
    }


    if (trackContent) {
        trackContent.hidden = true;
    }


    setSearchMessage(
        ""
    );


    if (trackOrderInput) {

        trackOrderInput.value = "";

        trackOrderInput.focus();
    }
}


/* =========================================================
   NAVBAR CART COUNT
   ========================================================= */

function readCart() {

    try {

        const raw =
            localStorage.getItem(
                CART_KEY
            );

        if (!raw) {
            return [];
        }

        const parsed =
            JSON.parse(raw);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            "Cart read error:",
            error
        );

        return [];
    }
}


function updateCartCount() {

    const cart =
        readCart();


    const count =
        cart.reduce(
            (total, item) =>
                total + getQuantity(item),
            0
        );


    const cartCount =
        document.getElementById(
            "cartCount"
        );

    const mobileCartCount =
        document.getElementById(
            "mobileCartCount"
        );


    if (cartCount) {
        cartCount.textContent =
            count;
    }

    if (mobileCartCount) {
        mobileCartCount.textContent =
            count;
    }
}


/* =========================================================
   NAVBAR SEARCH
   ========================================================= */

function setupNavbarFeatures() {

    updateCartCount();


    const desktopSearchForm =
        document.getElementById(
            "desktopSearchForm"
        );

    const desktopSearch =
        document.getElementById(
            "desktopSearch"
        );


    if (desktopSearchForm) {

        desktopSearchForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const query =
                    desktopSearch?.value.trim() ||
                    "";

                if (!query) {
                    return;
                }

                window.location.href =
                    `menu.html?search=${encodeURIComponent(query)}`;
            }
        );
    }


    const mobileSearchForm =
        document.getElementById(
            "mobileSearchForm"
        );

    const mobileSearch =
        document.getElementById(
            "mobileSearch"
        );


    if (mobileSearchForm) {

        mobileSearchForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                const query =
                    mobileSearch?.value.trim() ||
                    "";

                if (!query) {
                    return;
                }

                window.location.href =
                    `menu.html?search=${encodeURIComponent(query)}`;
            }
        );
    }


    const locationButton =
        document.getElementById(
            "locationButton"
        );


    const mobileLocationButton =
        document.getElementById(
            "mobileLocationButton"
        );


    /*
       Track page does not need a second
       location verification system.
       These buttons remain available through
       the common navbar.
    */

    if (locationButton) {

        locationButton.addEventListener(
            "click",
            () => {

                if (
                    navigator.geolocation
                ) {

                    navigator.geolocation.getCurrentPosition(
                        () => {},
                        () => {}
                    );
                }
            }
        );
    }


    if (mobileLocationButton) {

        mobileLocationButton.addEventListener(
            "click",
            () => {

                if (
                    navigator.geolocation
                ) {

                    navigator.geolocation.getCurrentPosition(
                        () => {},
                        () => {}
                    );
                }
            }
        );
    }
}


/* =========================================================
   LOAD NAVBAR
   ========================================================= */

async function loadNavbar() {

    const navbar =
        document.getElementById(
            "navbar"
        );


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
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Navbar request failed: ${response.status}`
            );
        }


        const html =
            await response.text();


        navbar.innerHTML =
            html;


        setupNavbarFeatures();

    } catch (error) {

        console.error(
            "Navbar loading error:",
            error
        );
    }
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function setupTrackEvents() {

    if (trackOrderForm) {

        trackOrderForm.addEventListener(
            "submit",
            handleTrackSearch
        );
    }


    if (refreshTrackButton) {

        refreshTrackButton.addEventListener(
            "click",
            refreshOrder
        );
    }


    if (tryAgainButton) {

        tryAgainButton.addEventListener(
            "click",
            tryAgain
        );
    }


    if (trackOrderInput) {

        trackOrderInput.addEventListener(
            "input",
            () => {

                trackOrderInput.value =
                    trackOrderInput.value
                        .replace(/\s+/g, " ")
                        .trimStart();

            }
        );
    }
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initTrackOrder() {

    setupTrackEvents();

    loadNavbar();

    /*
       If the customer came directly from
       checkout/payment and the saved order exists,
       automatically show it.
    */

    loadLastOrder();
}


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initTrackOrder
    );

} else {

    initTrackOrder();
}