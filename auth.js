/* =========================================================
   11:11 PIZZA CAFE
   Firebase Phone OTP Login
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyDVxaKGhY3q8TVFaxqMrMtAf5vDobVYIKA",
    authDomain: "pizza-cafe-50a89.firebaseapp.com",
    projectId: "pizza-cafe-50a89",
    storageBucket: "pizza-cafe-50a89.firebasestorage.app",
    messagingSenderId: "105063731490",
    appId: "1:105063731490:web:c25ce3f2e507c1ca84157b",
    measurementId: "G-ZSZ0CGLGME"
};

/* ---------------------------------------------------------
   Firebase Initialize
   --------------------------------------------------------- */

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

let confirmationResult = null;
let recaptchaVerifier = null;
let resendInterval = null;


/* ---------------------------------------------------------
   DOM
   --------------------------------------------------------- */

const phoneStep = document.getElementById("phoneStep");
const otpStep = document.getElementById("otpStep");
const successStep = document.getElementById("successStep");

const phoneForm = document.getElementById("phoneForm");
const phoneNumberInput = document.getElementById("phoneNumber");
const phoneError = document.getElementById("phoneError");
const sendOtpButton = document.getElementById("sendOtpButton");

const otpForm = document.getElementById("otpForm");
const otpInputs = document.querySelectorAll(".otp-input");
const otpError = document.getElementById("otpError");
const verifyOtpButton = document.getElementById("verifyOtpButton");

const maskedPhone = document.getElementById("maskedPhone");
const changeNumberButton = document.getElementById("changeNumberButton");
const resendOtpButton = document.getElementById("resendOtpButton");
const resendTimer = document.getElementById("resendTimer");

const continueButton = document.getElementById("continueButton");


/* ---------------------------------------------------------
   Firebase Auth Persistence
   User stays logged in after browser close/reopen
   --------------------------------------------------------- */

auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch((error) => {
        console.error("Firebase persistence error:", error);
    });


/* ---------------------------------------------------------
   Utility
   --------------------------------------------------------- */

function showElement(element) {
    if (element) {
        element.style.display = "";
    }
}

function hideElement(element) {
    if (element) {
        element.style.display = "none";
    }
}

function clearError(element) {
    if (element) {
        element.textContent = "";
        element.style.display = "none";
    }
}

function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = "block";
    }
}


/* ---------------------------------------------------------
   Phone Validation
   --------------------------------------------------------- */

function cleanPhoneNumber(value) {
    return value.replace(/\D/g, "");
}

function isValidIndianMobile(phone) {
    return /^[6-9]\d{9}$/.test(phone);
}


/* ---------------------------------------------------------
   reCAPTCHA
   --------------------------------------------------------- */

function createRecaptcha() {

    if (recaptchaVerifier) {
        return;
    }

    try {

        recaptchaVerifier = new firebase.auth.RecaptchaVerifier(
            "recaptcha-container",
            {
                size: "invisible",

                callback: function () {
                    console.log("reCAPTCHA completed.");
                },

                "expired-callback": function () {
                    console.log("reCAPTCHA expired.");
                }
            }
        );

        recaptchaVerifier.render()
            .then(function (widgetId) {
                window.recaptchaWidgetId = widgetId;
            })
            .catch(function (error) {
                console.error("reCAPTCHA render error:", error);
            });

    } catch (error) {

        console.error("reCAPTCHA initialization error:", error);

    }
}


/* ---------------------------------------------------------
   Reset reCAPTCHA
   --------------------------------------------------------- */

function resetRecaptcha() {

    if (
        typeof grecaptcha !== "undefined" &&
        window.recaptchaWidgetId !== undefined
    ) {
        try {
            grecaptcha.reset(window.recaptchaWidgetId);
        } catch (error) {
            console.warn("reCAPTCHA reset warning:", error);
        }
    }
}


/* ---------------------------------------------------------
   SEND OTP
   --------------------------------------------------------- */

if (phoneForm) {

    phoneForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        clearError(phoneError);

        const phone = cleanPhoneNumber(phoneNumberInput.value);

        phoneNumberInput.value = phone;

        if (!isValidIndianMobile(phone)) {

            showError(
                phoneError,
                "Please enter a valid 10-digit Indian mobile number."
            );

            phoneNumberInput.focus();

            return;
        }

        sendOtpButton.disabled = true;

        const originalButtonHTML = sendOtpButton.innerHTML;

        sendOtpButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Sending OTP...';

        try {

            createRecaptcha();

            if (!recaptchaVerifier) {
                throw new Error("reCAPTCHA could not be initialized.");
            }

            const fullPhoneNumber = "+91" + phone;

            console.log(
                "Sending Firebase OTP to:",
                fullPhoneNumber
            );

            confirmationResult =
                await auth.signInWithPhoneNumber(
                    fullPhoneNumber,
                    recaptchaVerifier
                );

            console.log("OTP sent successfully.");

            /* Save phone temporarily */
            sessionStorage.setItem(
                "1111_login_phone",
                phone
            );

            /* Mask phone */
            const masked =
                phone.substring(0, 2) +
                "******" +
                phone.substring(8);

            if (maskedPhone) {
                maskedPhone.textContent = "+91 " + masked;
            }

            /* Show OTP screen */
            hideElement(phoneStep);
            showElement(otpStep);
            hideElement(successStep);

            clearOtpInputs();

            if (otpInputs.length > 0) {
                otpInputs[0].focus();
            }

            startResendTimer();

        } catch (error) {

            console.error("Firebase OTP Error:", error);

            resetRecaptcha();

            let message =
                "OTP send nahi ho paya. Please try again.";

            if (error && error.code) {

                switch (error.code) {

                    case "auth/invalid-phone-number":
                        message =
                            "Phone number invalid hai.";
                        break;

                    case "auth/too-many-requests":
                        message =
                            "Too many attempts. Please try again later.";
                        break;

                    case "auth/quota-exceeded":
                        message =
                            "Firebase SMS daily quota exceed ho gaya hai.";
                        break;

                    case "auth/operation-not-allowed":
                        message =
                            "Firebase Phone Authentication enabled nahi hai.";
                        break;

                    case "auth/captcha-check-failed":
                        message =
                            "reCAPTCHA verification failed. Please try again.";
                        break;

                    case "auth/unauthorized-domain":
                        message =
                            "Ye website domain Firebase Authorized Domains mein added nahi hai.";
                        break;

                    case "auth/api-key-not-valid":
                        message =
                            "Firebase API key invalid hai. Firebase config check karo.";
                        break;

                    default:
                        message =
                            error.message ||
                            message;
                }
            }

            showError(phoneError, message);

        } finally {

            sendOtpButton.disabled = false;
            sendOtpButton.innerHTML = originalButtonHTML;

        }

    });

}


/* ---------------------------------------------------------
   OTP INPUT
   --------------------------------------------------------- */

function clearOtpInputs() {

    otpInputs.forEach(function (input) {
        input.value = "";
        input.classList.remove("error");
    });

    clearError(otpError);
}


otpInputs.forEach(function (input, index) {

    input.addEventListener("input", function () {

        input.value =
            input.value.replace(/\D/g, "").slice(0, 1);

        input.classList.remove("error");

        if (input.value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }

        updateVerifyButton();
    });


    input.addEventListener("keydown", function (event) {

        if (
            event.key === "Backspace" &&
            !input.value &&
            index > 0
        ) {
            otpInputs[index - 1].focus();
        }

    });


    input.addEventListener("paste", function (event) {

        event.preventDefault();

        const pasted =
            (
                event.clipboardData ||
                window.clipboardData
            )
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, otpInputs.length);

        pasted.split("").forEach(function (digit, i) {

            if (otpInputs[i]) {
                otpInputs[i].value = digit;
            }

        });

        const nextEmpty =
            Array.from(otpInputs).find(function (el) {
                return !el.value;
            });

        if (nextEmpty) {
            nextEmpty.focus();
        } else if (otpInputs.length > 0) {
            otpInputs[otpInputs.length - 1].focus();
        }

        updateVerifyButton();

    });

});


function getOtpCode() {

    return Array.from(otpInputs)
        .map(function (input) {
            return input.value;
        })
        .join("");

}


function updateVerifyButton() {

    if (!verifyOtpButton) {
        return;
    }

    const code = getOtpCode();

    verifyOtpButton.disabled =
        code.length !== otpInputs.length;

}


/* ---------------------------------------------------------
   VERIFY OTP
   --------------------------------------------------------- */

if (otpForm) {

    otpForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        clearError(otpError);

        const code = getOtpCode();

        if (code.length !== 6) {

            showError(
                otpError,
                "Please enter the complete 6-digit OTP."
            );

            return;
        }

        if (!confirmationResult) {

            showError(
                otpError,
                "OTP session expired. Please request a new OTP."
            );

            return;
        }

        verifyOtpButton.disabled = true;

        const originalButtonHTML =
            verifyOtpButton.innerHTML;

        verifyOtpButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';

        try {

            const result =
                await confirmationResult.confirm(code);

            const user = result.user;

            console.log(
                "Phone login successful:",
                user.uid
            );

            /* ---------------------------------------------
               Save login information
               --------------------------------------------- */

            const loginPhone =
                sessionStorage.getItem(
                    "1111_login_phone"
                );

            const userData = {

                uid: user.uid,

                phone:
                    user.phoneNumber ||
                    (loginPhone
                        ? "+91" + loginPhone
                        : ""),

                phoneNumber:
                    user.phoneNumber ||
                    (loginPhone
                        ? "+91" + loginPhone
                        : ""),

                loggedIn: true,

                loginTime:
                    new Date().toISOString()

            };

            localStorage.setItem(
                "1111_user",
                JSON.stringify(userData)
            );

            /* ---------------------------------------------
               Show success
               --------------------------------------------- */

            hideElement(phoneStep);
            hideElement(otpStep);
            showElement(successStep);

            clearInterval(resendInterval);

        } catch (error) {

            console.error(
                "OTP verification error:",
                error
            );

            let message =
                "Invalid OTP. Please check the OTP and try again.";

            if (error && error.code) {

                switch (error.code) {

                    case "auth/invalid-verification-code":
                        message =
                            "OTP galat hai. Please check and enter the correct OTP.";
                        break;

                    case "auth/code-expired":
                        message =
                            "OTP expire ho gaya hai. Please resend OTP.";
                        break;

                    case "auth/session-expired":
                        message =
                            "OTP session expire ho gaya hai. Please resend OTP.";
                        break;

                    case "auth/too-many-requests":
                        message =
                            "Too many attempts. Please try again later.";
                        break;

                    default:
                        message =
                            error.message ||
                            message;
                }

            }

            showError(otpError, message);

            otpInputs.forEach(function (input) {
                input.classList.add("error");
            });

        } finally {

            verifyOtpButton.disabled = false;

            verifyOtpButton.innerHTML =
                originalButtonHTML;

            updateVerifyButton();

        }

    });

}


/* ---------------------------------------------------------
   CHANGE PHONE NUMBER
   --------------------------------------------------------- */

if (changeNumberButton) {

    changeNumberButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            clearInterval(resendInterval);

            confirmationResult = null;

            clearOtpInputs();

            hideElement(otpStep);
            hideElement(successStep);
            showElement(phoneStep);

            resetRecaptcha();

            if (phoneNumberInput) {
                phoneNumberInput.focus();
            }

        }
    );

}


/* ---------------------------------------------------------
   RESEND OTP
   --------------------------------------------------------- */

if (resendOtpButton) {

    resendOtpButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            if (resendOtpButton.disabled) {
                return;
            }

            const phone =
                sessionStorage.getItem(
                    "1111_login_phone"
                );

            if (!phone) {

                showError(
                    otpError,
                    "Please enter your phone number again."
                );

                return;
            }

            resendOtpButton.disabled = true;

            clearError(otpError);

            try {

                resetRecaptcha();

                createRecaptcha();

                const fullPhoneNumber =
                    "+91" + phone;

                confirmationResult =
                    await auth.signInWithPhoneNumber(
                        fullPhoneNumber,
                        recaptchaVerifier
                    );

                console.log(
                    "OTP resent successfully."
                );

                clearOtpInputs();

                if (otpInputs.length > 0) {
                    otpInputs[0].focus();
                }

                startResendTimer();

            } catch (error) {

                console.error(
                    "Resend OTP error:",
                    error
                );

                let message =
                    "OTP resend nahi ho paya.";

                if (error && error.code) {

                    if (
                        error.code ===
                        "auth/too-many-requests"
                    ) {
                        message =
                            "Too many attempts. Please try again later.";
                    }

                    if (
                        error.code ===
                        "auth/quota-exceeded"
                    ) {
                        message =
                            "Firebase SMS daily quota exceed ho gaya hai.";
                    }

                    if (
                        error.code ===
                        "auth/unauthorized-domain"
                    ) {
                        message =
                            "Website domain Firebase Authorized Domains mein added nahi hai.";
                    }

                    if (error.message) {
                        console.error(
                            error.message
                        );
                    }
                }

                showError(
                    otpError,
                    message
                );

                resendOtpButton.disabled = false;

            }

        }
    );

}


/* ---------------------------------------------------------
   RESEND TIMER
   --------------------------------------------------------- */

function startResendTimer() {

    clearInterval(resendInterval);

    let seconds = 30;

    if (resendOtpButton) {
        resendOtpButton.disabled = true;
    }

    updateResendTimer(seconds);

    resendInterval = setInterval(function () {

        seconds--;

        updateResendTimer(seconds);

        if (seconds <= 0) {

            clearInterval(resendInterval);

            if (resendOtpButton) {
                resendOtpButton.disabled = false;
            }

            if (resendTimer) {
                resendTimer.textContent = "";
            }

        }

    }, 1000);

}


function updateResendTimer(seconds) {

    if (!resendTimer) {
        return;
    }

    if (seconds > 0) {

        resendTimer.textContent =
            "Resend OTP in " + seconds + "s";

    } else {

        resendTimer.textContent = "";

    }

}


/* ---------------------------------------------------------
   CONTINUE BUTTON
   --------------------------------------------------------- */

if (continueButton) {

    continueButton.addEventListener(
        "click",
        function () {

            /*
             * Login successful.
             * Change this destination later if you have
             * an account page.
             */

            window.location.href = "index.html";

        }
    );

}


/* ---------------------------------------------------------
   Firebase Auth State
   --------------------------------------------------------- */

auth.onAuthStateChanged(function (user) {

    if (user) {

        console.log(
            "Firebase user is logged in:",
            user.uid
        );

        const existingUser =
            localStorage.getItem("1111_user");

        if (!existingUser) {

            const userData = {

                uid: user.uid,

                phone:
                    user.phoneNumber || "",

                phoneNumber:
                    user.phoneNumber || "",

                loggedIn: true,

                loginTime:
                    new Date().toISOString()

            };

            localStorage.setItem(
                "1111_user",
                JSON.stringify(userData)
            );

        }

    } else {

        console.log(
            "No Firebase user currently logged in."
        );

    }

});


/* ---------------------------------------------------------
   INITIALIZE
   --------------------------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateVerifyButton();

        /*
         * Create reCAPTCHA after page loads.
         * Login page must contain:
         *
         * <div id="recaptcha-container"></div>
         */

        if (
            document.getElementById(
                "recaptcha-container"
            )
        ) {
            createRecaptcha();
        }

    }
);