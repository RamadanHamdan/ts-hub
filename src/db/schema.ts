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
// ENUMS
// ================================================================

// Role: 1 user = 1 role (single role system)
// super_admin → akses penuh, kelola user & konfigurasi sistem
// admin       → input reservasi, payment, checkin/out, lihat laporan
// tamu        → login untuk lihat histori & poin sendiri
export const roleEnum = pgEnum("role", [
  "super_admin",
  "admin",
  "tamu",
]);

export const statusUnitEnum = pgEnum("status_unit", [
  "available",
  "occupied",
  "maintenance",
]);

export const typeDurasiEnum = pgEnum("type_durasi", [
  "transit",       // beberapa jam saja
  "halfday_pagi",  // pagi → siang
  "halfday_malam", // malam → siang besok
  "harian",        // 1 malam (14:00 → 12:00)
  "mingguan",
  "bulanan",
]);

export const statusReservasiEnum = pgEnum("status_reservasi", [
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
]);

export const statusInvoiceEnum = pgEnum("status_invoice", [
  "paid",
  "unpaid",
  "partial",
]);

export const checkInOutTypeEnum = pgEnum("checkinout_type", [
  "checkin",
  "checkout",
]);

export const metodePembayaranEnum = pgEnum("metode_pembayaran", [
  "transfer",
  "cash",
  "mixed",
]);

// ================================================================
// TABLE: Tamu (Guest / Member)
// Data profil tamu + counter poin untuk sistem reward
// ================================================================

export const tamus = pgTable("tamu", {
  id: serial("id_tamu").primaryKey(),
  nama_tamu: varchar("nama_tamu", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  no_telp: varchar("no_telp", { length: 20 }),
  alamat: text("alamat"),

  // Sistem poin: 1 check-in = 1 poin (bisa dikonfigurasi)
  total_poin: integer("total_poin").notNull().default(0),
  total_checkin: integer("total_checkin").notNull().default(0),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ================================================================
// TABLE: Users (Autentikasi & Otorisasi)
//
// Dipisah dari tamu agar admin/super_admin tidak perlu
// memiliki data tamu (nama, poin, histori, dll).
//
// Aturan:
//   role = "tamu"        → id_tamu wajib diisi (link ke tabel tamu)
//   role = "admin"       → id_tamu NULL
//   role = "super_admin" → id_tamu NULL
// ================================================================

export const users = pgTable("users", {
  id: serial("id_user").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password_hash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").notNull().default("tamu"),

  // Hanya terisi jika role = "tamu"
  id_tamu: integer("id_tamu")
    .unique() // 1 tamu hanya boleh punya 1 akun
    .references(() => tamus.id, { onDelete: "set null" }),

  is_active: boolean("is_active").notNull().default(true),
  last_login: timestamp("last_login"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

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
// Contoh dari data: TA=Tower A, TB=Tower B, TC=Tower C, TD=Tower D
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
// Nomor unit dari data nyata: TD.1134, TB.1534, TA.2118, dll.
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
    status: statusUnitEnum("status").notNull().default("available"),
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
// Harga berbeda per tipe durasi sesuai data lapangan:
//   transit=100K, halfday=150-200K, harian=200-300K
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
    uniquePricePerDay: uniqueIndex("uq_price_unit_durasi_date").on(
      table.id_unit_category,
      table.type_durasi,
      table.date
    ),
  })
);



// ================================================================
// TABLE: Reservation
// ================================================================

export const reservations = pgTable(
  "reservation",
  {
    id: serial("reservation_id").primaryKey(),
    id_tamu: integer("id_tamu")
      .notNull()
      .references(() => tamus.id, { onDelete: "restrict" }),
    id_room: integer("id_room")
      .notNull()
      .references(() => rooms.id, { onDelete: "restrict" }),

    harga_snapshot: decimal("harga_snapshot", {
      precision: 12,
      scale: 2,
    }).notNull(),

    type_durasi: typeDurasiEnum("type_durasi").notNull(),
    status: statusReservasiEnum("status").notNull().default("pending"),

    start_date: date("start_date").notNull(),
    end_date: date("end_date").notNull(),

    // Jam check in & out sesuai data lapangan (14:00, 21:00, dll)
    planned_checkin_time: time("planned_checkin_time").notNull(),
    planned_checkout_time: time("planned_checkout_time").notNull(),

    reservation_date: timestamp("reservation_date").notNull().defaultNow(),
    catatan: text("catatan"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
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
// Saat checkin terjadi → update poin tamu via poin_log
// ================================================================

export const checkInOuts = pgTable(
  "check_in_out",
  {
    id: serial("id_checkinout").primaryKey(),
    id_reservation: integer("id_reservation")
      .notNull()
      .references(() => reservations.id, { onDelete: "restrict" }),
    type: checkInOutTypeEnum("type").notNull(),
    actual_datetime: timestamp("actual_datetime").notNull().defaultNow(),
    catatan: text("catatan"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueCheckInOut: uniqueIndex("uq_checkinout_reservation_type").on(
      table.id_reservation,
      table.type
    ),
  })
);

// ================================================================
// TABLE: Payment
// ================================================================

export const payments = pgTable("payment", {
  id: serial("id_payment").primaryKey(),
  id_tamu: integer("id_tamu")
    .notNull()
    .references(() => tamus.id, { onDelete: "restrict" }),
  id_reservation: integer("id_reservation")
    .notNull()
    .unique()
    .references(() => reservations.id, { onDelete: "restrict" }),

  total_tagihan: decimal("total_tagihan", { precision: 12, scale: 2 }).notNull(),
  uang_masuk: decimal("uang_masuk", { precision: 12, scale: 2 }).notNull(),
  sisa_pembayaran: decimal("sisa_pembayaran", {
    precision: 12,
    scale: 2,
  }).notNull().default("0"),

  metode_pembayaran: metodePembayaranEnum("metode_pembayaran"),
  note_pelunasan: text("note_pelunasan"),

  poin_diberikan: boolean("poin_diberikan").notNull().default(false),
  jumlah_poin_diberikan: integer("jumlah_poin_diberikan").notNull().default(0),

  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ================================================================
// TABLE: Invoice
// ================================================================

export const invoices = pgTable("invoice", {
  id: serial("invoice_id").primaryKey(),
  id_payment: integer("id_payment")
    .notNull()
    .unique()
    .references(() => payments.id, { onDelete: "restrict" }),
  nomor_invoice: varchar("nomor_invoice", { length: 50 }).notNull().unique(), // INV-20250901-0001
  status: statusInvoiceEnum("status").notNull().default("unpaid"),
  invoice_description: text("invoice_description"),
  issued_at: timestamp("issued_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// ================================================================
// TABLE: Tagihan (item detail per invoice)
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
// TABLE: Unit Occupancy (histori penghunian)
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
      .references(() => tamus.id, { onDelete: "restrict" }),
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
// TABLE: Poin Log (riwayat transaksi poin)
// tipe: "tambah" saat checkin | "pakai" saat redeem | "hangus"
// ================================================================

export const poinLogs = pgTable(
  "poin_log",
  {
    id: serial("id_poin_log").primaryKey(),
    id_tamu: integer("id_tamu")
      .notNull()
      .references(() => tamus.id, { onDelete: "restrict" }),
    id_reservation: integer("id_reservation")
      .references(() => reservations.id, { onDelete: "set null" }),
    tipe: varchar("tipe", { length: 20 }).notNull(), // "tambah" | "pakai" | "hangus" | "bonus"
    jumlah_poin: integer("jumlah_poin").notNull(),   // positif=tambah, negatif=kurang
    keterangan: text("keterangan"),
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

export const usersRelations = relations(users, ({ one }) => ({
  tamu: one(tamus, {
    fields: [users.id_tamu],
    references: [tamus.id],
  }),
}));

export const tamusRelations = relations(tamus, ({ one, many }) => ({
  user: one(users),   // akun login tamu (jika ada)
  reservations: many(reservations),
  payments: many(payments),
  occupancies: many(unitOccupancies),
  poinLogs: many(poinLogs),
}));

export const apartsRelations = relations(aparts, ({ many }) => ({
  unitsCategory: many(unitsCategory),
}));

export const unitsCategoryRelations = relations(unitsCategory, ({ one, many }) => ({
  apart: one(aparts, {
    fields: [unitsCategory.id_apart],
    references: [aparts.id],
  }),
  rooms: many(rooms),
  todayPrices: many(todayPrices),
}));

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

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  tamu: one(tamus, {
    fields: [reservations.id_tamu],
    references: [tamus.id],
  }),
  room: one(rooms, {
    fields: [reservations.id_room],
    references: [rooms.id],
  }),
  checkInOuts: many(checkInOuts),
  payment: one(payments),
  occupancy: one(unitOccupancies),
  poinLog: one(poinLogs),
}));

export const checkInOutsRelations = relations(checkInOuts, ({ one }) => ({
  reservation: one(reservations, {
    fields: [checkInOuts.id_reservation],
    references: [reservations.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  tamu: one(tamus, {
    fields: [payments.id_tamu],
    references: [tamus.id],
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
  tamu: one(tamus, {
    fields: [unitOccupancies.id_tamu],
    references: [tamus.id],
  }),
  reservation: one(reservations, {
    fields: [unitOccupancies.id_reservation],
    references: [reservations.id],
  }),
}));

export const poinLogsRelations = relations(poinLogs, ({ one }) => ({
  tamu: one(tamus, {
    fields: [poinLogs.id_tamu],
    references: [tamus.id],
  }),
  reservation: one(reservations, {
    fields: [poinLogs.id_reservation],
    references: [reservations.id],
  }),
}));