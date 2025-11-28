document.addEventListener("DOMContentLoaded", function () {
    initFloatingPhotos();
    initScrollReveal();
    initHoverGlow();
    initSpotifyEmbed();        // Skills page – Spotify embed API/JSON
    initTimeGreeting();        // Home page – computer time based greeting
    initAboutImageCycle();     // About page – rotating rectangle self images
    initContactMessageForm();  // Contact page – message form to contact
});

// Floating photos, Slight up–down motion on circles

const floatingPhotos = [];

function initFloatingPhotos() {
    const nodes = document.querySelectorAll(".profile-photo-home, .about-photo");

    for (const el of nodes) {
        floatingPhotos.push({
            el: el,
            angle: Math.random() * Math.PI * 2,
            speed: 0.015 + Math.random() * 0.01,
            amplitude: 6 + Math.random() * 4
        });
        el.style.willChange = "transform";
    }

    if (floatingPhotos.length > 0) {
        requestAnimationFrame(stepFloatingPhotos);
    }
}

function stepFloatingPhotos() {
    for (const p of floatingPhotos) {
        p.angle += p.speed;
        const offset = Math.sin(p.angle) * p.amplitude;
        p.el.style.transform = "translateY(" + offset + "px)";
    }
    requestAnimationFrame(stepFloatingPhotos);
}

// Scroll reveal for sections, Fades cards in when scrolls

const revealItems = [];

function initScrollReveal() {
    const cards = document.querySelectorAll(".about-section, .portfolio-item");

    for (const el of cards) {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";

        revealItems.push({
            el: el,
            shown: false
        });
    }

    revealOnScroll();
    window.addEventListener("scroll", revealOnScroll);
}

function revealOnScroll() {
    const windowHeight = window.innerHeight;

    for (const item of revealItems) {
        if (item.shown) continue;

        const rect = item.el.getBoundingClientRect();
        if (rect.top < windowHeight - 80) {
            item.el.style.opacity = "1";
            item.el.style.transform = "translateY(0)";
            item.shown = true;
        }
    }
}

// Hover glow on clickable things, shared effect for main stuffs

function initHoverGlow() {
    const clickable = document.querySelectorAll(".cv-button, .social-icon");

    for (const el of clickable) {
        // ensure transform works on inline elements
        if (getComputedStyle(el).display === "inline") {
            el.style.display = "inline-block";
        }

        el.style.transition = "transform 0.2s ease-out, box-shadow 0.2s ease-out";

        el.addEventListener("mouseenter", function () {
            el.style.transform = "scale(1.05)";
            el.style.boxShadow = "0 0 12px rgba(255, 255, 255, 0.8)";
        });

        el.addEventListener("mouseleave", function () {
            el.style.transform = "scale(1)";
            el.style.boxShadow = "none";
        });
    }
}

// Spotify play embed on Skills page, this uses Spotify oEmbed API

function initSpotifyEmbed() {
    const container = document.getElementById("spotify-embed");
    if (!container) return; // only run on Skills page

    const spotifyUrl = "https://open.spotify.com/artist/2olKds5VGArAK0KFPduS88";
    const apiUrl = "https://open.spotify.com/oembed?url=" +
                   encodeURIComponent(spotifyUrl);

    fetch(apiUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // data.html contains an <iframe> player from Spotify
            container.innerHTML = data.html;
        })
        .catch(function (error) {
            console.log("Spotify embed error:", error);
            container.textContent =
                "Spotify preview is not available at the moment.";
        });
}

// Time-based greeting on home, this will uses Date + conditions + DOM

function initTimeGreeting() {
    const el = document.getElementById("time-greeting");
    if (!el) return; // only run on homepage

    const hour = new Date().getHours();
    let message;

    if (hour < 12) {
        message = "Good morning!";
    } else if (hour < 18) {
        message = "Good afternoon!";
    } else {
        message = "Good evening!";
    }

    el.textContent = message;
}

// on tha About fist with a pagerectangle image cycle, this will uses array of data + timed switch

function initAboutImageCycle() {
    const imgEl = document.getElementById("aboutCycleImage");
    if (!imgEl) return; // only run on tha About page

    const aboutImages = [
        { src: "images/ChineseDrum2.jpg",   alt: "Kevin playing Chinese drum" },
        { src: "images/MMTGraudation.jpg",  alt: "MMT graduation" },
        { src: "images/SocialEvents.JPG",   alt: "Social events and student life" }
    ];

    let index = 0;

    // initial image
    imgEl.src = aboutImages[0].src;
    imgEl.alt = aboutImages[0].alt;

    // will changes the image every 5 seconds
    setInterval(function () {
        index = (index + 1) % aboutImages.length;

        imgEl.style.opacity = 0;   // fade out

        setTimeout(function () {
            imgEl.src = aboutImages[index].src;
            imgEl.alt = aboutImages[index].alt;
            imgEl.style.opacity = 1; // fade in
        }, 400);
    }, 5000);
}

// Contact page to send message form, use DOM + events + validation
function initContactMessageForm() {
    const form = document.getElementById("contact-message-form");
    if (!form) return; // only run on Contact page

    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const textarea = document.getElementById("contactMessage");
        const message = textarea.value.trim();

        if (message === "") {
            alert("Please enter a message first.");
            return;
        }

        console.log("Contact message:", message);
        alert("Message sent successfully.");
        textarea.value = "";
    });
}
