/* =========================================================
   KAMPUS AL-QUR'AN WIDYA SILAHUDIN SHIDIQ
   ADMIN.JS

   PENTING:
   supabaseClient SUDAH dibuat di supabase-config.js
   Jadi JANGAN membuat const supabaseClient lagi di sini.
========================================================= */


/* =========================================================
   KONFIGURASI
========================================================= */

const STORAGE_BUCKET = "kampus-media";

const ADMIN_LIMITS = {
    kegiatanJudul: 80,
    kegiatanDeskripsi: 180,
    produkNama: 60,
    produkDeskripsi: 140,
    hargaMaksimal: 100000000,
    stokMaksimal: 99999,
    kegiatanFileMaksimal: 50 * 1024 * 1024,
    produkFileMaksimal: 10 * 1024 * 1024
};


/* =========================================================
   DATA SEMENTARA
========================================================= */

let kegiatanData = [];
let produkData = [];
let pendingDelete = null;


/* =========================================================
   HELPER
========================================================= */

function el(id) {
    return document.getElementById(id);
}


function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function setMessage(id, text, type = "") {

    const target = el(id);

    if (!target) {
        return;
    }

    target.textContent = text || "";

    target.classList.remove(
        "success",
        "error",
        "loading"
    );

    if (type) {
        target.classList.add(type);
    }
}


function formatRupiah(value) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(Number(value) || 0);
}


function formatTanggal(value) {

    if (!value) {
        return "Tanpa tanggal";
    }

    const date = new Date(
        value + "T00:00:00"
    );

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    ).format(date);
}


function isVideo(url) {

    return /\.(mp4|webm|mov)(\?|#|$)/i.test(
        String(url || "")
    );
}


/* =========================================================
   NAVIGASI ADMIN
========================================================= */

function showPage(pageId) {

    document
        .querySelectorAll(".page")
        .forEach(page => {
            page.classList.add("hidden");
        });

    const target = el(pageId);

    if (target) {
        target.classList.remove("hidden");
    }

    document
        .querySelectorAll("aside > button")
        .forEach(button => {

            button.classList.remove("active");

            const onclick =
                button.getAttribute("onclick") || "";

            if (
                onclick.includes(
                    "'" + pageId + "'"
                )
            ) {
                button.classList.add("active");
            }
        });

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   LOGIN / ADMIN PAGE
========================================================= */

function showLoginPage() {

    if (el("loginPage")) {
        el("loginPage").classList.remove("hidden");
    }

    if (el("adminPage")) {
        el("adminPage").classList.add("hidden");
    }
}


function showAdminPage() {

    if (el("loginPage")) {
        el("loginPage").classList.add("hidden");
    }

    if (el("adminPage")) {
        el("adminPage").classList.remove("hidden");
    }

    showPage("dashboard");
}


/* =========================================================
   LOGIN
========================================================= */

async function checkLogin() {

    try {

        const {
            data,
            error
        } = await supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        if (data?.session) {

            showAdminPage();

            await loadAll();

        } else {

            showLoginPage();

        }

    } catch (error) {

        console.error(
            "Gagal mengecek login:",
            error
        );

        showLoginPage();
    }
}


const loginForm = el("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const email =
                el("email").value.trim();

            const password =
                el("password").value;

            setMessage(
                "loginMessage",
                "⏳ Sedang masuk...",
                "loading"
            );

            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .auth
                        .signInWithPassword({
                            email,
                            password
                        });

                if (error) {
                    throw error;
                }

                if (!data?.user) {
                    throw new Error(
                        "Login gagal."
                    );
                }

                setMessage(
                    "loginMessage",
                    ""
                );

                showAdminPage();

                await loadAll();

            } catch (error) {

                console.error(
                    "Login gagal:",
                    error
                );

                setMessage(
                    "loginMessage",
                    "❌ " +
                    (
                        error.message ||
                        "Email atau password salah."
                    ),
                    "error"
                );
            }
        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

const logoutButton = el("logoutButton");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await supabaseClient.auth.signOut();

            } catch (error) {

                console.error(error);

            }

            location.reload();
        }
    );
}


/* =========================================================
   CHARACTER COUNTER
========================================================= */

function updateKegiatanCounter() {

    const textarea =
        el("deskripsiKegiatan");

    const counter =
        el("kegiatanCharacterCount");

    if (!textarea || !counter) {
        return;
    }

    counter.textContent =
        textarea.value.length +
        " / " +
        ADMIN_LIMITS.kegiatanDeskripsi;
}


function updateProdukCounter() {

    const textarea =
        el("deskripsiProduk");

    const counter =
        el("produkCharacterCount");

    if (!textarea || !counter) {
        return;
    }

    counter.textContent =
        textarea.value.length +
        " / " +
        ADMIN_LIMITS.produkDeskripsi;
}


if (el("deskripsiKegiatan")) {

    el("deskripsiKegiatan")
        .addEventListener(
            "input",
            updateKegiatanCounter
        );
}


if (el("deskripsiProduk")) {

    el("deskripsiProduk")
        .addEventListener(
            "input",
            updateProdukCounter
        );
}


/* =========================================================
   FILE
========================================================= */

function createFileName(file) {

    const original =
        String(file.name || "file");

    let extension = "";

    if (original.includes(".")) {

        extension =
            original
                .split(".")
                .pop()
                .toLowerCase()
                .replace(
                    /[^a-z0-9]/g,
                    ""
                );
    }

    if (!extension) {

        const map = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "video/mp4": "mp4",
            "video/webm": "webm"
        };

        extension =
            map[file.type] || "bin";
    }

    const random =
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : Math.random()
                .toString(36)
                .slice(2);

    return (
        Date.now() +
        "-" +
        random +
        "." +
        extension
    );
}


async function uploadFile(
    file,
    folder
) {

    const path =
        folder +
        "/" +
        createFileName(file);

    const {
        error
    } =
        await supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .upload(
                path,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );

    if (error) {
        throw error;
    }

    const {
        data
    } =
        supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(path);

    if (!data?.publicUrl) {

        await removeStoragePath(path);

        throw new Error(
            "URL file gagal dibuat."
        );
    }

    return {
        publicUrl: data.publicUrl,
        filePath: path
    };
}


async function removeStoragePath(path) {

    if (!path) {
        return;
    }

    try {

        const {
            error
        } =
            await supabaseClient
                .storage
                .from(STORAGE_BUCKET)
                .remove([path]);

        if (error) {
            console.warn(
                "File storage tidak dapat dihapus:",
                error
            );
        }

    } catch (error) {

        console.warn(
            "Gagal menghapus file:",
            error
        );
    }
}


function getStoragePath(url) {

    if (!url) {
        return null;
    }

    try {

        const decoded =
            decodeURIComponent(url);

        const marker =
            "/storage/v1/object/public/" +
            STORAGE_BUCKET +
            "/";

        const index =
            decoded.indexOf(marker);

        if (index === -1) {
            return null;
        }

        return decoded
            .slice(
                index + marker.length
            )
            .split("?")[0];

    } catch {

        return null;
    }
}


async function removeStorageByUrl(url) {

    const path =
        getStoragePath(url);

    if (path) {
        await removeStoragePath(path);
    }
}


/* =========================================================
   VALIDASI FILE KEGIATAN
========================================================= */

function validateKegiatanFile(
    file,
    wajib
) {

    if (!file) {

        if (wajib) {
            throw new Error(
                "Pilih foto atau video kegiatan."
            );
        }

        return;
    }

    const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "video/webm"
    ];

    if (!allowed.includes(file.type)) {

        throw new Error(
            "Media kegiatan harus JPG, PNG, WEBP, MP4, atau WEBM."
        );
    }

    if (
        file.size >
        ADMIN_LIMITS.kegiatanFileMaksimal
    ) {

        throw new Error(
            "Ukuran media kegiatan maksimal 50 MB."
        );
    }
}


/* =========================================================
   VALIDASI FILE PRODUK
========================================================= */

function validateProdukFile(
    file,
    wajib
) {

    if (!file) {

        if (wajib) {
            throw new Error(
                "Pilih foto produk."
            );
        }

        return;
    }

    const allowed = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowed.includes(file.type)) {

        throw new Error(
            "Foto produk harus JPG, PNG, atau WEBP."
        );
    }

    if (
        file.size >
        ADMIN_LIMITS.produkFileMaksimal
    ) {

        throw new Error(
            "Foto produk maksimal 10 MB."
        );
    }
}


/* =========================================================
   PREVIEW KEGIATAN
========================================================= */

function previewKegiatan(url) {

    const wrapper =
        el("currentKegiatanMedia");

    const preview =
        el("currentKegiatanMediaPreview");

    if (!wrapper || !preview) {
        return;
    }

    if (!url) {

        preview.innerHTML = "";

        wrapper.classList.add("hidden");

        return;
    }

    if (isVideo(url)) {

        preview.innerHTML = `
            <video
                controls
                preload="metadata"
            >
                <source
                    src="${escapeHTML(url)}"
                >
            </video>
        `;

    } else {

        preview.innerHTML = `
            <img
                src="${escapeHTML(url)}"
                alt="Media kegiatan"
            >
        `;
    }

    wrapper.classList.remove("hidden");
}


/* =========================================================
   PREVIEW PRODUK
========================================================= */

function previewProduk(url) {

    const wrapper =
        el("currentProdukMedia");

    const preview =
        el("currentProdukMediaPreview");

    if (!wrapper || !preview) {
        return;
    }

    if (!url) {

        preview.innerHTML = "";

        wrapper.classList.add("hidden");

        return;
    }

    preview.innerHTML = `
        <img
            src="${escapeHTML(url)}"
            alt="Foto produk"
        >
    `;

    wrapper.classList.remove("hidden");
}


/* =========================================================
   RESET KEGIATAN
========================================================= */

function resetKegiatanForm(
    clearMessage = true
) {

    const form =
        el("kegiatanForm");

    if (form) {
        form.reset();
    }

    if (el("editKegiatanId")) {
        el("editKegiatanId").value = "";
    }

    if (el("editKegiatanMediaLama")) {
        el("editKegiatanMediaLama").value = "";
    }

    if (el("editKegiatanNotice")) {

        el("editKegiatanNotice")
            .classList
            .add("hidden");
    }

    if (el("cancelEditKegiatanBottom")) {

        el("cancelEditKegiatanBottom")
            .classList
            .add("hidden");
    }

    if (el("submitKegiatanButton")) {

        el("submitKegiatanButton")
            .textContent =
            "Simpan Kegiatan";
    }

    if (el("kegiatanPageTitle")) {

        el("kegiatanPageTitle")
            .textContent =
            "Tambah Kegiatan";
    }

    previewKegiatan("");

    updateKegiatanCounter();

    if (clearMessage) {
        setMessage(
            "kegiatanMessage",
            ""
        );
    }
}


/* =========================================================
   RESET PRODUK
========================================================= */

function resetProdukForm(
    clearMessage = true
) {

    const form =
        el("produkForm");

    if (form) {
        form.reset();
    }

    if (el("editProdukId")) {
        el("editProdukId").value = "";
    }

    if (el("editProdukFotoLama")) {
        el("editProdukFotoLama").value = "";
    }

    if (el("stokProduk")) {
        el("stokProduk").value = "1";
    }

    if (el("editProdukNotice")) {

        el("editProdukNotice")
            .classList
            .add("hidden");
    }

    if (el("cancelEditProdukBottom")) {

        el("cancelEditProdukBottom")
            .classList
            .add("hidden");
    }

    if (el("submitProdukButton")) {

        el("submitProdukButton")
            .textContent =
            "Simpan Produk";
    }

    if (el("produkPageTitle")) {

        el("produkPageTitle")
            .textContent =
            "Tambah Produk";
    }

    previewProduk("");

    updateProdukCounter();

    if (clearMessage) {
        setMessage(
            "produkMessage",
            ""
        );
    }
}


/* =========================================================
   EDIT KEGIATAN
========================================================= */

function editKegiatan(id) {

    const item =
        kegiatanData.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!item) {

        alert(
            "Kegiatan tidak ditemukan."
        );

        return;
    }

    showPage("kegiatan");

    el("editKegiatanId").value =
        item.id;

    el("editKegiatanMediaLama").value =
        item.foto_url || "";

    el("judulKegiatan").value =
        item.judul || "";

    el("tanggalKegiatan").value =
        item.tanggal || "";

    el("deskripsiKegiatan").value =
        item.deskripsi || "";

    if (el("mediaKegiatan")) {
        el("mediaKegiatan").value = "";
    }

    if (el("editKegiatanNotice")) {

        el("editKegiatanNotice")
            .classList
            .remove("hidden");
    }

    if (el("cancelEditKegiatanBottom")) {

        el("cancelEditKegiatanBottom")
            .classList
            .remove("hidden");
    }

    el("submitKegiatanButton")
        .textContent =
        "Simpan Perubahan";

    el("kegiatanPageTitle")
        .textContent =
        "Edit Kegiatan";

    previewKegiatan(
        item.foto_url
    );

    updateKegiatanCounter();

    setMessage(
        "kegiatanMessage",
        "✏️ Mode edit kegiatan.",
        "loading"
    );

    el("kegiatanForm")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


/* =========================================================
   EDIT PRODUK
========================================================= */

function editProduk(id) {

    const item =
        produkData.find(
            item =>
                String(item.id) ===
                String(id)
        );

    if (!item) {

        alert(
            "Produk tidak ditemukan."
        );

        return;
    }

    showPage("produk");

    el("editProdukId").value =
        item.id;

    el("editProdukFotoLama").value =
        item.foto_url || "";

    el("namaProduk").value =
        item.nama || "";

    el("kategoriProduk").value =
        item.kategori || "lainnya";

    el("hargaProduk").value =
        Number(item.harga) || 0;

    el("stokProduk").value =
        Number(item.stok) || 0;

    el("deskripsiProduk").value =
        item.deskripsi || "";

    if (el("fotoProduk")) {
        el("fotoProduk").value = "";
    }

    if (el("editProdukNotice")) {

        el("editProdukNotice")
            .classList
            .remove("hidden");
    }

    if (el("cancelEditProdukBottom")) {

        el("cancelEditProdukBottom")
            .classList
            .remove("hidden");
    }

    el("submitProdukButton")
        .textContent =
        "Simpan Perubahan";

    el("produkPageTitle")
        .textContent =
        "Edit Produk";

    previewProduk(
        item.foto_url
    );

    updateProdukCounter();

    setMessage(
        "produkMessage",
        "✏️ Mode edit produk.",
        "loading"
    );

    el("produkForm")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}


/* =========================================================
   BATAL EDIT
========================================================= */

[
    "cancelEditKegiatan",
    "cancelEditKegiatanBottom"
].forEach(id => {

    const button = el(id);

    if (button) {

        button.addEventListener(
            "click",
            () => {
                resetKegiatanForm();
            }
        );
    }
});


[
    "cancelEditProduk",
    "cancelEditProdukBottom"
].forEach(id => {

    const button = el(id);

    if (button) {

        button.addEventListener(
            "click",
            () => {
                resetProdukForm();
            }
        );
    }
});


/* =========================================================
   SIMPAN KEGIATAN
========================================================= */

const kegiatanForm =
    el("kegiatanForm");

if (kegiatanForm) {

    kegiatanForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const button =
                el("submitKegiatanButton");

            const editId =
                el("editKegiatanId")
                    ?.value || "";

            const editing =
                Boolean(editId);

            const oldUrl =
                el("editKegiatanMediaLama")
                    ?.value || "";

            let uploadBaru = null;

            try {

                button.disabled = true;

                button.textContent =
                    editing
                        ? "Menyimpan Perubahan..."
                        : "Menyimpan...";

                const judul =
                    el("judulKegiatan")
                        .value
                        .trim();

                const tanggal =
                    el("tanggalKegiatan")
                        .value || null;

                const deskripsi =
                    el("deskripsiKegiatan")
                        .value
                        .trim();

                const file =
                    el("mediaKegiatan")
                        .files[0];

                if (judul.length < 3) {

                    throw new Error(
                        "Judul minimal 3 karakter."
                    );
                }

                if (
                    judul.length >
                    ADMIN_LIMITS.kegiatanJudul
                ) {

                    throw new Error(
                        "Judul maksimal 80 karakter."
                    );
                }

                if (
                    deskripsi.length >
                    ADMIN_LIMITS.kegiatanDeskripsi
                ) {

                    throw new Error(
                        "Deskripsi maksimal 180 karakter."
                    );
                }

                validateKegiatanFile(
                    file,
                    !editing && !oldUrl
                );

                let mediaUrl = oldUrl;

                if (file) {

                    setMessage(
                        "kegiatanMessage",
                        "⏳ Mengupload media...",
                        "loading"
                    );

                    uploadBaru =
                        await uploadFile(
                            file,
                            "kegiatan"
                        );

                    mediaUrl =
                        uploadBaru.publicUrl;
                }

                if (!mediaUrl) {

                    throw new Error(
                        "Foto/video kegiatan wajib ada."
                    );
                }

                const payload = {
                    judul,
                    tanggal,
                    deskripsi,
                    foto_url: mediaUrl
                };

                if (editing) {

                    setMessage(
                        "kegiatanMessage",
                        "⏳ Menyimpan perubahan...",
                        "loading"
                    );

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("kegiatan")
                            .update(payload)
                            .eq(
                                "id",
                                editId
                            );

                    if (error) {
                        throw error;
                    }

                    if (
                        uploadBaru &&
                        oldUrl &&
                        oldUrl !== mediaUrl
                    ) {

                        await removeStorageByUrl(
                            oldUrl
                        );
                    }

                    uploadBaru = null;

                    resetKegiatanForm(false);

                    setMessage(
                        "kegiatanMessage",
                        "✅ Kegiatan berhasil diperbarui.",
                        "success"
                    );

                } else {

                    setMessage(
                        "kegiatanMessage",
                        "⏳ Menyimpan kegiatan...",
                        "loading"
                    );

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("kegiatan")
                            .insert(payload);

                    if (error) {
                        throw error;
                    }

                    uploadBaru = null;

                    resetKegiatanForm(false);

                    setMessage(
                        "kegiatanMessage",
                        "✅ Kegiatan berhasil ditambahkan.",
                        "success"
                    );
                }

                await loadKegiatan();
                await updateDashboard();

            } catch (error) {

                console.error(
                    "Kegiatan error:",
                    error
                );

                if (uploadBaru?.filePath) {

                    await removeStoragePath(
                        uploadBaru.filePath
                    );
                }

                setMessage(
                    "kegiatanMessage",
                    "❌ " +
                    (
                        error.message ||
                        "Kegiatan gagal disimpan."
                    ),
                    "error"
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    el("editKegiatanId")
                        ?.value
                        ? "Simpan Perubahan"
                        : "Simpan Kegiatan";
            }
        }
    );
}


/* =========================================================
   SIMPAN PRODUK
========================================================= */

const produkForm =
    el("produkForm");

if (produkForm) {

    produkForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const button =
                el("submitProdukButton");

            const editId =
                el("editProdukId")
                    ?.value || "";

            const editing =
                Boolean(editId);

            const oldUrl =
                el("editProdukFotoLama")
                    ?.value || "";

            let uploadBaru = null;

            try {

                button.disabled = true;

                button.textContent =
                    editing
                        ? "Menyimpan Perubahan..."
                        : "Menyimpan...";

                const nama =
                    el("namaProduk")
                        .value
                        .trim();

                const kategori =
                    el("kategoriProduk")
                        .value;

                const harga =
                    Number(
                        el("hargaProduk")
                            .value
                    );

                const stok =
                    Number(
                        el("stokProduk")
                            .value
                    );

                const deskripsi =
                    el("deskripsiProduk")
                        .value
                        .trim();

                const file =
                    el("fotoProduk")
                        .files[0];

                if (nama.length < 2) {

                    throw new Error(
                        "Nama produk minimal 2 karakter."
                    );
                }

                if (
                    nama.length >
                    ADMIN_LIMITS.produkNama
                ) {

                    throw new Error(
                        "Nama produk maksimal 60 karakter."
                    );
                }

                if (
                    !Number.isFinite(harga) ||
                    harga < 0
                ) {

                    throw new Error(
                        "Harga tidak valid."
                    );
                }

                if (
                    harga >
                    ADMIN_LIMITS.hargaMaksimal
                ) {

                    throw new Error(
                        "Harga maksimal " +
                        formatRupiah(
                            ADMIN_LIMITS.hargaMaksimal
                        ) +
                        "."
                    );
                }

                if (
                    !Number.isInteger(stok) ||
                    stok < 0
                ) {

                    throw new Error(
                        "Stok harus angka bulat minimal 0."
                    );
                }

                if (
                    stok >
                    ADMIN_LIMITS.stokMaksimal
                ) {

                    throw new Error(
                        "Stok maksimal 99.999."
                    );
                }

                if (
                    deskripsi.length >
                    ADMIN_LIMITS.produkDeskripsi
                ) {

                    throw new Error(
                        "Deskripsi maksimal 140 karakter."
                    );
                }

                validateProdukFile(
                    file,
                    !editing && !oldUrl
                );

                let fotoUrl = oldUrl;

                if (file) {

                    setMessage(
                        "produkMessage",
                        "⏳ Mengupload foto...",
                        "loading"
                    );

                    uploadBaru =
                        await uploadFile(
                            file,
                            "produk"
                        );

                    fotoUrl =
                        uploadBaru.publicUrl;
                }

                if (!fotoUrl) {

                    throw new Error(
                        "Foto produk wajib ada."
                    );
                }

                const payload = {
                    nama,
                    kategori,
                    harga,
                    stok,
                    deskripsi,
                    foto_url: fotoUrl,
                    tersedia: stok > 0
                };

                if (editing) {

                    setMessage(
                        "produkMessage",
                        "⏳ Menyimpan perubahan...",
                        "loading"
                    );

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("produk")
                            .update(payload)
                            .eq(
                                "id",
                                editId
                            );

                    if (error) {
                        throw error;
                    }

                    if (
                        uploadBaru &&
                        oldUrl &&
                        oldUrl !== fotoUrl
                    ) {

                        await removeStorageByUrl(
                            oldUrl
                        );
                    }

                    uploadBaru = null;

                    resetProdukForm(false);

                    setMessage(
                        "produkMessage",
                        "✅ Produk berhasil diperbarui.",
                        "success"
                    );

                } else {

                    setMessage(
                        "produkMessage",
                        "⏳ Menyimpan produk...",
                        "loading"
                    );

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("produk")
                            .insert(payload);

                    if (error) {
                        throw error;
                    }

                    uploadBaru = null;

                    resetProdukForm(false);

                    setMessage(
                        "produkMessage",
                        "✅ Produk berhasil ditambahkan.",
                        "success"
                    );
                }

                await loadProduk();
                await updateDashboard();

            } catch (error) {

                console.error(
                    "Produk error:",
                    error
                );

                if (uploadBaru?.filePath) {

                    await removeStoragePath(
                        uploadBaru.filePath
                    );
                }

                setMessage(
                    "produkMessage",
                    "❌ " +
                    (
                        error.message ||
                        "Produk gagal disimpan."
                    ),
                    "error"
                );

            } finally {

                button.disabled = false;

                button.textContent =
                    el("editProdukId")
                        ?.value
                        ? "Simpan Perubahan"
                        : "Simpan Produk";
            }
        }
    );
}


/* =========================================================
   LOAD KEGIATAN
========================================================= */

async function loadKegiatan() {

    const container =
        el("daftarKegiatan");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading-state">
            ⏳ Memuat kegiatan...
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

        kegiatanData =
            data || [];

        if (el("jumlahKegiatan")) {

            el("jumlahKegiatan")
                .textContent =
                kegiatanData.length;
        }

        if (!kegiatanData.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <span>📷</span>

                    <h3>
                        Belum ada kegiatan
                    </h3>

                    <p>
                        Tambahkan dokumentasi
                        kegiatan menggunakan
                        form di atas.
                    </p>

                </div>
            `;

            return;
        }

        container.innerHTML =
            kegiatanData
                .map(item => {

                    const url =
                        item.foto_url || "";

                    let media = `
                        <div class="card-media">
                            <div
                                style="
                                    width:100%;
                                    height:100%;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    font-size:40px;
                                "
                            >
                                📷
                            </div>
                        </div>
                    `;

                    if (
                        url &&
                        isVideo(url)
                    ) {

                        media = `
                            <div class="card-media">

                                <video
                                    controls
                                    preload="metadata"
                                >
                                    <source
                                        src="${escapeHTML(url)}"
                                    >
                                </video>

                            </div>
                        `;

                    } else if (url) {

                        media = `
                            <div class="card-media">

                                <img
                                    src="${escapeHTML(url)}"
                                    alt="${escapeHTML(item.judul)}"
                                    loading="lazy"
                                >

                            </div>
                        `;
                    }

                    return `
                        <article class="card">

                            ${media}

                            <div class="card-body">

                                <span class="card-date">
                                    📅
                                    ${escapeHTML(
                                        formatTanggal(
                                            item.tanggal
                                        )
                                    )}
                                </span>

                                <h3 class="card-title">
                                    ${escapeHTML(
                                        item.judul ||
                                        "Kegiatan"
                                    )}
                                </h3>

                                <p class="card-description">
                                    ${escapeHTML(
                                        item.deskripsi ||
                                        "Tidak ada deskripsi."
                                    )}
                                </p>

                                <div class="card-actions">

                                    <button
                                        type="button"
                                        class="edit-button"
                                        data-action="edit-kegiatan"
                                        data-id="${escapeHTML(item.id)}"
                                    >
                                        ✏️ Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="delete-button"
                                        data-action="delete-kegiatan"
                                        data-id="${escapeHTML(item.id)}"
                                    >
                                        🗑️ Hapus
                                    </button>

                                </div>

                            </div>

                        </article>
                    `;
                })
                .join("");

    } catch (error) {

        console.error(
            "Load kegiatan error:",
            error
        );

        kegiatanData = [];

        container.innerHTML = `
            <div class="empty-state">

                <span>⚠️</span>

                <h3>
                    Kegiatan gagal dimuat
                </h3>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Terjadi kesalahan."
                    )}
                </p>

            </div>
        `;
    }
}


/* =========================================================
   LOAD PRODUK
========================================================= */

async function loadProduk() {

    const container =
        el("daftarProduk");

    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="loading-state">
            ⏳ Memuat produk...
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

        produkData =
            data || [];

        if (el("jumlahProduk")) {

            el("jumlahProduk")
                .textContent =
                produkData.length;
        }

        if (!produkData.length) {

            container.innerHTML = `
                <div class="empty-state">

                    <span>🛍️</span>

                    <h3>
                        Belum ada produk
                    </h3>

                    <p>
                        Tambahkan produk karya
                        santri menggunakan
                        form di atas.
                    </p>

                </div>
            `;

            return;
        }

        container.innerHTML =
            produkData
                .map(item => {

                    const foto =
                        item.foto_url || "";

                    let media = `
                        <div class="card-media">

                            <div
                                style="
                                    width:100%;
                                    height:100%;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    font-size:40px;
                                "
                            >
                                🛍️
                            </div>

                        </div>
                    `;

                    if (foto) {

                        media = `
                            <div class="card-media">

                                <img
                                    src="${escapeHTML(foto)}"
                                    alt="${escapeHTML(item.nama)}"
                                    loading="lazy"
                                >

                            </div>
                        `;
                    }

                    const stok =
                        Number(item.stok) || 0;

                    return `
                        <article class="card">

                            ${media}

                            <div class="card-body">

                                <span class="card-category">
                                    ${escapeHTML(
                                        item.kategori ||
                                        "lainnya"
                                    )}
                                </span>

                                <h3 class="card-title">
                                    ${escapeHTML(
                                        item.nama ||
                                        "Produk"
                                    )}
                                </h3>

                                <p class="card-description">
                                    ${escapeHTML(
                                        item.deskripsi ||
                                        "Tidak ada deskripsi."
                                    )}
                                </p>

                                <div class="card-price">
                                    ${formatRupiah(
                                        item.harga
                                    )}
                                </div>

                                <div class="card-stock">
                                    Stok:
                                    ${stok}

                                    ${
                                        stok > 0
                                            ? " • Tersedia"
                                            : " • Habis"
                                    }
                                </div>

                                <div class="card-actions">

                                    <button
                                        type="button"
                                        class="edit-button"
                                        data-action="edit-produk"
                                        data-id="${escapeHTML(item.id)}"
                                    >
                                        ✏️ Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="delete-button"
                                        data-action="delete-produk"
                                        data-id="${escapeHTML(item.id)}"
                                    >
                                        🗑️ Hapus
                                    </button>

                                </div>

                            </div>

                        </article>
                    `;
                })
                .join("");

    } catch (error) {

        console.error(
            "Load produk error:",
            error
        );

        produkData = [];

        container.innerHTML = `
            <div class="empty-state">

                <span>⚠️</span>

                <h3>
                    Produk gagal dimuat
                </h3>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Terjadi kesalahan."
                    )}
                </p>

            </div>
        `;
    }
}


/* =========================================================
   TOMBOL EDIT/HAPUS KEGIATAN
========================================================= */

if (el("daftarKegiatan")) {

    el("daftarKegiatan")
        .addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "button[data-action]"
                    );

                if (!button) {
                    return;
                }

                const id =
                    button.dataset.id;

                if (
                    button.dataset.action ===
                    "edit-kegiatan"
                ) {

                    editKegiatan(id);
                }

                if (
                    button.dataset.action ===
                    "delete-kegiatan"
                ) {

                    openDeleteModal(
                        "kegiatan",
                        id
                    );
                }
            }
        );
}


/* =========================================================
   TOMBOL EDIT/HAPUS PRODUK
========================================================= */

if (el("daftarProduk")) {

    el("daftarProduk")
        .addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "button[data-action]"
                    );

                if (!button) {
                    return;
                }

                const id =
                    button.dataset.id;

                if (
                    button.dataset.action ===
                    "edit-produk"
                ) {

                    editProduk(id);
                }

                if (
                    button.dataset.action ===
                    "delete-produk"
                ) {

                    openDeleteModal(
                        "produk",
                        id
                    );
                }
            }
        );
}


/* =========================================================
   MODAL HAPUS
========================================================= */

function openDeleteModal(
    type,
    id
) {

    let item;

    if (type === "kegiatan") {

        item =
            kegiatanData.find(
                data =>
                    String(data.id) ===
                    String(id)
            );

    } else {

        item =
            produkData.find(
                data =>
                    String(data.id) ===
                    String(id)
            );
    }

    if (!item) {

        alert(
            "Data tidak ditemukan."
        );

        return;
    }

    pendingDelete = {
        type,
        id,
        item
    };

    const nama =
        type === "kegiatan"
            ? item.judul
            : item.nama;

    if (el("deleteModalText")) {

        el("deleteModalText")
            .textContent =
            'Yakin ingin menghapus "' +
            (
                nama ||
                "data ini"
            ) +
            '"? Data yang sudah dihapus tidak dapat dikembalikan.';
    }

    el("deleteModal")
        ?.classList
        .remove("hidden");

    document.body.style.overflow =
        "hidden";
}


function closeDeleteModal() {

    el("deleteModal")
        ?.classList
        .add("hidden");

    pendingDelete = null;

    document.body.style.overflow =
        "";
}


if (el("cancelDeleteButton")) {

    el("cancelDeleteButton")
        .addEventListener(
            "click",
            closeDeleteModal
        );
}


if (el("deleteModalBackground")) {

    el("deleteModalBackground")
        .addEventListener(
            "click",
            closeDeleteModal
        );
}


/* =========================================================
   HAPUS KEGIATAN
========================================================= */

async function deleteKegiatan(info) {

    const {
        error
    } =
        await supabaseClient
            .from("kegiatan")
            .delete()
            .eq(
                "id",
                info.id
            );

    if (error) {
        throw error;
    }

    if (info.item?.foto_url) {

        await removeStorageByUrl(
            info.item.foto_url
        );
    }

    if (
        String(
            el("editKegiatanId")
                ?.value || ""
        ) ===
        String(info.id)
    ) {

        resetKegiatanForm();
    }

    await loadKegiatan();
    await updateDashboard();
}


/* =========================================================
   HAPUS PRODUK
========================================================= */

async function deleteProduk(info) {

    const {
        error
    } =
        await supabaseClient
            .from("produk")
            .delete()
            .eq(
                "id",
                info.id
            );

    if (error) {
        throw error;
    }

    if (info.item?.foto_url) {

        await removeStorageByUrl(
            info.item.foto_url
        );
    }

    if (
        String(
            el("editProdukId")
                ?.value || ""
        ) ===
        String(info.id)
    ) {

        resetProdukForm();
    }

    await loadProduk();
    await updateDashboard();
}


/* =========================================================
   KONFIRMASI HAPUS
========================================================= */

if (el("confirmDeleteButton")) {

    el("confirmDeleteButton")
        .addEventListener(
            "click",
            async () => {

                if (!pendingDelete) {
                    return;
                }

                const info =
                    pendingDelete;

                const button =
                    el("confirmDeleteButton");

                button.disabled = true;

                button.textContent =
                    "Menghapus...";

                try {

                    if (
                        info.type ===
                        "kegiatan"
                    ) {

                        await deleteKegiatan(
                            info
                        );

                    } else {

                        await deleteProduk(
                            info
                        );
                    }

                    closeDeleteModal();

                } catch (error) {

                    console.error(
                        "Delete error:",
                        error
                    );

                    alert(
                        "❌ " +
                        (
                            error.message ||
                            "Data gagal dihapus."
                        )
                    );

                } finally {

                    button.disabled = false;

                    button.textContent =
                        "Ya, Hapus";
                }
            }
        );
}


/* =========================================================
   REFRESH
========================================================= */

if (el("refreshKegiatan")) {

    el("refreshKegiatan")
        .addEventListener(
            "click",
            async () => {

                const button =
                    el("refreshKegiatan");

                button.disabled = true;

                button.textContent =
                    "↻ Memuat...";

                try {

                    await loadKegiatan();

                } finally {

                    button.disabled = false;

                    button.textContent =
                        "↻ Muat Ulang";
                }
            }
        );
}


if (el("refreshProduk")) {

    el("refreshProduk")
        .addEventListener(
            "click",
            async () => {

                const button =
                    el("refreshProduk");

                button.disabled = true;

                button.textContent =
                    "↻ Memuat...";

                try {

                    await loadProduk();

                } finally {

                    button.disabled = false;

                    button.textContent =
                        "↻ Muat Ulang";
                }
            }
        );
}


/* =========================================================
   DASHBOARD COUNTER
========================================================= */

async function updateDashboard() {

    try {

        const [
            kegiatanResult,
            produkResult
        ] =
            await Promise.all([

                supabaseClient
                    .from("kegiatan")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    ),

                supabaseClient
                    .from("produk")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )

            ]);

        if (
            !kegiatanResult.error &&
            el("jumlahKegiatan")
        ) {

            el("jumlahKegiatan")
                .textContent =
                kegiatanResult.count || 0;
        }

        if (
            !produkResult.error &&
            el("jumlahProduk")
        ) {

            el("jumlahProduk")
                .textContent =
                produkResult.count || 0;
        }

    } catch (error) {

        console.warn(
            "Counter dashboard error:",
            error
        );
    }
}


/* =========================================================
   LOAD SEMUA
========================================================= */

async function loadAll() {

    await Promise.all([
        loadKegiatan(),
        loadProduk()
    ]);

    await updateDashboard();
}


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") {
            return;
        }

        if (
            el("deleteModal") &&
            !el("deleteModal")
                .classList
                .contains("hidden")
        ) {

            closeDeleteModal();

            return;
        }

        if (
            el("editKegiatanId")
                ?.value
        ) {

            resetKegiatanForm();

            return;
        }

        if (
            el("editProdukId")
                ?.value
        ) {

            resetProdukForm();
        }
    }
);


/* =========================================================
   AUTH STATE
========================================================= */

supabaseClient.auth.onAuthStateChange(
    (
        event,
        session
    ) => {

        if (
            event === "SIGNED_OUT"
        ) {

            showLoginPage();
        }

        if (
            event === "SIGNED_IN" &&
            session
        ) {

            showAdminPage();
        }
    }
);


/* =========================================================
   MULAI
========================================================= */

updateKegiatanCounter();
updateProdukCounter();

checkLogin();