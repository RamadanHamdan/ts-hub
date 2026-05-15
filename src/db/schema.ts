import { pgTable, serial, text, varchar, date, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
    id: serial('id_user').primaryKey(),
    nama_tamu: varchar('nama_tamu').notNull(),
    email:varchar('email').unique().notNull(),
    alamat:text('alamat_user'),
    username: varchar('username').unique().notNull(),
    password: varchar('password').notNull(),
    createdAt:timestamp('created_at').defaultNow(),
    updatedAt:timestamp('updated_at').defaultNow(),

})

export const reservations = pgTable('reservations', {
    id:serial('reservation_id').primaryKey(),
    reservation_date:date('reservation_date').notNull(),
    checkin:date('checkin').notNull(),
    checkout:date('checkout').notNull(),
    total_harga:integer('total_harga').notNull(),
    status:varchar('status').notNull(),
    
})


export const apartemens = pgTable('apartement', {
    id: serial('id_apartement').primaryKey(),
    nama_apartement:varchar('nama_apartement').notNull(),
    apart_location:varchar('apart_location').notNull(),
    
})

export const units = pgTable('unit', {
    id: serial('id_unit').primaryKey(),
    nama_unit:varchar('nama_unit').notNull(),
    id_apartement:serial('id_apartement').notNull().references(() => apartemens.id),
    
})
