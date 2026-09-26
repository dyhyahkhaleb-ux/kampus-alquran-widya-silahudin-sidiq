/* =========================================================
   KAMPUS AL-QUR'AN WIDYA SILAHUDIN SHIDIQ
   WEBSITE UTAMA
   SUPABASE + GALERI + TOKO + KERANJANG
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
   BATAS DATA
========================================================= */

const WEBSITE_LIMITS = {

    hargaMaksimal: 100000000,

    stokMaksimal: 99999,

    judulKegiatan: 80,

    deskripsiKegiatan: 180,

    namaProduk: 60,

    deskripsiProduk: 140

};


/* =========================================================
   DATA
========================================================= */

let PRODUCTS = [];

let KEGIATAN = [];

let activeCategory = "semua";


let cart = JSON.parse(
    localStorage.getItem(
        "kampusWidyaCart"
    ) || "[]"
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

    const value =
        Number(number);


    if (
        !Number.isFinite(value)
    ) {

        return "Rp0";

    }


    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(value);

}


function formatTanggal(date) {

    if (!date) {

        return "";

    }


    try {

        const value =
            new Date(
                date + "T00:00:00"
            );


        return new Intl.DateTimeFormat(
            "id-ID",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(value);

    }

    catch {

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


function isValidProductPrice(price) {

    const value =
        Number(price);


    return (
        Number.isFinite(value) &&
        value >= 0 &&
        value <= WEBSITE_LIMITS.hargaMaksimal
    );

}


function getSafeStock(stock) {

    const value =
        Number(stock);


    if (
        !Number.isFinite(value) ||
        value < 0
    ) {

        return 0;

    }


    return Math.min(
        Math.floor(value),
        WEBSITE_LIMITS.stokMaksimal
    );

}


function truncateText(
    text,
    maximum
) {

    const value =
        String(text ?? "");


    if (
        value.length <= maximum
    ) {

        return value;

    }


    return (
        value.slice(
            0,
            maximum
        ) +
        "..."
    );

}


/* =========================================================
   KEGIATAN
   AMBIL DARI SUPABASE
========================================================= */

async function loadKegiatan() {

    const container =
        document.getElementById(
            "galleryGrid"
        );


    if (!container) {

        console.error(
            "Elemen #galleryGrid tidak ditemukan."
        );

        return;

    }


    container.innerHTML = `

        <div class="loading-data">

            <span class="loading-icon">
                ⏳
            </span>

            <strong>
                Memuat dokumentasi kegiatan...
            </strong>

        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("kegiatan")
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


        KEGIATAN =
            data || [];


        console.log(
            "Kegiatan berhasil dimuat:",
            KEGIATAN
        );


        renderGallery();

    }

    catch (error) {

        console.error(
            "Gagal mengambil kegiatan:",
            error
        );


        container.innerHTML = `

            <div
                class="
                    loading-data
                    error-data
                "
            >

                <span class="loading-icon">
                    ⚠️
                </span>

                <strong>
                    Dokumentasi kegiatan gagal dimuat
                </strong>

                <small>
                    ${escapeHTML(
                        error.message ||
                        "Terjadi kesalahan."
                    )}
                </small>

            </div>

        `;

    }

}


/* =========================================================
   TAMPILKAN KEGIATAN
========================================================= */

function renderGallery() {

    const container =
        document.getElementById(
            "galleryGrid"
        );


    if (!container) {

        return;

    }


    if (!KEGIATAN.length) {

        container.innerHTML = `

            <div class="loading-data">

                <span class="loading-icon">
                    📷
                </span>

                <strong>
                    Belum ada dokumentasi kegiatan
                </strong>

                <small>
                    Dokumentasi kegiatan akan tampil di sini.
                </small>

            </div>

        `;


        return;

    }


    container.innerHTML =
        KEGIATAN
            .map(item => {


                const rawJudul =
                    truncateText(
                        item.judul ||
                        "Kegiatan Kampus",
                        WEBSITE_LIMITS.judulKegiatan
                    );


                const rawDeskripsi =
                    truncateText(
                        item.deskripsi ||
                        "",
                        WEBSITE_LIMITS.deskripsiKegiatan
                    );


                const judul =
                    escapeHTML(
                        rawJudul
                    );


                const deskripsi =
                    escapeHTML(
                        rawDeskripsi
                    );


                const mediaURL =
                    item.foto_url ||
                    "";


                let mediaHTML =
                    "";


                /* ==========================================
                   VIDEO
                ========================================== */

                if (
                    mediaURL &&
                    isVideoFile(
                        mediaURL
                    )
                ) {

                    mediaHTML = `

                        <video
                            class="
                                gallery-image
                                gallery-video
                            "
                            controls
                            preload="metadata"
                        >

                            <source
                                src="${mediaURL}"
                            >

                            Browser tidak mendukung video.

                        </video>

                    `;

                }


                /* ==========================================
                   FOTO
                ========================================== */

                else if (mediaURL) {

                    mediaHTML = `

                        <img
                            src="${mediaURL}"
                            alt="${judul}"
                            class="gallery-image"
                            loading="lazy"

                            onerror="
                                this.style.display='none';
                                this.nextElementSibling.style.display='flex';
                            "
                        >


                        <div
                            class="gallery-placeholder"
                        >

                            <span>
                                📷
                            </span>

                            <strong>
                                Foto tidak dapat dimuat
                            </strong>

                        </div>

                    `;

                }


                /* ==========================================
                   TANPA MEDIA
                ========================================== */

                else {

                    mediaHTML = `

                        <div
                            class="gallery-placeholder"
                            style="display:flex"
                        >

                            <span>
                                📷
                            </span>

                            <strong>
                                Belum ada media
                            </strong>

                        </div>

                    `;

                }


                return `

                    <article
                        class="gallery-card"
                    >

                        <div
                            class="gallery-media"
                        >

                            ${mediaHTML}

                        </div>


                        <div
                            class="gallery-info"
                        >

                            <h3>
                                ${judul}
                            </h3>


                            ${
                                deskripsi
                                ?
                                `

                                <p>
                                    ${deskripsi}
                                </p>

                                `
                                :
                                ""
                            }


                            ${
                                item.tanggal
                                ?
                                `

                                <small>
                                    ${
                                        formatTanggal(
                                            item.tanggal
                                        )
                                    }
                                </small>

                                `
                                :
                                ""
                            }

                        </div>

                    </article>

                `;


            })
            .join("");

}


/* =========================================================
   PRODUK
   AMBIL DARI SUPABASE
========================================================= */

async function loadProducts() {

    const container =
        document.getElementById(
            "productGrid"
        );


    if (!container) {

        console.error(
            "Elemen #productGrid tidak ditemukan."
        );

        return;

    }


    container.innerHTML = `

        <div class="loading-data">

            <span class="loading-icon">
                ⏳
            </span>

            <strong>
                Memuat produk...
            </strong>

        </div>

    `;


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


        /*
           Bersihkan isi keranjang jika produknya
           sudah dihapus dari database.
        */

        cart =
            cart.filter(item =>

                PRODUCTS.some(
                    product =>
                        Number(product.id) ===
                        Number(item.id)
                )

            );


        saveCart();

        renderFilters();

        renderProducts();

        renderCart();

    }

    catch (error) {

        console.error(
            "Gagal mengambil produk:",
            error
        );


        container.innerHTML = `

            <div
                class="
                    loading-data
                    error-data
                "
            >

                <span class="loading-icon">
                    ⚠️
                </span>

                <strong>
                    Produk gagal dimuat
                </strong>

                <small>
                    ${
                        escapeHTML(
                            error.message ||
                            "Terjadi kesalahan."
                        )
                    }
                </small>

            </div>

        `;

    }

}


/* =========================================================
   FILTER PRODUK
========================================================= */

function renderFilters() {

    const container =
        document.getElementById(
            "productFilters"
        );


    if (!container) {

        return;

    }


    const categories = [

        "semua",

        ...new Set(

            PRODUCTS
                .map(
                    product =>
                        product.kategori
                )
                .filter(Boolean)

        )

    ];


    container.innerHTML =
        categories
            .map(category => {


                let label =
                    category;


                if (
                    category ===
                    "semua"
                ) {

                    label =
                        "Semua";

                }

                else {

                    label =
                        String(category)
                            .charAt(0)
                            .toUpperCase()
                        +
                        String(category)
                            .slice(1);

                }


                return `

                    <button
                        type="button"

                        class="
                            filter-button
                            ${
                                activeCategory === category
                                ?
                                "active"
                                :
                                ""
                            }
                        "

                        data-category="${
                            escapeHTML(
                                category
                            )
                        }"
                    >

                        ${
                            escapeHTML(
                                label
                            )
                        }

                    </button>

                `;


            })
            .join("");


    document
        .querySelectorAll(
            ".filter-button"
        )
        .forEach(button => {


            button.addEventListener(
                "click",
                () => {


                    activeCategory =
                        button.dataset.category;


                    renderFilters();

                    renderProducts();

                }
            );


        });

}


/* =========================================================
   TAMPILKAN PRODUK
========================================================= */

function renderProducts() {

    const container =
        document.getElementById(
            "productGrid"
        );


    if (!container) {

        return;

    }


    let products =
        PRODUCTS;


    if (
        activeCategory !==
        "semua"
    ) {

        products =
            PRODUCTS.filter(

                product =>
                    product.kategori ===
                    activeCategory

            );

    }


    if (!products.length) {

        container.innerHTML = `

            <div class="loading-data">

                <span class="loading-icon">
                    🛍️
                </span>

                <strong>
                    Belum ada produk
                </strong>

                <small>
                    Produk karya santri akan tampil di sini.
                </small>

            </div>

        `;


        return;

    }


    container.innerHTML =
        products
            .map(product => {


                const harga =
                    Number(
                        product.harga
                    );


                const hargaValid =
                    isValidProductPrice(
                        harga
                    );


                const stok =
                    getSafeStock(
                        product.stok
                    );


                const tersedia =
                    product.tersedia !== false &&
                    stok > 0 &&
                    hargaValid;


                const nama =
                    escapeHTML(

                        truncateText(
                            product.nama ||
                            "Produk",
                            WEBSITE_LIMITS.namaProduk
                        )

                    );


                const kategori =
                    escapeHTML(
                        product.kategori ||
                        "Produk"
                    );


                const deskripsi =
                    escapeHTML(

                        truncateText(
                            product.deskripsi ||
                            "",
                            WEBSITE_LIMITS.deskripsiProduk
                        )

                    );


                return `

                    <article
                        class="product-card"
                    >


                        <div
                            class="product-image-wrapper"
                        >


                            ${
                                product.foto_url
                                ?
                                `

                                <img
                                    src="${product.foto_url}"

                                    alt="${nama}"

                                    class="product-image"

                                    loading="lazy"

                                    onerror="
                                        this.style.display='none';
                                        this.nextElementSibling.style.display='flex';
                                    "
                                >


                                <div
                                    class="product-placeholder"
                                >

                                    <span>
                                        🛍️
                                    </span>

                                    <small>
                                        Foto tidak dapat dimuat
                                    </small>

                                </div>

                                `
                                :
                                `

                                <div
                                    class="product-placeholder"
                                    style="display:flex"
                                >

                                    <span>
                                        🛍️
                                    </span>

                                    <small>
                                        Belum ada foto
                                    </small>

                                </div>

                                `
                            }


                        </div>


                        <div
                            class="product-content"
                        >


                            <span
                                class="product-category"
                            >

                                ${kategori}

                            </span>


                            <h3>

                                ${nama}

                            </h3>


                            ${
                                deskripsi
                                ?
                                `

                                <p>
                                    ${deskripsi}
                                </p>

                                `
                                :
                                ""
                            }


                            <div
                                class="stock-status"
                            >


                                ${
                                    !hargaValid
                                    ?
                                    `

                                    <span
                                        class="sold-out"
                                    >
                                        ● Harga perlu diperbaiki
                                    </span>

                                    `
                                    :
                                    tersedia
                                    ?
                                    `

                                    <span
                                        class="available"
                                    >
                                        ● Tersedia
                                    </span>


                                    <small>
                                        Stok ${stok}
                                    </small>

                                    `
                                    :
                                    `

                                    <span
                                        class="sold-out"
                                    >
                                        ● Habis
                                    </span>

                                    `
                                }


                            </div>


                            <div
                                class="product-bottom"
                            >


                                <span
                                    class="
                                        product-price
                                        ${
                                            !hargaValid
                                            ?
                                            "invalid-price"
                                            :
                                            ""
                                        }
                                    "
                                >

                                    ${
                                        hargaValid
                                        ?
                                        formatRupiah(
                                            harga
                                        )
                                        :
                                        "Harga tidak valid"
                                    }

                                </span>


                                <button
                                    type="button"

                                    class="add-cart"

                                    onclick="
                                        addToCart(
                                            ${Number(product.id)}
                                        )
                                    "

                                    ${
                                        !tersedia
                                        ?
                                        "disabled"
                                        :
                                        ""
                                    }
                                >

                                    ${
                                        !hargaValid
                                        ?
                                        "Tidak tersedia"
                                        :
                                        tersedia
                                        ?
                                        "+ Keranjang"
                                        :
                                        "Habis"
                                    }

                                </button>


                            </div>


                        </div>


                    </article>

                `;


            })
            .join("");

}


/* =========================================================
   SIMPAN KERANJANG
========================================================= */

function saveCart() {

    localStorage.setItem(

        "kampusWidyaCart",

        JSON.stringify(
            cart
        )

    );

}


/* =========================================================
   CARI PRODUK
========================================================= */

function getProduct(id) {

    return PRODUCTS.find(

        product =>
            Number(product.id) ===
            Number(id)

    );

}


/* =========================================================
   TAMBAH KE KERANJANG
========================================================= */

function addToCart(id) {

    const product =
        getProduct(id);


    if (!product) {

        alert(
            "Produk tidak ditemukan."
        );

        return;

    }


    const harga =
        Number(
            product.harga
        );


    if (
        !isValidProductPrice(
            harga
        )
    ) {

        alert(
            "Harga produk ini perlu diperbaiki oleh admin."
        );

        return;

    }


    const stok =
        getSafeStock(
            product.stok
        );


    if (
        product.tersedia === false ||
        stok <= 0
    ) {

        alert(
            "Produk sedang tidak tersedia."
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
            existing.quantity >=
            stok
        ) {

            alert(
                "Jumlah sudah mencapai stok yang tersedia."
            );

            return;

        }


        existing.quantity++;

    }

    else {

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
   UBAH JUMLAH KERANJANG
========================================================= */

function changeQuantity(
    id,
    amount
) {

    const product =
        getProduct(id);


    const item =
        cart.find(

            cartItem =>
                Number(cartItem.id) ===
                Number(id)

        );


    if (
        !product ||
        !item
    ) {

        return;

    }


    const stok =
        getSafeStock(
            product.stok
        );


    if (
        amount > 0 &&
        item.quantity >= stok
    ) {

        alert(
            "Jumlah sudah mencapai stok yang tersedia."
        );

        return;

    }


    item.quantity +=
        amount;


    if (
        item.quantity <= 0
    ) {

        cart =
            cart.filter(

                cartItem =>
                    Number(cartItem.id) !==
                    Number(id)

            );

    }


    saveCart();

    renderCart();

}


/* =========================================================
   HAPUS SATU PRODUK DARI KERANJANG
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
   TAMPILKAN KERANJANG
========================================================= */

function renderCart() {

    const countElement =
        document.getElementById(
            "cartCount"
        );


    const itemsElement =
        document.getElementById(
            "cartItems"
        );


    const totalElement =
        document.getElementById(
            "cartTotal"
        );


    if (
        !countElement ||
        !itemsElement ||
        !totalElement
    ) {

        return;

    }


    /*
       Buang item yang produknya sudah
       tidak ada atau harganya tidak valid.
    */

    cart =
        cart.filter(item => {


            const product =
                getProduct(
                    item.id
                );


            if (!product) {

                return false;

            }


            return isValidProductPrice(
                product.harga
            );

        });


    const totalItems =
        cart.reduce(

            (total, item) =>
                total +
                Number(
                    item.quantity
                ),

            0

        );


    countElement.textContent =
        totalItems;


    if (!cart.length) {

        itemsElement.innerHTML = `

            <div
                class="empty-cart"
            >

                <span>
                    🛒
                </span>

                <strong>
                    Keranjang masih kosong
                </strong>

                <small>
                    Pilih karya santri
                    yang ingin dibeli.
                </small>

            </div>

        `;


        totalElement.textContent =
            "Rp0";


        saveCart();


        return;

    }


    let totalPrice =
        0;


    itemsElement.innerHTML =
        cart
            .map(item => {


                const product =
                    getProduct(
                        item.id
                    );


                if (!product) {

                    return "";

                }


                const harga =
                    Number(
                        product.harga
                    );


                if (
                    !isValidProductPrice(
                        harga
                    )
                ) {

                    return "";

                }


                const stok =
                    getSafeStock(
                        product.stok
                    );


                if (
                    item.quantity >
                    stok
                ) {

                    item.quantity =
                        Math.max(
                            stok,
                            1
                        );

                }


                const subtotal =
                    harga *
                    Number(
                        item.quantity
                    );


                totalPrice +=
                    subtotal;


                const nama =
                    escapeHTML(
                        truncateText(
                            product.nama ||
                            "Produk",
                            WEBSITE_LIMITS.namaProduk
                        )
                    );


                return `

                    <div
                        class="cart-item"
                    >


                        <div
                            class="cart-item-info"
                        >

                            <h4>
                                ${nama}
                            </h4>


                            <small>

                                ${
                                    formatRupiah(
                                        harga
                                    )
                                }

                                ×

                                ${item.quantity}

                            </small>

                        </div>


                        <div
                            class="cart-item-actions"
                        >


                            <div
                                class="cart-quantity"
                            >


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


                                <b>
                                    ${item.quantity}
                                </b>


                                <button
                                    type="button"

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


                            <button
                                type="button"

                                class="remove-cart-item"

                                onclick="
                                    removeFromCart(
                                        ${Number(product.id)}
                                    )
                                "

                                title="Hapus produk"
                            >

                                ×

                            </button>


                        </div>


                    </div>

                `;


            })
            .join("");


    totalElement.textContent =
        formatRupiah(
            totalPrice
        );


    saveCart();

}


/* =========================================================
   BUKA KERANJANG
========================================================= */

function openCart() {

    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    if (overlay) {

        overlay.classList.add(
            "open"
        );

    }


    document.body.classList.add(
        "no-scroll"
    );

}


/* =========================================================
   TUTUP KERANJANG
========================================================= */

function closeCart() {

    const overlay =
        document.getElementById(
            "cartOverlay"
        );


    if (overlay) {

        overlay.classList.remove(
            "open"
        );

    }


    document.body.classList.remove(
        "no-scroll"
    );

}


/* =========================================================
   EVENT KERANJANG
========================================================= */

document
    .getElementById(
        "cartButton"
    )
    ?.addEventListener(
        "click",
        openCart
    );


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
        "cartBackground"
    )
    ?.addEventListener(
        "click",
        closeCart
    );


document
    .getElementById(
        "clearCart"
    )
    ?.addEventListener(
        "click",
        () => {


            if (!cart.length) {

                return;

            }


            const yakin =
                confirm(
                    "Kosongkan semua isi keranjang?"
                );


            if (!yakin) {

                return;

            }


            cart = [];


            saveCart();

            renderCart();

        }
    );


/* =========================================================
   CHECKOUT
========================================================= */

document
    .getElementById(
        "checkoutButton"
    )
    ?.addEventListener(
        "click",
        () => {


            if (!cart.length) {

                alert(
                    "Keranjang masih kosong."
                );

                return;

            }


            const modal =
                document.getElementById(
                    "checkoutModal"
                );


            if (modal) {

                modal.classList.add(
                    "open"
                );

            }

        }
    );


/* =========================================================
   TUTUP CHECKOUT
========================================================= */

document
    .getElementById(
        "closeCheckout"
    )
    ?.addEventListener(
        "click",
        () => {


            document
                .getElementById(
                    "checkoutModal"
                )
                ?.classList
                .remove(
                    "open"
                );

        }
    );


/* =========================================================
   FORM CHECKOUT
========================================================= */

document
    .getElementById(
        "checkoutForm"
    )
    ?.addEventListener(
        "submit",
        event => {


            event.preventDefault();


            if (!cart.length) {

                alert(
                    "Keranjang masih kosong."
                );

                return;

            }


            const name =
                document
                    .getElementById(
                        "customerName"
                    )
                    ?.value
                    .trim() ||
                "";


            const phone =
                document
                    .getElementById(
                        "customerPhone"
                    )
                    ?.value
                    .trim() ||
                "";


            const address =
                document
                    .getElementById(
                        "customerAddress"
                    )
                    ?.value
                    .trim() ||
                "";


            if (!name) {

                alert(
                    "Nama pemesan belum diisi."
                );

                return;

            }


            if (!phone) {

                alert(
                    "Nomor WhatsApp belum diisi."
                );

                return;

            }


            if (!address) {

                alert(
                    "Alamat belum diisi."
                );

                return;

            }


            let totalPrice =
                0;


            const orderLines =
                cart
                    .map(item => {


                        const product =
                            getProduct(
                                item.id
                            );


                        if (!product) {

                            return "";

                        }


                        const harga =
                            Number(
                                product.harga
                            );


                        if (
                            !isValidProductPrice(
                                harga
                            )
                        ) {

                            return "";

                        }


                        const subtotal =
                            harga *
                            Number(
                                item.quantity
                            );


                        totalPrice +=
                            subtotal;


                        return (
                            "- " +
                            product.nama +
                            " x" +
                            item.quantity +
                            " = " +
                            formatRupiah(
                                subtotal
                            )
                        );


                    })
                    .filter(Boolean);


            if (
                !orderLines.length
            ) {

                alert(
                    "Tidak ada produk valid untuk dipesan."
                );

                return;

            }


            const message =
`Assalamu'alaikum.

Saya ingin memesan karya dari Toko Karya Santri Kampus Al-Qur'an Widya Silahudin Shidiq.

Nama: ${name}
No. WhatsApp: ${phone}

Alamat:
${address}

Pesanan:
${orderLines.join("\n")}

Total: ${formatRupiah(totalPrice)}

Mohon informasi ketersediaan produk dan cara pembayarannya.

Terima kasih.`;


            const whatsappURL =

                "https://wa.me/" +

                WEBSITE_INFO.whatsapp +

                "?text=" +

                encodeURIComponent(
                    message
                );


            window.open(
                whatsappURL,
                "_blank"
            );

        }
    );


/* =========================================================
   KONTAK
========================================================= */

const addressElement =
    document.getElementById(
        "addressText"
    );


if (addressElement) {

    addressElement.textContent =
        WEBSITE_INFO.address;

}


const phoneElement =
    document.getElementById(
        "phoneText"
    );


if (phoneElement) {

    phoneElement.textContent =
        WEBSITE_INFO.phoneDisplay;

}


/* =========================================================
   WHATSAPP KONTAK
========================================================= */

document
    .getElementById(
        "contactWhatsapp"
    )
    ?.addEventListener(
        "click",
        () => {


            const message =

                "Assalamu'alaikum, saya ingin bertanya tentang Kampus Al-Qur'an Widya Silahudin Shidiq.";


            const whatsappURL =

                "https://wa.me/" +

                WEBSITE_INFO.whatsapp +

                "?text=" +

                encodeURIComponent(
                    message
                );


            window.open(
                whatsappURL,
                "_blank"
            );

        }
    );


/* =========================================================
   MOBILE MENU
========================================================= */

const mobileMenu =
    document.getElementById(
        "mobileMenu"
    );


const navbarMenu =
    document.getElementById(
        "navbarMenu"
    );


if (
    mobileMenu &&
    navbarMenu
) {

    mobileMenu.addEventListener(
        "click",
        () => {


            navbarMenu
                .classList
                .toggle(
                    "open"
                );

        }
    );

}


/* =========================================================
   TUTUP MENU SETELAH LINK DIKLIK
========================================================= */

document
    .querySelectorAll(
        "#navbarMenu a"
    )
    .forEach(link => {


        link.addEventListener(
            "click",
            () => {


                navbarMenu
                    ?.classList
                    .remove(
                        "open"
                    );

            }
        );


    });


/* =========================================================
   FOOTER YEAR
========================================================= */

const currentYear =
    document.getElementById(
        "currentYear"
    );


if (currentYear) {

    currentYear.textContent =
        new Date()
            .getFullYear();

}


/* =========================================================
   CEK SUPABASE
========================================================= */

function checkSupabase() {

    if (
        typeof supabaseClient ===
        "undefined"
    ) {

        console.error(
            "Supabase belum terhubung. Periksa supabase-config.js."
        );


        const gallery =
            document.getElementById(
                "galleryGrid"
            );


        const products =
            document.getElementById(
                "productGrid"
            );


        if (gallery) {

            gallery.innerHTML = `

                <div
                    class="
                        loading-data
                        error-data
                    "
                >

                    <span class="loading-icon">
                        ⚠️
                    </span>

                    <strong>
                        Supabase belum terhubung
                    </strong>

                    <small>
                        Periksa supabase-config.js
                    </small>

                </div>

            `;

        }


        if (products) {

            products.innerHTML = `

                <div
                    class="
                        loading-data
                        error-data
                    "
                >

                    <span class="loading-icon">
                        ⚠️
                    </span>

                    <strong>
                        Supabase belum terhubung
                    </strong>

                    <small>
                        Periksa supabase-config.js
                    </small>

                </div>

            `;

        }


        return false;

    }


    return true;

}


/* =========================================================
   START WEBSITE
========================================================= */

async function startWebsite() {

    console.log(
        "Memulai website Kampus Al-Qur'an Widya Silahudin Shidiq..."
    );


    if (
        !checkSupabase()
    ) {

        return;

    }


    try {

        await Promise.all([

            loadKegiatan(),

            loadProducts()

        ]);


        console.log(
            "Website berhasil dimuat."
        );

    }

    catch (error) {

        console.error(
            "Website gagal dimuat:",
            error
        );

    }

}


/* =========================================================
   JALANKAN WEBSITE
========================================================= */

startWebsite();