/*
  seedHistoricalEncryptedGrades_CRT.js

  Seed điểm lịch sử theo đúng flow Diffie-Hellman + CRT đang dùng trong hệ thống:

    Mã hóa:
      PUBLIC_KEY sinh viên = G ^ PIN_sinh_vien mod P
      sharedSecret          = PUBLIC_KEY_sinh_vien ^ PIN_giang_vien mod P
      sharedSecret -> startIndex/endIndex -> 3 số nguyên tố -> CRT -> C

    Giải mã:
      PUBLIC_KEY giảng viên = G ^ PIN_giang_vien mod P
      sharedSecret          = PUBLIC_KEY_giang_vien ^ PIN_sinh_vien mod P

  Điểm quan trọng của bản này:
  - Không dùng một PIN chung một cách mù quáng cho mọi giảng viên.
  - Kiểm tra PIN được cung cấp có khớp GIANG_VIEN.PIN_HASH hay không.
  - Kiểm tra PUBLIC_KEY giảng viên có đúng G^PIN mod P hay không.
  - START_INDEX, END_INDEX chỉ được tính trong bộ nhớ và không lưu vào DIEM_CRT.
  - Mặc định bỏ qua 2025-2026 HK2 để giảng viên import trên giao diện.
  - Không lưu GK/CK/TB dạng rõ trong database.

  Ví dụ:
    node scripts/seedHistoricalEncryptedGrades_CRT.js --students=SV001,SV920 --concurrency=20
    node scripts/seedHistoricalEncryptedGrades_CRT.js --all --concurrency=30

  Nếu tất cả giảng viên vẫn dùng PIN mặc định 123456:
    node scripts/seedHistoricalEncryptedGrades_CRT.js --teacher-pin=123456 --concurrency=30

  Nếu một số giảng viên đã đổi PIN, tạo file JSON:
    {
      "GV0101": "123456",
      "GV0102": "456789"
    }

  rồi chạy:
    node scripts/seedHistoricalEncryptedGrades_CRT.js --teacher-pin-file=teacher-pins.json

  Có thể truyền JSON trực tiếp:
    node scripts/seedHistoricalEncryptedGrades_CRT.js --teacher-pin-map={"GV0101":"123456"}
*/

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sql = require("msnodesqlv8");

const connectionString =
  process.env.DB_CONNECTION_STRING ||
  "Server=localhost\\SQLEXPRESS;" +
    "Database=QLSV_AT;" +
    "Trusted_Connection=Yes;" +
    "Driver={ODBC Driver 17 for SQL Server};" +
    "Encrypt=no;TrustServerCertificate=yes;";

const P = BigInt(
  "0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF"
);
const G = 2n;
const N = 5_000_000n;
const NUMBER_OF_GRADES = 3n;
const MAX_SCORE_X10 = 100n;
const ALGORITHM_VERSION = "CRT_DH_V2";
const LEGACY_ALGORITHM_VERSION = "CRT_V1";

function getArg(name, defaultValue = "") {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  return found ? found.slice(prefix.length) : defaultValue;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function parseBoolArg(name, defaultValue = false) {
  const raw = getArg(name, String(defaultValue)).toLowerCase();
  return raw === "true" || raw === "1" || hasFlag(name);
}

const STUDENTS_ARG = getArg("students");
const CLASS_ARG = getArg("class");
const YEAR_ARG = getArg("year");
const SEMESTER_ARG = getArg("semester");
const LIMIT = Math.max(0, Number(getArg("limit", process.env.MAX_SEED_ROWS || "0")) || 0);
const CONCURRENCY = Math.max(
  1,
  Number(getArg("concurrency", process.env.SEED_CONCURRENCY || "20")) || 20
);
const INCLUDE_CURRENT_TERM = parseBoolArg("include-current", false);
const FORCE = parseBoolArg("force", false);
const DRY_RUN = parseBoolArg("dry-run", false);
const REPAIR_PUBLIC_KEYS = parseBoolArg("repair-public-keys", false);
const DEFAULT_TEACHER_PIN = String(
  getArg("teacher-pin", process.env.SEED_TEACHER_PIN || "123456")
).trim();
const TEACHER_PIN_FILE = getArg("teacher-pin-file");
const TEACHER_PIN_MAP_ARG = getArg("teacher-pin-map");

const FILTER_STUDENTS = STUDENTS_ARG
  ? STUDENTS_ARG.split(",").map((x) => x.trim().toUpperCase()).filter(Boolean)
  : [];

function clean(value) {
  return String(value ?? "").trim();
}

function queryAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    sql.query(connectionString, query, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function columnExists(tableName, columnName) {
  const rows = await queryAsync(
    `
      SELECT 1 AS ok
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function getMetadata() {
  return {
    diemHasNamHoc: await columnExists("DIEM_CRT", "NamHoc"),
    diemHasHocKy: await columnExists("DIEM_CRT", "HocKy"),
    diemHasHocky: await columnExists("DIEM_CRT", "HOCKY"),
    diemHasUpdatedAt: await columnExists("DIEM_CRT", "UPDATED_AT"),
    diemHasMaKhoaCrt: await columnExists("DIEM_CRT", "MAKHOA_CRT"),
    diemHasMaLopCrt: await columnExists("DIEM_CRT", "MALOP_CRT"),
    diemHasSvPublicKeyCrt: await columnExists("DIEM_CRT", "SV_PUBLIC_KEY_CRT"),
    diemHasAlgorithmVersion: await columnExists("DIEM_CRT", "ALGORITHM_VERSION"),
    diemHasKeyVersion: await columnExists("DIEM_CRT", "KEY_VERSION"),
  };
}

function sha256Hex(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex").toUpperCase();
}

function sha256BigInt(text) {
  return BigInt(`0x${crypto.createHash("sha256").update(text, "utf8").digest("hex")}`);
}

function modPow(base, exponent, modulus) {
  let result = 1n;
  let b = base % modulus;
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % modulus;
    e >>= 1n;
    b = (b * b) % modulus;
  }
  return result;
}

function extendedGcd(a, b) {
  if (b === 0n) return [a, 1n, 0n];
  const [g, x1, y1] = extendedGcd(b, a % b);
  return [g, y1, x1 - (a / b) * y1];
}

function modularInverse(a, modulus) {
  const [g, x] = extendedGcd((a % modulus + modulus) % modulus, modulus);
  if (g !== 1n) throw new Error("Không có nghịch đảo modular");
  return (x % modulus + modulus) % modulus;
}

function calculatePublicKey(pin) {
  if (!/^\d+$/.test(pin)) throw new Error("PIN giảng viên phải là số");
  return modPow(G, BigInt(pin), P).toString();
}

function calculateStartIndex({ maKhoa, maLop, mssv, maHp, publicKey, pin }) {
  const publicKeyClean = clean(publicKey);
  const pinClean = clean(pin);
  if (!/^\d+$/.test(publicKeyClean)) throw new Error("PUBLIC_KEY sinh viên không hợp lệ");
  if (!/^\d+$/.test(pinClean)) throw new Error("PIN giảng viên không hợp lệ");

  const sharedSecret = modPow(BigInt(publicKeyClean), BigInt(pinClean), P).toString();
  const safeRange = N - MAX_SCORE_X10 - NUMBER_OF_GRADES + 1n;
  const seed = [
    clean(maKhoa),
    clean(maLop),
    clean(mssv).toLowerCase(),
    clean(maHp).toUpperCase(),
    LEGACY_ALGORITHM_VERSION,
    sharedSecret,
  ].join("|");

  return Number((sha256BigInt(seed) % safeRange) + MAX_SCORE_X10);
}

function crtEncrypt(values, primes) {
  const residues = values.map((x) => BigInt(x));
  const moduli = primes.map((x) => BigInt(clean(x)));
  const M = moduli.reduce((acc, value) => acc * value, 1n);
  let C = 0n;

  for (let i = 0; i < residues.length; i += 1) {
    if (residues[i] < 0n || residues[i] >= moduli[i]) {
      throw new Error(`Điểm ${residues[i]} không hợp lệ với prime ${moduli[i]}`);
    }
    const Mi = M / moduli[i];
    const yi = modularInverse(Mi % moduli[i], moduli[i]);
    C += residues[i] * Mi * yi;
  }
  return ((C % M) + M) % M;
}

function deterministicGrades(mssv, maHp, namHoc, hocKy) {
  const seed = sha256BigInt(`${mssv}|${maHp}|${namHoc}|${hocKy}`);
  const gk = 40 + Number(seed % 55n); // 4.0 -> 9.4
  const ck = 42 + Number((seed * 7n) % 55n); // 4.2 -> 9.6
  const tb = Math.round(gk * 0.4 + ck * 0.6);
  return [gk, ck, tb];
}

function loadTeacherPinMap() {
  const result = {};

  if (TEACHER_PIN_FILE) {
    const fullPath = path.resolve(process.cwd(), TEACHER_PIN_FILE);
    const parsed = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    Object.entries(parsed || {}).forEach(([maGv, pin]) => {
      result[clean(maGv).toUpperCase()] = clean(pin);
    });
  }

  if (TEACHER_PIN_MAP_ARG) {
    const parsed = JSON.parse(TEACHER_PIN_MAP_ARG);
    Object.entries(parsed || {}).forEach(([maGv, pin]) => {
      result[clean(maGv).toUpperCase()] = clean(pin);
    });
  }

  return result;
}

const TEACHER_PIN_MAP = loadTeacherPinMap();
const teacherValidationCache = new Map();

async function getVerifiedTeacherPin(row) {
  const maGv = clean(row.MaGV).toUpperCase();
  if (!maGv) throw new Error("Học phần chưa có MaGV");

  if (teacherValidationCache.has(maGv)) {
    return teacherValidationCache.get(maGv);
  }

  const pin = clean(TEACHER_PIN_MAP[maGv] || DEFAULT_TEACHER_PIN);
  if (!/^\d{4,100}$/.test(pin)) {
    throw new Error(`PIN seed của ${maGv} phải là số và có ít nhất 4 chữ số`);
  }

  const expectedHash = sha256Hex(pin);
  const dbHash = clean(row.GvPinHash).toUpperCase();
  if (!dbHash || dbHash !== expectedHash) {
    throw new Error(
      `PIN seed không khớp PIN_HASH của ${maGv}. ` +
        `Hãy truyền đúng PIN bằng --teacher-pin-file hoặc --teacher-pin-map.`
    );
  }

  const expectedPublicKey = calculatePublicKey(pin);
  const dbPublicKey = clean(row.GvPublicKey);

  if (dbPublicKey !== expectedPublicKey) {
    if (!REPAIR_PUBLIC_KEYS) {
      throw new Error(
        `PUBLIC_KEY của ${maGv} không khớp PIN hiện tại. ` +
          `Chạy SQL tổng mới hoặc thêm --repair-public-keys=true trước khi seed.`
      );
    }

    await queryAsync(
      `UPDATE dbo.GIANG_VIEN SET PUBLIC_KEY = ? WHERE UPPER(LTRIM(RTRIM(MaGV))) = UPPER(?)`,
      [expectedPublicKey, maGv]
    );
    console.log(`Đã sửa PUBLIC_KEY của ${maGv} theo PIN hợp lệ.`);
  }

  const value = { pin, publicKey: expectedPublicKey };
  teacherValidationCache.set(maGv, value);
  return value;
}

async function loadTargetRows() {
  const where = ["CAST(LEFT(tkb.NamHoc, 4) AS INT) BETWEEN 2022 AND 2025"];
  const params = [];

  if (!INCLUDE_CURRENT_TERM) {
    where.push("NOT (LTRIM(RTRIM(tkb.NamHoc)) = '2025-2026' AND tkb.HOCKY = 2)");
  }
  if (FILTER_STUDENTS.length > 0) {
    where.push(`UPPER(LTRIM(RTRIM(tkb.MASV))) IN (${FILTER_STUDENTS.map(() => "?").join(",")})`);
    params.push(...FILTER_STUDENTS);
  }
  if (CLASS_ARG) {
    where.push("UPPER(LTRIM(RTRIM(sv.MaLop))) = UPPER(?)");
    params.push(CLASS_ARG);
  }
  if (YEAR_ARG) {
    where.push("LTRIM(RTRIM(tkb.NamHoc)) = ?");
    params.push(YEAR_ARG);
  }
  if (SEMESTER_ARG) {
    where.push("tkb.HOCKY = ?");
    params.push(Number(SEMESTER_ARG));
  }

  let rows = await queryAsync(
    `
      SELECT DISTINCT
        LTRIM(RTRIM(tkb.MASV)) AS MASV,
        LTRIM(RTRIM(tkb.MAHP)) AS MAHP,
        LTRIM(RTRIM(tkb.NamHoc)) AS NamHoc,
        tkb.HOCKY AS HocKy,
        LTRIM(RTRIM(COALESCE(NULLIF(hp.MaLop, ''), NULLIF(tkb.MaLop, ''), sv.MaLop))) AS MaLop,
        LTRIM(RTRIM(COALESCE(NULLIF(sv.Khoa, ''), NULLIF(hp.MaKhoa, ''), NULLIF(l.MAKHOA, ''), 'CNTT'))) AS MaKhoa,
        sv.PUBLIC_KEY AS SvPublicKey,
        LTRIM(RTRIM(hp.MaGV)) AS MaGV,
        gv.PUBLIC_KEY AS GvPublicKey,
        gv.PIN_HASH AS GvPinHash,
        hp.TenHP
      FROM dbo.THOI_KHOA_BIEU tkb
      INNER JOIN dbo.SINH_VIEN sv
        ON UPPER(LTRIM(RTRIM(sv.MaSV))) = UPPER(LTRIM(RTRIM(tkb.MASV)))
      LEFT JOIN dbo.LOP l
        ON LTRIM(RTRIM(l.MaLop)) = LTRIM(RTRIM(sv.MaLop))
      INNER JOIN dbo.HOC_PHAN hp
        ON LTRIM(RTRIM(hp.MAHP)) = LTRIM(RTRIM(tkb.MAHP))
       AND hp.HocKy = tkb.HOCKY
       AND LTRIM(RTRIM(hp.NamHoc)) = LTRIM(RTRIM(tkb.NamHoc))
      INNER JOIN dbo.GIANG_VIEN gv
        ON UPPER(LTRIM(RTRIM(gv.MaGV))) = UPPER(LTRIM(RTRIM(hp.MaGV)))
      WHERE ${where.join(" AND ")}
      ORDER BY NamHoc, HocKy, MAHP, MASV
    `,
    params
  );

  if (LIMIT > 0) rows = rows.slice(0, LIMIT);
  return rows;
}

function buildGradeWhere(row, metadata) {
  const where = ["LTRIM(RTRIM(MASV)) = ?", "LTRIM(RTRIM(MAHP)) = ?"];
  const params = [row.MASV, row.MAHP];
  if (metadata.diemHasNamHoc) {
    where.push("LTRIM(RTRIM(NamHoc)) = ?");
    params.push(row.NamHoc);
  }
  if (metadata.diemHasHocKy) {
    where.push("HocKy = ?");
    params.push(Number(row.HocKy));
  } else if (metadata.diemHasHocky) {
    where.push("HOCKY = ?");
    params.push(Number(row.HocKy));
  }
  return { whereSql: where.join(" AND "), params };
}

async function gradeExists(row, metadata) {
  const { whereSql, params } = buildGradeWhere(row, metadata);
  const rows = await queryAsync(`SELECT TOP 1 1 AS ok FROM dbo.DIEM_CRT WHERE ${whereSql}`, params);
  return rows.length > 0;
}

async function deleteExistingGrade(row, metadata) {
  const { whereSql, params } = buildGradeWhere(row, metadata);
  await queryAsync(`DELETE FROM dbo.DIEM_CRT WHERE ${whereSql}`, params);
}

async function insertGrade(row, cValue, metadata) {
  const columns = ["MASV", "MAHP", "MAGV", "C"];
  const values = [row.MASV, row.MAHP, row.MaGV, cValue];

  const add = (enabled, column, value) => {
    if (enabled) {
      columns.push(column);
      values.push(value);
    }
  };

  add(metadata.diemHasNamHoc, "NamHoc", row.NamHoc);
  if (metadata.diemHasHocKy) add(true, "HocKy", Number(row.HocKy));
  else add(metadata.diemHasHocky, "HOCKY", Number(row.HocKy));
  add(metadata.diemHasMaKhoaCrt, "MAKHOA_CRT", row.MaKhoa);
  add(metadata.diemHasMaLopCrt, "MALOP_CRT", row.MaLop);
  add(metadata.diemHasSvPublicKeyCrt, "SV_PUBLIC_KEY_CRT", clean(row.SvPublicKey));
  add(metadata.diemHasAlgorithmVersion, "ALGORITHM_VERSION", ALGORITHM_VERSION);
  add(metadata.diemHasKeyVersion, "KEY_VERSION", 1);
  add(metadata.diemHasUpdatedAt, "UPDATED_AT", new Date());

  await queryAsync(
    `INSERT INTO dbo.DIEM_CRT (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
    values
  );
}

async function processOne(row, metadata) {
  if (!row.MASV || !row.MAHP || !row.MaGV) throw new Error("Thiếu MASV, MAHP hoặc MaGV");
  if (!/^\d+$/.test(clean(row.SvPublicKey))) {
    throw new Error(`Sinh viên ${row.MASV} chưa có PUBLIC_KEY hợp lệ`);
  }

  const exists = await gradeExists(row, metadata);
  if (exists && !FORCE) return "skipped";

  const teacher = await getVerifiedTeacherPin(row);
  const startIndex = calculateStartIndex({
    maKhoa: row.MaKhoa,
    maLop: row.MaLop,
    mssv: row.MASV,
    maHp: row.MAHP,
    publicKey: row.SvPublicKey,
    pin: teacher.pin,
  });
  const endIndex = startIndex + 2;

  const primeRows = await queryAsync(
    `SELECT Id, Primes FROM dbo.SNT WHERE Id BETWEEN ? AND ? ORDER BY Id`,
    [startIndex, endIndex]
  );
  if (primeRows.length !== 3) {
    throw new Error(`Không lấy đủ 3 số nguyên tố: ${startIndex}-${endIndex}`);
  }

  const plaintext = deterministicGrades(row.MASV, row.MAHP, row.NamHoc, row.HocKy);
  const cValue = crtEncrypt(plaintext, primeRows.map((x) => x.Primes)).toString();

  if (DRY_RUN) return "dry-run";
  if (exists && FORCE) await deleteExistingGrade(row, metadata);
  await insertGrade(row, cValue, metadata);
  return "inserted";
}

async function runWithConcurrency(items, concurrency, worker) {
  let nextIndex = 0;
  const stats = { inserted: 0, skipped: 0, failed: 0, dryRun: 0 };

  async function runner() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      const item = items[index];
      try {
        const status = await worker(item);
        if (status === "inserted") stats.inserted += 1;
        else if (status === "skipped") stats.skipped += 1;
        else if (status === "dry-run") stats.dryRun += 1;
      } catch (error) {
        stats.failed += 1;
        console.error(
          `Lỗi seed ${item.MASV}-${item.MAHP}-${item.NamHoc}-HK${item.HocKy}: ${error.message}`
        );
      }

      const done = stats.inserted + stats.skipped + stats.failed + stats.dryRun;
      if (done % 200 === 0 || done === items.length) {
        console.log(
          `Tiến độ ${done}/${items.length} | inserted=${stats.inserted} | skipped=${stats.skipped} | failed=${stats.failed} | dryRun=${stats.dryRun}`
        );
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runner()));
  return stats;
}

async function main() {
  console.log("=== Seed điểm lịch sử mã hóa CRT - bản đồng bộ PIN giảng viên ===");
  console.log(`students=${STUDENTS_ARG || "ALL"}`);
  console.log(`class=${CLASS_ARG || "ALL"}`);
  console.log(`year=${YEAR_ARG || "ALL"}`);
  console.log(`semester=${SEMESTER_ARG || "ALL"}`);
  console.log(`limit=${LIMIT || "NO LIMIT"}`);
  console.log(`concurrency=${CONCURRENCY}`);
  console.log(`includeCurrentTerm=${INCLUDE_CURRENT_TERM}`);
  console.log(`force=${FORCE}`);
  console.log(`dryRun=${DRY_RUN}`);
  console.log(`repairPublicKeys=${REPAIR_PUBLIC_KEYS}`);
  console.log(`teacherPinMap=${Object.keys(TEACHER_PIN_MAP).length} giảng viên`);

  const metadata = await getMetadata();
  console.log("Schema DIEM_CRT:", metadata);

  const totalRows = await queryAsync(`SELECT COUNT(*) AS total FROM dbo.THOI_KHOA_BIEU`);
  const rows = await loadTargetRows();
  console.log(`Tổng dòng THOI_KHOA_BIEU: ${totalRows[0]?.total ?? 0}`);
  console.log(`Dòng đủ điều kiện seed: ${rows.length}`);

  if (rows.length === 0) {
    console.log("Không có dữ liệu cần seed.");
    return;
  }

  const result = await runWithConcurrency(rows, CONCURRENCY, (row) => processOne(row, metadata));
  console.log("=== Hoàn tất seed điểm CRT ===");
  console.log(result);
  if (!INCLUDE_CURRENT_TERM) {
    console.log("Đã bỏ qua 2025-2026 HK2 để giảng viên nhập/import điểm hiện tại qua UI.");
  }

  if (result.failed > 0) process.exitCode = 2;
}

main().catch((error) => {
  console.error("Lỗi seed điểm lịch sử CRT:", error);
  process.exit(1);
});
