/* =========================================================
   11:11 PIZZA CAFE
   COMMON NAVBAR JS
   Location + Search + Cart Count
   ========================================================= */

"use strict";


/* =========================================================
   SETTINGS
   ========================================================= */

const NAVBAR_CART_KEY = "1111_cart";
const NAVBAR_LOCATION_KEY = "1111_user_location";

const MAX_DELIVERY_DISTANCE_KM = 5;


/* =========================================================
   HELPERS
   ========================================================= */

function navbarSafeNumber(value, fallback = 0) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


function navbarGetQuantity(item) {
    const quantity = navbarSafeNumber(
        item?.quantity ?? item?.qty ?? 1,
        1
    );

    return Math.max(1, Math.round(quantity));
}


/* =========================================================
   CART
   ========================================================= */

function navbarGetCart() {
    try {
        const raw = localStorage.getItem(
            NAVBAR_CART_KEY
        );

        if (!raw) {
            return [];
        }

        const cart = JSON.parse(raw);

        return Array.isArray(cart)
            ? cart
            : [];

    } catch (error) {
        console.error(
            "Navbar cart error:",
            error
        );

        return [];
    }
}


function navbarUpdateCartCount() {
    const cart = navbarGetCart();

    const count = cart.reduce(
        (total, item) =>
            total + navbarGetQuantity(item),
        0
    );


    const desktopCount =
        document.getElementById("cartCount");

    const mobileCount =
        document.getElementById("mobileCartCount");


    if (desktopCount) {
        desktopCount.textContent = count;
    }


    if (mobileCount) {
        mobileCount.textContent = count;
    }
}


/* =========================================================
   LOCATION STORAGE
   ========================================================= */

function navbarSaveLocation(latitude, longitude) {

    const locationData = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        savedAt: new Date().toISOString()
    };


    try {

        localStorage.setItem(
            NAVBAR_LOCATION_KEY,
            JSON.stringify(locationData)
        );

    } catch (error) {

        console.error(
            "Location save error:",
            error
        );
    }
}


function navbarGetSavedLocation() {

    try {

        const raw =
            localStorage.getItem(
                NAVBAR_LOCATION_KEY
            );


        if (!raw) {
            return null;
        }


        const data =
            JSON.parse(raw);


        if (
            !data ||
            !Number.isFinite(
                Number(data.latitude)
            ) ||
            !Number.isFinite(
                Number(data.longitude)
            )
        ) {
            return null;
        }


        return data;

    } catch (error) {

        console.error(
            "Saved location error:",
            error
        );

        return null;
    }
}


/* =========================================================
   LOCATION TEXT
   ========================================================= */

function navbarSetLocationText(
    text,
    mobileText = null
) {

    const locationText =
        document.getElementById(
            "locationText"
        );


    if (locationText) {
        locationText.textContent = text;
    }


    /*
       Mobile bottom button normally only says
       Location, so we keep it short.
    */

    const mobileButton =
        document.getElementById(
            "mobileLocationButton"
        );


    if (mobileButton) {

        const span =
            mobileButton.querySelector(
                "span:last-child"
            );


        if (span) {

            span.textContent =
                mobileText || "Location";
        }
    }
}


/* =========================================================
   DISTANCE CALCULATION
   ========================================================= */

function navbarCalculateDistanceKm(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadiusKm = 6371;


    const latitudeDifference =
        (
            Number(lat2) -
            Number(lat1)
        ) *
        Math.PI /
        180;


    const longitudeDifference =
        (
            Number(lon2) -
            Number(lon1)
        ) *
        Math.PI /
        180;


    const a =
        Math.sin(
            latitudeDifference / 2
        ) ** 2 +

        Math.cos(
            Number(lat1) *
            Math.PI /
            180
        ) *

        Math.cos(
            Number(lat2) *
            Math.PI /
            180
        ) *

        Math.sin(
            longitudeDifference / 2
        ) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadiusKm * c;
}


/* =========================================================
   GEOLOCATION SUPPORT
   ========================================================= */

function navbarIsLocationSupported() {

    return (
        "geolocation" in navigator
    );
}


/* =========================================================
   LOCATION ERROR MESSAGE
   ========================================================= */

function navbarGetLocationErrorMessage(
    error
) {

    if (!error) {
        return "Unable to detect your location.";
    }


    switch (error.code) {

        case error.PERMISSION_DENIED:

            return (
                "Location permission was denied. " +
                "Please allow location access in your browser."
            );


        case error.POSITION_UNAVAILABLE:

            return (
                "Your location is currently unavailable. " +
                "Please check GPS/location services."
            );


        case error.TIMEOUT:

            return (
                "Location request timed out. " +
                "Please turn on GPS and try again."
            );


        default:

            return (
                "Unable to detect your location. " +
                "Please try again."
            );
    }
}


/* =========================================================
   LOCATION UI STATE
   ========================================================= */

function navbarSetLocationLoading(isLoading) {

    const desktopButton =
        document.getElementById(
            "locationButton"
        );


    const mobileButton =
        document.getElementById(
            "mobileLocationButton"
        );


    if (desktopButton) {

        desktopButton.disabled =
            isLoading;

        desktopButton.classList.toggle(
            "location-loading",
            isLoading
        );
    }


    if (mobileButton) {

        mobileButton.disabled =
            isLoading;

        mobileButton.classList.toggle(
            "location-loading",
            isLoading
        );
    }


    if (isLoading) {

        navbarSetLocationText(
            "Locating...",
            "Locating..."
        );
    }
}


/* =========================================================
   LOCATION RESULT
   ========================================================= */

function navbarHandleLocationSuccess(
    position
) {

    if (!position?.coords) {

        navbarHandleLocationError({
            code: 2
        });

        return;
    }


    const latitude =
        Number(
            position.coords.latitude
        );


    const longitude =
        Number(
            position.coords.longitude
        );


    const accuracy =
        Number(
            position.coords.accuracy
        );


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        navbarHandleLocationError({
            code: 2
        });

        return;
    }


    navbarSaveLocation(
        latitude,
        longitude
    );


    navbarSetLocationLoading(false);


    /*
       We do not display exact coordinates
       in the navbar.
    */

    navbarSetLocationText(
        "Located",
        "Located"
    );


    /*
       Dispatch a custom event so checkout.js
       and other pages can use the verified
       location without another request.
    */

    window.dispatchEvent(
        new CustomEvent(
            "1111-location-updated",
            {
                detail: {
                    latitude,
                    longitude,
                    accuracy:
                        Number.isFinite(
                            accuracy
                        )
                            ? accuracy
                            : null
                }
            }
        )
    );


    /*
       Optional small visual confirmation.
       We don't use alert() because it is annoying
       every time the customer clicks Location.
    */

    navbarShowLocationNotice(
        "Location detected successfully."
    );
}


/* =========================================================
   LOCATION ERROR
   ========================================================= */

function navbarHandleLocationError(
    error
) {

    navbarSetLocationLoading(false);


    const message =
        navbarGetLocationErrorMessage(
            error
        );


    navbarSetLocationText(
        "Location",
        "Location"
    );


    console.warn(
        "Location error:",
        error
    );


    navbarShowLocationNotice(
        message,
        "error"
    );
}


/* =========================================================
   LOCATION REQUEST
   ========================================================= */

function navbarRequestLocation() {

    if (
        !navbarIsLocationSupported()
    ) {

        navbarShowLocationNotice(
            "Your browser does not support location.",
            "error"
        );

        return;
    }


    if (
        !window.isSecureContext &&
        location.hostname !== "localhost" &&
        location.hostname !== "127.0.0.1"
    ) {

        navbarShowLocationNotice(
            "Location works on HTTPS. Open the live website using HTTPS.",
            "error"
        );

        return;
    }


    navbarSetLocationLoading(true);


    /*
       High accuracy is useful for delivery-area
       verification, but we also allow a longer
       timeout so slow GPS does not immediately fail.
    */

    navigator.geolocation.getCurrentPosition(
        navbarHandleLocationSuccess,
        navbarHandleLocationError,
        {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 60000
        }
    );
}


/* =========================================================
   LOCATION NOTICE
   ========================================================= */

function navbarShowLocationNotice(
    message,
    type = "success"
) {

    let notice =
        document.getElementById(
            "navbarLocationNotice"
        );


    if (!notice) {

        notice =
            document.createElement(
                "div"
            );

        notice.id =
            "navbarLocationNotice";


        notice.setAttribute(
            "role",
            "status"
        );


        notice.style.position =
            "fixed";

        notice.style.left =
            "50%";

        notice.style.bottom =
            "95px";

        notice.style.transform =
            "translateX(-50%)";

        notice.style.zIndex =
            "99999";

        notice.style.maxWidth =
            "calc(100vw - 30px)";

        notice.style.padding =
            "12px 18px";

        notice.style.borderRadius =
            "14px";

        notice.style.fontSize =
            "14px";

        notice.style.fontWeight =
            "700";

        notice.style.textAlign =
            "center";

        notice.style.backdropFilter =
            "blur(16px)";

        notice.style.webkitBackdropFilter =
            "blur(16px)";

        notice.style.boxShadow =
            "0 10px 30px rgba(0,0,0,.20)";

        document.body.appendChild(
            notice
        );
    }


    notice.textContent =
        message;


    if (type === "error") {

        notice.style.background =
            "rgba(220, 38, 38, .94)";

        notice.style.color =
            "#fff";

    } else {

        notice.style.background =
            "rgba(22, 163, 74, .94)";

        notice.style.color =
            "#fff";
    }


    notice.style.display =
        "block";


    clearTimeout(
        notice._hideTimer
    );


    notice._hideTimer =
        setTimeout(
            () => {

                notice.style.display =
                    "none";

            },
            3500
        );
}


/* =========================================================
   SEARCH
   ========================================================= */

function navbarGoToSearch(
    input
) {

    const query =
        input?.value.trim() ||
        "";


    if (!query) {

        input?.focus();

        return;
    }


    window.location.href =
        `menu.html?search=${encodeURIComponent(query)}`;
}


function navbarSetupSearch() {

    const desktopForm =
        document.getElementById(
            "desktopSearchForm"
        );


    const desktopInput =
        document.getElementById(
            "desktopSearch"
        );


    if (desktopForm) {

        desktopForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                navbarGoToSearch(
                    desktopInput
                );
            }
        );
    }


    const mobileForm =
        document.getElementById(
            "mobileSearchForm"
        );


    const mobileInput =
        document.getElementById(
            "mobileSearch"
        );


    if (mobileForm) {

        mobileForm.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                navbarGoToSearch(
                    mobileInput
                );
            }
        );
    }
}


/* =========================================================
   LOCATION BUTTONS
   ========================================================= */

function navbarSetupLocationButtons() {

    const desktopButton =
        document.getElementById(
            "locationButton"
        );


    const mobileButton =
        document.getElementById(
            "mobileLocationButton"
        );


    if (desktopButton) {

        desktopButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                navbarRequestLocation();
            }
        );
    }


    if (mobileButton) {

        mobileButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                navbarRequestLocation();
            }
        );
    }
}


/* =========================================================
   RESTORE SAVED LOCATION
   ========================================================= */

function navbarRestoreLocation() {

    const savedLocation =
        navbarGetSavedLocation();


    if (!savedLocation) {
        return;
    }


    /*
       Saved location is only restored visually.
       We don't automatically request GPS on every
       page load because that would repeatedly trigger
       browser permission/location requests.
    */

    navbarSetLocationText(
        "Located",
        "Located"
    );
}


/* =========================================================
   LISTEN FOR CART CHANGES
   ========================================================= */

function navbarListenForCartChanges() {

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key ===
                NAVBAR_CART_KEY
            ) {

                navbarUpdateCartCount();
            }
        }
    );


    /*
       Same-tab custom event support.
       Cart pages can call:

       window.dispatchEvent(
           new Event("1111-cart-updated")
       );
    */

    window.addEventListener(
        "1111-cart-updated",
        navbarUpdateCartCount
    );
}


/* =========================================================
   INITIALIZE NAVBAR
   ========================================================= */

function initializeNavbarJS() {

    navbarUpdateCartCount();

    navbarSetupSearch();

    navbarSetupLocationButtons();

    navbarRestoreLocation();

    navbarListenForCartChanges();
}


/* =========================================================
   AUTO START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeNavbarJS
    );

} else {

    initializeNavbarJS();
}