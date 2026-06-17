const rawData = [
    { unit: 'TC.0507', apartement: 'JARDIN', type: 'Studio Type 18', fasilitas: 'Wifi / View Plaza'},
    { unit: 'TC.1608', apartement: 'JARDIN', type: 'Studio Type 18', fasilitas: 'Wifi / View Kolam' },
    { unit: 'TC.0826', apartement: 'JARDIN', type: 'Studio Type 24', fasilitas: 'Wifi / View Kolam' },
    { unit: 'TD.1134', apartement: 'JARDIN', type: 'Studio Type 24', fasilitas: 'Wifi / View Mall Ciwalk' },
    { unit: 'TA.1126', apartement: 'JARDIN', type: 'Studio Type 24', fasilitas: 'Non Wifi / View Kolam' },
    { unit: 'TB.1534', apartement: 'JARDIN', type: 'Studio Type 24', fasilitas: 'WiFi / View Kota' },
    { unit: 'TA.2118', apartement: 'JARDIN', type: 'Studio Type 33', fasilitas: 'WiFi / View Kota' },
    { unit: 'TA.0933', apartement: 'JARDIN', type: 'Studio Type 33', fasilitas: 'WiFi / View Kota' },
    { unit: 'TA.0932', apartement: 'JARDIN', type: 'Studio Type 33', fasilitas: 'Wifi / View Mall' },
    { unit: 'TA.0931', apartement: 'JARDIN', type: 'Studio Type 33', fasilitas: 'Wifi  / View Kota' },
    { unit: 'TB.0919', apartement: 'JARDIN', type: 'Studio Type 33', fasilitas: 'Wifi + Netflix / View Masjid' },
    { unit: 'TC.1727', apartement: 'JARDIN', type: 'Studio Type 33', fasilitas: 'Wifi + Netlfix / View Kolam' },
    { unit: 'TB.1728', apartement: 'JARDIN', type: 'Studio Type 33', fasilitas: 'Wifi + Netlfix / View Kolam' },
    { unit: 'TD.2126', apartement: 'JARDIN', type: '2BR Type 33', fasilitas: 'Non Wifi  / View Kolam' },
    { unit: 'TC.0630', apartement: 'JARDIN', type: '2BR Type 33', fasilitas: 'Wifi + Netflix / View Kota' },
    { unit: 'TB.0508', apartement: 'GAA', type: 'Studio Type 25', fasilitas: 'Wifi + Netflix / View Plaza' },
    { unit: 'TB.0510', apartement: 'GAA', type: 'Studio Type 25', fasilitas: 'Wifi + Netflix / View Plaza' },
    { unit: 'TB.0622', apartement: 'GAA', type: 'Studio Type 25', fasilitas: 'Wifi + Netflix / View Plaza' },
    { unit: 'TC.0528', apartement: 'GAA', type: 'Studio Type 25', fasilitas: 'Wifi + Netflix / View Plaza' },
]
export type TypeUnit = {
    unit: string
    apartement: string
    type: string
}

export const listTypeUnit: TypeUnit[] = rawData

export function getUnitOptions() {
    return [
        { value: '', label: '--Pilih Tipe Unit--' },
        ...Array.from(new Set(rawData.map((w) => w.unit)))
            .sort()
            .map((s) => ({ value: s, label: s }))
    ]
}

export function getApartOptions(selectedUnit: string) {
    const filtered = selectedUnit
    ? rawData.filter((w) => w.unit === selectedUnit)
    : rawData
    return [
        {value: '', label: '--Pilih Apartemen--'},
        ...Array.from(new Set(filtered.map((w) => w.apartement)))
            .sort()
            .map((s) => ({ value: s, label: s }))
    ]
}

export function getTypeOptions(selectedApartement: string) {
    const filtered = selectedApartement
    ? rawData.filter((w) => w.apartement === selectedApartement)
    : rawData
    return [
        {value: '', label: '--Pilih Tipe--'},
        ...Array.from(new Set(filtered.map((w) => w.type)))
            .sort()
            .map((s) => ({ value: s, label: s }))
    ]
}

export function getFasilitasOptions(selectedFasilitas: string) {
    const filtered = selectedFasilitas
    ? rawData.filter((w) => w.apartement === selectedFasilitas)
    : rawData
    return [
        {value: '', label: '--Pilih Fasilitas--'},
        ...Array.from(new Set(filtered.map((w) => w.fasilitas)))
            .sort()
            .map((s) => ({value: s, label: s}))
    ]
}