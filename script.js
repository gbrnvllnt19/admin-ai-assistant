```javascript
// ==========================================
// AI ADMIN ASSISTANT
// SCRIPT UTAMA
// ==========================================

// Data aplikasi
let dataAsli = [];
let dataSekarang = [];
let namaFile = "";
let kolom = [];


// ==========================================
// ELEMENT HTML
// ==========================================

const fileInput = document.getElementById("fileInput");
const fileInfo = document.getElementById("fileInfo");

const commandInput = document.getElementById("commandInput");
const processBtn = document.getElementById("processBtn");

const dataTable = document.getElementById("dataTable");
const tableBody = document.getElementById("tableBody");

const previewInfo = document.getElementById("previewInfo");
const downloadBtn = document.getElementById("downloadBtn");

const activityList = document.getElementById("activityList");


// ==========================================
// UPLOAD FILE
// ==========================================

fileInput.addEventListener("change", function () {

    const file = fileInput.files[0];

    if (!file) {
        return;
    }

    namaFile = file.name;

    fileInfo.classList.remove("hidden");

    fileInfo.textContent =
        "File: " + file.name;

    bacaFile(file);

});


// ==========================================
// BACA EXCEL / CSV
// ==========================================

function bacaFile(file) {

    const reader = new FileReader();

    reader.onload = function (event) {

        try {

            const hasil = new Uint8Array(
                event.target.result
            );

            const workbook = XLSX.read(
                hasil,
                {
                    type: "array"
                }
            );

            const sheetPertama =
                workbook.Sheets[
                    workbook.SheetNames[0]
                ];

            const hasilData =
                XLSX.utils.sheet_to_json(
                    sheetPertama,
                    {
                        defval: ""
                    }
                );

            if (hasilData.length === 0) {

                alert(
                    "File kosong atau tidak memiliki data."
                );

                return;
            }

            dataAsli = hasilData.map(function (row) {
                return { ...row };
            });

            dataSekarang = hasilData.map(function (row) {
                return { ...row };
            });

            kolom = Object.keys(
                dataSekarang[0]
            );

            tampilkanTabel(dataSekarang);

            previewInfo.textContent =
                dataSekarang.length +
                " baris • " +
                kolom.length +
                " kolom";

            downloadBtn.disabled = false;

            tambahAktivitas(
                "File berhasil dibaca: " +
                file.name
            );

        } catch (error) {

            console.error(error);

            alert(
                "Gagal membaca file. Pastikan file Excel atau CSV valid."
            );

        }

    };

    reader.readAsArrayBuffer(file);

}


// ==========================================
// TAMPILKAN TABEL
// ==========================================
function tampilkanTabel(data) {

```
tableBody.innerHTML = "";

const kepalaTabel =
    dataTable.querySelector("thead");

kepalaTabel.innerHTML = "";

const barisHeader =
    document.createElement("tr");

const headerNomor =
    document.createElement("th");

headerNomor.textContent = "No";

barisHeader.appendChild(
    headerNomor
);

kolom.forEach(function (namaKolom) {

    const th =
        document.createElement("th");

    th.textContent =
        namaKolom;

    barisHeader.appendChild(th);

});

kepalaTabel.appendChild(
    barisHeader
);

if (data.length === 0) {

    const barisKosong =
        document.createElement("tr");

    const cellKosong =
        document.createElement("td");

    cellKosong.colSpan =
        kolom.length + 1;

    cellKosong.textContent =
        "Tidak ada data";

    barisKosong.appendChild(
        cellKosong
    );

    tableBody.appendChild(
        barisKosong
    );

    return;
}

data.forEach(function (row, index) {

    const tr =
        document.createElement("tr");

    const nomor =
        document.createElement("td");

    nomor.textContent =
        index + 1;

    tr.appendChild(nomor);

    kolom.forEach(function (namaKolom) {

        const td =
            document.createElement("td");

        let nilai =
            row[namaKolom];

        if (
            nilai === "" ||
            nilai === null ||
            nilai === undefined
        ) {
            nilai = "-";
        }

        td.textContent =
            nilai;

        tr.appendChild(td);

    });

    tableBody.appendChild(tr);

});
```

}

// ==========================================
// TOMBOL CONTOH PERINTAH
// ==========================================

const tombolContoh =
    document.querySelectorAll(
        ".example-btn"
    );


tombolContoh.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            commandInput.value =
                button.textContent.trim();

            commandInput.focus();

        }
    );

});


// ==========================================
// TOMBOL PROSES
// ==========================================



        // ----------------------------------
        // URUTKAN A-Z
        // ----------------------------------

        if (
            perintah.includes("urutkan") &&
            (
                perintah.includes("a-z") ||
                perintah.includes("az")
            )
        ) {

            urutkanNama();

            return;
        }


        // ----------------------------------
        // CARI DUPLIKAT
        // ----------------------------------

        if (
            perintah.includes("duplikat")
        ) {

            cariDuplikat();

            return;
        }


        // ----------------------------------
        // CARI DATA KOSONG
        // ----------------------------------

        if (
            perintah.includes("data kosong") ||
            perintah.includes("data kosong")
        ) {

            cariDataKosong();

            return;
        }


        alert(
            "Perintah tersebut belum tersedia."
        );

    }
);


// ==========================================
// URUTKAN NAMA A-Z
// ==========================================

function urutkanNama() {

    let kolomNama = null;


    for (
        let i = 0;
        i < kolom.length;
        i++
    ) {

        const nama =
            kolom[i]
                .toLowerCase()
                .trim();


        if (
            nama === "nama" ||
            nama === "name" ||
            nama === "nama lengkap" ||
            nama === "nama_lengkap"
        ) {

            kolomNama =
                kolom[i];

            break;
        }

    }


    if (!kolomNama) {

        alert(
            "Kolom nama tidak ditemukan."
        );

        return;
    }


    dataSekarang.sort(
        function (a, b) {

            const namaA =
                String(
                    a[kolomNama] || ""
                ).trim();

            const namaB =
                String(
                    b[kolomNama] || ""
                ).trim();


            // Data kosong di akhir

            if (
                namaA === "" &&
                namaB !== ""
            ) {
                return 1;
            }

            if (
                namaA !== "" &&
                namaB === ""
            ) {
                return -1;
            }


            return namaA.localeCompare(
                namaB,
                "id"
            );

        }
    );


    tampilkanTabel(
        dataSekarang
    );


    previewInfo.textContent =
        dataSekarang.length +
        " baris • Diurutkan A-Z";


    tambahAktivitas(
        "Data berhasil diurutkan berdasarkan nama A-Z."
    );

}


// ==========================================
// CARI DUPLIKAT
// ==========================================

function cariDuplikat() {

    if (kolom.length === 0) {
        return;
    }


    // Untuk sementara gunakan
    // kolom pertama

    const kolomCek =
        kolom[0];


    const jumlah =
        {};


    dataSekarang.forEach(
        function (row) {

            const nilai =
                String(
                    row[kolomCek] || ""
                )
                    .trim()
                    .toLowerCase();


            if (nilai !== "") {

                if (!jumlah[nilai]) {
                    jumlah[nilai] = 0;
                }

                jumlah[nilai]++;

            }

        }
    );


    const duplikat =
        dataSekarang.filter(
            function (row) {

                const nilai =
                    String(
                        row[kolomCek] || ""
                    )
                        .trim()
                        .toLowerCase();


                return (
                    nilai !== "" &&
                    jumlah[nilai] > 1
                );

            }
        );


    tampilkanTabel(
        duplikat
    );


    previewInfo.textContent =
        duplikat.length +
        " data duplikat ditemukan";


    tambahAktivitas(
        duplikat.length +
        " data duplikat ditemukan."
    );

}


// ==========================================
// CARI DATA KOSONG
// ==========================================

function cariDataKosong() {

    const hasil =
        dataSekarang.filter(
            function (row) {

                for (
                    let i = 0;
                    i < kolom.length;
                    i++
                ) {

                    const nilai =
                        row[kolom[i]];


                    if (
                        nilai === "" ||
                        nilai === null ||
                        nilai === undefined
                    ) {

                        return true;

                    }

                }


                return false;

            }
        );


    tampilkanTabel(
        hasil
    );


    previewInfo.textContent =
        hasil.length +
        " baris memiliki data kosong";


    tambahAktivitas(
        hasil.length +
        " baris memiliki data kosong."
    );

}


// ==========================================
// DOWNLOAD EXCEL
// ==========================================

downloadBtn.addEventListener(
    "click",
    function () {

        if (
            dataSekarang.length === 0
        ) {

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
            "Hasil"
        );


        let namaOutput =
            namaFile
                .replace(
                    /\.[^/.]+$/,
                    ""
                );


        namaOutput +=
            "_hasil.xlsx";


        XLSX.writeFile(
            workbook,
            namaOutput
        );


        tambahAktivitas(
            "File hasil berhasil didownload."
        );

    }
);


// ==========================================
// AKTIVITAS
// ==========================================

function tambahAktivitas(
    pesan
) {

    const kosong =
        activityList.querySelector(
            ".activity-empty"
        );


    if (kosong) {
        kosong.remove();
    }


    const item =
        document.createElement(
            "div"
        );


    item.className =
        "activity-item";


    const waktu =
        new Date()
            .toLocaleTimeString(
                "id-ID",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );


    item.textContent = pesan;

const waktuElement = document.createElement("div");

waktuElement.className = "activity-time";
waktuElement.textContent = waktu;

item.appendChild(waktuElement);


    activityList.prepend(
        item
    );

}


// ==========================================
// SELESAI
// ==========================================

console.log(
    "AI Admin Assistant berhasil dimuat."
);
```
Ganti bagian mulai dari:

`// TOMBOL PROSES`

sampai sebelum:

`// DOWNLOAD EXCEL`

dengan kode berikut:

```javascript
// ==========================================
// TOMBOL PROSES
// ==========================================

processBtn.addEventListener(
    "click",
    function () {

        if (dataSekarang.length === 0) {

            alert(
                "Upload file terlebih dahulu."
            );

            return;
        }

        const perintah =
            commandInput.value
                .trim()
                .toLowerCase();

        if (perintah === "") {

            alert(
                "Masukkan perintah terlebih dahulu."
            );

            return;
        }


        // ==================================
        // URUTKAN NAMA
        // ==================================

        if (
            perintah.includes("urutkan") ||
            perintah.includes("urutin") ||
            perintah.includes("sortir") ||
            perintah.includes("sort")
        ) {

            urutkanData(perintah);

            return;
        }


        // ==================================
        // DATA KOSONG
        // ==================================

        if (
            perintah.includes("kosong") ||
            perintah.includes("lengkap") ||
            perintah.includes("rapihin") ||
            perintah.includes("rapikan")
        ) {

            rapikanData();

            return;
        }


        // ==================================
        // DUPLIKAT
        // ==================================

        if (
            perintah.includes("duplikat") ||
            perintah.includes("duplicate") ||
            perintah.includes("sama")
        ) {

            cariDuplikat();

            return;
        }


        // ==================================
        // RESET DATA
        // ==================================

        if (
            perintah.includes("reset") ||
            perintah.includes("kembalikan") ||
            perintah.includes("data asli")
        ) {

            resetData();

            return;
        }


        // ==================================
        // PERINTAH BELUM TERSEDIA
        // ==================================

        alert(
            "Perintah belum tersedia di versi ini."
        );

        tambahAktivitas(
            "Perintah belum dikenali."
        );

    }
);


// ==========================================
// URUTKAN DATA
// ==========================================

function urutkanData(perintah) {

    let kolomNama = null;


    // Cari kolom nama secara otomatis

    for (
        let i = 0;
        i < kolom.length;
        i++
    ) {

        const namaKolom =
            kolom[i]
                .toLowerCase()
                .trim();


        if (
            namaKolom === "nama" ||
            namaKolom === "name" ||
            namaKolom === "nama lengkap" ||
            namaKolom === "nama_lengkap"
        ) {

            kolomNama =
                kolom[i];

            break;
        }

    }


    if (!kolomNama) {

        alert(
            "Kolom nama tidak ditemukan."
        );

        return;
    }


    // Tentukan arah pengurutan

    let arahZtoA =
        perintah.includes("z-a") ||
        perintah.includes("za") ||
        perintah.includes("z ke a");


    dataSekarang.sort(
        function (a, b) {

            const namaA =
                String(
                    a[kolomNama] || ""
                ).trim();

            const namaB =
                String(
                    b[kolomNama] || ""
                ).trim();


            // ==============================
            // DATA KOSONG SELALU DI BAWAH
            // ==============================

            if (
                namaA === "" &&
                namaB !== ""
            ) {

                return 1;
            }

            if (
                namaA !== "" &&
                namaB === ""
            ) {

                return -1;
            }


            // Dua-duanya kosong

            if (
                namaA === "" &&
                namaB === ""
            ) {

                return 0;
            }


            // ==============================
            // URUTKAN
            // ==============================

            const hasil =
                namaA.localeCompare(
                    namaB,
                    "id"
                );


            if (arahZtoA) {

                return hasil * -1;

            }


            return hasil;

        }
    );


    tampilkanTabel(
        dataSekarang
    );


    previewInfo.textContent =
        dataSekarang.length +
        " baris • Data kosong tetap dipertahankan";


    tambahAktivitas(
        "Data berhasil diurutkan. Data kosong tetap berada di bagian bawah."
    );

}


// ==========================================
// RAPIIKAN DATA
// DATA KOSONG TIDAK DIHAPUS
// ==========================================

function rapikanData() {

    dataSekarang.sort(
        function (a, b) {

            const kosongA =
                cekBarisKosong(a);

            const kosongB =
                cekBarisKosong(b);


            if (
                kosongA &&
                !kosongB
            ) {

                return 1;
            }


            if (
                !kosongA &&
                kosongB
            ) {

                return -1;
            }


            return 0;

        }
    );


    tampilkanTabel(
        dataSekarang
    );


    const jumlahKosong =
        dataSekarang.filter(
            function (row) {

                return cekBarisKosong(row);

            }
        ).length;


    previewInfo.textContent =
        dataSekarang.length +
        " baris • " +
        jumlahKosong +
        " baris kosong/tidak lengkap dipindahkan ke bawah";


    tambahAktivitas(
        jumlahKosong +
        " baris kosong/tidak lengkap dipindahkan ke bagian bawah. Tidak ada data yang dihapus."
    );

}


// ==========================================
// CEK DATA TIDAK LENGKAP
// ==========================================

function cekBarisKosong(row) {

    for (
        let i = 0;
        i < kolom.length;
        i++
    ) {

        const nilai =
            row[kolom[i]];


        if (
            nilai === "" ||
            nilai === null ||
            nilai === undefined
        ) {

            return true;

        }

    }


    return false;

}


// ==========================================
// RESET KE DATA ASLI
// ==========================================

function resetData() {

    dataSekarang =
        dataAsli.map(
            function (row) {

                return {
                    ...row
                };

            }
        );


    tampilkanTabel(
        dataSekarang
    );


    previewInfo.textContent =
        dataSekarang.length +
        " baris • Data asli";


    tambahAktivitas(
        "Data dikembalikan ke kondisi awal."
    );

}
```

