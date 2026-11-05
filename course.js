"use strict";

const CART_KEY = "pawsative_cart";

const catalogue = [
    {
        name: "Canine obedience training",
        price: 1500,
        image: "obedience training.jpeg"
    },
    {
        name: "Pet grooming",
        price: 1500,
        image: "Grooming.jpeg"
    },
    {
        name: "Animal behavior",
        price: 1500,
        image: "Dogs.jpeg"
    },
    {
        name: "Pet business management",
        price: 1500,
        image: "store management.jpeg"
    },
    {
        name: "Puppy care",
        price: 750,
        image: "puppy care.jpeg"
    },
    {
        name: "Pet first aid",
        price: 750,
        image: "first aid.jpeg"
    },
    {
        name: "Basic dog walking",
        price: 750,
        image: "dog walking.jpeg"
    }
];

const currency = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR"
});

let selectedCourses = [];
let cartReadable = false;

function showCourseError(message) {
    const element = document.getElementById("course-message");

    if (element) {
        element.textContent = message;
    } else {
        window.alert(message);
    }
}

function showFeesError(message) {
    const element = document.getElementById("fees-message");

    if (element) {
        element.textContent = message;
    }
}

function clearConfirmation() {
    const element = document.getElementById("confirmation-message");

    if (element) {
        element.textContent = "";
    }
}

function readCart() {
    const saved = localStorage.getItem(CART_KEY);
    const parsed = saved === null ? [] : JSON.parse(saved);

    if (!Array.isArray(parsed)) {
        throw new Error("invalid-cart");
    }

    const courses = [];

    parsed.forEach(function (item) {
        if (!item || typeof item.name !== "string") {
            throw new Error("invalid-cart");
        }

        const course = catalogue.find(function (entry) {
            return entry.name.toLowerCase() ===
                item.name.trim().toLowerCase();
        });

        if (!course) {
            throw new Error("invalid-cart");
        }

        if (!courses.some(entry => entry.name === course.name)) {
            courses.push(course);
        }
    });

    return courses;
}

function saveCart(courses) {
    const records = courses.map(function (course) {
        return {
            name: course.name,
            price: course.price
        };
    });

    localStorage.setItem(CART_KEY, JSON.stringify(records));
}

function getDiscountRate(quantity) {
    if (quantity >= 4) return 15;
    if (quantity === 3) return 10;
    if (quantity === 2) return 5;
    return 0;
}

function calculateFees(courses) {
    const subtotal = courses.reduce(function (sum, course) {
        return sum + course.price;
    }, 0);

    const discountRate = getDiscountRate(courses.length);
    const savings = Math.round(subtotal * discountRate) / 100;

    return {
        quantity: courses.length,
        subtotal: subtotal,
        discountRate: discountRate,
        savings: savings,
        total: subtotal - savings
    };
}

function applyForCourse(event, name, price) {
    if (event) {
        event.preventDefault();
    }

    const course = catalogue.find(function (entry) {
        return entry.name === name && entry.price === Number(price);
    });

    if (!course) {
        showCourseError("Invalid course selection.");
        return;
    }

    try {
        const courses = readCart();

        if (!courses.some(item => item.name === course.name)) {
            courses.push(course);
        }

        saveCart(courses);
        window.location.href = "fees.html";
    } catch {
        showCourseError(
            "Your selection could not be saved. Allow browser storage " +
            "and try again. If the saved list is damaged, use " +
            "CLEAR SELECTION on the account page to reset it."
        );
    }
}

function removeCourse(name) {
    const updated = selectedCourses.filter(function (course) {
        return course.name !== name;
    });

    try {
        saveCart(updated);
        selectedCourses = updated;
        showFeesError("");
        clearConfirmation();
        renderCart();
    } catch {
        showFeesError(
            "The selection could not be saved. Allow site storage and try again."
        );
    }
}

function createCourseCard(course) {
    const card = document.createElement("article");
    card.className = "fees-course-card";

    const image = document.createElement("img");
    image.src = course.image;
    image.alt = course.name;

    const details = document.createElement("div");
    details.className = "fees-course-details";

    const heading = document.createElement("h3");
    heading.textContent = course.name;

    const price = document.createElement("p");
    price.textContent = currency.format(course.price);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "gold-link-btn";
    button.textContent = "UNSELECT";
    button.setAttribute("aria-label", "Unselect " + course.name);

    button.addEventListener("click", function () {
        removeCourse(course.name);
    });

    details.append(heading, price, button);
    card.append(image, details);

    return card;
}

function renderCart() {
    const container = document.getElementById("cart-items");

    if (!container) return;

    container.replaceChildren();

    selectedCourses.forEach(function (course) {
        container.appendChild(createCourseCard(course));
    });

    const fees = calculateFees(selectedCourses);

    document.getElementById("empty-cart").hidden =
        !cartReadable || fees.quantity > 0;

    document.getElementById("course-count").textContent =
        cartReadable ? fees.quantity : "Unavailable";

    document.getElementById("subtotal").textContent =
        cartReadable ? currency.format(fees.subtotal) : "Unavailable";

    document.getElementById("discount-rate").textContent =
        cartReadable ? fees.discountRate + "%" : "Unavailable";

    document.getElementById("savings").textContent =
        cartReadable ? currency.format(fees.savings) : "Unavailable";

    document.getElementById("total").textContent =
        cartReadable ? currency.format(fees.total) : "Unavailable";

    document.getElementById("confirm-selection").disabled =
        !cartReadable || fees.quantity === 0;

    document.getElementById("clear-cart").disabled =
        cartReadable && fees.quantity === 0;
}

function loadCart() {
    try {
        selectedCourses = readCart();
        cartReadable = true;
        showFeesError("");
    } catch {
        selectedCourses = [];
        cartReadable = false;

        showFeesError(
            "Your saved courses could not be loaded. Allow site " +
            "storage and reload, or use CLEAR SELECTION to remove " +
            "the saved list and start again."
        );
    }

    clearConfirmation();
    renderCart();
}

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-course][data-price]").forEach(
        function (button) {
            button.addEventListener("click", function (event) {
                applyForCourse(
                    event,
                    button.dataset.course,
                    Number(button.dataset.price)
                );
            });
        }
    );

    if (!document.getElementById("cart-items")) return;

    document.getElementById("clear-cart").addEventListener(
        "click",
        function () {
            if (!window.confirm("Remove all saved course selections?")) {
                return;
            }

            try {
                localStorage.removeItem(CART_KEY);
                selectedCourses = [];
                cartReadable = true;
                showFeesError("");
                clearConfirmation();
                renderCart();
            } catch {
                showFeesError(
                    "The list could not be cleared. Check browser storage settings."
                );
            }
        }
    );

    document.getElementById("confirm-selection").addEventListener(
        "click",
        function () {
            if (!cartReadable || selectedCourses.length === 0) {
                showFeesError("Please select a course first.");
                return;
            }

            const fees = calculateFees(selectedCourses);

            document.getElementById("confirmation-message").textContent =
                "Selected: " + fees.quantity + " course(s). Total: " +
                currency.format(fees.total) + ". Contact the academy " +
                "to arrange enrolment and payment. No payment has been processed.";
        }
    );

    loadCart();
});

window.addEventListener("storage", function (event) {
    if (
        document.getElementById("cart-items") &&
        (event.key === CART_KEY || event.key === null)
    ) {
        loadCart();
    }
});