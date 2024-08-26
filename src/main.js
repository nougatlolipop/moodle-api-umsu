require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk parsing JSON
app.use(express.json());

// Fungsi untuk mendapatkan user ID dari token
async function getUserIdFromToken(token) {
  try {
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_webservice_get_site_info",
          moodlewsrestformat: "json",
        },
      }
    );

    return response.data.userid;
  } catch (error) {
    throw new Error("Failed to get user ID from token");
  }
}

// Endpoint untuk login dan mendapatkan token dari Moodle
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const response = await axios.post(
      `${process.env.MOODLE_URL}/login/token.php`,
      null,
      {
        params: {
          username: username,
          password: password,
          service: process.env.MOODLE_SERVICE,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk mendapatkan kursus yang terdaftar berdasarkan klasifikasi timeline
app.post("/get-enrolled-courses", async (req, res) => {
  const { token, classification, offset, limit } = req.body;

  try {
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction:
            "core_course_get_enrolled_courses_by_timeline_classification",
          moodlewsrestformat: "json",
          classification: classification, // Misalnya: 'past,inprogress,future'
          offset: offset || 0, // Offset untuk pagination
          limit: limit || 10, // Jumlah data yang dikembalikan
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk mencari kursus berdasarkan keyword
app.post("/search-courses", async (req, res) => {
  const { token, query } = req.body;

  try {
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_course_search_courses",
          moodlewsrestformat: "json",
          criterianame: "search",
          criteriavalue: query || "", // Kata kunci untuk mencari kursus
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk mendapatkan kursus terbaru yang diakses
app.post("/get-recent-courses", async (req, res) => {
  const { token } = req.body;

  try {
    // Ambil user ID dari token
    const userid = await getUserIdFromToken(token);
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_enrol_get_users_courses",
          moodlewsrestformat: "json",
          userid: userid, // ID pengguna yang ingin Anda ambil data kursus terbarunya
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk mendaftarkan pengguna ke kursus menggunakan self-enrolment
app.post("/enrol-user-to-course", async (req, res) => {
  const { token, courseid, password } = req.body;

  try {
    // Kirim request ke API Moodle untuk self-enrolment
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "enrol_self_enrol_user",
          moodlewsrestformat: "json",
          courseid: courseid, // ID kursus yang ingin didaftarkan
          password: password || "", // password jika ada
        },
      }
    );

    // Jika sukses, balikan data response dari Moodle
    res.json(response.data);
  } catch (error) {
    // Menangkap dan mengembalikan error dari Moodle
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk mendapatkan konten dari kursus
app.post("/course-contents", async (req, res) => {
  const { token, courseid } = req.body; // ID kursus yang ingin diambil kontennya

  try {
    // Kirim request ke API Moodle untuk mendapatkan konten kursus
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_course_get_contents",
          moodlewsrestformat: "json",
          courseid: courseid, // ID kursus
        },
      }
    );

    // Kembalikan data konten kursus dari response Moodle
    res.json(response.data);
  } catch (error) {
    // Jika terjadi error, kirim pesan error kembali ke client
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk mendapatkan user berdasarkan field
app.post("/get-users-by-field", async (req, res) => {
  const { token, field, value } = req.body; // Field dan values yang ingin dicari

  try {
    // Kirim request ke API Moodle untuk mendapatkan user berdasarkan field
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_user_get_users_by_field",
          moodlewsrestformat: "json",
          field: field, // Field yang ingin dicari (contoh: username, email)
          values: [value], // Array dari values (contoh: ['john.doe@example.com'])
        },
      }
    );

    // Kembalikan data user dari response Moodle
    res.json(response.data);
  } catch (error) {
    // Jika terjadi error, kirim pesan error kembali ke client
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk mendapatkan kategori kursus
app.post("/get-course-categories", async (req, res) => {
  const { token, criteria } = req.body; // Token untuk otentikasi

  try {
    // Kirim request ke API Moodle untuk mendapatkan kategori kursus
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_course_get_categories",
          moodlewsrestformat: "json",
          criteria: criteria, // Kirim kriteria untuk filter
        },
      }
    );

    // Kembalikan data kategori kursus dari response Moodle
    res.json(response.data);
  } catch (error) {
    // Jika terjadi error, kirim pesan error kembali ke client
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk mendapatkan kursus berdasarkan kategori
app.post("/get-courses-by-categories", async (req, res) => {
  const { token, ids } = req.body; // Token untuk otentikasi dan ids untuk filter

  try {
    // Kirim request ke API Moodle untuk mendapatkan semua kategori
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_course_get_categories",
          moodlewsrestformat: "json",
        },
      }
    );

    // Ambil data kategori dari response Moodle
    let categories = response.data;

    // Filter data berdasarkan IDs yang disediakan
    if (ids && Array.isArray(ids)) {
      categories = categories.filter((category) => ids.includes(category.id));
    }

    // Kembalikan data kategori dari response Moodle
    res.json(categories);
  } catch (error) {
    // Jika terjadi error, kirim pesan error kembali ke client
    res.status(500).json({ error: error.message });
  }
});

//get sub category
app.post("/get-subcategories", async (req, res) => {
  const { token } = req.body; // Token untuk otentikasi dan parentId untuk filter subkategori

  try {
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_course_get_categories",
          moodlewsrestformat: "json",
        },
      }
    );

    // Kembalikan data subkategori dari response Moodle
    res.json(response.data);
  } catch (error) {
    // Jika terjadi error, kirim pesan error kembali ke client
    res.status(500).json({ error: error.message });
  }
});

// Endpoint untuk mendapatkan kursus berdasarkan ID kategori
app.post("/get-courses-by-category", async (req, res) => {
  const { token, categoryId } = req.body;

  if (!token || !categoryId) {
    return res.status(400).json({ error: "Token and categoryId are required" });
  }

  try {
    const responsecategory = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_course_get_categories",
          moodlewsrestformat: "json",
        },
      }
    );
    // Ambil data kategori dari response Moodle
    let categories = responsecategory.data;
    const key = "parent";
    const value = categoryId;
    // Filter data berdasarkan key dan value jika disediakan
    if (key && value) {
      categories = categories.filter((category) => category[key] === value);
    }

    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_course_get_courses_by_field",
          moodlewsrestformat: "json",
          field: "category",
          value: categoryId,
        },
      }
    );

    res.json({ categories: categories, ...response.data });
  } catch (error) {
    console.error("Error loading courses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint untuk melihat buku berdasarkan ID buku
app.post("/view-book", async (req, res) => {
  const { token, bookId } = req.body;

  if (!token || !bookId) {
    return res.status(400).json({ error: "Token and bookId are required" });
  }

  console.log(`Fetching book with ID: ${bookId}`); // Logging untuk verifikasi

  try {
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "mod_book_view_book",
          moodlewsrestformat: "json",
          bookid: bookId, // Pastikan parameter sesuai
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(
      "Error viewing book:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint untuk memperbarui pengguna (termasuk password)
app.post("/update-users", async (req, res) => {
  const { token, users } = req.body;

  if (!token || users.length === 0) {
    return res.status(400).json({
      error:
        "Token and users are required. Users must be an array and not empty",
    });
  }

  try {
    // Kirim permintaan ke API Moodle
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_user_update_users",
          moodlewsrestformat: "json",
          users: [users],
        },
      }
    );

    res
      .status(200)
      .json({ message: "Users updated successfully", data: response.data });
  } catch (error) {
    console.error(
      "Error updating users:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/download-file", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Token and file URL are required" });
  }

  try {
    const response = await axios.get(
      `https://elearning.umsu.ac.id/webservice/pluginfile.php/1053498/mod_resource/content/1/bukti_bayar_1903090075_82_2024-06-10_12-32.pdf?forcedownload=1&token=${token}`,
      {
        responseType: "arraybuffer", // for binary data (e.g., PDFs)
      }
    );

    res.set({
      "Content-Type": response.headers["content-type"] || "application/pdf", // Use the content type from response
      "Content-Disposition": 'attachment; filename="file.pdf"',
    });

    res.send(response.data); // Send binary data as response
  } catch (error) {
    console.error(
      "Error downloading file:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint untuk mendapatkan daftar pengguna yang terdaftar dalam kursus (termasuk ueid)
app.post("/get-enrolled-users", async (req, res) => {
  const { token, courseid } = req.body;

  if (!token || !courseid) {
    return res.status(400).json({ error: "Token and courseid are required" });
  }

  try {
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_enrol_get_enrolled_users",
          moodlewsrestformat: "json",
          courseid: courseid,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching enrolled users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Endpoint untuk unenrol pengguna berdasarkan ueid
// app.post("/unenrol-user", async (req, res) => {
//   const { token, ueid } = req.body;

//   if (!token || !ueid) {
//     return res.status(400).json({ error: "Token and ueid are required" });
//   }

//   try {
//     const response = await axios.post(
//       `${process.env.MOODLE_URL}/webservice/rest/server.php`,
//       null,
//       {
//         params: {
//           wstoken: token,
//           wsfunction: "core_enrol_unenrol_user_enrolment",
//           moodlewsrestformat: "json",
//           enrolments: JSON.stringify([{ ueid }]), // Menggunakan ueid yang didapatkan sebelumnya
//         },
//       }
//     );

//     res.json({ message: "User unenrolled successfully", data: response.data });
//   } catch (error) {
//     console.error(
//       "Error unenrolling user:",
//       error.response ? error.response.data : error.message
//     );
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

app.post("/unenrol-user", async (req, res) => {
  const { token, ueid } = req.body;

  if (!token || !ueid) {
    return res.status(400).json({ error: "Token and ueid are required" });
  }

  try {
    // Panggil API Moodle untuk unenrol pengguna berdasarkan ueid
    const response = await axios.post(
      `${process.env.MOODLE_URL}/webservice/rest/server.php`,
      null,
      {
        params: {
          wstoken: token,
          wsfunction: "core_enrol_unenrol_user_enrolment",
          moodlewsrestformat: "json",
          ueid: ueid, // Pastikan ueid valid
        },
      }
    );

    // Cek apakah ada kesalahan dari API Moodle
    if (response.data.errorcode) {
      return res.status(400).json({ error: response.data.message });
    }

    // Jika sukses, kirim pesan berhasil
    res.json({ message: "User unenrolled successfully", data: response.data });
  } catch (error) {
    console.error(
      "Error unenrolling user:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Menjalankan server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
