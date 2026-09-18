/* =========================================================
   11:11 PIZZA CAFE
   CART SYSTEM - FINAL CLEAN VERSION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const CART_KEY = "1111_cart";

    /* =====================================================
       ELEMENTS
       ===================================================== */

    const cartItemsContainer = document.getElementById("cartItems");
    const cartItemCount = document.getElementById("cartItemCount");

    const subtotalElement = document.getElementById("subtotal");
    const discountElement = document.getElementById("discount");
    const deliveryElement = document.getElementById("deliveryCharge");
    const grandTotalElement = document.getElementById("grandTotal");

    const checkoutButton = document.getElementById("checkoutButton");


    /* =====================================================
       GET CART
       ===================================================== */

    function getCart() {

        try {

            const savedCart = localStorage.getItem(CART_KEY);

            if (!savedCart) {
                return [];
            }

            const cart = JSON.parse(savedCart);

            if (!Array.isArray(cart)) {
                return [];
            }

            return cart;

        } catch (error) {

            console.error("Cart read error:", error);

            return [];
        }
    }


    /* =====================================================
       SAVE CART
       ===================================================== */

    function saveCart(cart) {

        try {

            localStorage.setItem(
                CART_KEY,
                JSON.stringify(cart)
            );

        } catch (error) {

            console.error("Cart save error:", error);
        }

        updateCartCount();

        renderCart();
    }


    /* =====================================================
       CART COUNT - NAVBAR
       ===================================================== */

    function updateCartCount() {

        const cart = getCart();

        let totalQuantity = 0;

        cart.forEach(function (item) {

            const quantity = Number(
                item.quantity ??
                item.qty ??
                1
            );

            totalQuantity += quantity > 0 ? quantity : 0;

        });


        /* New navbar class */

        document
            .querySelectorAll(".cart-count")
            .forEach(function (badge) {

                badge.textContent = totalQuantity;

                badge.style.display =
                    totalQuantity > 0
                        ? "flex"
                        : "none";

            });


        /* Old desktop ID */

        const cartCount =
            document.getElementById("cartCount");

        if (cartCount) {

            cartCount.textContent = totalQuantity;

            cartCount.style.display =
                totalQuantity > 0
                    ? "flex"
                    : "none";
        }


        /* Old mobile ID */

        const mobileCartCount =
            document.getElementById("mobileCartCount");

        if (mobileCartCount) {

            mobileCartCount.textContent =
                totalQuantity;

            mobileCartCount.style.display =
                totalQuantity > 0
                    ? "flex"
                    : "none";
        }
    }


    /* =====================================================
       NUMBER FORMAT
       ===================================================== */

    function money(value) {

        const amount = Number(value) || 0;

        return "₹" + amount.toLocaleString("en-IN");
    }


    /* =====================================================
       ADDON TOTAL
       ===================================================== */

    function getAddonTotal(item) {

        if (!Array.isArray(item.addons)) {
            return Number(item.addonTotal) || 0;
        }

        return item.addons.reduce(function (total, addon) {

            if (typeof addon === "object" && addon !== null) {

                return total + (
                    Number(addon.price) || 0
                );
            }

            return total;

        }, 0);
    }


    /* =====================================================
       ADDON TEXT
       ===================================================== */

    function getAddonText(item) {

        if (!Array.isArray(item.addons)) {
            return "";
        }

        if (item.addons.length === 0) {
            return "";
        }

        return item.addons
            .map(function (addon) {

                if (
                    typeof addon === "object" &&
                    addon !== null
                ) {

                    const name =
                        addon.name || "Add-on";

                    const price =
                        Number(addon.price) || 0;

                    return price > 0
                        ? `${name} (+${money(price)})`
                        : name;
                }

                return String(addon);

            })
            .join(" • ");
    }


    /* =====================================================
       UNIT PRICE
       ===================================================== */

    function getUnitPrice(item) {

        /*
          Priority:

          unitPrice
          singlePrice
          price
          basePrice + addon
        */

        if (
            item.unitPrice !== undefined &&
            item.unitPrice !== null &&
            Number(item.unitPrice) > 0
        ) {

            return Number(item.unitPrice);
        }


        if (
            item.singlePrice !== undefined &&
            item.singlePrice !== null &&
            Number(item.singlePrice) > 0
        ) {

            return Number(item.singlePrice);
        }


        if (
            item.price !== undefined &&
            item.price !== null &&
            Number(item.price) > 0
        ) {

            return Number(item.price);
        }


        const basePrice =
            Number(item.basePrice) || 0;

        const addonTotal =
            getAddonTotal(item);

        return basePrice + addonTotal;
    }


    /* =====================================================
       QUANTITY
       ===================================================== */

    function getQuantity(item) {

        const quantity = Number(
            item.quantity ??
            item.qty ??
            1
        );

        return quantity > 0 ? quantity : 1;
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
       PRODUCT KEY
       ===================================================== */

    function getProductKey(item) {

        const id =
            item.id ||
            item.name ||
            "product";

        const size =
            item.size ||
            "";

        let addons = "";

        if (Array.isArray(item.addons)) {

            addons = item.addons
                .map(function (addon) {

                    if (
                        typeof addon === "object" &&
                        addon !== null
                    ) {

                        return (
                            String(addon.name || "") +
                            ":" +
                            String(Number(addon.price) || 0)
                        );
                    }

                    return String(addon);
                })
                .sort()
                .join("|");
        }

        return (
            String(id).toLowerCase() +
            "___" +
            String(size).toLowerCase() +
            "___" +
            addons.toLowerCase()
        );
    }


    /* =====================================================
       NORMALIZE ITEM
       ===================================================== */

    function normalizeItem(item) {

        const quantity =
            getQuantity(item);

        const unitPrice =
            getUnitPrice(item);

        const basePrice =
            Number(item.basePrice) ||
            unitPrice;

        const addonTotal =
            getAddonTotal(item);

        const total =
            unitPrice * quantity;


        return {

            ...item,

            id:
                item.id ||
                String(item.name || "product")
                    .toLowerCase()
                    .replace(/\s+/g, "-"),

            name:
                item.name || "Product",

            description:
                item.description || "",

            image:
                item.image || "",

            size:
                item.size || "",

            basePrice:
                basePrice,

            addons:
                Array.isArray(item.addons)
                    ? item.addons
                    : [],

            addonTotal:
                addonTotal,

            quantity:
                quantity,

            qty:
                quantity,

            unitPrice:
                unitPrice,

            singlePrice:
                unitPrice,

            price:
                unitPrice,

            total:
                total,

            totalPrice:
                total
        };
    }


    /* =====================================================
       RENDER CART
       ===================================================== */

    function renderCart() {

        if (!cartItemsContainer) {
            return;
        }

        let cart = getCart();


        /* Normalize old cart data */

        cart = cart.map(function (item) {

            return normalizeItem(item);

        });


        /* Save normalized cart */

        try {

            localStorage.setItem(
                CART_KEY,
                JSON.stringify(cart)
            );

        } catch (error) {

            console.error(
                "Normalize save error:",
                error
            );
        }


        /* Empty cart */

        if (cart.length === 0) {

            cartItemsContainer.innerHTML = `
                <div class="empty-cart">

                    <div class="empty-cart-icon">
                        🛒
                    </div>

                    <h3>Your cart is empty</h3>

                    <p>
                        Add something delicious from
                        11:11 Pizza Cafe.
                    </p>

                    <button
                        type="button"
                        class="continue-shopping"
                        onclick="window.location.href='index.html'">
                        ← Continue Shopping
                    </button>

                </div>
            `;

            updateCartSummary([]);

            return;
        }


        /* Cart HTML */

        cartItemsContainer.innerHTML =
            cart.map(function (item, index) {

                const quantity =
                    getQuantity(item);

                const unitPrice =
                    getUnitPrice(item);

                const total =
                    unitPrice * quantity;

                const addonText =
                    getAddonText(item);

                const image =
                    item.image || "";


                return `

                    <article
                        class="cart-item"
                        data-index="${index}">

                        <div class="cart-item-image">

                            ${
                                image
                                    ? `
                                        <img
                                            src="${image}"
                                            alt="${escapeHTML(item.name)}"
                                            loading="lazy"
                                            onerror="this.style.display='none'; this.parentElement.classList.add('no-image');"
                                        >
                                      `
                                    : `
                                        <div class="cart-no-image">
                                            🍕
                                        </div>
                                      `
                            }

                        </div>


                        <div class="cart-item-details">

                            <h3>
                                ${escapeHTML(item.name)}
                            </h3>


                            ${
                                item.size
                                    ? `
                                        <div class="cart-size">
                                            Size:
                                            <strong>
                                                ${escapeHTML(item.size)}
                                            </strong>
                                        </div>
                                      `
                                    : ""
                            }


                            ${
                                addonText
                                    ? `
                                        <div class="cart-addons">
                                            ${escapeHTML(addonText)}
                                        </div>
                                      `
                                    : ""
                            }


                            <div class="cart-item-price">
                                ${money(unitPrice)}
                                <span>each</span>
                            </div>


                            <div class="cart-item-actions">

                                <div class="cart-quantity">

                                    <button
                                        type="button"
                                        class="cart-minus"
                                        data-index="${index}"
                                        aria-label="Decrease quantity">
                                        −
                                    </button>

                                    <span>
                                        ${quantity}
                                    </span>

                                    <button
                                        type="button"
                                        class="cart-plus"
                                        data-index="${index}"
                                        aria-label="Increase quantity">
                                        +
                                    </button>

                                </div>


                                <button
                                    type="button"
                                    class="cart-remove"
                                    data-index="${index}">
                                    <i class="fa-solid fa-trash"></i>
                                    Remove
                                </button>

                            </div>

                        </div>


                        <div class="cart-item-total">

                            ${money(total)}

                        </div>

                    </article>

                `;

            }).join("");


        updateCartSummary(cart);
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
       UPDATE SUMMARY
       ===================================================== */

    function updateCartSummary(cart) {

        let subtotal = 0;

        let totalItems = 0;


        cart.forEach(function (item) {

            const quantity =
                getQuantity(item);

            const unitPrice =
                getUnitPrice(item);

            subtotal +=
                unitPrice * quantity;

            totalItems +=
                quantity;

        });


        /*
          Currently Cart page only displays
          default discount/delivery.

          Final discount + delivery rules
          can be connected later with Checkout.
        */

        const discount = 0;

        const deliveryCharge = 0;

        const grandTotal =
            Math.max(
                0,
                subtotal -
                discount +
                deliveryCharge
            );


        if (cartItemCount) {

            cartItemCount.textContent =
                `${totalItems} ${
                    totalItems === 1
                        ? "Item"
                        : "Items"
                }`;
        }


        if (subtotalElement) {

            subtotalElement.textContent =
                money(subtotal);
        }


        if (discountElement) {

            discountElement.textContent =
                money(discount);
        }


        if (deliveryElement) {

            deliveryElement.textContent =
                money(deliveryCharge);
        }


        if (grandTotalElement) {

            grandTotalElement.textContent =
                money(grandTotal);
        }


        if (checkoutButton) {

            checkoutButton.disabled =
                cart.length === 0;

        }
    }


    /* =====================================================
       QUANTITY CHANGE
       ===================================================== */

    function changeQuantity(index, change) {

        const cart = getCart();

        if (!cart[index]) {
            return;
        }


        let quantity =
            getQuantity(cart[index]);


        quantity += change;


        /* Minimum quantity = 1 */

        if (quantity < 1) {
            quantity = 1;
        }


        cart[index].quantity =
            quantity;

        cart[index].qty =
            quantity;


        const unitPrice =
            getUnitPrice(cart[index]);


        cart[index].unitPrice =
            unitPrice;

        cart[index].singlePrice =
            unitPrice;

        cart[index].price =
            unitPrice;

        cart[index].total =
            unitPrice * quantity;

        cart[index].totalPrice =
            cart[index].total;


        saveCart(cart);
    }


    /* =====================================================
       REMOVE ITEM
       ===================================================== */

    function removeItem(index) {

        const cart = getCart();

        if (!cart[index]) {
            return;
        }


        cart.splice(index, 1);

        saveCart(cart);
    }


    /* =====================================================
       CLICK EVENTS
       ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const plusButton =
                event.target.closest(".cart-plus");

            const minusButton =
                event.target.closest(".cart-minus");

            const removeButton =
                event.target.closest(".cart-remove");


            /* PLUS */

            if (plusButton) {

                const index =
                    Number(
                        plusButton.dataset.index
                    );

                changeQuantity(index, 1);

                return;
            }


            /* MINUS */

            if (minusButton) {

                const index =
                    Number(
                        minusButton.dataset.index
                    );

                changeQuantity(index, -1);

                return;
            }


            /* REMOVE */

            if (removeButton) {

                const index =
                    Number(
                        removeButton.dataset.index
                    );

                removeItem(index);

                return;
            }

        }
    );


    /* =====================================================
       CHECKOUT
       ===================================================== */

    if (checkoutButton) {

        checkoutButton.addEventListener(
            "click",
            function () {

                const cart = getCart();

                if (cart.length === 0) {
                    return;
                }

                window.location.href =
                    "checkout.html";

            }
        );
    }


    /* =====================================================
       NAVBAR LOADER
       ===================================================== */

    const navbarContainer =
        document.getElementById("navbar");


    if (navbarContainer) {

        fetch("navbar.html")

            .then(function (response) {

                if (!response.ok) {

                    throw new Error(
                        "Navbar could not load"
                    );
                }

                return response.text();

            })

            .then(function (data) {

                navbarContainer.innerHTML =
                    data;


                /*
                  Navbar HTML me scripts
                  innerHTML se execute nahi hote.

                  Isliye count yahin manually update.
                */

                updateCartCount();


                /* Search */

                const searchInput =
                    document.querySelector(
                        "#searchInput, .search-input, input[type='search']"
                    );


                if (searchInput) {

                    searchInput.addEventListener(
                        "keydown",
                        function (event) {

                            if (
                                event.key === "Enter"
                            ) {

                                const value =
                                    searchInput.value
                                        .trim()
                                        .toLowerCase();


                                if (value) {

                                    window.location.href =
                                        "index.html?search=" +
                                        encodeURIComponent(
                                            value
                                        );
                                }
                            }
                        }
                    );
                }

            })

            .catch(function (error) {

                console.error(
                    "Navbar Error:",
                    error
                );

                /*
                  Navbar fail hone par bhi
                  cart render hota rahega.
                */

                updateCartCount();
            });

    } else {

        updateCartCount();
    }


    /* =====================================================
       INITIAL CART LOAD
       ===================================================== */

    renderCart();

    updateCartCount();


    /* =====================================================
       STORAGE SYNC
       ===================================================== */

    window.addEventListener(
        "storage",
        function (event) {

            if (event.key === CART_KEY) {

                renderCart();

                updateCartCount();
            }
        }
    );


    /* =====================================================
       OTHER TABS / PAGES SYNC
       ===================================================== */

    window.addEventListener(
        "focus",
        function () {

            renderCart();

            updateCartCount();

        }
    );

});