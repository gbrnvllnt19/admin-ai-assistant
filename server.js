const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", function (req, res) {
    res.send("AI Admin Server aktif.");
});

app.post("/api/ai", async function (req, res) {
    try {
        const perintah = req.body.perintah;

        if (!perintah) {
            return res.status(400).json({
                error: "Perintah tidak boleh kosong."
            });
        }

        const response = await fetch(
            "https://api.deepseek.com/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + process.env.DEEPSEEK_API_KEY
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: "Kamu adalah AI Admin Assistant. Kamu hanya membantu pekerjaan administrasi dan pengolahan data. Data kosong tidak boleh dihapus. Data kosong harus dipertahankan. Data asli harus selalu dipertahankan."
                        },
                        {
                            role: "user",
                            content: perintah
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.error?.message || "Gagal menghubungi DeepSeek."
            });
        }

        res.json({
            jawaban: data.choices[0].message.content
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Terjadi kesalahan pada server."
        });
    }
});

const PORT = 3000;

app.listen(PORT, function () {
    console.log("AI Admin Server berjalan di http://localhost:" + PORT);
});