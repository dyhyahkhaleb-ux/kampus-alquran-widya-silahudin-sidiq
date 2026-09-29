/* =========================================================
   KAMPUS AL-QUR'AN WIDYA SILAHUDIN SHIDIQ
   WEBSITE UTAMA
========================================================= */


/* =========================================================
   INFORMASI WEBSITE
========================================================= */

const WEBSITE_INFO = {
    whatsapp: "6282162666244",
    phoneDisplay: "0821-6266-6244",
    address:
        "Gg. Mamad Effendi, Nanggewer, Kecamatan Cibinong, Kabupaten Bogor, Jawa Barat 16912"
};


/* =========================================================
   DATA
========================================================= */

let PRODUCTS = [];
let KEGIATAN = [];

let activeCategory = "semua";
let searchKeyword = "";
let checkoutProcessing = false;

/* =========================================================
   PAYMENT STATE
========================================================= */

let currentPaymentOrder = null;

let selectedPaymentFile = null;

let paymentUploading = false;

let cart = JSON.parse(
    localStorage.getItem("kampusWidyaCart") || "[]"
);


/* =========================================================
   HELPER
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatRupiah(number) {

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(number) || 0);

}


function formatTanggal(date) {

    if (!date) {
        return "";
    }

    try {

        const tanggal =
            new Date(date + "T00:00:00");

        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(tanggal);

    } catch {

        return date;

    }

}


function isVideoFile(url = "") {

    const cleanURL =
        String(url)
            .split("?")[0]
            .toLowerCase();

    return (
        cleanURL.endsWith(".mp4") ||
        cleanURL.endsWith(".webm") ||
        cleanURL.endsWith(".mov") ||
        cleanURL.endsWith(".m4v")
    );

}


/* =========================================================
   STYLE TAMBAHAN
========================================================= */

function addFeatureStyles() {

    if (
        document.getElementById(
            "kampusFeatureStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "kampusFeatureStyles";

    style.textContent = `

        .shop-tools {
            width: 100%;
            margin: 28px 0 20px;
        }

        .product-search-box {
            position: relative;
            width: 100%;
            max-width: 620px;
        }

        .product-search-box input {
            width: 100%;
            height: 54px;
            padding: 0 52px 0 20px;
            border: 1px solid rgba(25,65,52,.18);
            border-radius: 14px;
            background: #fff;
            color: #183b31;
            font-family: inherit;
            font-size: 15px;
            outline: none;
            box-sizing: border-box;
        }

        .product-search-box input:focus {
            border-color: #b9974d;
            box-shadow: 0 0 0 4px rgba(185,151,77,.12);
        }

        .product-search-icon {
            position: absolute;
            right: 18px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
        }

        .product-result-info {
            margin-top: 12px;
            color: #74817c;
            font-size: 13px;
            min-height: 20px;
        }

        .product-actions {
            display: flex;
            gap: 8px;
            width: 100%;
            margin-top: 12px;
        }

        .product-detail-button {
            flex: 1;
            border: 1px solid rgba(27,72,58,.20);
            background: transparent;
            color: #1b483a;
            border-radius: 10px;
            padding: 11px 12px;
            font-family: inherit;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
        }

        .product-detail-button:hover {
            background: #1b483a;
            color: #fff;
        }

        .product-actions .add-cart {
            flex: 1;
        }

        .product-content > p {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 3;
            line-clamp: 3;
            overflow: hidden;
        }


        /* =================================================
           DETAIL PRODUK
        ================================================= */

        .product-detail-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(8,25,20,.75);
            backdrop-filter: blur(7px);
            -webkit-backdrop-filter: blur(7px);
            opacity: 0;
            visibility: hidden;
            transition: .25s ease;
        }

        .product-detail-overlay.open {
            opacity: 1;
            visibility: visible;
        }

        .product-detail-modal {
            position: relative;
            width: min(940px,100%);
            max-height: calc(100vh - 48px);
            overflow-y: auto;
            background: #fff;
            border-radius: 24px;
            box-shadow: 0 30px 100px rgba(0,0,0,.28);
        }

        .product-detail-close {
            position: absolute;
            z-index: 10;
            right: 16px;
            top: 16px;
            width: 42px;
            height: 42px;
            border: 0;
            border-radius: 50%;
            background: #fff;
            color: #173f33;
            font-size: 25px;
            cursor: pointer;
            box-shadow: 0 5px 20px rgba(0,0,0,.12);
        }

        .product-detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            min-height: 520px;
        }

        .product-detail-media {
            min-height: 520px;
            background: #f2f2ed;
            overflow: hidden;
            border-radius: 24px 0 0 24px;
        }

        .product-detail-media img {
            width: 100%;
            height: 100%;
            min-height: 520px;
            object-fit: cover;
            display: block;
        }

        .product-detail-placeholder {
            min-height: 520px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            font-size: 55px;
        }

        .product-detail-content {
            padding: 56px 46px 42px;
            display: flex;
            flex-direction: column;
        }

        .product-detail-category {
            width: fit-content;
            padding: 7px 11px;
            border-radius: 999px;
            background: rgba(185,151,77,.12);
            color: #8b6c2e;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .product-detail-content h2 {
            margin: 15px 0 12px;
            color: #153e32;
            font-size: 36px;
        }

        .product-detail-price {
            color: #b18a38;
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 18px;
        }

        .product-detail-description {
            color: #65716d;
            line-height: 1.8;
            white-space: pre-line;
        }

        .product-detail-cart {
            width: 100%;
            margin-top: auto;
            border: none;
            border-radius: 12px;
            background: #b9974d;
            color: #fff;
            padding: 15px 20px;
            font-weight: 800;
            cursor: pointer;
        }

        .product-detail-cart:disabled {
            opacity: .45;
            cursor: not-allowed;
        }


        /* =================================================
           KEGIATAN
        ================================================= */

        .gallery-card {
            cursor: pointer;
        }

        .gallery-detail-hint {
            display: inline-block;
            margin-top: 12px;
            color: #a78036;
            font-size: 12px;
            font-weight: 800;
        }

        .activity-detail-overlay {
            position: fixed;
            inset: 0;
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: rgba(8,25,20,.75);
            backdrop-filter: blur(7px);
            -webkit-backdrop-filter: blur(7px);
            opacity: 0;
            visibility: hidden;
            transition: .25s ease;
        }

        .activity-detail-overlay.open {
            opacity: 1;
            visibility: visible;
        }

        .activity-detail-modal {
            position: relative;
            width: min(1000px,100%);
            max-height: calc(100vh - 48px);
            overflow-y: auto;
            background: #fff;
            border-radius: 24px;
            box-shadow: 0 30px 100px rgba(0,0,0,.28);
        }

        .activity-detail-close {
            position: absolute;
            z-index: 10;
            right: 16px;
            top: 16px;
            width: 42px;
            height: 42px;
            border: 0;
            border-radius: 50%;
            background: #fff;
            color: #173f33;
            font-size: 25px;
            cursor: pointer;
            box-shadow: 0 5px 20px rgba(0,0,0,.12);
        }

        .activity-detail-media {
            min-height: 420px;
            max-height: 600px;
            overflow: hidden;
            background: #e9ede9;
            border-radius: 24px 24px 0 0;
        }

        .activity-detail-media img {
            width: 100%;
            height: 100%;
            min-height: 420px;
            max-height: 600px;
            object-fit: cover;
        }

        .activity-detail-media video {
            width: 100%;
            min-height: 420px;
            max-height: 600px;
            background: #07130f;
        }

        .activity-detail-placeholder {
            min-height: 420px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            font-size: 50px;
        }

        .activity-detail-body {
            padding: 38px 44px 44px;
        }

        .activity-detail-label {
            display: inline-flex;
            padding: 7px 11px;
            border-radius: 999px;
            background: rgba(185,151,77,.13);
            color: #92702f;
            font-size: 11px;
            font-weight: 800;
        }

        .activity-detail-body h2 {
            margin: 14px 0 0;
            color: #153e32;
            font-size: 38px;
        }

        .activity-detail-date {
            margin-top: 13px;
            color: #a17b34;
            font-size: 13px;
            font-weight: 700;
        }

        .activity-detail-description {
            color: #606d68;
            line-height: 1.9;
            white-space: pre-line;
        }


        /* =================================================
           CHECKOUT
        ================================================= */

        #checkoutForm button[type="submit"]:disabled {
            opacity: .65;
            cursor: wait;
        }


        /* =================================================
           RESPONSIVE
        ================================================= */

        @media(max-width:760px) {

            .product-detail-overlay,
            .activity-detail-overlay {
                padding: 10px;
                align-items: flex-end;
            }

            .product-detail-grid {
                grid-template-columns: 1fr;
            }

            .product-detail-media,
            .product-detail-media img {
                min-height: 280px;
                height: 280px;
            }

            .product-detail-content {
                padding: 28px 22px;
            }

            .activity-detail-media,
            .activity-detail-media img,
            .activity-detail-media video {
                min-height: 260px;
                max-height: 340px;
            }

            .activity-detail-body {
                padding: 27px 22px 30px;
            }

        }

        @media(max-width:480px) {

            .product-actions {
                flex-direction: column;
            }

            .product-actions button {
                width: 100%;
            }

        }

    `;

    document.head.appendChild(style);

}


/* =========================================================
   SEARCH PRODUK
========================================================= */

function createProductSearch() {

    const filters =
        document.getElementById(
            "productFilters"
        );

    if (!filters) {
        return;
    }

    if (
        document.getElementById(
            "productSearch"
        )
    ) {
        return;
    }

    const wrapper =
        document.createElement("div");

    wrapper.className =
        "shop-tools";

    wrapper.innerHTML = `

        <div class="product-search-box">

            <input
                type="search"
                id="productSearch"
                placeholder="Cari produk..."
                autocomplete="off"
            >

            <span class="product-search-icon">
                🔎
            </span>

        </div>

        <div
            id="productResultInfo"
            class="product-result-info"
        ></div>

    `;

    filters.parentNode.insertBefore(
        wrapper,
        filters
    );

    document
        .getElementById(
            "productSearch"
        )
        ?.addEventListener(
            "input",
            event => {

                searchKeyword =
                    event.target.value
                        .trim()
                        .toLowerCase();

                renderProducts();

            }
        );

}


/* =========================================================
   MODAL DETAIL PRODUK
========================================================= */

function createProductDetailModal() {

    if (
        document.getElementById(
            "productDetailOverlay"
        )
    ) {
        return;
    }

    const modal =
        document.createElement("div");

    modal.id =
        "productDetailOverlay";

    modal.className =
        "product-detail-overlay";

    modal.innerHTML = `

        <div class="product-detail-modal">

            <button
                type="button"
                id="productDetailClose"
                class="product-detail-close"
            >
                ×
            </button>

            <div id="productDetailContent"></div>

        </div>

    `;

    document.body.appendChild(modal);

    document
        .getElementById(
            "productDetailClose"
        )
        ?.addEventListener(
            "click",
            closeProductDetail
        );

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                closeProductDetail();
            }

        }
    );

}


function getProduct(id) {

    return PRODUCTS.find(
        product =>
            Number(product.id) ===
            Number(id)
    );

}


function openProductDetail(id) {

    const product =
        getProduct(id);

    if (!product) {
        return;
    }

    const overlay =
        document.getElementById(
            "productDetailOverlay"
        );

    const content =
        document.getElementById(
            "productDetailContent"
        );

    if (
        !overlay ||
        !content
    ) {
        return;
    }

    const tersedia =
        product.tersedia !== false &&
        Number(product.stok) > 0;

    const image =
        product.foto_url
            ? `

                <img
                    src="${product.foto_url}"
                    alt="${escapeHTML(product.nama)}"
                >

            `
            : `

                <div class="product-detail-placeholder">
                    🛍️
                </div>

            `;

    content.innerHTML = `

        <div class="product-detail-grid">

            <div class="product-detail-media">
                ${image}
            </div>

            <div class="product-detail-content">

                <span class="product-detail-category">

                    ${
                        escapeHTML(
                            product.kategori ||
                            "Produk"
                        )
                    }

                </span>

                <h2>
                    ${escapeHTML(product.nama)}
                </h2>

                <span class="product-detail-price">
                    ${formatRupiah(product.harga)}
                </span>

                <p>

                    ${
                        tersedia
                            ? `Stok tersedia: ${Number(product.stok)}`
                            : "Stok habis"
                    }

                </p>

                <p class="product-detail-description">

                    ${
                        escapeHTML(
                            product.deskripsi ||
                            "Belum ada deskripsi."
                        )
                    }

                </p>

                <button
                    class="product-detail-cart"
                    type="button"

                    ${
                        !tersedia
                            ? "disabled"
                            : ""
                    }

                    onclick="
                        addToCartFromDetail(
                            ${Number(product.id)}
                        )
                    "
                >

                    ${
                        tersedia
                            ? "+ Tambah ke Keranjang"
                            : "Produk Habis"
                    }

                </button>

            </div>

        </div>

    `;

    overlay.classList.add("open");

    document.body.classList.add(
        "no-scroll"
    );

}


function closeProductDetail() {

    document
        .getElementById(
            "productDetailOverlay"
        )
        ?.classList.remove("open");

    unlockBodyIfPossible();

}


function addToCartFromDetail(id) {

    closeProductDetail();

    setTimeout(
        () => {
            addToCart(id);
        },
        100
    );

}


/* =========================================================
   MODAL DETAIL KEGIATAN
========================================================= */

function createActivityDetailModal() {

    if (
        document.getElementById(
            "activityDetailOverlay"
        )
    ) {
        return;
    }

    const overlay =
        document.createElement("div");

    overlay.id =
        "activityDetailOverlay";

    overlay.className =
        "activity-detail-overlay";

    overlay.innerHTML = `

        <div class="activity-detail-modal">

            <button
                type="button"
                id="activityDetailClose"
                class="activity-detail-close"
            >
                ×
            </button>

            <div id="activityDetailContent"></div>

        </div>

    `;

    document.body.appendChild(overlay);

    document
        .getElementById(
            "activityDetailClose"
        )
        ?.addEventListener(
            "click",
            closeActivityDetail
        );

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {
                closeActivityDetail();
            }

        }
    );

}


function getActivity(id) {

    return KEGIATAN.find(
        item =>
            String(item.id) ===
            String(id)
    );

}


function openActivityDetail(id) {

    const item =
        getActivity(id);

    if (!item) {
        return;
    }

    const overlay =
        document.getElementById(
            "activityDetailOverlay"
        );

    const content =
        document.getElementById(
            "activityDetailContent"
        );

    if (
        !overlay ||
        !content
    ) {
        return;
    }

    let media = "";

    if (
        item.foto_url &&
        isVideoFile(item.foto_url)
    ) {

        media = `

            <video
                controls
                preload="metadata"
            >

                <source
                    src="${item.foto_url}"
                >

            </video>

        `;

    }

    else if (
        item.foto_url
    ) {

        media = `

            <img
                src="${item.foto_url}"
                alt="${escapeHTML(item.judul)}"
            >

        `;

    }

    else {

        media = `

            <div class="activity-detail-placeholder">
                📷
            </div>

        `;

    }

    content.innerHTML = `

        <div class="activity-detail-media">
            ${media}
        </div>

        <div class="activity-detail-body">

            <span class="activity-detail-label">
                Dokumentasi Kegiatan
            </span>

            <h2>

                ${
                    escapeHTML(
                        item.judul ||
                        "Kegiatan"
                    )
                }

            </h2>

            ${
                item.tanggal
                    ? `

                        <div class="activity-detail-date">
                            📅 ${formatTanggal(item.tanggal)}
                        </div>

                    `
                    : ""
            }

            <p class="activity-detail-description">

                ${
                    escapeHTML(
                        item.deskripsi ||
                        "Belum ada deskripsi."
                    )
                }

            </p>

        </div>

    `;

    overlay.classList.add("open");

    document.body.classList.add(
        "no-scroll"
    );

}


function closeActivityDetail() {

    const overlay =
        document.getElementById(
            "activityDetailOverlay"
        );

    if (!overlay) {
        return;
    }

    overlay
        .querySelectorAll("video")
        .forEach(
            video => {
                video.pause();
            }
        );

    overlay.classList.remove("open");

    unlockBodyIfPossible();

}


/* =========================================================
   BODY SCROLL
========================================================= */

function unlockBodyIfPossible() {

    const productOpen =
        document
            .getElementById(
                "productDetailOverlay"
            )
            ?.classList
            .contains("open");

    const activityOpen =
        document
            .getElementById(
                "activityDetailOverlay"
            )
            ?.classList
            .contains("open");

    const cartOpen =
        document
            .getElementById(
                "cartOverlay"
            )
            ?.classList
            .contains("open");

    const checkoutOpen =
        document
            .getElementById(
                "checkoutModal"
            )
            ?.classList
            .contains("open");

    if (
        !productOpen &&
        !activityOpen &&
        !cartOpen &&
        !checkoutOpen
    ) {

        document.body
            .classList
            .remove("no-scroll");

    }

}

/* =========================================================
   RENDER KEGIATAN
========================================================= */

function renderActivities() {

    const gallery =
        document.getElementById(
            "activityGallery"
        );


    if (!gallery) {

        console.warn(
            "activityGallery tidak ditemukan."
        );

        return;

    }


    /* =====================================================
       JIKA BELUM ADA DATA
    ===================================================== */

    if (
        !Array.isArray(KEGIATAN) ||
        KEGIATAN.length === 0
    ) {

        gallery.innerHTML = `

            <div class="empty-state">

                <span>
                    📷
                </span>

                <h3>
                    Belum ada dokumentasi kegiatan
                </h3>

                <p>
                    Dokumentasi kegiatan kampus
                    akan tampil di sini.
                </p>

            </div>

        `;

        return;

    }


    /* =====================================================
       BUAT CARD KEGIATAN
    ===================================================== */

    gallery.innerHTML =
        KEGIATAN
            .map(
                item => {

                    const id =
                        item.id;


                    const judul =
                        escapeHTML(
                            item.judul ||
                            "Kegiatan Kampus"
                        );


                    const deskripsi =
                        escapeHTML(
                            item.deskripsi ||
                            ""
                        );


                    const tanggal =
                        item.tanggal
                            ? formatTanggal(
                                item.tanggal
                            )
                            : "";


                    /* =====================================
                       MEDIA FOTO / VIDEO
                    ===================================== */

                    let media = `

                        <div class="gallery-placeholder">

                            <span>
                                📷
                            </span>

                        </div>

                    `;


                    if (
                        item.foto_url &&
                        isVideoFile(
                            item.foto_url
                        )
                    ) {

                        media = `

                            <video
                                muted
                                playsinline
                                preload="metadata"
                            >

                                <source
                                    src="${escapeHTML(
                                        item.foto_url
                                    )}"
                                >

                            </video>

                            <span class="gallery-video-icon">
                                ▶
                            </span>

                        `;

                    }

                    else if (
                        item.foto_url
                    ) {

                        media = `

                            <img
                                src="${escapeHTML(
                                    item.foto_url
                                )}"
                                alt="${judul}"
                                loading="lazy"
                            >

                        `;

                    }


                    /* =====================================
                       CARD
                    ===================================== */

                    return `

                        <article
                            class="gallery-card"
                            role="button"
                            tabindex="0"
                            data-activity-id="${escapeHTML(id)}"
                        >

                            <div class="gallery-media">

                                ${media}

                            </div>


                            <div class="gallery-content">

                                <span class="gallery-label">
                                    Kegiatan Kampus
                                </span>


                                <h3>
                                    ${judul}
                                </h3>


                                ${
                                    tanggal
                                        ? `

                                            <div class="gallery-date">

                                                📅
                                                ${escapeHTML(
                                                    tanggal
                                                )}

                                            </div>

                                        `
                                        : ""
                                }


                                ${
                                    deskripsi
                                        ? `

                                            <p>
                                                ${deskripsi}
                                            </p>

                                        `
                                        : ""
                                }


                                <span class="gallery-detail-hint">
                                    Lihat Detail →
                                </span>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");


    /* =====================================================
       EVENT CARD
    ===================================================== */

    gallery
        .querySelectorAll(
            ".gallery-card"
        )
        .forEach(
            card => {

                const activityId =
                    card.dataset.activityId;


                /* =========================================
                   CLICK
                ========================================= */

                card.addEventListener(
                    "click",
                    () => {

                        openActivityDetail(
                            activityId
                        );

                    }
                );


                /* =========================================
                   KEYBOARD
                ========================================= */

                card.addEventListener(
                    "keydown",
                    event => {

                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {

                            event.preventDefault();

                            openActivityDetail(
                                activityId
                            );

                        }

                    }
                );

            }
        );


    console.log(
        `✅ ${KEGIATAN.length} kegiatan berhasil ditampilkan.`
    );

}

/* =========================================================
   LOAD KEGIATAN
========================================================= */

async function loadActivities() {

    const gallery =
        document.getElementById(
            "activityGallery"
        );

    if (!gallery) {
        console.warn(
            "activityGallery tidak ditemukan."
        );

        return;
    }


    gallery.innerHTML = `

        <div class="empty-state">

            <span>
                ⏳
            </span>

            <h3>
                Memuat dokumentasi kegiatan...
            </h3>

        </div>

    `;


    try {

        /* =============================================
           CEK SUPABASE
        ============================================= */

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            throw new Error(
                "supabaseClient belum tersedia."
            );

        }


        console.log(
            "⏳ Mengambil data kegiatan..."
        );


        /* =============================================
           REQUEST DATABASE
        ============================================= */

        const request =
            supabaseClient
                .from("kegiatan")
                .select("*")
                .order(
                    "tanggal",
                    {
                        ascending: false
                    }
                );


        /*
            Timeout supaya halaman tidak selamanya
            berhenti di tulisan "Memuat..."
        */

        const timeout =
            new Promise(
                (
                    resolve,
                    reject
                ) => {

                    setTimeout(
                        () => {

                            reject(
                                new Error(
                                    "Timeout saat mengambil data kegiatan."
                                )
                            );

                        },
                        10000
                    );

                }
            );


        const result =
            await Promise.race([
                request,
                timeout
            ]);


        if (!result) {

            throw new Error(
                "Supabase tidak mengembalikan respons."
            );

        }


        const {
            data,
            error
        } = result;


        /* =============================================
           CEK ERROR SUPABASE
        ============================================= */

        if (error) {

            console.error(
                "Supabase kegiatan error:",
                error
            );

            throw error;

        }


        /* =============================================
           SIMPAN DATA
        ============================================= */

        KEGIATAN =
            Array.isArray(data)
                ? data
                : [];


        console.log(
            "✅ Data kegiatan:",
            KEGIATAN
        );


        /* =============================================
           RENDER
        ============================================= */

        renderActivities();


    } catch (error) {

        console.error(
            "❌ Load kegiatan error:",
            error
        );


        KEGIATAN = [];


        gallery.innerHTML = `

            <div class="empty-state">

                <span>
                    ⚠️
                </span>

                <h3>
                    Dokumentasi kegiatan gagal dimuat
                </h3>

                <p>
                    ${
                        escapeHTML(
                            error?.message ||
                            "Terjadi kesalahan saat mengambil data kegiatan."
                        )
                    }
                </p>

                <button
                    type="button"
                    onclick="loadActivities()"
                    style="
                        margin-top:16px;
                        padding:10px 18px;
                        border:0;
                        border-radius:10px;
                        background:#17483a;
                        color:white;
                        font-weight:700;
                        cursor:pointer;
                    "
                >
                    Coba Lagi
                </button>

            </div>

        `;

    }

}


/*
    Dibutuhkan karena tombol "Coba Lagi"
    menggunakan onclick dari HTML.
*/

window.loadActivities =
    loadActivities;


/* =========================================================
   LOAD PRODUK
========================================================= */

async function loadProducts() {

    const productGrid =
        document.getElementById(
            "productGrid"
        );

    if (productGrid) {

        productGrid.innerHTML = `

            <div class="empty-state">
                ⏳ Memuat produk...
            </div>

        `;

    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("produk")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (error) {
            throw error;
        }

        PRODUCTS =
            data || [];

        cart =
            cart.filter(
                cartItem => {

                    return PRODUCTS.some(
                        product =>
                            Number(product.id) ===
                            Number(cartItem.id)
                    );

                }
            );

        cart =
            cart
                .map(
                    cartItem => {

                        const product =
                            getProduct(
                                cartItem.id
                            );

                        if (!product) {
                            return null;
                        }

                        const stok =
                            Math.max(
                                0,
                                Number(
                                    product.stok
                                ) || 0
                            );

                        if (
                            product.tersedia === false ||
                            stok <= 0
                        ) {

                            return null;

                        }

                        return {

                            ...cartItem,

                            quantity:
                                Math.min(
                                    Number(
                                        cartItem.quantity
                                    ) || 1,
                                    stok
                                )

                        };

                    }
                )
                .filter(Boolean);

        saveCart();

        renderProducts();

        renderCart();

    } catch (error) {

        console.error(
            "Load produk error:",
            error
        );

        if (productGrid) {

            productGrid.innerHTML = `

                <div class="empty-state">

                    <span>
                        ⚠️
                    </span>

                    <h3>
                        Produk belum dapat dimuat
                    </h3>

                    <p>
                        Silakan coba lagi nanti.
                    </p>

                </div>

            `;

        }

    }

}

/* =========================================================
   FILTER PRODUK
========================================================= */

function getFilteredProducts() {

    return PRODUCTS.filter(
        product => {

            const category =
                String(
                    product.kategori ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const name =
                String(
                    product.nama ||
                    ""
                )
                    .toLowerCase();


            const description =
                String(
                    product.deskripsi ||
                    ""
                )
                    .toLowerCase();


            const matchesCategory =
                activeCategory ===
                "semua"

                    ? true

                    : category ===
                    activeCategory;


            const matchesSearch =
                !searchKeyword

                    ? true

                    : (
                        name.includes(
                            searchKeyword
                        ) ||

                        description.includes(
                            searchKeyword
                        ) ||

                        category.includes(
                            searchKeyword
                        )
                    );


            return (
                matchesCategory &&
                matchesSearch
            );

        }
    );

}


/* =========================================================
   CATEGORY FILTER
========================================================= */

function setupProductFilters() {

    const filters =
        document.getElementById(
            "productFilters"
        );


    if (!filters) {
        return;
    }


    filters.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-category]"
                );


            if (!button) {
                return;
            }


            activeCategory =
                String(
                    button.dataset.category ||
                    "semua"
                )
                    .trim()
                    .toLowerCase();


            filters
                .querySelectorAll(
                    "[data-category]"
                )
                .forEach(
                    item => {

                        item.classList.toggle(
                            "active",
                            item === button
                        );

                    }
                );


            renderProducts();

        }
    );

}


/* =========================================================
   RENDER PRODUK
========================================================= */

function renderProducts() {

    const grid =
        document.getElementById(
            "productGrid"
        );


    if (!grid) {
        return;
    }


    const products =
        getFilteredProducts();


    const info =
        document.getElementById(
            "productResultInfo"
        );


    if (info) {

        if (
            searchKeyword ||
            activeCategory !== "semua"
        ) {

            info.textContent =
                `${products.length} produk ditemukan`;

        } else {

            info.textContent =
                `${PRODUCTS.length} produk tersedia di toko`;

        }

    }


    if (!products.length) {

        grid.innerHTML = `

            <div class="empty-state">

                <span>
                    🔎
                </span>

                <h3>
                    Produk tidak ditemukan
                </h3>

                <p>
                    Coba gunakan kata pencarian
                    atau kategori lain.
                </p>

            </div>

        `;

        return;

    }


    grid.innerHTML =
        products
            .map(
                product => {

                    const stok =
                        Math.max(
                            0,
                            Number(
                                product.stok
                            ) || 0
                        );


                    const tersedia =
                        product.tersedia !== false &&
                        stok > 0;


                    const image =
                        product.foto_url
                            ? `

                                <img
                                    src="${product.foto_url}"
                                    alt="${escapeHTML(
                                        product.nama
                                    )}"
                                    loading="lazy"
                                >

                            `
                            : `

                                <div class="product-placeholder">
                                    🛍️
                                </div>

                            `;


                    return `

                        <article
                            class="product-card"
                        >

                            <div class="product-image">

                                ${image}

                                <span
                                    class="product-category"
                                >

                                    ${
                                        escapeHTML(
                                            product.kategori ||
                                            "Produk"
                                        )
                                    }

                                </span>

                            </div>


                            <div class="product-content">

                                <h3>

                                    ${
                                        escapeHTML(
                                            product.nama ||
                                            "Produk"
                                        )
                                    }

                                </h3>


                                <p>

                                    ${
                                        escapeHTML(
                                            product.deskripsi ||
                                            "Produk karya santri."
                                        )
                                    }

                                </p>


                                <div class="product-meta">

                                    <strong>

                                        ${formatRupiah(
                                            product.harga
                                        )}

                                    </strong>


                                    <span>

                                        ${
                                            tersedia
                                                ? `Stok ${stok}`
                                                : "Stok Habis"
                                        }

                                    </span>

                                </div>


                                <div class="product-actions">

                                    <button
                                        type="button"
                                        class="product-detail-button"
                                        onclick="
                                            openProductDetail(
                                                ${Number(product.id)}
                                            )
                                        "
                                    >
                                        Detail
                                    </button>


                                    <button
                                        type="button"
                                        class="add-cart"

                                        ${
                                            tersedia
                                                ? ""
                                                : "disabled"
                                        }

                                        onclick="
                                            addToCart(
                                                ${Number(product.id)}
                                            )
                                        "
                                    >

                                        ${
                                            tersedia
                                                ? "+ Keranjang"
                                                : "Habis"
                                        }

                                    </button>

                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   CART
========================================================= */

function saveCart() {

    localStorage.setItem(
        "kampusWidyaCart",
        JSON.stringify(cart)
    );

}


function getCartQuantity(
    productId
) {

    const item =
        cart.find(
            cartItem =>
                Number(cartItem.id) ===
                Number(productId)
        );


    return (
        Number(
            item?.quantity
        ) || 0
    );

}


function addToCart(id) {

    const product =
        getProduct(id);


    if (!product) {

        alert(
            "Produk tidak ditemukan."
        );

        return;

    }


    const stok =
        Math.max(
            0,
            Number(
                product.stok
            ) || 0
        );


    if (
        product.tersedia === false ||
        stok <= 0
    ) {

        alert(
            "Maaf, produk sedang habis."
        );

        return;

    }


    const existing =
        cart.find(
            item =>
                Number(item.id) ===
                Number(id)
        );


    if (existing) {

        if (
            Number(existing.quantity) >=
            stok
        ) {

            alert(
                `Jumlah maksimal sesuai stok: ${stok}.`
            );

            return;

        }


        existing.quantity =
            Number(
                existing.quantity
            ) + 1;

    } else {

        cart.push({
            id:
                Number(id),

            quantity:
                1
        });

    }


    saveCart();

    renderCart();

    openCart();

}


/* =========================================================
   UPDATE QUANTITY
========================================================= */

function changeQuantity(
    id,
    change
) {

    const item =
        cart.find(
            cartItem =>
                Number(cartItem.id) ===
                Number(id)
        );


    if (!item) {
        return;
    }


    const product =
        getProduct(id);


    if (!product) {

        removeFromCart(id);

        return;

    }


    const stok =
        Math.max(
            0,
            Number(
                product.stok
            ) || 0
        );


    const nextQuantity =
        Number(item.quantity) +
        Number(change);


    if (
        nextQuantity <= 0
    ) {

        removeFromCart(id);

        return;

    }


    if (
        nextQuantity >
        stok
    ) {

        alert(
            `Stok ${product.nama} hanya ${stok}.`
        );

        return;

    }


    item.quantity =
        nextQuantity;


    saveCart();

    renderCart();

}


/* =========================================================
   REMOVE CART
========================================================= */

function removeFromCart(id) {

    cart =
        cart.filter(
            item =>
                Number(item.id) !==
                Number(id)
        );


    saveCart();

    renderCart();

}


/* =========================================================
   CLEAR CART
========================================================= */

function clearCart() {

    if (!cart.length) {
        return;
    }


    const confirmed =
        confirm(
            "Kosongkan semua produk dari keranjang?"
        );


    if (!confirmed) {
        return;
    }


    cart = [];

    saveCart();

    renderCart();

}


/* =========================================================
   CART TOTAL
========================================================= */

function getCartTotal() {

    return cart.reduce(
        (
            total,
            item
        ) => {

            const product =
                getProduct(
                    item.id
                );


            if (!product) {

                return total;

            }


            return (
                total +
                (
                    Number(
                        product.harga
                    ) *
                    Number(
                        item.quantity
                    )
                )
            );

        },
        0
    );

}


/* =========================================================
   CART COUNT
========================================================= */

function getCartCount() {

    return cart.reduce(
        (
            total,
            item
        ) => {

            return (
                total +
                Number(
                    item.quantity
                )
            );

        },
        0
    );

}


/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {

    const container =
        document.getElementById(
            "cartItems"
        );


    const count =
        document.getElementById(
            "cartCount"
        );


    const total =
        document.getElementById(
            "cartTotal"
        );


    const checkoutButton =
        document.getElementById(
            "checkoutButton"
        );


    if (count) {

        const jumlah =
            getCartCount();


        count.textContent =
            jumlah;


        count.style.display =
            jumlah > 0
                ? ""
                : "none";

    }


    if (total) {

        total.textContent =
            formatRupiah(
                getCartTotal()
            );

    }


    if (checkoutButton) {

        checkoutButton.disabled =
            cart.length === 0;

    }


    if (!container) {
        return;
    }


    if (!cart.length) {

        container.innerHTML = `

            <div class="cart-empty">

                <span>
                    🛒
                </span>

                <h3>
                    Keranjang masih kosong
                </h3>

                <p>
                    Tambahkan produk dari
                    Toko Karya Santri.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        cart
            .map(
                item => {

                    const product =
                        getProduct(
                            item.id
                        );


                    if (!product) {

                        return "";

                    }


                    const quantity =
                        Number(
                            item.quantity
                        );


                    const subtotal =
                        Number(
                            product.harga
                        ) *
                        quantity;


                    const image =
                        product.foto_url
                            ? `

                                <img
                                    src="${product.foto_url}"
                                    alt="${escapeHTML(
                                        product.nama
                                    )}"
                                >

                            `
                            : `

                                <div class="cart-item-placeholder">
                                    🛍️
                                </div>

                            `;


                    return `

                        <div class="cart-item">

                            <div class="cart-item-image">

                                ${image}

                            </div>


                            <div class="cart-item-info">

                                <strong>

                                    ${escapeHTML(
                                        product.nama
                                    )}

                                </strong>


                                <span>

                                    ${formatRupiah(
                                        product.harga
                                    )}

                                </span>


                                <small>

                                    Subtotal:

                                    ${formatRupiah(
                                        subtotal
                                    )}

                                </small>


                                <div class="cart-quantity">

                                    <button
                                        type="button"
                                        onclick="
                                            changeQuantity(
                                                ${Number(product.id)},
                                                -1
                                            )
                                        "
                                    >
                                        −
                                    </button>


                                    <span>
                                        ${quantity}
                                    </span>


                                    <button
                                        type="button"

                                        ${
                                            quantity >=
                                            Number(
                                                product.stok
                                            )
                                                ? "disabled"
                                                : ""
                                        }

                                        onclick="
                                            changeQuantity(
                                                ${Number(product.id)},
                                                1
                                            )
                                        "
                                    >
                                        +
                                    </button>

                                </div>

                            </div>


                            <button
                                type="button"
                                class="cart-remove"
                                onclick="
                                    removeFromCart(
                                        ${Number(product.id)}
                                    )
                                "
                                aria-label="Hapus produk"
                            >
                                ×
                            </button>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   BUKA CART
========================================================= */

function openCart() {

    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    if (!overlay) {
        return;
    }


    renderCart();


    overlay.classList.add(
        "open"
    );


    document.body
        .classList
        .add(
            "no-scroll"
        );

}


/* =========================================================
   TUTUP CART
========================================================= */

function closeCart() {

    document
        .getElementById(
            "cartOverlay"
        )
        ?.classList
        .remove(
            "open"
        );


    unlockBodyIfPossible();

}


/* =========================================================
   CART EVENTS
========================================================= */

function setupCartEvents() {

    document
        .getElementById(
            "cartButton"
        )
        ?.addEventListener(
            "click",
            openCart
        );


    /*
       FIX:
       HTML menggunakan id="closeCart",
       jadi event listener harus menggunakan closeCart.
    */

    document
        .getElementById(
            "closeCart"
        )
        ?.addEventListener(
            "click",
            closeCart
        );


    document
        .getElementById(
            "cartOverlay"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "cartOverlay"
                ) {

                    closeCart();

                }

            }
        );


    document
        .getElementById(
            "clearCart"
        )
        ?.addEventListener(
            "click",
            clearCart
        );


    document
        .getElementById(
            "checkoutButton"
        )
        ?.addEventListener(
            "click",
            openCheckout
        );

}

/* =========================================================
   BUKA CHECKOUT
========================================================= */

function openCheckout() {

    if (!cart.length) {

        alert(
            "Keranjang masih kosong."
        );

        return;
    }


    closeCart();


    const modal =
        document.getElementById(
            "checkoutModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.add(
        "open"
    );


    document.body
        .classList
        .add(
            "no-scroll"
        );

}


/* =========================================================
   TUTUP CHECKOUT
========================================================= */

function closeCheckout() {

    document
        .getElementById(
            "checkoutModal"
        )
        ?.classList
        .remove(
            "open"
        );


    unlockBodyIfPossible();

}


function setupCheckoutEvents() {

    document
        .getElementById(
            "checkoutClose"
        )
        ?.addEventListener(
            "click",
            closeCheckout
        );


    document
        .getElementById(
            "checkoutModal"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "checkoutModal"
                ) {

                    closeCheckout();

                }

            }
        );

}


/* =========================================================
   CHECKOUT HELPER
========================================================= */

function normalizeCheckoutItems() {

    return cart
        .map(item => {

            const product =
                getProduct(
                    item.id
                );


            if (!product) {
                return null;
            }


            return {

                id:
                    Number(
                        product.id
                    ),

                quantity:
                    Number(
                        item.quantity
                    )

            };

        })
        .filter(Boolean);

}


/* =========================================================
   ORDER ITEMS UNTUK WHATSAPP
========================================================= */

function buildOrderLines(
    orderItems
) {

    if (
        !Array.isArray(
            orderItems
        )
    ) {

        return "";

    }


    return orderItems
        .map(item => {

            const nama =
                item.nama ||
                item.name ||
                "Produk";


            const jumlah =
                Number(
                    item.jumlah ??
                    item.quantity ??
                    1
                );


            const harga =
                Number(
                    item.harga ??
                    0
                );


            const subtotal =
                Number(
                    item.subtotal ??
                    (
                        harga *
                        jumlah
                    )
                );


            return (
                "- " +
                nama +
                " x" +
                jumlah +
                " = " +
                formatRupiah(
                    subtotal
                )
            );

        })
        .join("\n");

}


/* =========================================================
   FORM CHECKOUT
========================================================= */

function setupCheckoutForm() {

    const form =
        document.getElementById(
            "checkoutForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                checkoutProcessing
            ) {

                return;

            }


            /* =============================================
               DATA PEMBELI
            ============================================= */

            const name =
                document
                    .getElementById(
                        "customerName"
                    )
                    ?.value
                    .trim();


            const phone =
                document
                    .getElementById(
                        "customerPhone"
                    )
                    ?.value
                    .trim();


            const address =
                document
                    .getElementById(
                        "customerAddress"
                    )
                    ?.value
                    .trim();


            if (
                !name ||
                !phone ||
                !address
            ) {

                alert(
                    "Lengkapi data pemesan terlebih dahulu."
                );

                return;

            }


            if (!cart.length) {

                alert(
                    "Keranjang masih kosong."
                );

                return;

            }


            /* =============================================
               BUTTON
            ============================================= */

            const submitButton =
                form.querySelector(
                    'button[type="submit"]'
                );


            const originalButtonText =
                submitButton
                    ?.textContent ||
                "Pesan Sekarang";


            checkoutProcessing =
                true;


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "⏳ Memproses pesanan...";

            }


            try {

                /* =========================================
                   PASTIKAN SUPABASE TERHUBUNG
                ========================================= */

                if (
                    typeof supabaseClient ===
                    "undefined"
                ) {

                    throw new Error(
                        "Supabase belum terhubung."
                    );

                }


                /* =========================================
                   AMBIL PRODUK TERBARU
                ========================================= */

                const {

                    data:
                        latestProducts,

                    error:
                        latestProductsError

                } =
                    await supabaseClient
                        .from("produk")
                        .select("*");


                if (
                    latestProductsError
                ) {

                    throw latestProductsError;

                }


                PRODUCTS =
                    latestProducts ||
                    [];


                /* =========================================
                   VALIDASI PRODUK DAN STOK
                ========================================= */

                for (
                    const cartItem
                    of cart
                ) {

                    const product =
                        getProduct(
                            cartItem.id
                        );


                    if (!product) {

                        throw new Error(
                            "Ada produk di keranjang yang sudah tidak tersedia."
                        );

                    }


                    const stok =
                        Math.max(
                            0,
                            Number(
                                product.stok
                            ) || 0
                        );


                    const quantity =
                        Number(
                            cartItem.quantity
                        ) || 0;


                    if (
                        product.tersedia ===
                        false ||
                        stok <= 0
                    ) {

                        throw new Error(
                            `${product.nama} sedang tidak tersedia.`
                        );

                    }


                    if (
                        quantity <= 0
                    ) {

                        throw new Error(
                            `Jumlah ${product.nama} tidak valid.`
                        );

                    }


                    if (
                        quantity >
                        stok
                    ) {

                        throw new Error(
                            `Stok ${product.nama} tinggal ${stok}. Silakan sesuaikan jumlah pesanan.`
                        );

                    }

                }


                /* =========================================
                   DATA YANG DIKIRIM KE FUNCTION SUPABASE
                ========================================= */

                const checkoutItems =
                    normalizeCheckoutItems();


                if (
                    !checkoutItems.length
                ) {

                    throw new Error(
                        "Tidak ada produk yang dapat diproses."
                    );

                }


                /* =========================================
                   BUAT PESANAN
                ========================================= */

                const {

                    data:
                        checkoutResult,

                    error:
                        checkoutError

                } =
                    await supabaseClient
                        .rpc(
                            "buat_pesanan",
                            {

                                p_nama_pembeli:
                                    name,

                                p_nomor_whatsapp:
                                    phone,

                                p_alamat:
                                    address,

                                p_items:
                                    checkoutItems

                            }
                        );


                if (
                    checkoutError
                ) {

                    throw checkoutError;

                }


                /* =========================================
                   HASIL FUNCTION
                ========================================= */

                const result =
                    Array.isArray(
                        checkoutResult
                    )
                        ?
                        checkoutResult[0]
                        :
                        checkoutResult;


                if (!result) {

                    throw new Error(
                        "Pesanan gagal dibuat. Supabase tidak mengembalikan data pesanan."
                    );

                }


                /* =========================================
                   KODE PESANAN
                ========================================= */

                const kodePesanan =
                    result.kode_pesanan ||
                    (
                        "KWS-" +
                        result.id
                    );


                /* =========================================
                   TOTAL
                ========================================= */

                const totalPrice =
                    Number(
                        result.total
                    ) ||
                    0;


                /* =========================================
                   ITEMS HASIL CHECKOUT
                ========================================= */

                let orderItems =
                    result.items;


                if (
                    typeof orderItems ===
                    "string"
                ) {

                    try {

                        orderItems =
                            JSON.parse(
                                orderItems
                            );

                    } catch {

                        orderItems =
                            [];

                    }

                }


                if (
                    !Array.isArray(
                        orderItems
                    )
                ) {

                    orderItems =
                        [];

                }


                /* =========================================
                   BUAT DAFTAR BARANG
                ========================================= */

                const orderLines =
                    buildOrderLines(
                        orderItems
                    );


                /* =========================================
                   SIMPAN DATA SEBELUM CART DIKOSONGKAN
                ========================================= */

                const successData = {

    id:
        result.id,

    kodePesanan,

    tokenPembayaran:
        result.token_pembayaran,

    name,

    phone,

    address,

    totalPrice,

    orderItems,

    orderLines

};

/* =========================================
   TOKEN PEMBAYARAN
========================================= */

if (
    !successData.tokenPembayaran
) {

    throw new Error(
        "Token pembayaran tidak diterima dari server."
    );

}

/* =========================================
   NOTIFIKASI TELEGRAM - PESANAN BARU
========================================= */

supabaseClient.functions.invoke(
    "telegram-notification",
    {
        body: {
            type: "pesanan_baru",
            kode_pesanan: successData.kodePesanan,
            nama_pembeli: successData.name,
            total: successData.totalPrice
        }
    }
).then(({ error }) => {

    if (error) {
        console.error(
            "Notifikasi Telegram gagal:",
            error
        );
    }

}).catch(error => {

    console.error(
        "Notifikasi Telegram error:",
        error
    );

});

                /* =========================================
                   KOSONGKAN CART
                ========================================= */

                cart = [];


                saveCart();


                renderCart();


                /* =========================================
                   RESET FORM
                ========================================= */

                form.reset();


                /* =========================================
                   TUTUP CHECKOUT
                ========================================= */

                closeCheckout();


                /* =========================================
                   REFRESH PRODUK
                   STOK BARU LANGSUNG TAMPIL
                ========================================= */

                await loadProducts();


                /* =========================================
                   WHATSAPP
                ========================================= */

                const message =
`Assalamu'alaikum.

Saya sudah membuat pesanan dari Toko Karya Santri Kampus Al-Qur'an Widya Silahudin Shidiq.

Kode Pesanan: ${successData.kodePesanan}

Nama: ${successData.name}
No. WhatsApp: ${successData.phone}

Alamat:
${successData.address}

Pesanan:
${successData.orderLines || "-"}

Total: ${formatRupiah(successData.totalPrice)}

Mohon informasi cara pembayaran dan proses selanjutnya.

Terima kasih.`;


                const whatsappURL =

                    "https://wa.me/" +

                    WEBSITE_INFO.whatsapp +

                    "?text=" +

                    encodeURIComponent(
                        message
                    );


                /* =========================================
   BUKA MODAL PEMBAYARAN
========================================= */

openPaymentModal(
    successData
);

            } catch (error) {

                console.error(
                    "Checkout error:",
                    error
                );


                let errorMessage =
                    error?.message ||
                    "Pesanan gagal dibuat.";


                /* =========================================
                   BERSIHKAN PESAN ERROR POSTGRES
                ========================================= */

                errorMessage =
                    String(
                        errorMessage
                    )
                        .replace(
                            "P0001: ",
                            ""
                        )
                        .replace(
                            "Error: ",
                            ""
                        );


                alert(
                    "❌ Pesanan gagal diproses.\n\n" +
                    errorMessage
                );


                /* =========================================
                   REFRESH PRODUK JIKA STOK BERUBAH
                ========================================= */

                try {

                    await loadProducts();

                } catch (
                    refreshError
                ) {

                    console.warn(
                        "Refresh produk gagal:",
                        refreshError
                    );

                }


            } finally {

                checkoutProcessing =
                    false;


                if (
                    submitButton
                ) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        originalButtonText;

                }

            }

        }
    );

}

/* =========================================================
   PAYMENT MODAL
========================================================= */

function openPaymentModal(orderData) {

    const modal =
        document.getElementById(
            "paymentModal"
        );

    if (
        !modal ||
        !orderData
    ) {
        return;
    }


    currentPaymentOrder =
        orderData;

    selectedPaymentFile =
        null;


    /* =====================================================
       ISI INFORMASI PESANAN
    ===================================================== */

    const codeElement =
        document.getElementById(
            "paymentOrderCode"
        );

    const totalElement =
        document.getElementById(
            "paymentOrderTotal"
        );

    const statusElement =
        document.getElementById(
            "paymentStatus"
        );


    if (codeElement) {

        codeElement.textContent =
            orderData.kodePesanan ||
            "-";

    }


    if (totalElement) {

        totalElement.textContent =
            formatRupiah(
                orderData.totalPrice
            );

    }


    if (statusElement) {

        statusElement.textContent =
            "Belum Bayar";

    }


    /* =====================================================
       RESET UPLOAD
    ===================================================== */

    resetPaymentFile();


    const errorBox =
        document.getElementById(
            "paymentError"
        );

    const successBox =
        document.getElementById(
            "paymentSuccess"
        );


    if (errorBox) {

        errorBox.hidden =
            true;

        errorBox.textContent =
            "";

    }


    if (successBox) {

        successBox.hidden =
            true;

        successBox.textContent =
            "";

    }


    /* =====================================================
       BUKA MODAL
    ===================================================== */

    modal.classList.add(
        "open"
    );


    document.body
        .classList
        .add(
            "no-scroll"
        );

}


/* =========================================================
   CLOSE PAYMENT
========================================================= */

function closePaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );


    modal
        ?.classList
        .remove(
            "open"
        );


    resetPaymentFile();


    currentPaymentOrder =
        null;


    unlockBodyIfPossible();

}


/* =========================================================
   RESET FILE PEMBAYARAN
========================================================= */

function resetPaymentFile() {

    selectedPaymentFile =
        null;


    const input =
        document.getElementById(
            "paymentProofInput"
        );

    const preview =
        document.getElementById(
            "paymentPreview"
        );

    const previewImage =
        document.getElementById(
            "paymentPreviewImage"
        );

    const chooseButton =
        document.getElementById(
            "paymentChooseFile"
        );


    if (input) {

        input.value =
            "";

    }


    if (previewImage) {

        if (
            previewImage.src &&
            previewImage.src.startsWith(
                "blob:"
            )
        ) {

            URL.revokeObjectURL(
                previewImage.src
            );

        }


        previewImage.src =
            "";

    }


    if (preview) {

        preview.hidden =
            true;

    }


    if (chooseButton) {

        chooseButton.hidden =
            false;

    }

}

/* =========================================================
   KIRIM BUKTI PEMBAYARAN
========================================================= */

async function kirimBuktiPembayaran() {

    console.log(
        "Tombol kirim bukti pembayaran ditekan"
    );

}

/* =========================================================
   FORMAT UKURAN FILE
========================================================= */

function formatPaymentFileSize(
    bytes
) {

    const size =
        Number(bytes) || 0;


    if (
        size <
        1024
    ) {

        return (
            size +
            " B"
        );

    }


    if (
        size <
        1024 * 1024
    ) {

        return (
            (
                size /
                1024
            ).toFixed(1) +
            " KB"
        );

    }


    return (
        (
            size /
            (
                1024 *
                1024
            )
        ).toFixed(1) +
        " MB"
    );

}


/* =========================================================
   PILIH FILE PEMBAYARAN
========================================================= */

function handlePaymentFile(
    file
) {

    const errorBox =
        document.getElementById(
            "paymentError"
        );


    if (errorBox) {

        errorBox.hidden =
            true;

        errorBox.textContent =
            "";

    }


    if (!file) {

        resetPaymentFile();

        return;

    }


    /* =====================================================
       VALIDASI TYPE
    ===================================================== */

    const allowedTypes = [

        "image/jpeg",

        "image/png",

        "image/webp"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        resetPaymentFile();


        if (errorBox) {

            errorBox.textContent =
                "Bukti pembayaran harus berupa JPG, PNG, atau WEBP.";

            errorBox.hidden =
                false;

        }


        return;

    }


    /* =====================================================
       MAX 5 MB
    ===================================================== */

    const maxSize =
        5 *
        1024 *
        1024;


    if (
        file.size >
        maxSize
    ) {

        resetPaymentFile();


        if (errorBox) {

            errorBox.textContent =
                "Ukuran bukti pembayaran maksimal 5 MB.";

            errorBox.hidden =
                false;

        }


        return;

    }


    selectedPaymentFile =
        file;


    /* =====================================================
       PREVIEW
    ===================================================== */

    const preview =
        document.getElementById(
            "paymentPreview"
        );

    const previewImage =
        document.getElementById(
            "paymentPreviewImage"
        );

    const fileName =
        document.getElementById(
            "paymentFileName"
        );

    const fileSize =
        document.getElementById(
            "paymentFileSize"
        );

    const chooseButton =
        document.getElementById(
            "paymentChooseFile"
        );


    if (previewImage) {

        previewImage.src =
            URL.createObjectURL(
                file
            );

    }


    if (fileName) {

        fileName.textContent =
            file.name;

    }


    if (fileSize) {

        fileSize.textContent =
            formatPaymentFileSize(
                file.size
            );

    }


    if (chooseButton) {

        chooseButton.hidden =
            true;

    }


    if (preview) {

        preview.hidden =
            false;

    }

}


/* =========================================================
   EXTENSION FILE
========================================================= */

function getPaymentFileExtension(
    file
) {

    const type =
        file?.type ||
        "";


    if (
        type ===
        "image/png"
    ) {

        return "png";

    }


    if (
        type ===
        "image/webp"
    ) {

        return "webp";

    }


    return "jpg";

}


/* =========================================================
   UPLOAD BUKTI PEMBAYARAN
========================================================= */

async function uploadPaymentProof() {

    if (
        paymentUploading
    ) {

        return;

    }


    const errorBox =
        document.getElementById(
            "paymentError"
        );

    const successBox =
        document.getElementById(
            "paymentSuccess"
        );

    const submitButton =
        document.getElementById(
            "paymentSubmit"
        );


    if (errorBox) {

        errorBox.hidden =
            true;

        errorBox.textContent =
            "";

    }


    if (successBox) {

        successBox.hidden =
            true;

        successBox.textContent =
            "";

    }


    /* =====================================================
       VALIDASI ORDER
    ===================================================== */

    if (
        !currentPaymentOrder?.id ||
        !currentPaymentOrder
            ?.tokenPembayaran
    ) {

        if (errorBox) {

            errorBox.textContent =
                "Data pesanan tidak ditemukan. Silakan buat pesanan kembali.";

            errorBox.hidden =
                false;

        }


        return;

    }


    /* =====================================================
       VALIDASI FILE
    ===================================================== */

    if (
        !selectedPaymentFile
    ) {

        if (errorBox) {

            errorBox.textContent =
                "Pilih bukti pembayaran terlebih dahulu.";

            errorBox.hidden =
                false;

        }


        return;

    }


    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        if (errorBox) {

            errorBox.textContent =
                "Supabase belum terhubung.";

            errorBox.hidden =
                false;

        }


        return;

    }


    paymentUploading =
        true;


    const originalText =
        submitButton
            ?.textContent ||
        "Kirim Bukti Pembayaran";


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "⏳ Mengirim bukti...";

    }


    let uploadedPath =
        "";


    try {

        /* =================================================
           NAMA FILE AMAN
        ================================================= */

        const extension =
            getPaymentFileExtension(
                selectedPaymentFile
            );


        const randomPart =

            (
                window.crypto
                    ?.randomUUID
                    ?.() ||
                (
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .slice(2)
                )
            );


        uploadedPath =

            "pesanan/" +

            String(
                currentPaymentOrder.id
            ) +

            "/" +

            randomPart +

            "." +

            extension;


        /* =================================================
           UPLOAD KE STORAGE PRIVATE
        ================================================= */

        const {
            error:
                uploadError
        } =

            await supabaseClient
                .storage
                .from(
    "bukti-pembayaran"
)
                .upload(
                    uploadedPath,
                    selectedPaymentFile,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            selectedPaymentFile
                                .type
                    }
                );


        if (
            uploadError
        ) {

            throw uploadError;

        }


        /* =================================================
           SIMPAN PATH KE PESANAN VIA RPC
        ================================================= */

        const {
            error:
                rpcError
        } =

            await supabaseClient
                .rpc(
                    "kirim_bukti_pembayaran",
                    {

                        p_pesanan_id:
                            Number(
                                currentPaymentOrder
                                    .id
                            ),

                        p_token_pembayaran:
                            currentPaymentOrder
                                .tokenPembayaran,

                        p_bukti_pembayaran:
                            uploadedPath

                    }
                );


        if (
            rpcError
        ) {

            throw rpcError;

        }

        /* =========================================
   NOTIFIKASI TELEGRAM - BUKTI PEMBAYARAN
========================================= */

supabaseClient.functions.invoke(
    "telegram-notification",
    {
        body: {
            type: "bukti_pembayaran",
            kode_pesanan:
                currentPaymentOrder.kodePesanan,

            nama_pembeli:
                currentPaymentOrder.name,

            total:
                currentPaymentOrder.totalPrice
        }
    }
).then(({ error }) => {

    if (error) {
        console.error(
            "Notifikasi Telegram bukti pembayaran gagal:",
            error
        );
    }

}).catch(error => {

    console.error(
        "Notifikasi Telegram bukti pembayaran error:",
        error
    );

});


        /* =================================================
           SUKSES
        ================================================= */

        const statusElement =
            document.getElementById(
                "paymentStatus"
            );


        if (statusElement) {

            statusElement.textContent =
                "Menunggu Verifikasi";

        }


        if (successBox) {

            successBox.textContent =
                "Bukti pembayaran berhasil dikirim. Admin akan memeriksa pembayaran Anda.";

            successBox.hidden =
                false;

        }


        resetPaymentFile();


        if (submitButton) {

            submitButton.textContent =
                "✓ Bukti Sudah Dikirim";

            submitButton.disabled =
                true;

        }


    } catch (error) {

        console.error(
            "Upload payment error:",
            error
        );


        /*
           Jika file sudah berhasil masuk Storage,
           tapi RPC gagal, kita coba hapus lagi agar
           tidak meninggalkan file yatim.
        */

        if (
            uploadedPath
        ) {

            try {

                await supabaseClient
                    .storage
                    .from(
                        "bukti-pembayaran"
                    )
                    .remove([
                        uploadedPath
                    ]);

            } catch (
                removeError
            ) {

                console.warn(
                    "Gagal membersihkan bukti pembayaran:",
                    removeError
                );

            }

        }


        if (errorBox) {

            errorBox.textContent =

                error?.message ||

                "Bukti pembayaran gagal dikirim.";

            errorBox.hidden =
                false;

        }


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                originalText;

        }


    } finally {

        paymentUploading =
            false;

    }

}


/* =========================================================
   PAYMENT WHATSAPP
========================================================= */

function openPaymentWhatsApp() {

    if (
        !currentPaymentOrder
    ) {

        return;

    }


    const order =
        currentPaymentOrder;


    const message =
`Assalamu'alaikum.

Saya sudah membuat pesanan dari Toko Karya Santri Kampus Al-Qur'an Widya Silahudin Shidiq.

Kode Pesanan: ${order.kodePesanan}

Nama: ${order.name}
No. WhatsApp: ${order.phone}

Alamat:
${order.address}

Pesanan:
${order.orderLines || "-"}

Total: ${formatRupiah(order.totalPrice)}

Saya ingin menanyakan pembayaran pesanan ini.

Terima kasih.`;


    const url =

        "https://wa.me/" +

        WEBSITE_INFO.whatsapp +

        "?text=" +

        encodeURIComponent(
            message
        );


    window.open(
        url,
        "_blank"
    );

}


/* =========================================================
   SETUP PAYMENT EVENTS
========================================================= */

function setupPaymentEvents() {

    const modal =
        document.getElementById(
            "paymentModal"
        );

        const submitButton =
    document.getElementById(
        "paymentSubmit"
    );

    const input =
        document.getElementById(
            "paymentProofInput"
        );


    /* CLOSE */

    document
        .getElementById(
            "closePayment"
        )
        ?.addEventListener(
            "click",
            closePaymentModal
        );


    /* CLICK BACKDROP */

    modal
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closePaymentModal();

                }

            }
        );


    /* PILIH FILE */

    document
        .getElementById(
            "paymentChooseFile"
        )
        ?.addEventListener(
            "click",
            () => {

                input?.click();

            }
        );


    /* FILE BERUBAH */

    input
        ?.addEventListener(
            "change",
            event => {

                const file =
                    event.target
                        .files?.[0];

                handlePaymentFile(
                    file
                );

            }
        );


    /* HAPUS FILE */

    document
        .getElementById(
            "paymentRemoveFile"
        )
        ?.addEventListener(
            "click",
            resetPaymentFile
        );


    /* KIRIM */

    document
        .getElementById(
            "paymentSubmit"
        )
        ?.addEventListener(
            "click",
            uploadPaymentProof
        );


    /* WHATSAPP */

    document
        .getElementById(
            "paymentWhatsapp"
        )
        ?.addEventListener(
            "click",
            openPaymentWhatsApp
        );

        submitButton?.addEventListener(
    "click",
    kirimBuktiPembayaran
);

}

/* =========================================================
   PAYMENT MODAL
========================================================= */

function openPaymentModal(orderData) {

    const modal =
        document.getElementById("paymentModal");

    if (!modal || !orderData) {
        return;
    }

    currentPaymentOrder = orderData;
    selectedPaymentFile = null;

    const codeElement =
        document.getElementById("paymentOrderCode");

    const totalElement =
        document.getElementById("paymentOrderTotal");

    const statusElement =
        document.getElementById("paymentStatus");


    if (codeElement) {
        codeElement.textContent =
            orderData.kodePesanan || "-";
    }

    if (totalElement) {
        totalElement.textContent =
            formatRupiah(orderData.totalPrice);
    }

    if (statusElement) {
        statusElement.textContent =
            "Belum Bayar";
    }


    const modalError =
        document.getElementById("paymentError");

    const modalSuccess =
        document.getElementById("paymentSuccess");


    if (modalError) {
        modalError.hidden = true;
        modalError.textContent = "";
    }

    if (modalSuccess) {
        modalSuccess.hidden = true;
        modalSuccess.textContent = "";
    }


    modal.classList.add("open");

    document.body.classList.add("no-scroll");
}


/* =========================================================
   TUTUP PAYMENT MODAL
========================================================= */

function closePaymentModal() {

    document
        .getElementById("paymentModal")
        ?.classList
        .remove("open");

    selectedPaymentFile = null;

    const input =
        document.getElementById("paymentProofInput");

    if (input) {
        input.value = "";
    }

    currentPaymentOrder = null;

    unlockBodyIfPossible();
}

/* =========================================================
   SETUP PAYMENT EVENTS
========================================================= */

function setupPaymentEventsLama() {

    const modal =
        document.getElementById(
            "paymentModal"
        );

    const closeButton =
        document.getElementById(
            "closePayment"
        );

    const chooseButton =
        document.getElementById(
            "paymentChooseFile"
        );

    const fileInput =
        document.getElementById(
            "paymentProofInput"
        );


    /* =====================================================
       TUTUP MODAL
    ===================================================== */

    closeButton?.addEventListener(
        "click",
        () => {

            closePaymentModal();

        }
    );


    /* =====================================================
       KLIK AREA GELAP UNTUK TUTUP
    ===================================================== */

    modal?.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closePaymentModal();

            }

        }
    );


    /* =====================================================
       TOMBOL PILIH BUKTI
    ===================================================== */

    chooseButton?.addEventListener(
        "click",
        () => {

            fileInput?.click();

        }
    );

}

/* =====================================================
   FILE BUKTI DIPILIH
===================================================== */

document.getElementById("paymentProofInput")?.addEventListener(
    "change",
    event => {

        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }


        /* CEK FORMAT GAMBAR */

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {

            alert(
                "Bukti pembayaran harus JPG, PNG, atau WEBP."
            );

            fileInput.value = "";

            return;
        }


        /* CEK UKURAN MAKSIMAL 5 MB */

        if (file.size > 5 * 1024 * 1024) {

            alert(
                "Ukuran gambar maksimal 5 MB."
            );

            fileInput.value = "";

            return;
        }


        /* SIMPAN FILE */

        selectedPaymentFile = file;


        /* AMBIL ELEMENT PREVIEW */

        const preview =
            document.getElementById(
                "paymentPreview"
            );

        const previewImage =
            document.getElementById(
                "paymentPreviewImage"
            );

        const fileName =
            document.getElementById(
                "paymentFileName"
            );

        const fileSize =
            document.getElementById(
                "paymentFileSize"
            );


        /* TAMPILKAN FOTO */

        if (previewImage) {

            previewImage.src =
                URL.createObjectURL(file);

        }

        if (fileName) {

            fileName.textContent =
                file.name;

        }

        if (fileSize) {

            fileSize.textContent =
                (
                    file.size /
                    1024 /
                    1024
                ).toFixed(2) + " MB";

        }

        const paymentChooseButton =
    document.getElementById(
        "paymentChooseFile"
    );

if (paymentChooseButton) {

    paymentChooseButton.hidden = true;

}
            preview.hidden = false;

        }

);

/* =========================================================
   KONTAK
========================================================= */

function setupContactForm() {

    const form =
        document.getElementById(
            "contactForm"
        );


    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                document
                    .getElementById(
                        "contactName"
                    )
                    ?.value
                    .trim();


            const phone =
                document
                    .getElementById(
                        "contactPhone"
                    )
                    ?.value
                    .trim();


            const message =
                document
                    .getElementById(
                        "contactMessage"
                    )
                    ?.value
                    .trim();


            if (
                !name ||
                !message
            ) {

                alert(
                    "Nama dan pesan wajib diisi."
                );

                return;

            }

                        const whatsappMessage =
`Assalamu'alaikum.

Saya ingin menghubungi Kampus Al-Qur'an Widya Silahudin Shidiq.

Nama: ${name}
No. WhatsApp: ${phone || "-"}

Pesan:
${message}`;

            const whatsappURL =
                "https://wa.me/" +
                WEBSITE_INFO.whatsapp +
                "?text=" +
                encodeURIComponent(
                    whatsappMessage
                );


            window.open(
                whatsappURL,
                "_blank"
            );

        }
    );

}


/* =========================================================
   NAVBAR
========================================================= */

function setupNavbar() {

    const navbar =
        document.getElementById(
            "navbar"
        );


    const menuButton =
        document.getElementById(
            "menuButton"
        );


    const navLinks =
        document.getElementById(
            "navLinks"
        );


    if (
        menuButton &&
        navLinks
    ) {

        menuButton.addEventListener(
            "click",
            () => {

                navLinks.classList.toggle(
                    "open"
                );

            }
        );


        navLinks
            .querySelectorAll("a")
            .forEach(
                link => {

                    link.addEventListener(
                        "click",
                        () => {

                            navLinks.classList.remove(
                                "open"
                            );

                        }
                    );

                }
            );

    }


    function updateNavbar() {

        if (!navbar) {
            return;
        }


        navbar.classList.toggle(
            "scrolled",
            window.scrollY > 30
        );

    }


    updateNavbar();


    window.addEventListener(
        "scroll",
        updateNavbar,
        {
            passive: true
        }
    );

}


/* =========================================================
   SMOOTH SCROLL
========================================================= */

function setupSmoothScroll() {

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    event => {

                        const href =
                            link.getAttribute(
                                "href"
                            );


                        if (
                            !href ||
                            href === "#"
                        ) {

                            return;

                        }


                        const target =
                            document.querySelector(
                                href
                            );


                        if (!target) {
                            return;
                        }


                        event.preventDefault();


                        target.scrollIntoView({
                            behavior:
                                "smooth",

                            block:
                                "start"
                        });

                    }
                );

            }
        );

}


/* =========================================================
   ACTIVE NAVIGATION
========================================================= */

function setupActiveNavigation() {

    const sections =
        document.querySelectorAll(
            "section[id]"
        );


    const links =
        document.querySelectorAll(
            '.nav-links a[href^="#"]'
        );


    if (
        !sections.length ||
        !links.length
    ) {

        return;

    }


    function updateActiveNavigation() {

        let currentSection =
            "";


        sections.forEach(
            section => {

                const top =
                    section.offsetTop -
                    180;


                if (
                    window.scrollY >=
                    top
                ) {

                    currentSection =
                        section.id;

                }

            }
        );


        links.forEach(
            link => {

                const href =
                    link
                        .getAttribute(
                            "href"
                        )
                        ?.replace(
                            "#",
                            ""
                        );


                link.classList.toggle(
                    "active",
                    href ===
                    currentSection
                );

            }
        );

    }


    updateActiveNavigation();


    window.addEventListener(
        "scroll",
        updateActiveNavigation,
        {
            passive: true
        }
    );

}


/* =========================================================
   REVEAL ANIMATION
========================================================= */

function setupRevealAnimation() {

    const elements =
        document.querySelectorAll(
            ".reveal"
        );


    if (!elements.length) {
        return;
    }


    if (
        !(
            "IntersectionObserver"
            in window
        )
    ) {

        elements.forEach(
            element => {

                element.classList.add(
                    "visible"
                );

            }
        );

        return;

    }


    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target
                                .classList
                                .add(
                                    "visible"
                                );


                            observer.unobserve(
                                entry.target
                            );

                        }

                    }
                );

            },
            {
                threshold:
                    0.12
            }
        );


    elements.forEach(
        element => {

            observer.observe(
                element
            );

        }
    );

}


/* =========================================================
   ESCAPE KEY
========================================================= */

function setupEscapeKey() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;

            }


            const activityOverlay =
                document.getElementById(
                    "activityDetailOverlay"
                );


            if (
                activityOverlay
                    ?.classList
                    .contains(
                        "open"
                    )
            ) {

                closeActivityDetail();

                return;

            }


            const productOverlay =
                document.getElementById(
                    "productDetailOverlay"
                );


            if (
                productOverlay
                    ?.classList
                    .contains(
                        "open"
                    )
            ) {

                closeProductDetail();

                return;

            }


            const checkoutModal =
                document.getElementById(
                    "checkoutModal"
                );


            if (
                checkoutModal
                    ?.classList
                    .contains(
                        "open"
                    )
            ) {

                closeCheckout();

                return;

            }


            const cartOverlay =
                document.getElementById(
                    "cartOverlay"
                );


            if (
                cartOverlay
                    ?.classList
                    .contains(
                        "open"
                    )
            ) {

                closeCart();

            }

        }
    );

}


/* =========================================================
   IMAGE ERROR HANDLER
========================================================= */

function setupImageErrorHandler() {

    document.addEventListener(
        "error",
        event => {

            const target =
                event.target;


            if (
                !target ||
                target.tagName !==
                "IMG"
            ) {

                return;

            }


            const parent =
                target.parentElement;


            if (!parent) {
                return;
            }


            /*
               Jangan proses gambar
               yang sudah pernah error.
            */

            if (
                target.dataset
                    .imageErrorHandled ===
                "true"
            ) {

                return;

            }


            target.dataset
                .imageErrorHandled =
                "true";


            target.style.display =
                "none";


            /*
               Buat placeholder hanya jika
               belum ada placeholder.
            */

            if (
                !parent.querySelector(
                    ".image-error-placeholder"
                )
            ) {

                const placeholder =
                    document.createElement(
                        "div"
                    );


                placeholder.className =
                    "image-error-placeholder";


                placeholder.innerHTML =
                    "🖼️";


                parent.appendChild(
                    placeholder
                );

            }

        },
        true
    );

}


/* =========================================================
   REALTIME PRODUK
========================================================= */

function setupProductRealtime() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        return;

    }


    try {

        supabaseClient
            .channel(
                "produk-public-realtime"
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "produk"
                },
                async () => {

                    try {

                        await loadProducts();

                    } catch (
                        error
                    ) {

                        console.warn(
                            "Realtime produk refresh gagal:",
                            error
                        );

                    }

                }
            )
            .subscribe();

    } catch (error) {

        console.warn(
            "Realtime produk tidak dapat diaktifkan:",
            error
        );

    }

}


/* =========================================================
   REALTIME KEGIATAN
========================================================= */

function setupActivityRealtime() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        return;

    }


    try {

        supabaseClient
            .channel(
                "kegiatan-public-realtime"
            )
            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "kegiatan"
                },
                async () => {

                    try {

                        await loadActivities();

                    } catch (
                        error
                    ) {

                        console.warn(
                            "Realtime kegiatan refresh gagal:",
                            error
                        );

                    }

                }
            )
            .subscribe();

    } catch (error) {

        console.warn(
            "Realtime kegiatan tidak dapat diaktifkan:",
            error
        );

    }

}


/* =========================================================
   REFRESH SAAT TAB AKTIF LAGI
========================================================= */

function setupVisibilityRefresh() {

    document.addEventListener(
        "visibilitychange",
        async () => {

            if (
                document.visibilityState !==
                "visible"
            ) {

                return;

            }


            try {

                await Promise.all([
                    loadProducts(),
                    loadActivities()
                ]);

            } catch (error) {

                console.warn(
                    "Refresh data gagal:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   REFRESH SAAT ONLINE LAGI
========================================================= */

function setupOnlineRefresh() {

    window.addEventListener(
        "online",
        async () => {

            try {

                await Promise.all([
                    loadProducts(),
                    loadActivities()
                ]);

            } catch (error) {

                console.warn(
                    "Refresh setelah online gagal:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   FOOTER YEAR
========================================================= */

function setupFooterYear() {

    const year =
        document.getElementById(
            "currentYear"
        );


    if (year) {

        year.textContent =
            new Date()
                .getFullYear();

    }

}


/* =========================================================
   EXTERNAL LINKS
========================================================= */

function setupExternalLinks() {

    document
        .querySelectorAll(
            'a[target="_blank"]'
        )
        .forEach(
            link => {

                const rel =
                    link.getAttribute(
                        "rel"
                    ) || "";


                const values =
                    new Set(
                        rel
                            .split(/\s+/)
                            .filter(Boolean)
                    );


                values.add(
                    "noopener"
                );


                values.add(
                    "noreferrer"
                );


                link.setAttribute(
                    "rel",
                    Array.from(
                        values
                    ).join(" ")
                );

            }
        );

}


/* =========================================================
   PREVENT DOUBLE SUBMIT
========================================================= */

function setupFormProtection() {

    document
        .querySelectorAll(
            "form"
        )
        .forEach(
            form => {

                form.addEventListener(
                    "submit",
                    () => {

                        const submit =
                            form.querySelector(
                                'button[type="submit"]'
                            );


                        if (!submit) {
                            return;
                        }


                        /*
                           Checkout punya sistem
                           loading sendiri.
                        */

                        if (
                            form.id ===
                            "checkoutForm"
                        ) {

                            return;

                        }


                        const oldText =
                            submit.textContent;


                        submit.disabled =
                            true;


                        setTimeout(
                            () => {

                                submit.disabled =
                                    false;


                                submit.textContent =
                                    oldText;

                            },
                            1500
                        );

                    }
                );

            }
        );

}


/* =========================================================
   UPDATE STATUS INTERNET
========================================================= */

function setupConnectionStatus() {

    function updateStatus() {

        document.body
            .classList
            .toggle(
                "offline",
                !navigator.onLine
            );

    }


    updateStatus();


    window.addEventListener(
        "online",
        updateStatus
    );


    window.addEventListener(
        "offline",
        updateStatus
    );

}


/* =========================================================
   SANITIZE CART
========================================================= */

function sanitizeCart() {

    if (
        !Array.isArray(
            cart
        )
    ) {

        cart = [];

        saveCart();

        return;

    }


    cart =
        cart
            .map(
                item => {

                    const id =
                        Number(
                            item?.id
                        );


                    const quantity =
                        Number(
                            item?.quantity
                        );


                    if (
                        !Number.isFinite(
                            id
                        ) ||
                        !Number.isFinite(
                            quantity
                        ) ||
                        quantity <= 0
                    ) {

                        return null;

                    }


                    return {
                        id,
                        quantity:
                            Math.floor(
                                quantity
                            )
                    };

                }
            )
            .filter(Boolean);


    saveCart();

}


/* =========================================================
   HANDLE GLOBAL CLICK
========================================================= */

function setupGlobalClick() {

    document.addEventListener(
        "click",
        event => {

            /*
               Tutup mobile navigation
               jika klik di luar menu.
            */

            const navLinks =
                document.getElementById(
                    "navLinks"
                );


            const menuButton =
                document.getElementById(
                    "menuButton"
                );


            if (
                navLinks &&
                menuButton &&
                navLinks.classList
                    .contains(
                        "open"
                    )
            ) {

                const clickedInsideNav =
                    navLinks.contains(
                        event.target
                    );


                const clickedMenu =
                    menuButton.contains(
                        event.target
                    );


                if (
                    !clickedInsideNav &&
                    !clickedMenu
                ) {

                    navLinks.classList
                        .remove(
                            "open"
                        );

                }

            }

        }
    );

}


/* =========================================================
   PREVENT INVALID CART VALUE
========================================================= */

function validateCartAgainstProducts() {

    let changed =
        false;


    cart =
        cart
            .map(
                item => {

                    const product =
                        getProduct(
                            item.id
                        );


                    if (!product) {

                        changed =
                            true;

                        return null;

                    }


                    const stock =
                        Math.max(
                            0,
                            Number(
                                product.stok
                            ) || 0
                        );


                    if (
                        product.tersedia ===
                        false ||
                        stock <= 0
                    ) {

                        changed =
                            true;

                        return null;

                    }


                    const quantity =
                        Math.min(
                            Math.max(
                                1,
                                Number(
                                    item.quantity
                                ) || 1
                            ),
                            stock
                        );


                    if (
                        quantity !==
                        Number(
                            item.quantity
                        )
                    ) {

                        changed =
                            true;

                    }


                    return {

                        id:
                            Number(
                                item.id
                            ),

                        quantity

                    };

                }
            )
            .filter(Boolean);


    if (changed) {

        saveCart();

    }


    renderCart();

}


/* =========================================================
   UPDATE DATA WEBSITE
========================================================= */

function updateWebsiteInfo() {

    const phoneElements =
        document.querySelectorAll(
            "[data-website-phone]"
        );


    phoneElements.forEach(
        element => {

            element.textContent =
                WEBSITE_INFO.phoneDisplay;

        }
    );


    const addressElements =
        document.querySelectorAll(
            "[data-website-address]"
        );


    addressElements.forEach(
        element => {

            element.textContent =
                WEBSITE_INFO.address;

        }
    );


    const whatsappLinks =
        document.querySelectorAll(
            "[data-whatsapp-link]"
        );


    whatsappLinks.forEach(
        link => {

            link.href =
                "https://wa.me/" +
                WEBSITE_INFO.whatsapp;

        }
    );

}


/* =========================================================
   LAZY VIDEO
========================================================= */

function setupLazyVideos() {

    const videos =
        document.querySelectorAll(
            "video"
        );


    videos.forEach(
        video => {

            video.setAttribute(
                "playsinline",
                ""
            );


            video.addEventListener(
                "play",
                () => {

                    videos.forEach(
                        otherVideo => {

                            if (
                                otherVideo !==
                                video
                            ) {

                                otherVideo.pause();

                            }

                        }
                    );

                }
            );

        }
    );

}


/* =========================================================
   SAFE STORAGE
========================================================= */

function testLocalStorage() {

    try {

        const testKey =
            "__kampus_storage_test__";


        localStorage.setItem(
            testKey,
            "1"
        );


        localStorage.removeItem(
            testKey
        );


        return true;

    } catch {

        console.warn(
            "LocalStorage tidak tersedia."
        );


        return false;

    }

}


/* =========================================================
   HANDLE RESIZE
========================================================= */

function setupResizeHandler() {

    let resizeTimer;


    window.addEventListener(
        "resize",
        () => {

            clearTimeout(
                resizeTimer
            );


            resizeTimer =
                setTimeout(
                    () => {

                        const navLinks =
                            document.getElementById(
                                "navLinks"
                            );


                        if (
                            window.innerWidth >
                            900
                        ) {

                            navLinks
                                ?.classList
                                .remove(
                                    "open"
                                );

                        }

                    },
                    150
                );

        }
    );

}


/* =========================================================
   HANDLE PAGE SHOW
========================================================= */

function setupPageShowRefresh() {

    window.addEventListener(
        "pageshow",
        event => {

            /*
               Saat browser kembali dari
               back-forward cache.
            */

            if (
                event.persisted
            ) {

                renderCart();


                loadProducts()
                    .catch(
                        error => {

                            console.warn(
                                "Refresh produk gagal:",
                                error
                            );

                        }
                    );


                loadActivities()
                    .catch(
                        error => {

                            console.warn(
                                "Refresh kegiatan gagal:",
                                error
                            );

                        }
                    );

            }

        }
    );

}


/* =========================================================
   INIT
========================================================= */

async function initWebsite() {

    addFeatureStyles();

    sanitizeCart();

    createProductSearch();

    createProductDetailModal();

    createActivityDetailModal();

    setupProductFilters();

    setupCartEvents();

    setupCheckoutEvents();

setupCheckoutForm();

setupPaymentEvents();

setupContactForm();

    setupNavbar();

    setupSmoothScroll();

    setupActiveNavigation();

    setupRevealAnimation();

    setupEscapeKey();

    setupImageErrorHandler();

    setupFooterYear();

    setupExternalLinks();

    setupFormProtection();

    setupConnectionStatus();

    setupGlobalClick();

    updateWebsiteInfo();

    setupLazyVideos();

    setupResizeHandler();

    setupPageShowRefresh();

    testLocalStorage();


    try {

        await Promise.all([
            loadProducts(),
            loadActivities()
        ]);


        validateCartAgainstProducts();

    } catch (error) {

        console.error(
            "Initial data load error:",
            error
        );

    }


    setupProductRealtime();

    setupActivityRealtime();

    setupVisibilityRefresh();

    setupOnlineRefresh();

}


/* =========================================================
   START WEBSITE
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initWebsite
    );

} else {

    initWebsite();

}


/* =========================================================
   TOMBOL WHATSAPP
========================================================= */

function setupWhatsAppButtons() {

    document
        .querySelectorAll(
            "[data-whatsapp]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();

                        const customMessage =
                            button.dataset.whatsapp ||
                            "Assalamu'alaikum, saya ingin bertanya mengenai Kampus Al-Qur'an Widya Silahudin Shidiq.";

                        const url =
                            "https://wa.me/" +
                            WEBSITE_INFO.whatsapp +
                            "?text=" +
                            encodeURIComponent(
                                customMessage
                            );

                        window.open(
                            url,
                            "_blank"
                        );

                    }
                );

            }
        );

}

/* =========================================================
   TOMBOL WHATSAPP
========================================================= */

function setupWhatsAppButtons() {

    document
        .querySelectorAll(
            "[data-whatsapp]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        const customMessage =
                            button.dataset
                                .whatsapp ||
                            "Assalamu'alaikum, saya ingin bertanya mengenai Kampus Al-Qur'an Widya Silahudin Shidiq.";


                        const url =

                            "https://wa.me/" +

                            WEBSITE_INFO.whatsapp +

                            "?text=" +

                            encodeURIComponent(
                                customMessage
                            );


                        window.open(
                            url,
                            "_blank"
                        );

                    }
                );

            }
        );

}


/* =========================================================
   NAVBAR
========================================================= */

function setupNavbar() {

    const header =
        document.querySelector(
            "header"
        );


    const menuButton =
        document.getElementById(
            "menuButton"
        ) ||
        document.getElementById(
            "mobileMenuButton"
        );


    const nav =
        document.querySelector(
            ".nav-links"
        ) ||
        document.getElementById(
            "navLinks"
        );


    /* =============================================
       HEADER SCROLL
    ============================================= */

    function updateHeader() {

        if (!header) {
            return;
        }


        header.classList.toggle(
            "scrolled",
            window.scrollY > 30
        );

    }


    updateHeader();


    window.addEventListener(
        "scroll",
        updateHeader,
        {
            passive: true
        }
    );


    /* =============================================
       MOBILE MENU
    ============================================= */

    if (
        menuButton &&
        nav
    ) {

        menuButton.addEventListener(
            "click",
            () => {

                nav.classList.toggle(
                    "open"
                );


                menuButton.classList.toggle(
                    "active"
                );

            }
        );


        nav
            .querySelectorAll("a")
            .forEach(
                link => {

                    link.addEventListener(
                        "click",
                        () => {

                            nav.classList.remove(
                                "open"
                            );


                            menuButton.classList.remove(
                                "active"
                            );

                        }
                    );

                }
            );

    }

}


/* =========================================================
   SMOOTH SCROLL
========================================================= */

function setupSmoothScroll() {

    document
        .querySelectorAll(
            'a[href^="#"]'
        )
        .forEach(
            link => {

                link.addEventListener(
                    "click",
                    event => {

                        const href =
                            link.getAttribute(
                                "href"
                            );


                        if (
                            !href ||
                            href === "#"
                        ) {

                            return;
                        }


                        const target =
                            document.querySelector(
                                href
                            );


                        if (!target) {
                            return;
                        }


                        event.preventDefault();


                        target.scrollIntoView({
                            behavior:
                                "smooth",

                            block:
                                "start"
                        });

                    }
                );

            }
        );

}


/* =========================================================
   ESCAPE KEY
========================================================= */

function setupEscapeKey() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;
            }


            const productDetail =
                document.getElementById(
                    "productDetailOverlay"
                );


            if (
                productDetail
                    ?.classList
                    .contains("open")
            ) {

                closeProductDetail();

                return;
            }


            const activityDetail =
                document.getElementById(
                    "activityDetailOverlay"
                );


            if (
                activityDetail
                    ?.classList
                    .contains("open")
            ) {

                closeActivityDetail();

                return;
            }


            const checkout =
                document.getElementById(
                    "checkoutModal"
                );


            if (
                checkout
                    ?.classList
                    .contains("open")
            ) {

                closeCheckout();

                return;
            }


            const cartOverlay =
                document.getElementById(
                    "cartOverlay"
                );


            if (
                cartOverlay
                    ?.classList
                    .contains("open")
            ) {

                closeCart();

            }

        }
    );

}


/* =========================================================
   UPDATE INFORMASI WEBSITE
========================================================= */

function updateWebsiteInformation() {

    /* =============================================
       NOMOR TELEPON
    ============================================= */

    document
        .querySelectorAll(
            "[data-phone]"
        )
        .forEach(
            element => {

                element.textContent =
                    WEBSITE_INFO.phoneDisplay;

            }
        );


    /* =============================================
       ALAMAT
    ============================================= */

    document
        .querySelectorAll(
            "[data-address]"
        )
        .forEach(
            element => {

                element.textContent =
                    WEBSITE_INFO.address;

            }
        );


    /* =============================================
       LINK WHATSAPP
    ============================================= */

    document
        .querySelectorAll(
            "[data-whatsapp-link]"
        )
        .forEach(
            element => {

                element.href =
                    "https://wa.me/" +
                    WEBSITE_INFO.whatsapp;

            }
        );

}


/* =========================================================
   CEK SUPABASE
========================================================= */

function checkSupabaseConnection() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        console.error(
            "❌ supabaseClient tidak ditemukan."
        );


        console.error(
            "Pastikan supabase-config.js dimuat sebelum script.js."
        );


        return false;

    }


    return true;

}


/* =========================================================
   TEST DATABASE CONNECTION
========================================================= */

async function testDatabaseConnection() {

    if (
        !checkSupabaseConnection()
    ) {

        return false;

    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from("produk")
                .select(
                    "id",
                    {
                        head: true
                    }
                );


        if (error) {

            console.warn(
                "Supabase connection warning:",
                error
            );


            return false;

        }


        console.log(
            "✅ Supabase terhubung."
        );


        return true;


    } catch (error) {

        console.error(
            "Supabase connection error:",
            error
        );


        return false;

    }

}


/* =========================================================
   SETUP GLOBAL CLICK
========================================================= */

function setupGlobalClickEvents() {

    document.addEventListener(
        "click",
        event => {

            /* =========================================
               CLOSE MOBILE NAV SAAT KLIK LUAR
            ========================================= */

            const nav =
                document.querySelector(
                    ".nav-links"
                ) ||
                document.getElementById(
                    "navLinks"
                );


            const menuButton =
                document.getElementById(
                    "menuButton"
                ) ||
                document.getElementById(
                    "mobileMenuButton"
                );


            if (
                !nav ||
                !menuButton ||
                !nav.classList.contains(
                    "open"
                )
            ) {

                return;

            }


            if (
                nav.contains(
                    event.target
                ) ||
                menuButton.contains(
                    event.target
                )
            ) {

                return;

            }


            nav.classList.remove(
                "open"
            );


            menuButton.classList.remove(
                "active"
            );

        }
    );

}


/* =========================================================
   CLEAN CART
========================================================= */

function cleanCartData() {

    if (
        !Array.isArray(
            cart
        )
    ) {

        cart = [];

    }


    cart =
        cart
            .map(
                item => {

                    const id =
                        Number(
                            item?.id
                        );


                    const quantity =
                        Number(
                            item?.quantity
                        );


                    if (
                        !Number.isFinite(id) ||
                        !Number.isFinite(quantity) ||
                        quantity <= 0
                    ) {

                        return null;

                    }


                    return {

                        id,

                        quantity:
                            Math.max(
                                1,
                                Math.floor(
                                    quantity
                                )
                            )

                    };

                }
            )
            .filter(Boolean);


    saveCart();

}


/* =========================================================
   START WEBSITE
========================================================= */

async function initializeWebsite() {

    console.log(
        "=============================================="
    );

    console.log(
        "Kampus Al-Qur'an Widya Silahudin Shidiq"
    );

    console.log(
        "Website sedang dimulai..."
    );

    console.log(
        "=============================================="
    );


    /* =============================================
       STYLE
    ============================================= */

    addFeatureStyles();


    /* =============================================
       BERSIHKAN CART
    ============================================= */

    cleanCartData();


    /* =============================================
       MODAL DINAMIS
    ============================================= */

    createProductDetailModal();

    createActivityDetailModal();


    /* =============================================
       SEARCH
    ============================================= */

    createProductSearch();


    /* =============================================
       EVENTS
    ============================================= */

    setupProductFilters();

    setupCartEvents();

    setupCheckoutEvents();

    setupCheckoutForm();

    setupContactForm();

    setupWhatsAppButtons();

    setupNavbar();

    setupSmoothScroll();

    setupEscapeKey();

    setupGlobalClickEvents();


    /* =============================================
       INFORMASI WEBSITE
    ============================================= */

    updateWebsiteInformation();


    /* =============================================
       RENDER CART AWAL
    ============================================= */

    renderCart();


    /* =============================================
       CEK SUPABASE
    ============================================= */

    if (
        !checkSupabaseConnection()
    ) {

        console.error(
            "Website tidak dapat mengambil data karena Supabase belum tersedia."
        );


        return;

    }


    /* =============================================
       LOAD DATABASE
    ============================================= */

    await Promise.all([

        loadActivities(),

        loadProducts()

    ]);


    /* =============================================
       TEST
    ============================================= */

    testDatabaseConnection();


    console.log(
        "✅ Website berhasil dimuat."
    );

}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeWebsite
    );

} else {

    initializeWebsite();

}


/* =========================================================
   GLOBAL FUNCTIONS
   DIPAKAI OLEH ONCLICK DI HTML
========================================================= */

window.openProductDetail =
    openProductDetail;


window.closeProductDetail =
    closeProductDetail;


window.addToCartFromDetail =
    addToCartFromDetail;


window.openActivityDetail =
    openActivityDetail;


window.closeActivityDetail =
    closeActivityDetail;


window.addToCart =
    addToCart;


window.changeQuantity =
    changeQuantity;


window.removeFromCart =
    removeFromCart;


window.clearCart =
    clearCart;


window.openCart =
    openCart;


window.closeCart =
    closeCart;


window.openCheckout =
    openCheckout;


window.closeCheckout =
    closeCheckout;


/* =========================================================
   END
========================================================= */