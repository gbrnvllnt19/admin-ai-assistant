const express = require("express");
const dotenv = require("dotenv");
const crypto = require("crypto");
const path = require("path");

dotenv.config();

const app = express();

app.use(express.json());


// =====================================================
// STATIC FILE
// =====================================================

app.use(express.static(path.join(__dirname)));


// =====================================================
// COOKIE SESSION SEDERHANA
// =====================================================

const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;

function buatSignature(data) {
    return crypto
        .createHmac(
            "sha256",
            process.env.SESSION_SECRET || "secret-default"
        )
        .update(data)
        .digest("hex");
}

function buatSession(username) {
    const data = Buffer.from(
        JSON.stringify({
            username: username,
            expires: Date.now() + SESSION_MAX_AGE
        })
    ).toString("base64url");

    const signature = buatSignature(data);

    return data + "." + signature;
}

function bacaCookie(req, nama) {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
        return null;
    }

    const cookies = cookieHeader.split(";");

    for (const cookie of cookies) {
        const bagian = cookie.trim().split("=");

        if (bagian[0] === nama) {
            return bagian.slice(1).join("=");
        }
    }

    return null;
}

function cekSession(req) {
    const token = bacaCookie(req, "admin_session");

    if (!token) {
        return null;
    }

    const bagian = token.split(".");

    if (bagian.length !== 2) {
        return null;
    }

    const data = bagian[0];
    const signature = bagian[1];

    const signatureBenar = buatSignature(data);

    if (signature !== signatureBenar) {
        return null;
    }

    try {
        const session = JSON.parse(
            Buffer.from(data, "base64url").toString()
        );

        if (Date.now() > session.expires) {
            return null;
        }

        return session;

    } catch (error) {
        return null;
    }
}


// =====================================================
// HALAMAN UTAMA
// =====================================================

app.get("/", function (req, res) {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


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

    const sessionToken = buatSession(username);

    const secureCookie =
        process.env.NODE_ENV === "production"
            ? " Secure;"
            : "";

    res.setHeader(
        "Set-Cookie",
        "admin_session=" +
        sessionToken +
        "; HttpOnly; SameSite=Lax; Path=/; Max-Age=" +
        Math.floor(SESSION_MAX_AGE / 1000) +
        ";" +
        secureCookie
    );

    res.json({
        success: true,
        username: username
    });

});


// =====================================================
// CEK LOGIN
// =====================================================

app.get("/api/check-login", function (req, res) {

    const session = cekSession(req);

    if (!session) {

        return res.json({
            loggedIn: false
        });

    }

    res.json({
        loggedIn: true,
        username: session.username
    });

});


// =====================================================
// LOGOUT
// =====================================================

app.post("/api/logout", function (req, res) {

    res.setHeader(
        "Set-Cookie",
        "admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"
    );

    res.json({
        success: true
    });

});


// =====================================================
// PROTEKSI LOGIN
// =====================================================

function wajibLogin(req, res, next) {

    const session = cekSession(req);

    if (!session) {

        return res.status(401).json({
            error: "Anda harus login terlebih dahulu."
        });

    }

    req.username = session.username;

    next();

}


// =====================================================
// DEEPSEEK AI
// =====================================================

app.post(
    "/api/ai",
    wajibLogin,
    async function (req, res) {

        try {

            const prompt = req.body.prompt;

            if (!prompt) {

                return res.status(400).json({
                    error: "Prompt tidak boleh kosong."
                });

            }

            if (!process.env.DEEPSEEK_API_KEY) {

                return res.status(500).json({
                    error:
                        "DEEPSEEK_API_KEY belum diatur di Environment Variables."
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

                                content: `
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
// EXPORT UNTUK VERCEL
// =====================================================

module.exports = app;


// =====================================================
// SERVER LOKAL
// =====================================================

if (require.main === module) {

    const PORT = process.env.PORT || 3000;

    app.listen(
        PORT,
        function () {

            console.log(
                "AI Admin Server berjalan di http://localhost:" +
                PORT
            );

        }
    );

}
