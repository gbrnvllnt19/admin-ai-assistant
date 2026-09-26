// =====================================================
// AI ADMIN ASSISTANT - SCRIPT.JS
// =====================================================


// =====================================================
// DATA UTAMA
// =====================================================

let dataAsli = [];
let dataSekarang = [];
let riwayatData = [];
let posisiRiwayat = -1;
let fileAktif = null;
let jumlahProses = 0;


// =====================================================
// ELEMENT HTML
// =====================================================

const loginPage = document.getElementById("loginPage");

// PENTING:
// HTML menggunakan id="dashboardPage"
const app = document.getElementById("dashboardPage");

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");

const logoutBtn = document.getElementById("logoutBtn");

const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");

const commandInput = document.getElementById("commandInput");
const commandCounter = document.getElementById("commandCounter");
const processBtn = document.getElementById("processBtn");

const dataTable = document.getElementById("dataTable");
const tableBody = document.getElementById("tableBody");
const tableRowInfo = document.getElementById("tableRowInfo");
const previewInfo = document.getElementById("previewInfo");

const downloadBtn = document.getElementById("downloadBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

const resetDataBtn = document.getElementById("resetDataBtn");
const clearDataBtn = document.getElementById("clearDataBtn");

const totalDataStat = document.getElementById("totalDataStat");
const processCountStat = document.getElementById("processCountStat");
const dataStatusStat = document.getElementById("dataStatusStat");

const activityList = document.getElementById("activityList");
const activityCount = document.getElementById("activityCount");


// =====================================================
// CEK LOGIN
// =====================================================

async function cekLogin() {
    try {
        const response = await fetch("/api/check-login", {
            credentials: "include"
        });

        const data = await response.json();

        if (data.loggedIn) {
            tampilkanApp();
        } else {
            tampilkanLogin();
        }

    } catch (error) {
        console.error("Gagal mengecek login:", error);
        tampilkanLogin();
    }
}


// =====================================================
// TAMPILKAN LOGIN
// =====================================================

function tampilkanLogin() {
    if (loginPage) {
        loginPage.classList.remove("hidden");
    }

    if (app) {
        app.classList.add("hidden");
    }
}


// =====================================================
// TAMPILKAN DASHBOARD
// =====================================================

function tampilkanApp() {
    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (app) {
        app.classList.remove("hidden");
    }
}


// =====================================================
// LOGIN
// =====================================================

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            loginMessage.textContent =
                "Username dan password wajib diisi.";
            return;
        }

        loginMessage.textContent = "Sedang login...";

        try {

            const response = await fetch("/api/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {

                loginMessage.textContent =
                    data.error ||
                    "Username atau password salah.";

                return;
            }

            loginMessage.textContent = "";

            // Masuk ke dashboard
            tampilkanApp();

        } catch (error) {

            console.error("Login error:", error);

            loginMessage.textContent =
                "Tidak dapat terhubung ke server.";
        }
    });
}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async function () {

        try {

            await fetch("/api/logout", {
                method: "POST",
                credentials: "include"
            });

            dataAsli = [];
            dataSekarang = [];
            riwayatData = [];
            posisiRiwayat = -1;
            fileAktif = null;
            jumlahProses = 0;

            tampilkanLogin();

        } catch (error) {

            console.error("Logout error:", error);

        }

    });
}


// =====================================================
// UPLOAD FILE
// =====================================================

if (fileInput) {

    fileInput.addEventListener("change", function (event) {

        const file = event.target.files[0];

        if (!file) {
            return;
        }

        fileAktif = file;

        const namaFile = file.name.toLowerCase();

        if (
            !namaFile.endsWith(".xlsx") &&
            !namaFile.endsWith(".xls") &&
            !namaFile.endsWith(".csv")
        ) {

            fileInfo.textContent =
                "Format file tidak didukung. Gunakan XLSX, XLS, atau CSV.";

            return;
        }

        bacaFile(file);

    });
}


// =====================================================
// BACA FILE
// =====================================================

function bacaFile(file) {

    const reader = new FileReader();

    reader.onload = function (event) {

        try {

            const data = new Uint8Array(event.target.result);

            const workbook = XLSX.read(data, {
                type: "array"
            });

            const namaSheet = workbook.SheetNames[0];

            const worksheet = workbook.Sheets[namaSheet];

            const hasil = XLSX.utils.sheet_to_json(
                worksheet,
                {
                    defval: ""
                }
            );

            dataAsli = hasil.map(function (baris) {
                return {
                    ...baris
                };
            });

            dataSekarang = hasil.map(function (baris) {
                return {
                    ...baris
                };
            });

            riwayatData = [];
            posisiRiwayat = -1;

            simpanRiwayat();

            tampilkanData();

            fileInfo.textContent =
                `${file.name} berhasil dibaca (${dataSekarang.length} baris).`;

            tambahAktivitas(
                `File "${file.name}" berhasil diupload.`
            );

            if (downloadBtn) {
                downloadBtn.disabled = dataSekarang.length === 0;
            }

        } catch (error) {

            console.error("Gagal membaca file:", error);

            fileInfo.textContent =
                "Gagal membaca file.";

        }

    };

    reader.readAsArrayBuffer(file);
}


// =====================================================
// TAMPILKAN DATA
// =====================================================

function tampilkanData() {

    if (!tableBody || !dataTable) {
        return;
    }

    tableBody.innerHTML = "";

    if (dataSekarang.length === 0) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td colspan="100%">
                Belum ada data.
            </td>
        `;

        tableBody.appendChild(row);

        updateStatistik();

        if (downloadBtn) {
            downloadBtn.disabled = true;
        }

        return;
    }


    const kolom = Object.keys(dataSekarang[0]);

    const headerRow =
        dataTable.querySelector("thead tr");

    if (headerRow) {

        headerRow.innerHTML = "";

        kolom.forEach(function (namaKolom) {

            const th = document.createElement("th");

            th.textContent = namaKolom;

            headerRow.appendChild(th);

        });

    }


    dataSekarang.forEach(function (baris) {

        const tr = document.createElement("tr");

        kolom.forEach(function (namaKolom) {

            const td = document.createElement("td");

            const nilai = baris[namaKolom];

            td.textContent =
                nilai === null ||
                nilai === undefined ||
                nilai === ""
                    ? ""
                    : nilai;

            tr.appendChild(td);

        });

        tableBody.appendChild(tr);

    });


    if (tableRowInfo) {

        tableRowInfo.textContent =
            `${dataSekarang.length} baris`;

    }


    if (previewInfo) {

        previewInfo.textContent =
            `${dataSekarang.length} data sedang ditampilkan.`;

    }


    if (downloadBtn) {
        downloadBtn.disabled = false;
    }


    updateStatistik();
}


// =====================================================
// STATISTIK
// =====================================================

function updateStatistik() {

    if (totalDataStat) {
        totalDataStat.textContent =
            dataSekarang.length;
    }

    if (processCountStat) {
        processCountStat.textContent =
            jumlahProses;
    }

    if (dataStatusStat) {

        if (dataSekarang.length > 0) {
            dataStatusStat.textContent = "Siap";
        } else {
            dataStatusStat.textContent = "Kosong";
        }

    }
}


// =====================================================
// SALIN DATA
// =====================================================

function salinData(data) {

    return data.map(function (baris) {

        return {
            ...baris
        };

    });

}


// =====================================================
// RIWAYAT DATA
// =====================================================

function simpanRiwayat() {

    riwayatData =
        riwayatData.slice(
            0,
            posisiRiwayat + 1
        );

    riwayatData.push(
        salinData(dataSekarang)
    );

    posisiRiwayat =
        riwayatData.length - 1;

    updateTombolRiwayat();
}


// =====================================================
// UPDATE TOMBOL RIWAYAT
// =====================================================

function updateTombolRiwayat() {

    if (undoBtn) {

        undoBtn.disabled =
            posisiRiwayat <= 0;

    }

    if (redoBtn) {

        redoBtn.disabled =
            posisiRiwayat >=
            riwayatData.length - 1;

    }
}


// =====================================================
// UNDO
// =====================================================

if (undoBtn) {

    undoBtn.addEventListener("click", function () {

        if (posisiRiwayat <= 0) {
            return;
        }

        posisiRiwayat--;

        dataSekarang =
            salinData(
                riwayatData[posisiRiwayat]
            );

        tampilkanData();

        tambahAktivitas(
            "Perubahan sebelumnya dikembalikan."
        );

        updateTombolRiwayat();

    });

}


// =====================================================
// REDO
// =====================================================

if (redoBtn) {

    redoBtn.addEventListener("click", function () {

        if (
            posisiRiwayat >=
            riwayatData.length - 1
        ) {
            return;
        }

        posisiRiwayat++;

        dataSekarang =
            salinData(
                riwayatData[posisiRiwayat]
            );

        tampilkanData();

        tambahAktivitas(
            "Perubahan dikembalikan."
        );

        updateTombolRiwayat();

    });

}


// =====================================================
// RESET DATA
// =====================================================

if (resetDataBtn) {

    resetDataBtn.addEventListener("click", function () {

        if (dataAsli.length === 0) {
            return;
        }

        dataSekarang =
            salinData(dataAsli);

        simpanRiwayat();

        tampilkanData();

        tambahAktivitas(
            "Data dikembalikan ke kondisi awal."
        );

    });

}


// =====================================================
// CLEAR DATA PREVIEW
// =====================================================

if (clearDataBtn) {

    clearDataBtn.addEventListener("click", function () {

        dataSekarang = [];

        simpanRiwayat();

        tampilkanData();

        tambahAktivitas(
            "Data preview dikosongkan."
        );

    });

}


// =====================================================
// COUNTER COMMAND
// =====================================================

function updateCommandCounter() {

    if (!commandInput || !commandCounter) {
        return;
    }

    commandCounter.textContent =
        `${commandInput.value.length} karakter`;
}


if (commandInput) {

    commandInput.addEventListener(
        "input",
        updateCommandCounter
    );

}


// =====================================================
// CONTOH PERINTAH
// =====================================================

document
    .querySelectorAll(".example-btn")
    .forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                const teks =
                    button.dataset.command ||
                    button.textContent.trim();

                if (commandInput) {

                    commandInput.value = teks;

                    updateCommandCounter();

                    commandInput.focus();

                }

            }
        );

    });


// =====================================================
// PROSES PERINTAH
// =====================================================

if (processBtn) {

    processBtn.addEventListener(
        "click",
        async function () {

            const perintah =
                commandInput.value.trim();

            if (!perintah) {

                alert(
                    "Tulis perintah terlebih dahulu."
                );

                return;
            }

            if (dataSekarang.length === 0) {

                alert(
                    "Upload data terlebih dahulu."
                );

                return;
            }

            processBtn.disabled = true;

            processBtn.textContent =
                "Memproses...";

            try {

                const hasil =
                    prosesLokal(perintah);

                if (hasil) {

                    dataSekarang = hasil;

                    simpanRiwayat();

                    tampilkanData();

                    jumlahProses++;

                    updateStatistik();

                    tambahAktivitas(
                        `Perintah diproses: ${perintah}`
                    );

                    return;
                }

                await mintaBantuanAI(perintah);

            } catch (error) {

                console.error(error);

                alert(
                    error.message ||
                    "Terjadi kesalahan saat memproses data."
                );

            } finally {

                processBtn.disabled = false;

                processBtn.innerHTML = `
                    <span class="process-icon">✦</span>
                    <span>Proses Data</span>
                    <span class="process-arrow">→</span>
                `;

            }

        }
    );

}


// =====================================================
// PROSES PERINTAH LOKAL
// =====================================================

function prosesLokal(perintah) {

    const teks =
        perintah.toLowerCase();


    // URUTKAN NAMA A-Z

    if (
        teks.includes("urutkan nama") &&
        (
            teks.includes("a-z") ||
            teks.includes("az") ||
            teks.includes("alfabet")
        )
    ) {

        return urutkanBerdasarkanKolom(
            dataSekarang,
            cariKolom(
                dataSekarang,
                [
                    "nama",
                    "name"
                ]
            ),
            false
        );

    }


    // URUTKAN NAMA Z-A

    if (
        teks.includes("urutkan nama") &&
        (
            teks.includes("z-a") ||
            teks.includes("za")
        )
    ) {

        return urutkanBerdasarkanKolom(
            dataSekarang,
            cariKolom(
                dataSekarang,
                [
                    "nama",
                    "name"
                ]
            ),
            true
        );

    }


    // DATA KOSONG KE BAWAH

    if (
        teks.includes("kosong") &&
        (
            teks.includes("bawah") ||
            teks.includes("paling bawah")
        )
    ) {

        return dataKosongKeBawah(
            dataSekarang
        );

    }


    // NORMALISASI TANGGAL

    if (
        teks.includes("normalisasi tanggal") ||
        teks.includes("rapikan tanggal")
    ) {

        return normalisasiTanggal(
            dataSekarang
        );

    }


    return null;
}


// =====================================================
// CARI KOLOM
// =====================================================

function cariKolom(data, daftarNama) {

    if (!data.length) {
        return null;
    }

    const kolom =
        Object.keys(data[0]);

    for (const nama of daftarNama) {

        const ditemukan =
            kolom.find(function (kolomData) {

                return kolomData
                    .toLowerCase()
                    .includes(
                        nama.toLowerCase()
                    );

            });

        if (ditemukan) {
            return ditemukan;
        }

    }

    return null;
}


// =====================================================
// URUTKAN DATA
// =====================================================

function urutkanBerdasarkanKolom(
    data,
    namaKolom,
    zToA
) {

    if (!namaKolom) {
        return data;
    }

    const hasil =
        salinData(data);

    hasil.sort(function (a, b) {

        const nilaiA =
            String(
                a[namaKolom] || ""
            ).toLowerCase();

        const nilaiB =
            String(
                b[namaKolom] || ""
            ).toLowerCase();

        const hasilBanding =
            nilaiA.localeCompare(
                nilaiB,
                "id",
                {
                    sensitivity: "base"
                }
            );

        return zToA
            ? hasilBanding * -1
            : hasilBanding;

    });

    return hasil;
}


// =====================================================
// DATA KOSONG KE BAWAH
// =====================================================

function dataKosongKeBawah(data) {

    const kolom =
        data.length > 0
            ? Object.keys(data[0])
            : [];

    const lengkap = [];
    const tidakLengkap = [];


    data.forEach(function (baris) {

        const adaKosong =
            kolom.some(function (namaKolom) {

                const nilai =
                    baris[namaKolom];

                return (
                    nilai === null ||
                    nilai === undefined ||
                    String(nilai).trim() === ""
                );

            });


        if (adaKosong) {

            tidakLengkap.push(baris);

        } else {

            lengkap.push(baris);

        }

    });


    return [
        ...lengkap,
        ...tidakLengkap
    ];
}


// =====================================================
// NORMALISASI TANGGAL
// =====================================================

function normalisasiTanggal(data) {

    const hasil =
        salinData(data);

    const kolomTanggal =
        Object.keys(
            hasil[0] || {}
        ).filter(function (namaKolom) {

            return namaKolom
                .toLowerCase()
                .includes("tanggal");

        });


    hasil.forEach(function (baris) {

        kolomTanggal.forEach(function (kolom) {

            const nilai =
                baris[kolom];

            if (!nilai) {
                return;
            }

            const tanggal =
                ubahKeTanggal(nilai);

            if (tanggal) {
                baris[kolom] = tanggal;
            }

        });

    });

    return hasil;
}


// =====================================================
// UBAH FORMAT TANGGAL
// =====================================================

function ubahKeTanggal(nilai) {

    const teks =
        String(nilai).trim();

    const cocok =
        teks.match(
            /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
        );


    if (cocok) {

        const hari =
            cocok[1].padStart(2, "0");

        const bulan =
            cocok[2].padStart(2, "0");

        const tahun =
            cocok[3];

        return `${hari}/${bulan}/${tahun}`;
    }

    return null;
}


// =====================================================
// MINTA BANTUAN AI
// =====================================================

async function mintaBantuanAI(perintah) {

    const kolom =
        dataSekarang.length > 0
            ? Object.keys(dataSekarang[0])
            : [];


    const prompt = `
Kamu adalah AI Admin Assistant.

Perintah pengguna:
${perintah}

Data saat ini:
Jumlah baris: ${dataSekarang.length}

Kolom:
${kolom.join(", ")}

Contoh data:
${JSON.stringify(
    dataSekarang.slice(0, 5),
    null,
    2
)}

Bantu pengguna memahami atau menyelesaikan pekerjaan administrasi tersebut.

Gunakan Bahasa Indonesia yang natural dan sederhana.

PENTING:
- Jangan menyarankan penghapusan data kosong.
- Data kosong atau tidak lengkap harus tetap dipertahankan.
- Jika perlu dirapikan, data kosong atau tidak lengkap ditempatkan di bagian paling bawah.
- Jangan mengarang data yang tidak tersedia.
`;


    const response =
        await fetch("/api/ai", {

            method: "POST",

            credentials: "include",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                prompt: prompt
            })

        });


    const hasil =
        await response.json();


    if (!response.ok) {

        throw new Error(
            hasil.error ||
            "AI gagal memproses perintah."
        );

    }


    jumlahProses++;

    updateStatistik();

    tambahAktivitas(
        `AI memberikan respons untuk: ${perintah}`
    );


    tampilkanJawabanAI(
        hasil.result
    );
}


// =====================================================
// TAMPILKAN HASIL AI
// =====================================================

function tampilkanJawabanAI(jawaban) {

    alert(jawaban);

}


// =====================================================
// DOWNLOAD EXCEL
// =====================================================

if (downloadBtn) {

    downloadBtn.addEventListener(
        "click",
        downloadExcel
    );

}


function downloadExcel() {

    if (dataSekarang.length === 0) {

        alert(
            "Tidak ada data untuk didownload."
        );

        return;
    }


    const worksheet =
        XLSX.utils.json_to_sheet(
            dataSekarang
        );


    const workbook =
        XLSX.utils.book_new();


    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Data"
    );


    let namaOutput =
        fileAktif
            ? fileAktif.name
            : "data";


    namaOutput =
        namaOutput.replace(
            /\.[^/.]+$/,
            ""
        );


    namaOutput += "_hasil.xlsx";


    XLSX.writeFile(
        workbook,
        namaOutput
    );


    tambahAktivitas(
        `File "${namaOutput}" berhasil dibuat.`
    );
}


// =====================================================
// AKTIVITAS
// =====================================================

function tambahAktivitas(teks) {

    if (!activityList) {
        return;
    }


    const item =
        document.createElement("div");


    item.className =
        "activity-item";


    const waktu =
        new Date().toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    item.innerHTML = `
        <div>${escapeHTML(teks)}</div>
        <div class="activity-time">${waktu}</div>
    `;


    activityList.prepend(item);


    const jumlah =
        activityList.children.length;


    if (activityCount) {

        activityCount.textContent =
            `${jumlah} aktivitas`;

    }
}


// =====================================================
// KEAMANAN TEXT HTML
// =====================================================

function escapeHTML(teks) {

    return String(teks)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =====================================================
// UPDATE AWAL
// =====================================================

updateCommandCounter();
updateStatistik();
updateTombolRiwayat();
cekLogin();
