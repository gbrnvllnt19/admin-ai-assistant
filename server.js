const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");

dotenv.config();

const app = express();
const PORT = 3000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || "secret-default",

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);


// =====================================================
// FILE HTML / CSS / JS
// =====================================================

app.use(express.static(__dirname));


// =====================================================
// LOGIN
// =====================================================

app.post("/api/login", function (req, res) {

    const username = req.body.username;
    const password = req.body.password;


    if (!username || !password) {
        return res.status(400).json({
            error: "Username dan password wajib diisi."
        });
    }


    if (
        username !== process.env.ADMIN_USERNAME ||
        password !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            error: "Username atau password salah."
        });
    }


    req.session.loggedIn = true;
    req.session.username = username;


    res.json({
        success: true,
        username: username
    });

});


// =====================================================
// CEK LOGIN
// =====================================================

app.get("/api/check-login", function (req, res) {

    if (req.session.loggedIn === true) {

        return res.json({
            loggedIn: true,
            username: req.session.username
        });

    }


    res.json({
        loggedIn: false
    });

});


// =====================================================
// LOGOUT
// =====================================================

app.post("/api/logout", function (req, res) {

    req.session.destroy(function (error) {

        if (error) {

            console.error("Logout error:", error);

            return res.status(500).json({
                error: "Gagal logout."
            });

        }


        res.json({
            success: true
        });

    });

});


// =====================================================
// PROTEKSI LOGIN
// =====================================================

function wajibLogin(req, res, next) {

    if (req.session.loggedIn === true) {
        return next();
    }


    res.status(401).json({
        error: "Anda harus login terlebih dahulu."
    });

}


// =====================================================
// DEEPSEEK AI
// =====================================================

app.post(
    "/api/ai",
    wajibLogin,
    async function (req, res) {

        try {

            // script.js mengirim "prompt"
            const prompt = req.body.prompt;


            if (!prompt) {

                return res.status(400).json({
                    error: "Prompt tidak boleh kosong."
                });

            }


            // Cek API KEY
            if (!process.env.DEEPSEEK_API_KEY) {

                return res.status(500).json({
                    error:
                        "DEEPSEEK_API_KEY belum diatur di file .env."
                });

            }


            const response = await fetch(
                "https://api.deepseek.com/chat/completions",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",

                        "Authorization":
                            "Bearer " +
                            process.env.DEEPSEEK_API_KEY
                    },

                    body: JSON.stringify({

                        model: "deepseek-chat",

                        messages: [

                            {
                                role: "system",

                                content:
                                    `
Kamu adalah AI Admin Assistant.

Fokus utama kamu adalah membantu pekerjaan administrasi dan pengolahan data.

Kamu dapat membantu:
- Excel
- CSV
- Rekap data
- Penyortiran data
- Penggabungan data
- Pencarian data
- Pengecekan data kosong
- Pengecekan data tidak lengkap
- Pengecekan data duplikat
- Normalisasi format
- Rekap berdasarkan kategori
- Pengolahan data administrasi lainnya

ATURAN PENTING:

1. Jangan menghapus data kosong atau tidak lengkap secara otomatis.

2. Data kosong atau tidak lengkap harus tetap dipertahankan.

3. Jika data perlu dirapikan, data kosong atau tidak lengkap ditempatkan di bagian paling bawah.

4. Data asli harus selalu dipertahankan.

5. Gunakan Bahasa Indonesia yang natural dan mudah dipahami.

6. Jangan mengarang data yang tidak tersedia.

7. Jika pengguna meminta perubahan data, jelaskan perubahan yang dilakukan dengan jelas.
`
                            },

                            {
                                role: "user",

                                content: prompt
                            }

                        ],

                        temperature: 0.2

                    })
                }
            );


            const data = await response.json();


            if (!response.ok) {

                return res.status(response.status).json({

                    error:
                        data.error?.message ||
                        "Gagal menghubungi DeepSeek."

                });

            }


            const hasil =
                data.choices &&
                data.choices[0] &&
                data.choices[0].message
                    ? data.choices[0].message.content
                    : "AI tidak memberikan jawaban.";


            // script.js mengharapkan "result"
            res.json({
                success: true,
                result: hasil
            });


        } catch (error) {

            console.error(
                "DeepSeek Error:",
                error
            );


            res.status(500).json({
                error:
                    "Terjadi kesalahan pada server AI."
            });

        }

    }
);


// =====================================================
// SERVER
// =====================================================

app.listen(
    PORT,
    function () {

        console.log(
            "AI Admin Server berjalan di http://localhost:" +
            PORT
        );

    }
);
