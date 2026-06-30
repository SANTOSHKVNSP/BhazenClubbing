/* ==========================================================================
   BhaZen Clubbing — vanilla JS (no jQuery / Bootstrap / Swiper / AOS)
   Handles: sticky header, mobile drawer, countdown, counter-up,
            scroll-reveal, FAQ accordion, back-to-top, video lightbox
   ========================================================================== */
(function () {
    "use strict";

    var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
    var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

    /* ---------- Sticky header ---------- */
    var header = $("#siteHeader");
    function onScrollHeader() {
        if (header) header.classList.toggle("scrolled", window.scrollY > 60);
    }

    /* ---------- Mobile drawer ---------- */
    var toggle = $("#navToggle");
    var drawer = $("#mobileDrawer");
    var overlay = $("#drawerOverlay");

    function openDrawer() {
        if (!drawer) return;
        overlay.hidden = false;
        void overlay.offsetWidth; // reflow so the transition runs
        overlay.classList.add("open");
        drawer.classList.add("open");
        drawer.setAttribute("aria-hidden", "false");
        toggle.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
    }
    function closeDrawer() {
        if (!drawer || !drawer.classList.contains("open")) return;
        overlay.classList.remove("open");
        drawer.classList.remove("open");
        drawer.setAttribute("aria-hidden", "true");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        window.setTimeout(function () { overlay.hidden = true; }, 320);
    }

    if (toggle) toggle.addEventListener("click", openDrawer);
    if (overlay) overlay.addEventListener("click", closeDrawer);
    var drawerClose = $("#drawerClose");
    if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
    $$("[data-drawer-link]").forEach(function (a) { a.addEventListener("click", closeDrawer); });

    /* ---------- Countdown ---------- */
    function pad(n) { return n < 10 ? "0" + n : "" + n; }

    function initCountdown() {
        var el = $("#countdown");
        if (!el) return;
        var target = new Date(el.getAttribute("data-target")).getTime();
        var dEl = $("[data-days]", el),
            hEl = $("[data-hours]", el),
            mEl = $("[data-mins]", el),
            sEl = $("[data-secs]", el);

        function tick() {
            var diff = Math.max(0, target - Date.now());
            var s = Math.floor(diff / 1000);
            var days = Math.floor(s / 86400);
            var hrs = Math.floor((s % 86400) / 3600);
            var mins = Math.floor((s % 3600) / 60);
            var secs = s % 60;
            dEl.textContent = pad(days);
            hEl.textContent = pad(hrs);
            mEl.textContent = pad(mins);
            sEl.textContent = pad(secs);
        }
        tick();
        window.setInterval(tick, 1000);
    }

    /* ---------- Counter-up ---------- */
    function animateCounter(el) {
        var end = parseInt(el.getAttribute("data-count"), 10) || 0;
        var suffix = el.getAttribute("data-suffix") || "";
        var dur = 1500, start = null;
        function step(ts) {
            if (start === null) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
            el.textContent = Math.round(end * eased).toLocaleString("en-IN") + suffix;
            if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    /* ---------- Scroll reveal + counter trigger (IntersectionObserver) ---------- */
    function initObservers() {
        var reveals = $$(".reveal");
        var counters = $$(".counter-num");

        if (!("IntersectionObserver" in window)) {
            reveals.forEach(function (n) { n.classList.add("in"); });
            counters.forEach(animateCounter);
            return;
        }

        var revObs = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); }
            });
        }, { threshold: 0.15 });
        reveals.forEach(function (n) { revObs.observe(n); });

        var cntObs = new IntersectionObserver(function (entries, obs) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { animateCounter(e.target); obs.unobserve(e.target); }
            });
        }, { threshold: 0.4 });
        counters.forEach(function (n) { cntObs.observe(n); });
    }

    /* ---------- FAQ accordion (single open at a time) ---------- */
    function initFaq() {
        var items = $$(".faq-item");
        items.forEach(function (item) {
            item.addEventListener("toggle", function () {
                if (item.open) {
                    items.forEach(function (other) {
                        if (other !== item) other.open = false;
                    });
                }
            });
        });
    }

    /* ---------- Back to top ---------- */
    function initToTop() {
        var btn = $("#toTop");
        if (!btn) return;
        var ring = $(".to-top-ring", btn);
        var LEN = 289;
        function update() {
            var st = window.scrollY;
            var h = document.documentElement.scrollHeight - window.innerHeight;
            var p = h > 0 ? st / h : 0;
            if (ring) ring.style.strokeDashoffset = LEN - LEN * p;
            btn.classList.toggle("show", st > 400);
        }
        btn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
        window.addEventListener("scroll", update, { passive: true });
        update();
    }

    /* ---------- Video lightbox ---------- */
    function initVideo() {
        var modal = $("#videoModal");
        var frame = $("#videoFrame");
        var closeBtn = $("#videoClose");
        if (!modal) return;

        function open(url) {
            var sep = url.indexOf("?") > -1 ? "&" : "?";
            frame.innerHTML = '<iframe src="' + url + sep +
                'autoplay=1&rel=0" title="Event video" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
            modal.hidden = false;
            document.body.style.overflow = "hidden";
        }
        function close() {
            modal.hidden = true;
            frame.innerHTML = "";
            document.body.style.overflow = "";
        }

        $$(".play-btn").forEach(function (b) {
            b.addEventListener("click", function () { open(b.getAttribute("data-video")); });
        });
        if (closeBtn) closeBtn.addEventListener("click", close);
        modal.addEventListener("click", function (e) { if (e.target === modal) close(); });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                if (!modal.hidden) close();
                closeDrawer();
            }
        });
    }

    /* ---------- Init ---------- */
    window.addEventListener("scroll", onScrollHeader, { passive: true });
    onScrollHeader();
    initCountdown();
    initObservers();
    initFaq();
    initToTop();
    initVideo();
})();
