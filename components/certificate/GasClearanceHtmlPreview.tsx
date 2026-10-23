"use client";

import React from "react";
import { format } from "date-fns";
import { GAS_CLEARANCE_STATIC_TEXT } from "@/lib/certificate-static-text";
import { cleanPastedText } from "@/lib/form-helpers";
import { GasClearanceCertificateData } from "./CertificateDocument";
import { TypewriterText } from "@/components/treatment/TypewriterText";

interface GasClearanceHtmlPreviewProps {
  data: GasClearanceCertificateData;
  activeField?: string | null;
}

const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return format(d, "dd/MM/yyyy");
  } catch {
    return String(date);
  }
};

const formatDateTime = (date: Date | string | undefined | null): string => {
  if (!date) return "";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return format(d, "dd/MM/yyyy - HH:mm");
  } catch {
    return String(date);
  }
};

export const GasClearanceHtmlPreview: React.FC<GasClearanceHtmlPreviewProps> = ({
  data,
  activeField = null,
}) => {
  const verificationLink = data.verificationUrl?.trim() || "";

  const logoUrl = data.logoImageUrl || "/images/letterhead.jpg";

  // Gas level reading calculation: empty if not filled
  const gasReading =
    data.gasLevelReading?.trim() ||
    (data.gasLevelPpm !== null && data.gasLevelPpm !== undefined && data.gasLevelPpm !== ""
      ? (data.containerNumber?.trim()
          ? `${data.containerNumber.trim()}: ${data.gasLevelPpm} ppm`
          : `${data.gasLevelPpm} ppm`)
      : "");

  return (
    <div className="mx-auto w-full max-w-[794px] min-h-[1123px] bg-white text-black shadow-[0_15px_50px_rgba(0,0,0,0.18)] border border-slate-300 p-8 md:p-12 font-sans text-[11px] leading-tight select-none rounded-sm transition-all duration-150 flex flex-col justify-between">
      <div className="flex-1">
        {/* 1. Official Letterhead Header */}
        <div className="w-full mb-2">
        {logoUrl && (
          <img
            src={logoUrl}
            alt="Prana Argentum Corporation Letterhead"
            className="w-full object-contain block"
          />
        )}
      </div>

      {/* 2. Top Metadata Row (Serial No, GC No, Reg No, Date) */}
      <div className="grid grid-cols-2 gap-4 text-[11px] mb-3 text-slate-900 border-b border-black pb-2">
        {/* Left Column */}
        <div className="space-y-1">
          <div>
            <span className="font-normal text-slate-800">Serial No. </span>
            <TypewriterText
              text={data.serialNo}
              active={activeField === "serialNo"}
              placeholder="-"
              className="font-bold text-black"
            />
          </div>
          <div>
            <div className="font-normal text-slate-800">Nomor GC / GC Number :</div>
            <div className="font-bold text-black text-[11px] break-all">
              <TypewriterText
                text={data.certificateNumber}
                active={activeField === "certificateNumber"}
                placeholder="-"
                className="font-bold"
              />
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-1 text-right">
          <div>
            <span className="font-normal text-slate-800">
              Nomor Registrasi / Registration Number :{" "}
            </span>
            <TypewriterText
              text={data.registrationNumber || "ID0018MB"}
              active={activeField === "registrationNumber"}
              placeholder="ID0018MB"
              className="font-bold text-black"
            />
          </div>
          <div>
            <span className="font-normal text-slate-800">
              Tanggal / Date (dd/mm/yyyy) :{" "}
            </span>
            <TypewriterText
              text={formatDate(data.certificateDate)}
              active={activeField === "certificateDate"}
              placeholder="-"
              className="font-bold text-black"
            />
          </div>
        </div>
      </div>

      {/* 3. Certificate Title */}
      <div className="text-center my-3">
        <h1 className="text-[14px] font-bold tracking-wide uppercase underline decoration-1 underline-offset-2">
          {GAS_CLEARANCE_STATIC_TEXT.titleId}
        </h1>
        <h2 className="text-[12px] italic tracking-wider uppercase text-slate-800 mt-0.5">
          {GAS_CLEARANCE_STATIC_TEXT.titleEn}
        </h2>
      </div>

      {/* 4. Salutation / Opening */}
      <div className="mb-3 space-y-1 text-[11px]">
        <div>
          <div>{GAS_CLEARANCE_STATIC_TEXT.headingId}</div>
          <div className="italic text-slate-600">{GAS_CLEARANCE_STATIC_TEXT.headingEn}</div>
        </div>
        <div className="pt-1">
          <div>{GAS_CLEARANCE_STATIC_TEXT.introId}</div>
          <div className="italic text-slate-600">{GAS_CLEARANCE_STATIC_TEXT.introEn}</div>
        </div>
      </div>

      {/* 5. Details / Bilingual Fields */}
      <div className="space-y-2 mb-4">
        {/* Field 1: Commodity */}
        <div className="flex items-start">
          <div className="w-[38%] pr-2">
            <div>Nama komoditas/media pembawa</div>
            <div className="italic text-slate-600">Commodity/article</div>
          </div>
          <div className="w-[3%] text-center font-bold">:</div>
          <div className="w-[59%] font-bold uppercase whitespace-pre-wrap leading-snug">
            <TypewriterText
              text={data.commodity}
              active={activeField === "commodity"}
              placeholder="-"
            />
          </div>
        </div>

        {/* Field 2: Container Number */}
        <div className="flex items-start">
          <div className="w-[38%] pr-2">
            <div>Nomor peti kemas</div>
            <div className="italic text-slate-600">Container number</div>
          </div>
          <div className="w-[3%] text-center font-bold">:</div>
          <div className="w-[59%] font-bold uppercase">
            <TypewriterText
              text={data.containerNumber}
              active={activeField === "containerNumber"}
              placeholder="-"
            />
          </div>
        </div>

        {/* Field 3: Carrier / Vessel */}
        <div className="flex items-start">
          <div className="w-[38%] pr-2">
            <div>Alat angkut</div>
            <div className="italic text-slate-600">Carrier/vessel</div>
          </div>
          <div className="w-[3%] text-center font-bold">:</div>
          <div className="w-[59%] font-bold uppercase">
            <TypewriterText
              text={data.carrierVessel}
              active={activeField === "carrierVessel"}
              placeholder="-"
            />
          </div>
        </div>

        {/* Field 4: Fumigation Area */}
        <div className="flex items-start">
          <div className="w-[38%] pr-2">
            <div>Area / Lokasi fumigasi</div>
            <div className="italic text-slate-600">Area/Location of Fumigation</div>
          </div>
          <div className="w-[3%] text-center font-bold">:</div>
          <div className="w-[59%] font-bold">
            <TypewriterText
              text={data.fumigationArea}
              active={activeField === "fumigationArea"}
              placeholder="-"
            />
          </div>
        </div>

        {/* Field 5: Fumigant */}
        <div className="flex items-start">
          <div className="w-[38%] pr-2">
            <div>Fumigan yang digunakan</div>
            <div className="italic text-slate-600">Fumigant</div>
          </div>
          <div className="w-[3%] text-center font-bold">:</div>
          <div className="w-[59%] font-bold">
            <TypewriterText
              text={data.fumigant || "Methyl Bromide (CH3Br)"}
              active={activeField === "fumigant"}
              placeholder="Methyl Bromide (CH3Br)"
            />
          </div>
        </div>

        {/* Field 6: Commencing Date & Time */}
        <div className="flex items-start">
          <div className="w-[38%] pr-2">
            <div>Waktu dimulainya fumigasi</div>
            <div className="italic text-slate-600">Commencing at (dd/mm/yyyy - HH:MM)</div>
          </div>
          <div className="w-[3%] text-center font-bold">:</div>
          <div className="w-[59%] font-bold">
            <TypewriterText
              text={formatDateTime(data.commencingAt)}
              active={activeField === "commencingAt"}
              placeholder="-"
            />
          </div>
        </div>

        {/* Field 7: Completed Date & Time */}
        <div className="flex items-start">
          <div className="w-[38%] pr-2">
            <div>Waktu selesainya fumigasi</div>
            <div className="italic text-slate-600">Completed at (dd/mm/yyyy - HH:MM)</div>
          </div>
          <div className="w-[3%] text-center font-bold">:</div>
          <div className="w-[59%] font-bold">
            <TypewriterText
              text={formatDateTime(data.completedAt)}
              active={activeField === "completedAt"}
              placeholder="-"
            />
          </div>
        </div>
      </div>

      {/* 6. Declaration Paragraphs */}
      <div className="space-y-2 mb-4 text-[10.5px] leading-snug">
        <div>
          <div>{GAS_CLEARANCE_STATIC_TEXT.declaration1Id}</div>
          <div className="italic text-slate-600">
            {GAS_CLEARANCE_STATIC_TEXT.declaration1En}
          </div>
        </div>
        <div>
          <div>{GAS_CLEARANCE_STATIC_TEXT.declaration2Id}</div>
          <div className="italic text-slate-600">
            {GAS_CLEARANCE_STATIC_TEXT.declaration2En}
          </div>
        </div>
      </div>

      {/* 7. Highlighted Result Line: Gas levels after fumigation (Left-aligned, matching PDF layout) */}
      <div className="my-3 py-1 text-left font-bold text-[11px] text-black">
        <span>
          {GAS_CLEARANCE_STATIC_TEXT.gasLevelLabelId} /{" "}
          <span className="italic font-bold text-black">
            {GAS_CLEARANCE_STATIC_TEXT.gasLevelLabelEn}
          </span>{" "}
          :{" "}
        </span>
        <span className="font-bold text-black">
          <TypewriterText
            text={gasReading}
            active={activeField === "gasLevelReading" || activeField === "gasLevelPpm"}
            placeholder=""
            className="font-bold text-black"
          />
        </span>
      </div>

      {/* 8. Signatures & Stamp Section (Right Aligned, matching PDF layout) */}
      <div className="flex justify-end my-4">
        <div className="w-[55%] text-center">
          <div className="font-normal text-[11px] text-black">
            {GAS_CLEARANCE_STATIC_TEXT.fumigationCompanyId}
          </div>
          <div className="italic text-slate-700 text-[10px]">
            {GAS_CLEARANCE_STATIC_TEXT.fumigationCompanyEn}
          </div>

          <div className="relative h-20 my-1 flex items-center justify-center">
            {/* Fumigator Signature */}
            {data.fumigatorSignatureUrl && (
              <img
                src={data.fumigatorSignatureUrl}
                alt="Signature"
                className="absolute h-16 object-contain z-10 select-none pointer-events-none"
              />
            )}
          </div>

          {/* Two-column Footer Labels */}
          <div className="grid grid-cols-2 gap-4 text-center text-[10px] pt-1">
            <div className="border-t border-black pt-1">
              <div className="min-h-[16px]"></div>
              <div className="text-black font-normal">{GAS_CLEARANCE_STATIC_TEXT.stampLabelId}</div>
              <div className="italic text-slate-700">{GAS_CLEARANCE_STATIC_TEXT.stampLabelEn}</div>
            </div>
            <div className="border-t border-black pt-1">
              <div className="font-bold text-[10.5px] uppercase text-black min-h-[16px]">
                <TypewriterText
                  text={data.fumigatorName}
                  active={activeField === "fumigatorName"}
                  placeholder=""
                  className="font-bold"
                />
              </div>
              <div className="italic text-slate-700">
                {GAS_CLEARANCE_STATIC_TEXT.signatureLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* 9. Bottom Bar: Digital Print Notice */}
      <div className="flex items-center gap-3 pt-3 border-t border-slate-300 mt-6 text-[9.5px] text-slate-800">
        <div className="shrink-0 w-16 h-16 border border-slate-300 rounded p-1 flex items-center justify-center bg-white shadow-sm">
          {data.qrCodeDataUrl ? (
            <img
              src={data.qrCodeDataUrl}
              alt="Verification QR"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-[9px] text-slate-400 text-center font-mono">QR Code</div>
          )}
        </div>
        <div className="space-y-0.5 leading-tight">
          <div className="font-bold text-[10px] text-black">
            {GAS_CLEARANCE_STATIC_TEXT.barantinText}
          </div>
          {verificationLink ? (
            <div className="text-slate-600">
              {GAS_CLEARANCE_STATIC_TEXT.barantinNote}{" "}
              <a
                href={verificationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 break-all"
              >
                {verificationLink}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default GasClearanceHtmlPreview;
