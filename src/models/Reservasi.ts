import { Schema, model, models } from 'mongoose'

const ReservasiSchema = new Schema(
    {
        id: {type: Number, index: true},
        user_id: {type: Number, index: true},
        nama_tamu: {type: String, index: true},
        tanggal_reservasi: {type: Date, index: true},
        type_unit: {type: String, index: true},
        duration: {type: String, index: true},
        tanggal_checkin: {type: Date, index: true},
        tanggal_checkout: {type: Date, index: true},
        harga: {type: Number, index: true},
        uang_masuk: {type: Number, index: true},
        sisa_pembayaran: {type: Number, index: true},
        note_pelunasan: {type: String, index: true},
        note_admin: {type: String, index: true},
        nama_apart: {type: String, index: true},
    },
    { timestamps: true }
);

export const Reservasi = models.Reservasi || model('Reservasi', ReservasiSchema, 'Reservasi');