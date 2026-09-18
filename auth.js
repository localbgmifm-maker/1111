/* =========================================================
   11:11 PIZZA CAFE
   FIREBASE PHONE OTP LOGIN
   ========================================================= */

/* =========================
   FIREBASE CONFIG
========================= */

const firebaseConfig = {
    apiKey: "AIzaSyDVxaKGhY3q8TVFaxqMrMtAf5vDobVYIKA",
    authDomain: "pizza-cafe-50a89.firebaseapp.com",
    projectId: "pizza-cafe-50a89",
    storageBucket: "pizza-cafe-50a89.firebasestorage.app",
    messagingSenderId: "105063731490",
    appId: "1:105063731490:web:c25ce3f2e507c1ca84157b",
    measurementId: "G-ZSZ0CGLGME"
};


/* =========================
   FIREBASE INITIALIZE
========================= */

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();


/* =========================
   VARIABLES
========================= */

let confirmationResult = null;
let recaptchaVerifier = null;
let recaptchaWidgetId = null;
let resendInterval = null;


/* =========================
   DOM ELEMENTS
========================= */

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

const changeNumberButton =
    document.getElementById("changeNumberButton");

const resendOtpButton =
    document.getElementById("resendOtpButton");

const resendTimer =
    document.getElementById("resendTimer");

const continueButton =
    document.getElementById("continueButton");


/* =========================
   PERSISTENCE
========================= */

auth.setPersistence(
    firebase.auth.Auth.Persistence.LOCAL
).catch(function (error) {

    console.error(
        "Firebase persistence error:",
        error
    );

});


/* =========================
   HELPERS
========================= */

function showElement(element) {

    if (element) {
        element.classList.remove("hidden");
        element.style.display = "";
    }

}


function hideElement(element) {

    if (element) {
        element.classList.add("hidden");
        element.style.display = "none";
    }

}


function clearError(element) {

    if (!element) {
        return;
    }

    element.textContent = "";
    element.style.display = "none";

}


function showError(element, message) {

    if (!element) {
        return;
    }

    element.textContent = message;
    element.style.display = "block";

}


function cleanPhoneNumber(value) {

    return String(value || "")
        .replace(/\D/g, "")
        .slice(0, 10);

}


function isValidIndianMobile(phone) {

    return /^[6-9]\d{9}$/.test(phone);

}


/* =========================
   RESET RECAPTCHA
========================= */

function resetRecaptcha() {

    try {

        if (
            typeof grecaptcha !== "undefined" &&
            recaptchaWidgetId !== null
        ) {

            grecaptcha.reset(
                recaptchaWidgetId
            );

        }

    } catch (error) {

        console.warn(
            "reCAPTCHA reset:",
            error
        );

    }

}


/* =========================
   CREATE RECAPTCHA
========================= */

function createRecaptcha() {

    if (recaptchaVerifier) {
        return Promise.resolve();
    }

    const container =
        document.getElementById(
            "recaptcha-container"
        );

    if (!container) {

        return Promise.reject(
            new Error(
                "reCAPTCHA container missing."
            )
        );

    }

    recaptchaVerifier =
        new firebase.auth.RecaptchaVerifier(
            "recaptcha-container",
            {
                size: "invisible",

                callback: function () {

                    console.log(
                        "reCAPTCHA completed."
                    );

                },

                "expired-callback": function () {

                    console.log(
                        "reCAPTCHA expired."
                    );

                }
            }
        );

    return recaptchaVerifier
        .render()
        .then(function (widgetId) {

            recaptchaWidgetId =
                widgetId;

            console.log(
                "reCAPTCHA ready."
            );

        });

}


/* =========================
   OTP ERROR MESSAGE
========================= */

function getFirebaseErrorMessage(error) {

    if (!error) {
        return "OTP send nahi ho paya.";
    }


    switch (error.code) {

        case "auth/invalid-phone-number":

            return "Mobile number invalid hai.";


        case "auth/operation-not-allowed":

            return "Firebase Phone Authentication enabled nahi hai.";


        case "auth/billing-not-enabled":

            return "Real SMS OTP ke liye Firebase billing required hai. Test phone number use karo.";


        case "auth/quota-exceeded":

            return "Firebase SMS quota exceed ho gaya hai.";


        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";


        case "auth/unauthorized-domain":

            return "Website domain Firebase Authorized Domains mein added nahi hai.";


        case "auth/captcha-check-failed":

            return "reCAPTCHA verification failed. Please try again.";


        case "auth/network-request-failed":

            return "Internet connection check karo aur dobara try karo.";


        case "auth/api-key-not-valid":

            return "Firebase API key invalid hai.";


        default:

            return error.message ||
                "OTP send nahi ho paya.";

    }

}


/* =========================
   SEND OTP
========================= */

if (phoneForm) {

    phoneForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearError(phoneError);

            const phone =
                cleanPhoneNumber(
                    phoneNumberInput.value
                );

            phoneNumberInput.value =
                phone;


            if (
                !isValidIndianMobile(phone)
            ) {

                showError(
                    phoneError,
                    "Please enter a valid 10-digit Indian mobile number."
                );

                phoneNumberInput.focus();

                return;

            }


            sendOtpButton.disabled = true;

            const oldButton =
                sendOtpButton.innerHTML;

            sendOtpButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Sending OTP...';


            try {

                await createRecaptcha();

                resetRecaptcha();


                const fullPhone =
                    "+91" + phone;


                console.log(
                    "Firebase OTP request:",
                    fullPhone
                );


                confirmationResult =
                    await auth.signInWithPhoneNumber(
                        fullPhone,
                        recaptchaVerifier
                    );


                console.log(
                    "OTP request successful."
                );


                sessionStorage.setItem(
                    "1111_login_phone",
                    phone
                );


                const masked =
                    phone.substring(0, 2) +
                    "******" +
                    phone.substring(8);


                if (maskedPhone) {

                    maskedPhone.textContent =
                        "+91 " + masked;

                }


                hideElement(phoneStep);
                showElement(otpStep);
                hideElement(successStep);


                clearOtpInputs();


                if (otpInputs.length) {

                    otpInputs[0].focus();

                }


                startResendTimer();

            }

            catch (error) {

                console.error(
                    "Firebase OTP Error:",
                    error
                );


                resetRecaptcha();


                showError(
                    phoneError,
                    getFirebaseErrorMessage(
                        error
                    )
                );

            }

            finally {

                sendOtpButton.disabled =
                    false;

                sendOtpButton.innerHTML =
                    oldButton;

            }

        }
    );

}


/* =========================
   OTP INPUTS
========================= */

function clearOtpInputs() {

    otpInputs.forEach(
        function (input) {

            input.value = "";

            input.classList.remove(
                "error"
            );

        }
    );

    clearError(otpError);

}


function getOtpCode() {

    return Array.from(
        otpInputs
    )
        .map(
            function (input) {
                return input.value;
            }
        )
        .join("");

}


function updateVerifyButton() {

    if (!verifyOtpButton) {
        return;
    }

    verifyOtpButton.disabled =
        getOtpCode().length !== 6;

}


otpInputs.forEach(
    function (input, index) {


        input.addEventListener(
            "input",
            function () {

                input.value =
                    input.value
                        .replace(/\D/g, "")
                        .slice(0, 1);


                input.classList.remove(
                    "error"
                );


                if (
                    input.value &&
                    index <
                    otpInputs.length - 1
                ) {

                    otpInputs[
                        index + 1
                    ].focus();

                }


                updateVerifyButton();

            }
        );


        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Backspace" &&
                    !input.value &&
                    index > 0
                ) {

                    otpInputs[
                        index - 1
                    ].focus();

                }

            }
        );


        input.addEventListener(
            "paste",
            function (event) {

                event.preventDefault();


                const pasted =
                    (
                        event.clipboardData ||
                        window.clipboardData
                    )
                        .getData("text")
                        .replace(/\D/g, "")
                        .slice(
                            0,
                            otpInputs.length
                        );


                pasted
                    .split("")
                    .forEach(
                        function (
                            digit,
                            i
                        ) {

                            if (
                                otpInputs[i]
                            ) {

                                otpInputs[i]
                                    .value =
                                    digit;

                            }

                        }
                    );


                const nextEmpty =
                    Array.from(
                        otpInputs
                    ).find(
                        function (input) {
                            return !input.value;
                        }
                    );


                if (nextEmpty) {

                    nextEmpty.focus();

                }


                updateVerifyButton();

            }
        );

    }
);


/* =========================
   VERIFY OTP
========================= */

if (otpForm) {

    otpForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearError(otpError);

            const code =
                getOtpCode();


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


            verifyOtpButton.disabled =
                true;


            const oldButton =
                verifyOtpButton.innerHTML;


            verifyOtpButton.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';


            try {

                const result =
                    await confirmationResult
                        .confirm(code);


                const user =
                    result.user;


                console.log(
                    "Login successful:",
                    user.uid
                );


                const phone =
                    user.phoneNumber ||
                    (
                        "+91" +
                        (
                            sessionStorage.getItem(
                                "1111_login_phone"
                            ) || ""
                        )
                    );


                const userData = {

                    uid: user.uid,

                    phone: phone,

                    phoneNumber: phone,

                    loggedIn: true,

                    loginTime:
                        new Date()
                            .toISOString()

                };


                localStorage.setItem(
                    "1111_user",
                    JSON.stringify(
                        userData
                    )
                );


                hideElement(phoneStep);
                hideElement(otpStep);
                showElement(successStep);


                clearInterval(
                    resendInterval
                );

            }

            catch (error) {

                console.error(
                    "OTP verification error:",
                    error
                );


                let message =
                    "Invalid OTP. Please check the OTP.";


                switch (
                    error.code
                ) {

                    case "auth/invalid-verification-code":

                        message =
                            "OTP galat hai. Please check the code.";

                        break;


                    case "auth/code-expired":

                        message =
                            "OTP expire ho gaya hai. Resend OTP karo.";

                        break;


                    case "auth/session-expired":

                        message =
                            "OTP session expire ho gaya hai. Resend OTP karo.";

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


                showError(
                    otpError,
                    message
                );


                otpInputs.forEach(
                    function (input) {

                        input.classList.add(
                            "error"
                        );

                    }
                );

            }

            finally {

                verifyOtpButton.innerHTML =
                    oldButton;

                updateVerifyButton();

            }

        }
    );

}


/* =========================
   CHANGE NUMBER
========================= */

if (changeNumberButton) {

    changeNumberButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            clearInterval(
                resendInterval
            );

            confirmationResult =
                null;


            clearOtpInputs();


            hideElement(otpStep);
            hideElement(successStep);
            showElement(phoneStep);


            if (phoneNumberInput) {

                phoneNumberInput.focus();

            }

        }
    );

}


/* =========================
   RESEND OTP
========================= */

if (resendOtpButton) {

    resendOtpButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();


            if (
                resendOtpButton.disabled
            ) {
                return;
            }


            const phone =
                sessionStorage.getItem(
                    "1111_login_phone"
                );


            if (!phone) {

                showError(
                    otpError,
                    "Phone number missing. Please enter it again."
                );

                return;

            }


            resendOtpButton.disabled =
                true;


            clearError(otpError);


            try {

                resetRecaptcha();


                const fullPhone =
                    "+91" + phone;


                confirmationResult =
                    await auth.signInWithPhoneNumber(
                        fullPhone,
                        recaptchaVerifier
                    );


                clearOtpInputs();


                if (otpInputs.length) {

                    otpInputs[0].focus();

                }


                startResendTimer();

            }

            catch (error) {

                console.error(
                    "Resend OTP error:",
                    error
                );


                showError(
                    otpError,
                    getFirebaseErrorMessage(
                        error
                    )
                );


                resendOtpButton.disabled =
                    false;

            }

        }
    );

}


/* =========================
   RESEND TIMER
========================= */

function startResendTimer() {

    clearInterval(
        resendInterval
    );


    let seconds = 30;


    if (resendOtpButton) {

        resendOtpButton.disabled =
            true;

    }


    updateResendTimer(
        seconds
    );


    resendInterval =
        setInterval(
            function () {

                seconds--;

                updateResendTimer(
                    seconds
                );


                if (seconds <= 0) {

                    clearInterval(
                        resendInterval
                    );


                    if (
                        resendOtpButton
                    ) {

                        resendOtpButton.disabled =
                            false;

                    }

                }

            },
            1000
        );

}


function updateResendTimer(
    seconds
) {

    if (!resendTimer) {
        return;
    }


    if (seconds > 0) {

        resendTimer.textContent =
            "Resend OTP in " +
            seconds +
            "s";

    }

    else {

        resendTimer.textContent =
            "";

    }

}


/* =========================
   CONTINUE
========================= */

if (continueButton) {

    continueButton.addEventListener(
        "click",
        function () {

            /*
             * If user came from checkout,
             * return there.
             */

            const returnPage =
                sessionStorage.getItem(
                    "1111_login_return"
                );


            if (returnPage) {

                sessionStorage.removeItem(
                    "1111_login_return"
                );

                window.location.href =
                    returnPage;

            }

            else {

                window.location.href =
                    "index.html";

            }

        }
    );

}


/* =========================
   AUTH STATE
========================= */

auth.onAuthStateChanged(
    function (user) {

        if (user) {

            console.log(
                "Firebase authenticated:",
                user.uid
            );

        }

        else {

            console.log(
                "No Firebase authenticated user."
            );

        }

    }
);


/* =========================
   PAGE INITIALIZE
========================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        updateVerifyButton();


        const recaptchaContainer =
            document.getElementById(
                "recaptcha-container"
            );


        if (recaptchaContainer) {

            try {

                await createRecaptcha();

            }

            catch (error) {

                console.error(
                    "reCAPTCHA setup error:",
                    error
                );

            }

        }

    }
);
