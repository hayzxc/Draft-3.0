export const CERTIFICATE_CONSTANTS = {
  registrationNumber: "ID0018MB",
  fumigant: "Methyl Bromide",
  companyName: "PRANA ARGENTUM CORPORATION",
} as const;

export interface FumigationFacility {
  id: string;
  name: string;
  address: string;
  fullAddress: string;
}

export const FUMIGATION_FACILITIES: FumigationFacility[] = [
  {
    id: "depo-surabaya-sejahtera",
    name: "PT. Depo Surabaya Sejahtera",
    address: "Jl. Tanjung Batu No.1, Perak Bar., Kec. Krembangan, Surabaya, Jawa Timur 60177",
    fullAddress:
      "PT. Depo Surabaya Sejahtera, Jl. Tanjung Batu No.1, Perak Bar., Kec. Krembangan, Surabaya, Jawa Timur 60177",
  },
  {
    id: "patriot-sakti-indonesia",
    name: "PT. Patriot Sakti Indonesia",
    address: "Jl. Raya Kalianak No. 59 A Surabaya",
    fullAddress:
      "PT. Patriot Sakti Indonesia, Jl. Raya Kalianak No. 59 A Surabaya",
  },
  {
    id: "samudera-pranajaya-perkasa",
    name: "PT. Samudera Pranajaya Perkasa",
    address:
      "Jl. Tanjung Batu 01, RT. 008, RW. 007, Kel. Perak Barat, Kec. Krembangan, Kota Surabaya, Provinsi Jawa Timur",
    fullAddress:
      "PT. Samudera Pranajaya Perkasa, Jl. Tanjung Batu 01, RT. 008, RW. 007, Kel. Perak Barat, Kec. Krembangan, Kota Surabaya, Provinsi Jawa Timur",
  },
];
