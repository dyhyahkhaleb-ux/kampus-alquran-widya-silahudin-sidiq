/* =========================================================
   KAMPUS AL-QUR'AN WIDYA SILAHUDIN SIDIQ
   ADMIN DASHBOARD
========================================================= */


/* =========================================================
   GLOBAL DATA
========================================================= */

let kegiatanData = [];
let produkData = [];
let pesananData = [];

let pendingDelete = null;

let currentKegiatanFoto = "";
let currentProdukFoto = "";

let kegiatanFileBaru = null;
let produkFileBaru = null;


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
        return "-";
    }

    try {

        const date =
            new Date(
                String(value).includes("T")
                    ? value
                    : value + "T00:00:00"
            );

        return new Intl.DateTimeFormat(
            "id-ID",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        ).format(date);

    } catch {

        return value;
    }
}


function formatTanggalWaktu(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(value);
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);
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


function normalizeWhatsApp(value) {

    let number =
        String(value || "")
            .replace(/\D/g, "");

    if (!number) {
        return "";
    }

    if (
        number.startsWith("0")
    ) {

        number =
            "62" +
            number.slice(1);
    }

    else if (
        number.startsWith("8")
    ) {

        number =
            "62" +
            number;
    }

    return number;
}


function setButtonLoading(
    button,
    loading,
    normalText,
    loadingText
) {

    if (!button) {
        return;
    }

    button.disabled =
        loading;

    button.textContent =
        loading
            ? loadingText
            : normalText;
}


/* =========================================================
   AUTH UI
========================================================= */

function showLogin() {

    el("loginSection")
        ?.classList
        .remove("hidden");

    el("adminApp")
        ?.classList
        .add("hidden");
}


function showAdmin() {

    el("loginSection")
        ?.classList
        .add("hidden");

    el("adminApp")
        ?.classList
        .remove("hidden");
}


/* =========================================================
   LOGIN
========================================================= */

const loginForm =
    el("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            const email =
                el("loginEmail")
                    ?.value
                    .trim();

            const password =
                el("loginPassword")
                    ?.value;

            const button =
                el("loginButton");

            const message =
                el("loginMessage");


            if (
                !email ||
                !password
            ) {

                if (message) {

                    message.textContent =
                        "Email dan password wajib diisi.";
                }

                return;
            }


            setButtonLoading(
                button,
                true,
                "Masuk Dashboard",
                "Memeriksa..."
            );


            if (message) {

                message.textContent =
                    "";
            }


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


                if (
                    !data?.session
                ) {

                    throw new Error(
                        "Login gagal. Session tidak ditemukan."
                    );
                }


                if (message) {

                    message.textContent =
                        "";
                }


                showAdmin();

                showPage(
                    "dashboard"
                );

                await loadAll();


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                if (message) {

                    message.textContent =
                        error.message ||
                        "Email atau password salah.";
                }

            } finally {

                setButtonLoading(
                    button,
                    false,
                    "Masuk Dashboard",
                    "Memeriksa..."
                );
            }

        }
    );
}


/* =========================================================
   LOGOUT
========================================================= */

el("logoutButton")
    ?.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    "Keluar dari Admin Dashboard?"
                );

            if (!confirmed) {
                return;
            }


            try {

                await supabaseClient
                    .auth
                    .signOut();

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }


            kegiatanData = [];
            produkData = [];
            pesananData = [];

            showLogin();


            if (el("loginPassword")) {

                el("loginPassword")
                    .value = "";
            }

        }
    );


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {

    document
        .querySelectorAll(
            ".page"
        )
        .forEach(
            page => {

                page.classList.add(
                    "hidden"
                );
            }
        );


    el(pageId)
        ?.classList
        .remove("hidden");


    document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(
            button => {

                button.classList
                    .toggle(
                        "active",
                        button.dataset.page ===
                        pageId
                    );
            }
        );


    el("sidebar")
        ?.classList
        .remove("open");


    if (
        pageId ===
        "dashboard"
    ) {

        updateDashboard();
    }


    if (
        pageId ===
        "pesanan"
    ) {

        loadPesanan();
    }
}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

el("mobileSidebarButton")
    ?.addEventListener(
        "click",
        () => {

            el("sidebar")
                ?.classList
                .toggle("open");
        }
    );


document.addEventListener(
    "click",
    event => {

        const sidebar =
            el("sidebar");

        const button =
            el("mobileSidebarButton");


        if (
            window.innerWidth > 900 ||
            !sidebar ||
            !sidebar.classList.contains(
                "open"
            )
        ) {
            return;
        }


        if (
            sidebar.contains(
                event.target
            ) ||
            button?.contains(
                event.target
            )
        ) {
            return;
        }


        sidebar.classList
            .remove("open");
    }
);


/* =========================================================
   MODAL HELPER
========================================================= */

function openModal(id) {

    el(id)
        ?.classList
        .remove("hidden");

    document.body.style.overflow =
        "hidden";
}


function closeModal(id) {

    el(id)
        ?.classList
        .add("hidden");

    document.body.style.overflow =
        "";
}


/* =========================================================
   STORAGE UPLOAD
========================================================= */

async function uploadFile(
    bucket,
    folder,
    file
) {

    if (!file) {
        return "";
    }


    const extension =
        file.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
        "file";


    const random =
        Math.random()
            .toString(36)
            .slice(2);


    const fileName =
        `${folder}/${Date.now()}-${random}.${extension}`;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(bucket)
            .upload(
                fileName,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false
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
            .from(bucket)
            .getPublicUrl(
                fileName
            );


    return (
        data?.publicUrl ||
        ""
    );
}


/* =========================================================
   HAPUS FILE STORAGE BERDASARKAN URL
========================================================= */

async function deleteStorageFileFromURL(
    bucket,
    url
) {

    if (!url) {
        return;
    }


    try {

        const marker =
            `/storage/v1/object/public/${bucket}/`;


        if (
            !url.includes(marker)
        ) {
            return;
        }


        const path =
            decodeURIComponent(
                url.split(marker)[1]
                    .split("?")[0]
            );


        if (!path) {
            return;
        }


        const {
            error
        } =
            await supabaseClient
                .storage
                .from(bucket)
                .remove([
                    path
                ]);


        if (error) {

            console.warn(
                "Gagal menghapus file storage:",
                error
            );
        }

    } catch (error) {

        console.warn(
            "Delete storage error:",
            error
        );
    }
}


/* =========================================================
   KEGIATAN - OPEN MODAL
========================================================= */

el("openKegiatanModal")
    ?.addEventListener(
        "click",
        () => {

            resetKegiatanForm();

            if (
                el("kegiatanModalTitle")
            ) {

                el("kegiatanModalTitle")
                    .textContent =
                    "Tambah Kegiatan";
            }


            openModal(
                "kegiatanModal"
            );
        }
    );


el("closeKegiatanModal")
    ?.addEventListener(
        "click",
        () => {

            closeModal(
                "kegiatanModal"
            );
        }
    );


/* =========================================================
   RESET KEGIATAN
========================================================= */

function resetKegiatanForm() {

    el("kegiatanForm")
        ?.reset();


    if (el("kegiatanId")) {

        el("kegiatanId")
            .value = "";
    }


    currentKegiatanFoto =
        "";

    kegiatanFileBaru =
        null;


    const preview =
        el("kegiatanPreview");


    if (preview) {

        preview.innerHTML =
            "";

        preview.classList
            .add("hidden");
    }
}


/* =========================================================
   PREVIEW KEGIATAN
========================================================= */

el("kegiatanFoto")
    ?.addEventListener(
        "change",
        event => {

            const file =
                event.target
                    .files?.[0];

            kegiatanFileBaru =
                file || null;


            const preview =
                el("kegiatanPreview");


            if (
                !file ||
                !preview
            ) {

                preview
                    ?.classList
                    .add("hidden");

                return;
            }


            const url =
                URL.createObjectURL(
                    file
                );


            preview.classList
                .remove("hidden");


            if (
                file.type
                    .startsWith(
                        "video/"
                    )
            ) {

                preview.innerHTML = `

                    <video
                        src="${url}"
                        controls
                    ></video>

                `;

            } else {

                preview.innerHTML = `

                    <img
                        src="${url}"
                        alt="Preview kegiatan"
                    >

                `;
            }

        }
    );


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
                        ascending:
                            false
                    }
                );


        if (error) {
            throw error;
        }


        kegiatanData =
            data || [];


        renderKegiatan();


    } catch (error) {

        console.error(
            "Load kegiatan error:",
            error
        );


        container.innerHTML = `

            <div class="empty-state">

                <span>
                    ⚠️
                </span>

                <h3>
                    Kegiatan gagal dimuat
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;
    }
}


/* =========================================================
   RENDER KEGIATAN
========================================================= */

function renderKegiatan() {

    const container =
        el("daftarKegiatan");


    if (!container) {
        return;
    }


    if (
        !kegiatanData.length
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <span>
                    📷
                </span>

                <h3>
                    Belum ada kegiatan
                </h3>

                <p>
                    Klik Tambah Kegiatan untuk
                    membuat dokumentasi baru.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        kegiatanData
            .map(
                item => {

                    let media =
                        `

                        <div
                            class="admin-card-placeholder"
                        >
                            📷
                        </div>

                        `;


                    if (
                        item.foto_url
                    ) {

                        if (
                            isVideoFile(
                                item.foto_url
                            )
                        ) {

                            media = `

                                <video
                                    src="${item.foto_url}"
                                    controls
                                    preload="metadata"
                                ></video>

                            `;

                        } else {

                            media = `

                                <img
                                    src="${item.foto_url}"
                                    alt="${escapeHTML(
                                        item.judul
                                    )}"
                                >

                            `;
                        }
                    }


                    return `

                        <article
                            class="admin-card"
                        >

                            <div
                                class="admin-card-media"
                            >

                                ${media}

                            </div>


                            <div
                                class="admin-card-body"
                            >

                                <span
                                    class="admin-card-label"
                                >
                                    Kegiatan
                                </span>


                                <h3>
                                    ${escapeHTML(
                                        item.judul ||
                                        "Tanpa Judul"
                                    )}
                                </h3>


                                <p>
                                    ${escapeHTML(
                                        item.deskripsi ||
                                        "Belum ada deskripsi."
                                    )}
                                </p>


                                <div
                                    class="admin-card-meta"
                                >

                                    <span>
                                        📅
                                        ${escapeHTML(
                                            formatTanggal(
                                                item.tanggal
                                            )
                                        )}
                                    </span>

                                </div>


                                <div
                                    class="admin-card-actions"
                                >

                                    <button
                                        type="button"
                                        class="edit-button"
                                        onclick="
                                            editKegiatan(
                                                '${String(item.id)}'
                                            )
                                        "
                                    >
                                        ✏️ Edit
                                    </button>


                                    <button
                                        type="button"
                                        class="delete-button"
                                        onclick="
                                            openDeleteModal(
                                                'kegiatan',
                                                '${String(item.id)}'
                                            )
                                        "
                                    >
                                        🗑️ Hapus
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
   EDIT KEGIATAN
========================================================= */

function editKegiatan(id) {

    const item =
        kegiatanData.find(
            data =>
                String(data.id) ===
                String(id)
        );


    if (!item) {
        return;
    }


    resetKegiatanForm();


    if (
        el("kegiatanModalTitle")
    ) {

        el("kegiatanModalTitle")
            .textContent =
            "Edit Kegiatan";
    }


    el("kegiatanId").value =
        item.id ?? "";


    el("kegiatanJudul").value =
        item.judul ?? "";


    el("kegiatanTanggal").value =
        item.tanggal ?? "";


    el("kegiatanDeskripsi").value =
        item.deskripsi ?? "";


    currentKegiatanFoto =
        item.foto_url || "";


    const preview =
        el("kegiatanPreview");


    if (
        preview &&
        currentKegiatanFoto
    ) {

        preview.classList
            .remove("hidden");


        if (
            isVideoFile(
                currentKegiatanFoto
            )
        ) {

            preview.innerHTML = `

                <video
                    src="${currentKegiatanFoto}"
                    controls
                ></video>

            `;

        } else {

            preview.innerHTML = `

                <img
                    src="${currentKegiatanFoto}"
                    alt="Foto kegiatan"
                >

            `;
        }
    }


    openModal(
        "kegiatanModal"
    );
}


/* =========================================================
   SAVE KEGIATAN
========================================================= */

el("kegiatanForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const form =
                event.currentTarget;


            const id =
                el("kegiatanId")
                    ?.value;


            const judul =
                el("kegiatanJudul")
                    ?.value
                    .trim();


            const tanggal =
                el("kegiatanTanggal")
                    ?.value;


            const deskripsi =
                el("kegiatanDeskripsi")
                    ?.value
                    .trim();


            if (!judul) {

                alert(
                    "Judul kegiatan wajib diisi."
                );

                return;
            }


            const button =
                el("saveKegiatanButton");


            setButtonLoading(
                button,
                true,
                "Simpan Kegiatan",
                "⏳ Menyimpan..."
            );


            try {

                let fotoURL =
                    currentKegiatanFoto;


                if (
                    kegiatanFileBaru
                ) {

                    fotoURL =
                        await uploadFile(
                            "kegiatan",
                            "uploads",
                            kegiatanFileBaru
                        );
                }


                const payload = {

                    judul,
                    tanggal:
                        tanggal || null,

                    deskripsi:
                        deskripsi || "",

                    foto_url:
                        fotoURL || ""
                };


                if (id) {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("kegiatan")
                            .update(
                                payload
                            )
                            .eq(
                                "id",
                                id
                            );


                    if (error) {
                        throw error;
                    }


                    if (
                        kegiatanFileBaru &&
                        currentKegiatanFoto &&
                        currentKegiatanFoto !==
                        fotoURL
                    ) {

                        await deleteStorageFileFromURL(
                            "kegiatan",
                            currentKegiatanFoto
                        );
                    }

                } else {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("kegiatan")
                            .insert([
                                payload
                            ]);


                    if (error) {
                        throw error;
                    }
                }


                form.reset();

                closeModal(
                    "kegiatanModal"
                );

                resetKegiatanForm();

                await loadKegiatan();

                await updateDashboard();


                alert(
                    id
                        ? "✅ Kegiatan berhasil diperbarui."
                        : "✅ Kegiatan berhasil ditambahkan."
                );


            } catch (error) {

                console.error(
                    "Save kegiatan error:",
                    error
                );


                alert(
                    "❌ Kegiatan gagal disimpan.\n\n" +
                    (
                        error.message ||
                        "Terjadi kesalahan."
                    )
                );

            } finally {

                setButtonLoading(
                    button,
                    false,
                    "Simpan Kegiatan",
                    "⏳ Menyimpan..."
                );
            }

        }
    );


/* =========================================================
   PRODUK - OPEN MODAL
========================================================= */

el("openProdukModal")
    ?.addEventListener(
        "click",
        () => {

            resetProdukForm();


            if (
                el("produkModalTitle")
            ) {

                el("produkModalTitle")
                    .textContent =
                    "Tambah Produk";
            }


            openModal(
                "produkModal"
            );
        }
    );


el("closeProdukModal")
    ?.addEventListener(
        "click",
        () => {

            closeModal(
                "produkModal"
            );
        }
    );


/* =========================================================
   RESET PRODUK
========================================================= */

function resetProdukForm() {

    el("produkForm")
        ?.reset();


    if (el("produkId")) {

        el("produkId")
            .value = "";
    }


    if (
        el("produkTersedia")
    ) {

        el("produkTersedia")
            .checked = true;
    }


    currentProdukFoto =
        "";

    produkFileBaru =
        null;


    const preview =
        el("produkPreview");


    if (preview) {

        preview.innerHTML =
            "";

        preview.classList
            .add("hidden");
    }
}


/* =========================================================
   PREVIEW PRODUK
========================================================= */

el("produkFoto")
    ?.addEventListener(
        "change",
        event => {

            const file =
                event.target
                    .files?.[0];


            produkFileBaru =
                file || null;


            const preview =
                el("produkPreview");


            if (
                !file ||
                !preview
            ) {

                preview
                    ?.classList
                    .add("hidden");

                return;
            }


            const url =
                URL.createObjectURL(
                    file
                );


            preview.classList
                .remove("hidden");


            preview.innerHTML = `

                <img
                    src="${url}"
                    alt="Preview produk"
                >

            `;
        }
    );


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
                        ascending:
                            false
                    }
                );


        if (error) {
            throw error;
        }


        produkData =
            data || [];


        renderProduk();


    } catch (error) {

        console.error(
            "Load produk error:",
            error
        );


        container.innerHTML = `

            <div class="empty-state">

                <span>
                    ⚠️
                </span>

                <h3>
                    Produk gagal dimuat
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;
    }
}


/* =========================================================
   RENDER PRODUK
========================================================= */

function renderProduk() {

    const container =
        el("daftarProduk");


    if (!container) {
        return;
    }


    if (
        !produkData.length
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <span>
                    🛍️
                </span>

                <h3>
                    Belum ada produk
                </h3>

                <p>
                    Klik Tambah Produk untuk
                    membuat produk baru.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        produkData
            .map(
                item => {

                    const tersedia =
                        item.tersedia !==
                        false &&
                        Number(
                            item.stok
                        ) > 0;


                    const media =
                        item.foto_url
                            ? `

                                <img
                                    src="${item.foto_url}"
                                    alt="${escapeHTML(
                                        item.nama
                                    )}"
                                >

                            `
                            : `

                                <div
                                    class="admin-card-placeholder"
                                >
                                    🛍️
                                </div>

                            `;


                    return `

                        <article
                            class="admin-card"
                        >

                            <div
                                class="admin-card-media"
                            >

                                ${media}

                            </div>


                            <div
                                class="admin-card-body"
                            >

                                <span
                                    class="admin-card-label"
                                >
                                    ${escapeHTML(
                                        item.kategori ||
                                        "Produk"
                                    )}
                                </span>


                                <h3>
                                    ${escapeHTML(
                                        item.nama ||
                                        "Tanpa Nama"
                                    )}
                                </h3>


                                <p>
                                    ${escapeHTML(
                                        item.deskripsi ||
                                        "Belum ada deskripsi."
                                    )}
                                </p>


                                <div
                                    class="admin-card-meta"
                                >

                                    <strong>
                                        ${formatRupiah(
                                            item.harga
                                        )}
                                    </strong>


                                    <span>

                                        ${
                                            tersedia
                                                ? `Stok ${Number(
                                                    item.stok
                                                )}`
                                                : "Habis"
                                        }

                                    </span>

                                </div>


                                <div
                                    class="admin-card-actions"
                                >

                                    <button
                                        type="button"
                                        class="edit-button"
                                        onclick="
                                            editProduk(
                                                '${String(item.id)}'
                                            )
                                        "
                                    >
                                        ✏️ Edit
                                    </button>


                                    <button
                                        type="button"
                                        class="delete-button"
                                        onclick="
                                            openDeleteModal(
                                                'produk',
                                                '${String(item.id)}'
                                            )
                                        "
                                    >
                                        🗑️ Hapus
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
   EDIT PRODUK
========================================================= */

function editProduk(id) {

    const item =
        produkData.find(
            data =>
                String(data.id) ===
                String(id)
        );


    if (!item) {
        return;
    }


    resetProdukForm();


    if (
        el("produkModalTitle")
    ) {

        el("produkModalTitle")
            .textContent =
            "Edit Produk";
    }


    el("produkId").value =
        item.id ?? "";


    el("produkNama").value =
        item.nama ?? "";


    el("produkHarga").value =
        Number(
            item.harga
        ) || 0;


    el("produkStok").value =
        Number(
            item.stok
        ) || 0;


    el("produkKategori").value =
        item.kategori ?? "";


    el("produkDeskripsi").value =
        item.deskripsi ?? "";


    el("produkTersedia").checked =
        item.tersedia !== false;


    currentProdukFoto =
        item.foto_url || "";


    const preview =
        el("produkPreview");


    if (
        preview &&
        currentProdukFoto
    ) {

        preview.classList
            .remove("hidden");


        preview.innerHTML = `

            <img
                src="${currentProdukFoto}"
                alt="Foto produk"
            >

        `;
    }


    openModal(
        "produkModal"
    );
}


/* =========================================================
   SAVE PRODUK
========================================================= */

el("produkForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const form =
                event.currentTarget;


            const id =
                el("produkId")
                    ?.value;


            const nama =
                el("produkNama")
                    ?.value
                    .trim();


            const harga =
                Number(
                    el("produkHarga")
                        ?.value
                );


            const stok =
                Number(
                    el("produkStok")
                        ?.value
                );


            const kategori =
                el("produkKategori")
                    ?.value
                    .trim();


            const deskripsi =
                el("produkDeskripsi")
                    ?.value
                    .trim();


            const tersedia =
                Boolean(
                    el("produkTersedia")
                        ?.checked
                );


            if (!nama) {

                alert(
                    "Nama produk wajib diisi."
                );

                return;
            }


            if (
                !Number.isFinite(
                    harga
                ) ||
                harga < 0
            ) {

                alert(
                    "Harga produk tidak valid."
                );

                return;
            }


            if (
                !Number.isFinite(
                    stok
                ) ||
                stok < 0
            ) {

                alert(
                    "Stok produk tidak valid."
                );

                return;
            }


            const button =
                el("saveProdukButton");


            setButtonLoading(
                button,
                true,
                "Simpan Produk",
                "⏳ Menyimpan..."
            );


            try {

                let fotoURL =
                    currentProdukFoto;


                if (
                    produkFileBaru
                ) {

                    fotoURL =
                        await uploadFile(
                            "produk",
                            "uploads",
                            produkFileBaru
                        );
                }


                const payload = {

                    nama,

                    harga,

                    stok,

                    kategori:
                        kategori || "",

                    deskripsi:
                        deskripsi || "",

                    tersedia,

                    foto_url:
                        fotoURL || ""
                };


                if (id) {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("produk")
                            .update(
                                payload
                            )
                            .eq(
                                "id",
                                id
                            );


                    if (error) {
                        throw error;
                    }


                    if (
                        produkFileBaru &&
                        currentProdukFoto &&
                        currentProdukFoto !==
                        fotoURL
                    ) {

                        await deleteStorageFileFromURL(
                            "produk",
                            currentProdukFoto
                        );
                    }

                } else {

                    const {
                        error
                    } =
                        await supabaseClient
                            .from("produk")
                            .insert([
                                payload
                            ]);


                    if (error) {
                        throw error;
                    }
                }


                form.reset();

                closeModal(
                    "produkModal"
                );

                resetProdukForm();

                await loadProduk();

                await updateDashboard();


                alert(
                    id
                        ? "✅ Produk berhasil diperbarui."
                        : "✅ Produk berhasil ditambahkan."
                );


            } catch (error) {

                console.error(
                    "Save produk error:",
                    error
                );


                alert(
                    "❌ Produk gagal disimpan.\n\n" +
                    (
                        error.message ||
                        "Terjadi kesalahan."
                    )
                );

            } finally {

                setButtonLoading(
                    button,
                    false,
                    "Simpan Produk",
                    "⏳ Menyimpan..."
                );
            }

        }
    );


/* =========================================================
   PESANAN
========================================================= */

function getPesananItems(
    item
) {

    if (
        Array.isArray(
            item?.items
        )
    ) {

        return item.items;
    }


    if (
        typeof item?.items ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(
                    item.items
                );


            return Array.isArray(
                parsed
            )
                ? parsed
                : [];

        } catch {

            return [];
        }
    }


    return [];
}


/* =========================================================
   JUMLAH BARANG PESANAN
========================================================= */

function getJumlahBarang(
    item
) {

    return getPesananItems(
        item
    ).reduce(
        (
            total,
            product
        ) => {

            return (
                total +
                Number(
                    product.jumlah ??
                    product.quantity ??
                    1
                )
            );

        },
        0
    );
}


/* =========================================================
   LOAD PESANAN
========================================================= */

async function loadPesanan() {

    const container =
        el("daftarPesanan");


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="loading-state">
            ⏳ Memuat pesanan...
        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("pesanan")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );


        if (error) {
            throw error;
        }


        pesananData =
            data || [];


        renderPesanan();

        updatePesananCounter();


    } catch (error) {

        console.error(
            "Load pesanan error:",
            error
        );


        pesananData =
            [];


        container.innerHTML = `

            <div class="empty-state">

                <span>
                    ⚠️
                </span>

                <h3>
                    Pesanan gagal dimuat
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
   PESANAN COUNTER
========================================================= */

function updatePesananCounter() {

    const total =
        pesananData.length;


    const baru =
        pesananData.filter(
            item =>
                String(
                    item.status ||
                    "baru"
                )
                    .toLowerCase() ===
                "baru"
        ).length;


    if (
        el("jumlahPesanan")
    ) {

        el("jumlahPesanan")
            .textContent =
            total;
    }


    if (
        el("jumlahPesananBaru")
    ) {

        el("jumlahPesananBaru")
            .textContent =
            baru;
    }


    const badge =
        el(
            "sidebarPesananBaru"
        );


    if (badge) {

        badge.textContent =
            baru;


        badge.classList.toggle(
            "hidden",
            baru <= 0
        );
    }
}


/* =========================================================
   RENDER PESANAN
========================================================= */

function renderPesanan() {

    const container =
        el("daftarPesanan");


    if (!container) {
        return;
    }


    const filter =
        el(
            "filterStatusPesanan"
        )?.value ||
        "semua";


    const filtered =
        filter === "semua"
            ? [...pesananData]
            : pesananData.filter(
                item =>
                    String(
                        item.status ||
                        "baru"
                    )
                        .toLowerCase() ===
                    filter
            );


    if (
        el("pesananSummaryText")
    ) {

        el(
            "pesananSummaryText"
        ).textContent =
            `${filtered.length} pesanan ditampilkan • ${pesananData.length} total`;
    }


    if (
        !filtered.length
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <span>
                    📦
                </span>

                <h3>
                    Belum ada pesanan
                </h3>

                <p>

                    ${
                        filter ===
                        "semua"

                            ? "Pesanan dari website akan muncul di sini."

                            : "Tidak ada pesanan dengan status ini."
                    }

                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        filtered
            .map(
                item => {

                    const items =
                        getPesananItems(
                            item
                        );


                    const status =
                        String(
                            item.status ||
                            "baru"
                        ).toLowerCase();


                    const itemHTML =
                        items.length

                            ? items
                                .map(
                                    product => {

                                        const jumlah =
                                            Number(
                                                product.jumlah ??
                                                product.quantity ??
                                                1
                                            );


                                        const harga =
                                            Number(
                                                product.harga ??
                                                0
                                            );


                                        const subtotal =
                                            Number(
                                                product.subtotal ??
                                                harga *
                                                jumlah
                                            );


                                        return `

                                            <div
                                                class="order-item"
                                            >

                                                <div>

                                                    <div
                                                        class="order-item-name"
                                                    >

                                                        ${escapeHTML(
                                                            product.nama ||
                                                            product.name ||
                                                            "Produk"
                                                        )}

                                                    </div>


                                                    <div
                                                        class="order-item-meta"
                                                    >

                                                        ${jumlah}

                                                        ×

                                                        ${formatRupiah(
                                                            harga
                                                        )}

                                                    </div>

                                                </div>


                                                <div
                                                    class="order-item-price"
                                                >

                                                    ${formatRupiah(
                                                        subtotal
                                                    )}

                                                </div>

                                            </div>

                                        `;
                                    }
                                )
                                .join("")

                            : `

                                <div
                                    class="order-item"
                                >

                                    <div
                                        class="order-item-name"
                                    >
                                        Data barang tidak tersedia.
                                    </div>

                                </div>

                            `;


                    return `

                        <article
                            class="order-card"
                            data-order-id="${escapeHTML(
                                item.id
                            )}"
                        >


                            <div
                                class="order-head"
                            >


                                <div>

                                    <h2
                                        class="order-number"
                                    >
                                        Pesanan #${escapeHTML(
                                            item.id
                                        )}
                                    </h2>


                                    <div
                                        class="order-date"
                                    >

                                        ${escapeHTML(
                                            formatTanggalWaktu(
                                                item.created_at
                                            )
                                        )}

                                        •

                                        ${getJumlahBarang(
                                            item
                                        )}

                                        barang

                                    </div>

                                </div>


                                <span
                                    class="order-status ${escapeHTML(
                                        status
                                    )}"
                                >

                                    ${escapeHTML(
                                        status
                                    )}

                                </span>


                            </div>


                            <div
                                class="order-body"
                            >


                                <div>


                                    <div
                                        class="order-section-title"
                                    >
                                        Data Pemesan
                                    </div>


                                    <div
                                        class="order-customer"
                                    >


                                        <div
                                            class="order-info-row"
                                        >

                                            <span>
                                                Nama
                                            </span>

                                            <strong>

                                                ${escapeHTML(
                                                    item.nama_pembeli ||
                                                    "-"
                                                )}

                                            </strong>

                                        </div>


                                        <div
                                            class="order-info-row"
                                        >

                                            <span>
                                                WhatsApp
                                            </span>

                                            <strong>

                                                ${escapeHTML(
                                                    item.nomor_whatsapp ||
                                                    "-"
                                                )}

                                            </strong>

                                        </div>


                                        <div
                                            class="order-info-row"
                                        >

                                            <span>
                                                Alamat
                                            </span>

                                            <div>

                                                ${escapeHTML(
                                                    item.alamat ||
                                                    "-"
                                                )}

                                            </div>

                                        </div>


                                    </div>


                                </div>


                                <div>


                                    <div
                                        class="order-section-title"
                                    >
                                        Barang Pesanan
                                    </div>


                                    <div
                                        class="order-items"
                                    >

                                        ${itemHTML}

                                    </div>


                                    <div
                                        class="order-total"
                                    >

                                        <span>
                                            Total Pesanan
                                        </span>

                                        <strong>

                                            ${formatRupiah(
                                                item.total
                                            )}

                                        </strong>

                                    </div>


                                </div>


                            </div>


                            <div
                                class="order-actions"
                            >


                                <select

                                    class="order-status-select"

                                    data-action="status-pesanan"

                                    data-id="${escapeHTML(
                                        item.id
                                    )}"

                                >

                                    <option
                                        value="baru"

                                        ${
                                            status ===
                                            "baru"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Baru
                                    </option>


                                    <option
                                        value="diproses"

                                        ${
                                            status ===
                                            "diproses"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Diproses
                                    </option>


                                    <option
                                        value="dikirim"

                                        ${
                                            status ===
                                            "dikirim"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Dikirim
                                    </option>


                                    <option
                                        value="selesai"

                                        ${
                                            status ===
                                            "selesai"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Selesai
                                    </option>


                                    <option
                                        value="dibatalkan"

                                        ${
                                            status ===
                                            "dibatalkan"
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        Dibatalkan
                                    </option>


                                </select>

                                <button
    type="button"
    class="order-payment-proof"
    data-action="lihat-bukti-pembayaran"
    data-id="${escapeHTML(
        item.id
    )}"
    ${!item.bukti_pembayaran ? "disabled" : ""}
>
    👁 Lihat Bukti
</button>

${
    item.bukti_pembayaran &&
    item.status_pembayaran !== "dibayar"
        ? `
            <button
                type="button"
                class="order-payment-approve"
                data-action="terima-pembayaran"
                data-id="${escapeHTML(item.id)}"
            >
                ✅ Terima
            </button>

            <button
                type="button"
                class="order-payment-reject"
                data-action="tolak-pembayaran"
                data-id="${escapeHTML(item.id)}"
            >
                ❌ Tolak
            </button>
        `
        : ""
}

                                <button

                                    type="button"

                                    class="order-whatsapp"

                                    data-action="whatsapp-pesanan"

                                    data-id="${escapeHTML(
                                        item.id
                                    )}"

                                >
                                    💬 WhatsApp
                                </button>


                                <button

                                    type="button"

                                    class="order-delete"

                                    data-action="delete-pesanan"

                                    data-id="${escapeHTML(
                                        item.id
                                    )}"

                                >
                                    🗑️ Hapus
                                </button>


                            </div>


                        </article>

                    `;
                }
            )
            .join("");
}


/* =========================================================
   FILTER PESANAN
========================================================= */

el("filterStatusPesanan")
    ?.addEventListener(
        "change",
        () => {

            renderPesanan();
        }
    );


/* =========================================================
   UPDATE STATUS PESANAN
   + STOK OTOMATIS
========================================================= */

async function updateStatusPesanan(
    id,
    status,
    selectElement
) {

    const allowed = [
        "baru",
        "diproses",
        "dikirim",
        "selesai",
        "dibatalkan"
    ];


    /* =====================================================
       VALIDASI STATUS
    ===================================================== */

    if (
        !allowed.includes(
            status
        )
    ) {

        alert(
            "Status pesanan tidak valid."
        );

        return;
    }


    /* =====================================================
       SIMPAN STATUS LAMA
       Untuk mengembalikan dropdown jika terjadi error.
    ===================================================== */

    const currentItem =
        pesananData.find(
            item =>
                String(item.id) ===
                String(id)
        );

    const oldStatus =
        currentItem?.status ||
        "baru";


    /* =====================================================
       DISABLE DROPDOWN SAAT PROSES
    ===================================================== */

    if (
        selectElement
    ) {

        selectElement.disabled =
            true;
    }


    try {

        /* =================================================
           PANGGIL FUNCTION SUPABASE

           Function ini yang menangani:
           - perubahan status
           - pengembalian stok jika dibatalkan
           - pengurangan stok jika pesanan diaktifkan lagi
        ================================================= */

        const {
            error
        } =
            await supabaseClient
                .rpc(
                    "ubah_status_pesanan",
                    {
                        p_pesanan_id:
                            Number(id),

                        p_status_baru:
                            status
                    }
                );


        if (error) {
            throw error;
        }


        /* =================================================
           UPDATE DATA LOKAL
        ================================================= */

        if (
            currentItem
        ) {

            currentItem.status =
                status;
        }


        /* =================================================
           REFRESH PESANAN DARI DATABASE

           Supaya data admin benar-benar sinkron
           dengan Supabase.
        ================================================= */

        await loadPesanan();


        /* =================================================
           UPDATE DASHBOARD
        ================================================= */

        await updateDashboard();


        console.log(
            `✅ Status pesanan #${id}: ${oldStatus} → ${status}`
        );


    } catch (error) {

        console.error(
            "Update status pesanan error:",
            error
        );


        /* =================================================
           KEMBALIKAN DROPDOWN KE STATUS LAMA
        ================================================= */

        if (
            selectElement &&
            document.body.contains(
                selectElement
            )
        ) {

            selectElement.value =
                oldStatus;
        }


        alert(
            "❌ Status pesanan gagal diubah.\n\n" +
            (
                error.message ||
                "Terjadi kesalahan."
            )
        );


        /* =================================================
           REFRESH DATA
        ================================================= */

        await loadPesanan();


    } finally {

        if (
            selectElement &&
            document.body.contains(
                selectElement
            )
        ) {

            selectElement.disabled =
                false;
        }
    }
}

/* =========================================================
   LIHAT BUKTI PEMBAYARAN
========================================================= */

async function lihatBuktiPembayaran(id) {

    const item =
        pesananData.find(
            data =>
                String(data.id) ===
                String(id)
        );

    if (!item) {
        alert("Pesanan tidak ditemukan.");
        return;
    }

    if (!item.bukti_pembayaran) {
        alert("Pembeli belum mengirim bukti pembayaran.");
        return;
    }

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .storage
                .from("bukti-pembayaran")
                .createSignedUrl(
                    item.bukti_pembayaran,
                    60 * 10
                );

        if (error) {
            throw error;
        }

        if (!data?.signedUrl) {
            throw new Error(
                "URL bukti pembayaran tidak berhasil dibuat."
            );
        }

        window.open(
            data.signedUrl,
            "_blank"
        );

    } catch (error) {

        console.error(
            "Lihat bukti pembayaran error:",
            error
        );

        alert(
            "❌ Bukti pembayaran gagal dibuka.\n\n" +
            (
                error.message ||
                "Terjadi kesalahan."
            )
        );
    }
}

/* =========================================================
   WHATSAPP PESANAN
========================================================= */

function openWhatsAppPesanan(
    id
) {

    const item =
        pesananData.find(
            data =>
                String(data.id) ===
                String(id)
        );


    if (!item) {

        alert(
            "Pesanan tidak ditemukan."
        );

        return;
    }


    const phone =
        normalizeWhatsApp(
            item.nomor_whatsapp
        );


    if (!phone) {

        alert(
            "Nomor WhatsApp pembeli tidak tersedia."
        );

        return;
    }


    const message =
`Assalamu'alaikum ${item.nama_pembeli || ""}.

Kami dari Kampus Al-Qur'an Widya Silahudin Sidiq menghubungi terkait pesanan #${item.id}.

Total pesanan: ${formatRupiah(item.total)}
Status pesanan: ${item.status || "baru"}

Terima kasih.`;


    const url =
        "https://wa.me/" +
        phone +
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
   PESANAN EVENTS
========================================================= */

el("daftarPesanan")
    ?.addEventListener(
        "change",
        event => {

            const select =
                event.target.closest(
                    'select[data-action="status-pesanan"]'
                );


            if (!select) {
                return;
            }


            updateStatusPesanan(
                select.dataset.id,
                select.value,
                select
            );
        }
    );


el("daftarPesanan")
    ?.addEventListener(
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
    "lihat-bukti-pembayaran"
) {
    lihatBuktiPembayaran(
        id
    );

    return;
}

            if (
                button.dataset.action ===
                "whatsapp-pesanan"
            ) {

                openWhatsAppPesanan(
                    id
                );

                return;
            }


            if (
                button.dataset.action ===
                "delete-pesanan"
            ) {

                openDeleteModal(
                    "pesanan",
                    id
                );
            }
        }
    );


/* =========================================================
   REFRESH PESANAN
========================================================= */

el("refreshPesanan")
    ?.addEventListener(
        "click",
        async () => {

            const button =
                el(
                    "refreshPesanan"
                );


            if (button) {

                button.disabled =
                    true;

                button.textContent =
                    "↻ Memuat...";
            }


            try {

                await loadPesanan();

                await updateDashboard();

            } finally {

                if (button) {

                    button.disabled =
                        false;

                    button.textContent =
                        "↻ Muat Ulang";
                }
            }
        }
    );


/* =========================================================
   DELETE MODAL
========================================================= */

function openDeleteModal(
    type,
    id
) {

    let item = null;


    if (
        type ===
        "kegiatan"
    ) {

        item =
            kegiatanData.find(
                data =>
                    String(data.id) ===
                    String(id)
            );

    }

    else if (
        type ===
        "produk"
    ) {

        item =
            produkData.find(
                data =>
                    String(data.id) ===
                    String(id)
            );

    }

    else if (
        type ===
        "pesanan"
    ) {

        item =
            pesananData.find(
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


    let nama =
        "data ini";


    if (
        type ===
        "kegiatan"
    ) {

        nama =
            item.judul ||
            "Kegiatan";
    }


    if (
        type ===
        "produk"
    ) {

        nama =
            item.nama ||
            "Produk";
    }


    if (
        type ===
        "pesanan"
    ) {

        nama =
            `Pesanan #${item.id}`;
    }


    if (
        el("deleteItemName")
    ) {

        el("deleteItemName")
            .textContent =
            nama;
    }


    openModal(
        "deleteModal"
    );
}


/* =========================================================
   CANCEL DELETE
========================================================= */

el("cancelDeleteButton")
    ?.addEventListener(
        "click",
        () => {

            pendingDelete =
                null;

            closeModal(
                "deleteModal"
            );
        }
    );


/* =========================================================
   DELETE KEGIATAN
========================================================= */

async function deleteKegiatan(
    info
) {

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


    if (
        info.item?.foto_url
    ) {

        await deleteStorageFileFromURL(
            "kegiatan",
            info.item.foto_url
        );
    }


    await loadKegiatan();
}


/* =========================================================
   DELETE PRODUK
========================================================= */

async function deleteProduk(
    info
) {

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


    if (
        info.item?.foto_url
    ) {

        await deleteStorageFileFromURL(
            "produk",
            info.item.foto_url
        );
    }


    await loadProduk();
}


/* =========================================================
   DELETE PESANAN
========================================================= */

async function deletePesanan(
    info
) {

    const {
        error
    } =
        await supabaseClient
            .from("pesanan")
            .delete()
            .eq(
                "id",
                info.id
            );


    if (error) {
        throw error;
    }


    await loadPesanan();
}


/* =========================================================
   CONFIRM DELETE
========================================================= */

el("confirmDeleteButton")
    ?.addEventListener(
        "click",
        async () => {

            if (
                !pendingDelete
            ) {
                return;
            }


            const button =
                el(
                    "confirmDeleteButton"
                );


            const info =
                pendingDelete;


            setButtonLoading(
                button,
                true,
                "Ya, Hapus",
                "Menghapus..."
            );


            try {

                if (
                    info.type ===
                    "kegiatan"
                ) {

                    await deleteKegiatan(
                        info
                    );
                }


                else if (
                    info.type ===
                    "produk"
                ) {

                    await deleteProduk(
                        info
                    );
                }


                else if (
                    info.type ===
                    "pesanan"
                ) {

                    await deletePesanan(
                        info
                    );
                }


                pendingDelete =
                    null;


                closeModal(
                    "deleteModal"
                );


                await updateDashboard();


                alert(
                    "✅ Data berhasil dihapus."
                );


            } catch (error) {

                console.error(
                    "Delete error:",
                    error
                );


                alert(
                    "❌ Data gagal dihapus.\n\n" +
                    (
                        error.message ||
                        "Terjadi kesalahan."
                    )
                );

            } finally {

                setButtonLoading(
                    button,
                    false,
                    "Ya, Hapus",
                    "Menghapus..."
                );
            }

        }
    );


/* =========================================================
   DASHBOARD COUNTER
========================================================= */

async function updateDashboard() {

    try {

        const [
            kegiatanResult,
            produkResult,
            pesananResult,
            pesananBaruResult
        ] =
            await Promise.all([


                supabaseClient
                    .from("kegiatan")
                    .select(
                        "id",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    ),


                supabaseClient
                    .from("produk")
                    .select(
                        "id",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    ),


                supabaseClient
                    .from("pesanan")
                    .select(
                        "id",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    ),


                supabaseClient
                    .from("pesanan")
                    .select(
                        "id",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    )
                    .eq(
                        "status",
                        "baru"
                    )

            ]);


        if (
            !kegiatanResult.error &&
            el("jumlahKegiatan")
        ) {

            el("jumlahKegiatan")
                .textContent =
                kegiatanResult.count ||
                0;
        }


        if (
            !produkResult.error &&
            el("jumlahProduk")
        ) {

            el("jumlahProduk")
                .textContent =
                produkResult.count ||
                0;
        }


        if (
            !pesananResult.error &&
            el("jumlahPesanan")
        ) {

            el("jumlahPesanan")
                .textContent =
                pesananResult.count ||
                0;
        }


        if (
            !pesananBaruResult.error
        ) {

            const jumlahBaru =
                pesananBaruResult.count ||
                0;


            if (
                el(
                    "jumlahPesananBaru"
                )
            ) {

                el(
                    "jumlahPesananBaru"
                ).textContent =
                    jumlahBaru;
            }


            const badge =
                el(
                    "sidebarPesananBaru"
                );


            if (badge) {

                badge.textContent =
                    jumlahBaru;


                badge.classList
                    .toggle(
                        "hidden",
                        jumlahBaru <= 0
                    );
            }
        }


    } catch (error) {

        console.warn(
            "Dashboard counter error:",
            error
        );
    }
}


/* =========================================================
   LOAD SEMUA DATA
========================================================= */

async function loadAll() {

    await Promise.all([

        loadKegiatan(),

        loadProduk(),

        loadPesanan(),

        updateDashboard()

    ]);
}


/* =========================================================
   ESC CLOSE MODAL
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {
            return;
        }


        if (
            !el("deleteModal")
                ?.classList
                .contains("hidden")
        ) {

            pendingDelete =
                null;

            closeModal(
                "deleteModal"
            );

            return;
        }


        if (
            !el("kegiatanModal")
                ?.classList
                .contains("hidden")
        ) {

            closeModal(
                "kegiatanModal"
            );

            return;
        }


        if (
            !el("produkModal")
                ?.classList
                .contains("hidden")
        ) {

            closeModal(
                "produkModal"
            );
        }
    }
);


/* =========================================================
   CHECK SESSION
========================================================= */

async function checkSession() {

    try {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            throw new Error(
                "supabaseClient tidak ditemukan. Periksa supabase-config.js."
            );
        }


        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {
            throw error;
        }


        const session =
            data?.session;


        if (
            session
        ) {

            showAdmin();


            if (
                el("adminEmail")
            ) {

                el("adminEmail")
                    .textContent =
                    session.user
                        ?.email ||
                    "Administrator";
            }


            showPage(
                "dashboard"
            );


            await loadAll();


        } else {

            showLogin();
        }


    } catch (error) {

        console.error(
            "Check session error:",
            error
        );


        showLogin();


        if (
            el("loginMessage")
        ) {

            el("loginMessage")
                .textContent =
                error.message ||
                "Gagal menghubungkan Admin Dashboard.";
        }
    }
}


/* =========================================================
   AUTH STATE CHANGE
========================================================= */

if (
    typeof supabaseClient !==
    "undefined"
) {

    supabaseClient
        .auth
        .onAuthStateChange(
            (
                event,
                session
            ) => {

                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    showLogin();

                    return;
                }


                if (
                    session &&
                    el("adminEmail")
                ) {

                    el("adminEmail")
                        .textContent =
                        session.user
                            ?.email ||
                        "Administrator";
                }
            }
        );
}


/* =========================================================
   START ADMIN
========================================================= */

checkSession();