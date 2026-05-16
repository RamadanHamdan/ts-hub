import {
    pgTable,
    serial,
    varchar,
    integer,
    decimal,
    date,
    timestamp,
    text,
    pgEnum,
    boolean,
    uniqueIndex,
    index,
    time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ================================================================
// ANALISIS DARI DATA OPERASIONAL (gambar excel):
//
// Kolom di lapangan:
//   Nama | Tanggal | Unit (misal TD.1134) | Duration (1 malam,
//   Halfday Malam, transit) | Check in (jam) | Check out (jam) |
//   Harga | Uang Masuk | Sisa Pembayaran | Note Pelunasan
//
// Temuan penting:
// 1. "Duration" bukan harian/mingguan/bulanan tapi:
//    "1 malam", "Halfday Malam", "transit" → butuh enum baru
// 2. Check in & Check out adalah JAM (time), bukan date
//    → harus time, bukan timestamp penuh
// 3. Sisa Pembayaran di data = Rp 0 (lunas) atau ada nilai
//    → Note Pelunasan: "Full Transfer", "Cash", "Sisa Cash 75K"
// 4. Satu tamu bisa pakai 2 unit berbeda (Richal: TA.0931 & TA.0932)
//    → 1 tamu bisa punya banyak reservasi aktif bersamaan ✓
// 5. Nomor unit format: [Kode Tipe][Lantai][Nomor] (TD.1134, TB.1534)
//    → perlu parsing atau simpan as-is sebagai nomor_unit
// 6. Sistem POIN: hitung dari berapa kali check-in tamu tsb
// ================================================================

// ================================================================
// ENUMS
// ================================================================

export const statusUnitEnum = pgEnum("status_unit", [
    "terisi",
    "ready",
    "cleaning",
    "booked",
    "sold",
    "checkout",
    "maintenance",
]);

export const typeDurasiEnum = pgEnum("type_durasi", [
    "1 malam",
    "halfday",
    "transit",
    "extend",
])

export const statusReservasiEnum = pgEnum("status_reservasi", [
    "pending",
    "confirmed",
    "checked_in",
    "checked_out",
    "cancelled",
]);

export const statusInvoiceEnum = pgEnum("status_invoice", [
    "paid",     // lunas, sisa = 0
    "unpaid",   // belum bayar
    "partial",  // ada sisa pembayaran
]);

export const checkInOutTypeEnum = pgEnum("checkinout_type", [
    "checkin",
    "checkout",
]);

export const metodePembayaranEnum = pgEnum("metode_pembayaran", [
    "full_transfer",
    "cash",
    "sisa_cash",
    "cancel",
    "refund",
    "transfer",
]);

// ================================================================
// TABLE: Apart
// ================================================================

export const aparts = pgTable("apart", {
    id: serial("apart_id").primaryKey(),
    nama_apart: varchar("nama_apart", { length: 255 }).notNull(),
    apart_location: varchar("apart_location", { length: 255 }).notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ================================================================
// TABLE: Units Category
// Contoh dari data: TD = Tower D, TB = Tower B, TA = Tower A, TC = Tower C
// ================================================================

export const unitsCategory = pgTable("units_category", {
    id: serial("id_unit_category").primaryKey(),
    id_apart: integer("id_apart")
        .notNull()
        .references(() => aparts.id, { onDelete: "restrict" }),
    kode_kategori: varchar("kode_kategori", { length: 10 }).notNull(), // "TA","TB","TC","TD"
    nama_unit: varchar("nama_unit", { length: 255 }).notNull(),        // "Tower A", "Tower B"
    deskripsi: text("deskripsi"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ================================================================
// TABLE: Rooms
// Nomor unit asli dari data: TD.1134, TB.1534, TA.2118, dll.
// Format: [kode_kategori].[lantai][nomor]
// ================================================================

export const rooms = pgTable(
    "rooms",
    {
        id: serial("id_room").primaryKey(),
        id_unit_category: integer("id_unit_category")
            .notNull()
            .references(() => unitsCategory.id, { onDelete: "restrict" }),
        nomor_unit: varchar("nomor_unit", { length: 20 }).notNull(), // "TD.1134"
        lantai: integer("lantai"),
        status: statusUnitEnum("status").notNull().default("ready"),
        is_active: boolean("is_active").notNull().default(true),
        created_at: timestamp("created_at").notNull().defaultNow(),
        updated_at: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => ({
        uniqueNomorUnit: uniqueIndex("uq_rooms_nomor_unit").on(table.nomor_unit),
        idxStatus: index("idx_rooms_status").on(table.status),
    })
);

// ================================================================
// TABLE: Today Price
// Harga berbeda per tipe durasi (transit lebih murah dari harian)
// Sesuai data: transit=100K, halfday=150-200K, harian=200-300K
// ================================================================

export const todayPrices = pgTable(
    "today_price",
    {
        id: serial("id_today_price").primaryKey(),
        id_unit_category: integer("id_unit_category")
            .notNull()
            .references(() => unitsCategory.id, { onDelete: "restrict" }),
        type_durasi: typeDurasiEnum("type_durasi").notNull(),
        harga: decimal("harga", { precision: 12, scale: 2 }).notNull(),
        date: date("date").notNull(),
        created_at: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        // Satu harga per unit per tipe durasi per hari
        uniquePricePerDay: uniqueIndex("uq_price_unit_durasi_date").on(
            table.id_unit_category,
            table.type_durasi,
            table.date
        ),
    })
);

// ================================================================
// TABLE: Tamu (Guest)
// Ini juga sebagai "member" untuk sistem poin
// ================================================================

export const users = pgTable("users", {
    id: serial("id_tamu").primaryKey(),
    nama_tamu: varchar("nama_tamu", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).unique(),
    no_telp: varchar("no_telp", { length: 20 }),
    alamat: text("alamat"),
    no_identitas: varchar("no_identitas", { length: 50 }).unique(), // KTP/Paspor

    // ── SISTEM POIN ──────────────────────────────────────────────
    // Total poin dihitung dari akumulasi check-in
    // 1 check-in = 1 poin (atau bisa dikonfigurasi)
    total_poin: integer("total_poin").notNull().default(0),
    total_checkin: integer("total_checkin").notNull().default(0), // denormalized counter untuk performa query
    // ─────────────────────────────────────────────────────────────

    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ================================================================
// TABLE: Reservation
// Sesuai data lapangan:
// - check_in_time & check_out_time adalah JAM (bukan full datetime)
// - type_durasi menentukan durasi (transit/halfday/harian dll)
// - start_date = tanggal menginap (misal 01/09/2025)
// - end_date bisa sama dengan start_date (transit/halfday)
// ================================================================

export const reservations = pgTable(
    "reservation",
    {
        id: serial("reservation_id").primaryKey(),
        id_tamu: integer("id_tamu")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),
        id_room: integer("id_room")
            .notNull()
            .references(() => rooms.id, { onDelete: "restrict" }),

        // Snapshot harga saat booking — tidak berubah walau price diedit
        harga_snapshot: decimal("harga_snapshot", {
            precision: 12,
            scale: 2,
        }).notNull(),

        type_durasi: typeDurasiEnum("type_durasi").notNull(),
        status: statusReservasiEnum("status").notNull().default("pending"),

        // Tanggal menginap
        start_date: date("start_date").notNull(),
        end_date: date("end_date").notNull(),

        // JAM check in & check out (sesuai data: 14:00, 12:00, 21:00, dll)
        planned_checkin_time: time("planned_checkin_time").notNull(),
        planned_checkout_time: time("planned_checkout_time").notNull(),

        reservation_date: timestamp("reservation_date").notNull().defaultNow(),
        catatan: text("catatan"),
        created_at: timestamp("created_at").notNull().defaultNow(),
        updated_at: timestamp("updated_at").notNull().defaultNow(),
    },
    (table) => ({
        // Satu room tidak boleh double-booking di tanggal & jam yang sama
        idxRoomDate: index("idx_reservation_room_date").on(
            table.id_room,
            table.start_date,
            table.end_date
        ),
        idxTamu: index("idx_reservation_tamu").on(table.id_tamu),
    })
);

// ================================================================
// TABLE: Check In / Out
// Mencatat waktu aktual (bukan rencana)
// Saat checkin terjadi → trigger update poin tamu
// ================================================================

export const checkInOuts = pgTable(
    "check_in_out",
    {
        id: serial("id_checkinout").primaryKey(),
        id_reservation: integer("id_reservation")
            .notNull()
            .references(() => reservations.id, { onDelete: "restrict" }),
        type: checkInOutTypeEnum("type").notNull(),
        actual_datetime: timestamp("actual_datetime").notNull().defaultNow(), // waktu aktual checkin/checkout
        catatan: text("catatan"),
        created_at: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        // Satu reservasi hanya boleh 1 checkin dan 1 checkout
        uniqueCheckInOut: uniqueIndex("uq_checkinout_reservation_type").on(
            table.id_reservation,
            table.type
        ),
    })
);

// ================================================================
// TABLE: Payment
// Sesuai data: ada sisa pembayaran, note pelunasan, metode bayar
// ================================================================

export const payments = pgTable("payment", {
    id: serial("id_payment").primaryKey(),
    id_tamu: integer("id_tamu")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    id_reservation: integer("id_reservation")
        .notNull()
        .unique() // 1 reservasi = 1 payment
        .references(() => reservations.id, { onDelete: "restrict" }),

    total_tagihan: decimal("total_tagihan", { precision: 12, scale: 2 }).notNull(),
    uang_masuk: decimal("uang_masuk", { precision: 12, scale: 2 }).notNull(),
    sisa_pembayaran: decimal("sisa_pembayaran", {
        precision: 12,
        scale: 2,
    }).notNull().default("0"),

    metode_pembayaran: metodePembayaranEnum("metode_pembayaran"),
    note_pelunasan: text("note_pelunasan"), // "Full Transfer", "Cash", "Sisa Cash 75K"

    // Untuk sistem poin: apakah poin sudah diberikan untuk transaksi ini?
    poin_diberikan: boolean("poin_diberikan").notNull().default(false),
    jumlah_poin_diberikan: integer("jumlah_poin_diberikan").notNull().default(0),

    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ================================================================
// TABLE: Invoice
// Generated otomatis dari payment
// ================================================================

export const invoices = pgTable("invoice", {
    id: serial("invoice_id").primaryKey(),
    id_payment: integer("id_payment")
        .notNull()
        .unique()
        .references(() => payments.id, { onDelete: "restrict" }),
    nomor_invoice: varchar("nomor_invoice", { length: 50 }).notNull().unique(), // misal: INV-20250901-0001
    status: statusInvoiceEnum("status").notNull().default("unpaid"),
    invoice_description: text("invoice_description"),
    issued_at: timestamp("issued_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ================================================================
// TABLE: Tagihan
// Detail item dalam invoice (bisa lebih dari 1 item per invoice)
// Contoh item: "Sewa kamar 1 malam", "Biaya tambahan", dll.
// ================================================================

export const tagihans = pgTable("tagihan", {
    id: serial("id_tagihan").primaryKey(),
    id_invoice: integer("id_invoice")
        .notNull()
        .references(() => invoices.id, { onDelete: "restrict" }),
    deskripsi: varchar("deskripsi", { length: 255 }).notNull(),
    jumlah: integer("jumlah").notNull().default(1),
    harga_satuan: decimal("harga_satuan", { precision: 12, scale: 2 }).notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
});

// ================================================================
// TABLE: Unit Occupancy
// Histori penghunian unit — siapa menempati unit kapan
// ================================================================

export const unitOccupancies = pgTable(
    "unit_occupancy",
    {
        id: serial("id_occupancy").primaryKey(),
        id_room: integer("id_room")
            .notNull()
            .references(() => rooms.id, { onDelete: "restrict" }),
        id_tamu: integer("id_tamu")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),
        id_reservation: integer("id_reservation")
            .notNull()
            .unique()
            .references(() => reservations.id, { onDelete: "restrict" }),
        start_date: date("start_date").notNull(),
        end_date: date("end_date"),
        is_active: boolean("is_active").notNull().default(true),
        created_at: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        idxRoom: index("idx_occupancy_room").on(table.id_room),
        idxTamu: index("idx_occupancy_tamu").on(table.id_tamu),
    })
);

// ================================================================
// TABLE: Poin Log  ← TABEL BARU (untuk sistem poin)
// Setiap check-in menghasilkan poin.
// Log ini mencatat setiap transaksi poin (tambah / pakai / hangus)
// Sumber kebenaran poin ada di sini, bukan hanya di tamu.total_poin
// ================================================================

export const poinLogs = pgTable(
    "poin_log",
    {
        id: serial("id_poin_log").primaryKey(),
        id_tamu: integer("id_tamu")
            .notNull()
            .references(() => users.id, { onDelete: "restrict" }),
        id_reservation: integer("id_reservation")
            .references(() => reservations.id, { onDelete: "set null" }), // null jika poin digunakan/hangus manual
        tipe: varchar("tipe", { length: 20 }).notNull(), // "tambah" | "pakai" | "hangus" | "bonus"
        jumlah_poin: integer("jumlah_poin").notNull(),   // positif = tambah, negatif = kurang
        keterangan: text("keterangan"),                   // "Check-in ke-5", "Redeem reward", dll.
        created_at: timestamp("created_at").notNull().defaultNow(),
    },
    (table) => ({
        idxTamu: index("idx_poinlog_tamu").on(table.id_tamu),
        idxReservasi: index("idx_poinlog_reservasi").on(table.id_reservation),
    })
);

// ================================================================
// RELATIONS
// ================================================================

export const apartsRelations = relations(aparts, ({ many }) => ({
    unitsCategory: many(unitsCategory),
}));

export const unitsCategoryRelations = relations(
    unitsCategory,
    ({ one, many }) => ({
        apart: one(aparts, {
            fields: [unitsCategory.id_apart],
            references: [aparts.id],
        }),
        rooms: many(rooms),
        todayPrices: many(todayPrices),
    })
);

export const roomsRelations = relations(rooms, ({ one, many }) => ({
    unitsCategory: one(unitsCategory, {
        fields: [rooms.id_unit_category],
        references: [unitsCategory.id],
    }),
    reservations: many(reservations),
    occupancies: many(unitOccupancies),
}));

export const todayPricesRelations = relations(todayPrices, ({ one }) => ({
    unitsCategory: one(unitsCategory, {
        fields: [todayPrices.id_unit_category],
        references: [unitsCategory.id],
    }),
}));

export const tamusRelations = relations(users, ({ many }) => ({
    reservations: many(reservations),
    payments: many(payments),
    occupancies: many(unitOccupancies),
    poinLogs: many(poinLogs),
}));

export const reservationsRelations = relations(
    reservations,
    ({ one, many }) => ({
        tamu: one(users, {
            fields: [reservations.id_tamu],
            references: [users.id],
        }),
        room: one(rooms, {
            fields: [reservations.id_room],
            references: [rooms.id],
        }),
        checkInOuts: many(checkInOuts),
        payment: one(payments),
        occupancy: one(unitOccupancies),
        poinLog: one(poinLogs),
    })
);

export const checkInOutsRelations = relations(checkInOuts, ({ one }) => ({
    reservation: one(reservations, {
        fields: [checkInOuts.id_reservation],
        references: [reservations.id],
    }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
    tamu: one(users, {
        fields: [payments.id_tamu],
        references: [users.id],
    }),
    reservation: one(reservations, {
        fields: [payments.id_reservation],
        references: [reservations.id],
    }),
    invoice: one(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
    payment: one(payments, {
        fields: [invoices.id_payment],
        references: [payments.id],
    }),
    tagihans: many(tagihans),
}));

export const tagihansRelations = relations(tagihans, ({ one }) => ({
    invoice: one(invoices, {
        fields: [tagihans.id_invoice],
        references: [invoices.id],
    }),
}));

export const unitOccupanciesRelations = relations(unitOccupancies, ({ one }) => ({
    room: one(rooms, {
        fields: [unitOccupancies.id_room],
        references: [rooms.id],
    }),
    tamu: one(users, {
        fields: [unitOccupancies.id_tamu],
        references: [users.id],
    }),
    reservation: one(reservations, {
        fields: [unitOccupancies.id_reservation],
        references: [reservations.id],
    }),
}));

export const poinLogsRelations = relations(poinLogs, ({ one }) => ({
    tamu: one(users, {
        fields: [poinLogs.id_tamu],
        references: [users.id],
    }),
    reservation: one(reservations, {
        fields: [poinLogs.id_reservation],
        references: [reservations.id],
    }),
}));