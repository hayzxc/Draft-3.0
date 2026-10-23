"use client";

import React from "react";
import { format } from "date-fns";
import { CERTIFICATE_CONSTANTS } from "@/lib/certificate-constants";
import { cleanPastedText, formatConsigneeDisplay } from "@/lib/form-helpers";
import { TreatmentCertificateData } from "./TreatmentDocument";
import { TypewriterText } from "./TypewriterText";
import { GasClearanceHtmlPreview } from "@/components/certificate/GasClearanceHtmlPreview";
import { mapTreatmentToGasClearanceData } from "@/lib/treatment-bundle-helpers";

interface TreatmentHtmlPreviewProps {
  data: TreatmentCertificateData;
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

const formatContinuousDisplay = (text: string | null | undefined): string => {
  if (!text) return "";
  return cleanPastedText(text, false);
};

export const TreatmentHtmlPreview: React.FC<TreatmentHtmlPreviewProps> = ({
  data,
  activeField = null,
}) => {
  const verificationLink = data.verificationUrl?.trim() || "";

  const includeGc = data.includeGasClearance !== false;

  return (
    <div className="w-full space-y-4">
      {/* Page 1: Treatment Certificate (Fumigation Certificate) */}
      <div className="mx-auto w-full max-w-[820px] bg-white text-black shadow-[0_12px_45px_rgba(0,0,0,0.18)] border border-slate-300 p-6 md:p-8 font-sans text-[11px] leading-tight select-none rounded-sm transition-all duration-150">
      {/* Top Serial No & Date */}
      <div className="flex justify-end text-xs mb-1 font-normal text-slate-900">
        <span>
          Serial No.{" "}
          <TypewriterText
            text={data.serialNo}
            active={activeField === "serialNo"}
            placeholder="-"
          />{" "}
          | Date issued (dd/mm/yyyy):{" "}
          <TypewriterText
            text={formatDate(data.dateIssued)}
            active={activeField === "dateIssued"}
            placeholder="-"
          />
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-[#0850A2] font-bold text-sm md:text-base tracking-tight mb-1 text-left">
        TREATMENT CERTIFICATE - Methyl Bromide Fumigation
      </h1>

      {/* Table 1: Certificate Number & Provider ID */}
      <div className="w-full border border-black mb-1">
        <div className="flex bg-black text-white font-bold text-xs items-stretch w-full">
          <div className="w-1/2 shrink-0 border-r border-black p-1">Certificate number</div>
          <div className="w-1/2 min-w-0 p-1">Treatment provider ID number</div>
        </div>
        <div className="flex font-bold text-xs bg-white text-black items-stretch w-full">
          <div className="w-1/2 shrink-0 border-r border-black p-1 break-all [overflow-wrap:anywhere] min-w-0 font-mono">
            <TypewriterText
              text={data.certificateNumber}
              active={activeField === "certificateNumber"}
              placeholder="-"
            />
          </div>
          <div className="w-1/2 min-w-0 p-1 break-all [overflow-wrap:anywhere] font-mono text-slate-900">
            {CERTIFICATE_CONSTANTS.registrationNumber}
          </div>
        </div>
      </div>

      {/* Consignment Details */}
      <div className="text-[#0850A2] font-bold text-xs mt-2 mb-0.5">Consignment details</div>
      <div className="w-full border border-black text-[10.5px]">
        {/* Row 1: Consignment Link */}
        <div className="flex border-b border-black items-stretch w-full">
          <div className="w-[31%] shrink-0 border-r border-black p-1.5 text-slate-800">
            Consignment link (container numbers if applicable)
          </div>
          <div className="w-[69%] min-w-0 p-1.5 space-y-0.5 text-slate-900 break-words [overflow-wrap:anywhere] leading-snug">
            {(data.consignmentLinkPpk?.trim() || activeField === "consignmentLinkPpk") ? (
              <div>
                No. PTK Karantina (PPK) :{" "}
                <TypewriterText
                  text={data.consignmentLinkPpk}
                  active={activeField === "consignmentLinkPpk"}
                  placeholder=""
                />
              </div>
            ) : null}
            <div>
              No. DO :{" "}
              <TypewriterText
                text={data.consignmentLinkDo}
                active={activeField === "consignmentLinkDo"}
                placeholder="-"
              />
            </div>
            {(data.consignmentLinkBl?.trim() || activeField === "consignmentLinkBl") ? (
              <div>
                No. BL (Bill of Lading) :{" "}
                <TypewriterText
                  text={data.consignmentLinkBl}
                  active={activeField === "consignmentLinkBl"}
                  placeholder=""
                />
              </div>
            ) : null}
            <div>
              Containers :{" "}
              <TypewriterText
                text={data.containers}
                active={activeField === "containers"}
                placeholder="-"
              />
            </div>
            <div className="font-normal text-slate-900 whitespace-pre-line break-words leading-snug">
              <TypewriterText
                text={formatConsigneeDisplay(data.consignee)}
                active={activeField === "consignee"}
                bold={false}
                placeholder=""
              />
            </div>
          </div>
        </div>

        {/* Row 2: Seal and Carrier */}
        <div className="flex border-b border-black items-stretch w-full">
          <div className="w-[31%] shrink-0 border-r border-black p-1.5 text-slate-800">
            Seal numbers(s) and Carrier/vessel (if applicable)
          </div>
          <div className="w-[69%] min-w-0 p-1.5 space-y-0.5 break-words [overflow-wrap:anywhere] leading-snug">
            <div>
              Seal numbers :{" "}
              <TypewriterText
                text={data.sealNumbers}
                active={activeField === "sealNumbers"}
                placeholder="-"
              />
            </div>
            <div>
              Carrier/vessel :{" "}
              <TypewriterText
                text={data.carrierVessel}
                active={activeField === "carrierVessel"}
                placeholder="-"
              />
            </div>
          </div>
        </div>

        {/* Row 3: Client name and address (Dynamic Height & Auto-Wrap) */}
        <div className="flex border-b border-black items-stretch w-full">
          <div className="w-[31%] shrink-0 border-r border-black p-1.5 text-slate-800">
            Client name and address
          </div>
          <div className="w-[69%] min-w-0 p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere] leading-snug whitespace-pre-line">
            <TypewriterText
              text={formatContinuousDisplay(data.clientNameAddress)}
              active={activeField === "clientNameAddress"}
              placeholder="-"
            />
          </div>
        </div>

        {/* Row 4: Commodity description and quantity */}
        <div className="flex border-b border-black items-stretch w-full">
          <div className="w-[31%] shrink-0 border-r border-black p-1.5 text-slate-800">
            Commodity description and quantity
          </div>
          <div className="w-[69%] min-w-0 p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere] leading-snug whitespace-pre-line">
            <TypewriterText
              text={formatContinuousDisplay(data.commodityDescription)}
              active={activeField === "commodityDescription"}
              placeholder="-"
            />
          </div>
        </div>

        {/* Row 5: Origin & Port */}
        <div className="flex border-b border-black items-stretch w-full">
          <div className="w-[31%] shrink-0 border-r border-black p-1.5 space-y-0.5 text-slate-800">
            <div>Commodity country of origin</div>
            <div>Destination country</div>
          </div>
          <div className="w-[24%] shrink-0 border-r border-black p-1.5 space-y-0.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere] min-w-0">
            <div>
              <TypewriterText
                text={data.originCountry}
                active={activeField === "originCountry"}
                placeholder="-"
              />
            </div>
            <div>
              <TypewriterText
                text={data.destinationCountry}
                active={activeField === "destinationCountry"}
                placeholder="-"
              />
            </div>
          </div>
          <div className="w-[21%] shrink-0 border-r border-black p-1.5 space-y-0.5 text-slate-800">
            <div>Port of loading</div>
            <div>Port of unloading</div>
          </div>
          <div className="w-[24%] min-w-0 p-1.5 space-y-0.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere]">
            <div>
              <TypewriterText
                text={data.portOfLoading}
                active={activeField === "portOfLoading"}
                placeholder="-"
              />
            </div>
            <div>
              <TypewriterText
                text={data.portOfUnloading}
                active={activeField === "portOfUnloading"}
                placeholder="-"
              />
            </div>
          </div>
        </div>

        {/* Row 6: Target & Enclosure */}
        <div className="flex items-stretch w-full">
          <div className="w-[31%] shrink-0 border-r border-black p-1.5 text-slate-800">
            Target of fumigation
          </div>
          <div className="w-[24%] shrink-0 border-r border-black p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere] min-w-0">
            <TypewriterText
              text={data.targetOfFumigation}
              active={activeField === "targetOfFumigation"}
              placeholder="-"
            />
          </div>
          <div className="w-[21%] shrink-0 border-r border-black p-1.5 text-slate-800">
            Enclosure type
          </div>
          <div className="w-[24%] min-w-0 p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere]">
            <TypewriterText
              text={data.enclosureType}
              active={activeField === "enclosureType"}
              placeholder="-"
            />
          </div>
        </div>
      </div>

      {/* Treatment Schedule */}
      <div className="text-[#0850A2] font-bold text-xs mt-2 mb-0.5">
        Treatment schedule (prescribed/specified treatment schedule)
      </div>
      <div className="w-full border border-black flex items-stretch text-[10.5px]">
        <div className="w-[14%] shrink-0 border-r border-black p-1.5 text-slate-800">Dose rate</div>
        <div className="w-[19%] shrink-0 border-r border-black p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere] min-w-0">
          <TypewriterText
            text={data.prescribedDoseRate}
            active={activeField === "prescribedDoseRate"}
            placeholder="-"
          />
        </div>
        <div className="w-[18%] shrink-0 border-r border-black p-1.5 text-slate-800">Exposure period</div>
        <div className="w-[16%] shrink-0 border-r border-black p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere] min-w-0">
          <TypewriterText
            text={data.prescribedExposurePeriod}
            active={activeField === "prescribedExposurePeriod"}
            placeholder="-"
          />
        </div>
        <div className="w-[16%] shrink-0 border-r border-black p-1.5 text-slate-800">Temperature</div>
        <div className="w-[17%] min-w-0 p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere]">
          <TypewriterText
            text={data.prescribedTemperature}
            active={activeField === "prescribedTemperature"}
            placeholder="-"
          />
        </div>
      </div>

      {/* Fumigation Details */}
      <div className="text-[#0850A2] font-bold text-xs mt-2 mb-0.5">Fumigation details (treatment applied)</div>
      <div className="w-full border border-black text-[10.5px]">
        {/* Row 1: Applied values */}
        <div className="flex border-b border-black items-stretch w-full">
          <div className="w-[14%] shrink-0 border-r border-black p-1.5 text-slate-800">Applied dose</div>
          <div className="w-[19%] shrink-0 border-r border-black p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere] min-w-0">
            <TypewriterText
              text={data.appliedDose}
              active={activeField === "appliedDose"}
              placeholder="-"
            />
          </div>
          <div className="w-[18%] shrink-0 border-r border-black p-1.5 text-slate-800">Exposure period</div>
          <div className="w-[16%] shrink-0 border-r border-black p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere] min-w-0">
            <TypewriterText
              text={data.appliedExposurePeriod}
              active={activeField === "appliedExposurePeriod"}
              placeholder="-"
            />
          </div>
          <div className="w-[16%] shrink-0 border-r border-black p-1.5 text-slate-800">Temperature</div>
          <div className="w-[17%] min-w-0 p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere]">
            <TypewriterText
              text={data.appliedTemperature}
              active={activeField === "appliedTemperature"}
              placeholder="-"
            />
          </div>
        </div>

        {/* Row 2: Place of fumigation */}
        <div className="flex border-b border-black items-stretch w-full">
          <div className="w-[31%] shrink-0 border-r border-black p-1.5 text-slate-800">
            Place of fumigation (Full address)
          </div>
          <div className="w-[69%] min-w-0 p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere] leading-snug whitespace-pre-line">
            <TypewriterText
              text={formatContinuousDisplay(data.placeOfFumigation)}
              active={activeField === "placeOfFumigation"}
              placeholder="-"
            />
          </div>
        </div>

        {/* Row 3: Commenced & Completed */}
        <div className="flex border-b border-black items-stretch w-full">
          <div className="w-[31%] shrink-0 border-r border-black p-1.5 space-y-1 text-slate-800">
            <div>
              <div>Date and time fumigation commenced</div>
              <div className="text-[9.5px] text-slate-600">(dd/mm/yyyy - HH:MM)</div>
            </div>
            <div>
              <div>Date and time fumigation completed</div>
              <div className="text-[9.5px] text-slate-600">(dd/mm/yyyy - HH:MM)</div>
            </div>
          </div>
          <div className="w-[69%] min-w-0 p-1.5 space-y-2.5 font-bold text-slate-900 flex flex-col justify-around break-words [overflow-wrap:anywhere]">
            <div>
              <TypewriterText
                text={formatDateTime(data.commencingAt)}
                active={activeField === "commencingAt"}
                placeholder="-"
              />
            </div>
            <div>
              <TypewriterText
                text={formatDateTime(data.completedAt)}
                active={activeField === "completedAt"}
                placeholder="-"
              />
            </div>
          </div>
        </div>

        {/* Row 4: Final TLV */}
        <div className="flex items-stretch w-full">
          <div className="w-[31%] shrink-0 border-r border-black p-1.5 text-slate-800">
            Final TLV reading (ppm)
          </div>
          <div className="w-[69%] min-w-0 p-1.5 font-bold text-slate-900 break-words [overflow-wrap:anywhere] leading-snug">
            <TypewriterText
              text={data.finalTlvReading}
              active={activeField === "finalTlvReading"}
              placeholder="-"
            />
          </div>
        </div>
      </div>

      {/* Declaration */}
      <div className="mt-2 mb-1 text-[10px] space-y-0.5">
        <div className="text-[#0850A2] font-bold text-xs mb-0.5">Declaration</div>
        <div>I, the fumigator-in-charge declare:</div>
        <div>
          1. The fumigation certified was conducted in accordance with the treatment schedule, import conditions, and all
          the requirements in the Methyl Bromide Fumigation Methodology, and
        </div>
        <div>2. The information I have provided is true and correct.</div>
      </div>

      {/* Signature & QR Code Box */}
      <div className="w-full border border-black flex items-stretch">
        {/* Left Block (75%) */}
        <div className="w-3/4 border-r border-black flex flex-col justify-between">
          {/* Signature area */}
          <div className="min-h-16 flex border-b border-black items-stretch">
            <div className="w-[26.67%] shrink-0 border-r border-black flex items-center justify-center font-bold text-xs p-1">
              Signature
            </div>
            <div className="w-[73.33%] min-w-0 flex items-center justify-center p-1">
              {data.fumigatorSignatureUrl ? (
                <img
                  src={data.fumigatorSignatureUrl}
                  alt="Signature"
                  className="max-h-14 object-contain transition-opacity duration-300"
                />
              ) : (
                <span className="text-[10px] text-slate-400 italic">No signature uploaded</span>
              )}
            </div>
          </div>

          {/* Full Name */}
          <div className="min-h-6 flex border-b border-black items-stretch">
            <div className="w-[26.67%] shrink-0 border-r border-black pr-2 text-right font-bold text-xs flex items-center justify-end p-1">
              Full name
            </div>
            <div className="w-[73.33%] min-w-0 pl-2 font-bold text-xs break-all [overflow-wrap:anywhere] flex items-center p-1">
              <TypewriterText
                text={data.fumigatorName}
                active={activeField === "fumigatorName"}
                placeholder="-"
              />
            </div>
          </div>

          {/* Accreditation Number */}
          <div className="min-h-6 flex items-stretch">
            <div className="w-[26.67%] shrink-0 border-r border-black pr-2 text-right font-bold text-xs flex items-center justify-end p-1">
              Accreditation number
            </div>
            <div className="w-[73.33%] min-w-0 pl-2 font-bold text-xs break-all [overflow-wrap:anywhere] flex items-center p-1 font-mono">
              <TypewriterText
                text={data.fumigatorAccreditationNumber}
                active={activeField === "fumigatorAccreditationNumber"}
                placeholder="-"
              />
            </div>
          </div>
        </div>

        {/* Right Block (25%) */}
        <div className="w-1/4 flex flex-col justify-between">
          <div className="min-h-16 border-b border-black flex items-center justify-center p-1">
            {data.qrCodeDataUrl ? (
              <img
                src={data.qrCodeDataUrl}
                alt="Barantin QR Code"
                className="h-14 w-14 object-contain"
              />
            ) : (
              <div className="h-14 w-14 border border-dashed border-slate-300 flex items-center justify-center text-[8px] text-slate-400 text-center">
                QR Code
              </div>
            )}
          </div>
          <div className="min-h-12 p-1.5 flex flex-col justify-center">
            <div className="text-[10px] text-slate-700">Date (dd/mm/yyyy):</div>
            <div className="font-bold text-xs">
              <TypewriterText
                text={formatDate(data.dateIssued)}
                active={activeField === "dateIssued"}
                placeholder="-"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Declarations */}
      <div className="mt-2 text-[10.5px]">
        <div className="text-[#0850A2] font-bold text-xs mb-0.5">Additional Declarations</div>
        <div className="break-all [overflow-wrap:anywhere]">
          <TypewriterText
            text={data.additionalDeclarations}
            active={activeField === "additionalDeclarations"}
            placeholder="-"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t border-black text-[9.5px] leading-tight text-slate-800">
        <div>
          Printed digitally through: <strong className="font-bold">FUMI TRUST by BARANTIN</strong>.
          {verificationLink ? " The authenticity of this document can be verified through the QRcode above or via the following link:" : ""}
        </div>
        {verificationLink && (
          <a
            href={verificationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0850A2] underline break-all block mt-0.5"
          >
            {verificationLink}
          </a>
        )}
      </div>
      </div>

      {/* Page 2: Gas Clearance (when enabled) */}
      {includeGc && (
        <div className="w-full animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3 my-4 max-w-[820px] mx-auto select-none">
            <div className="flex-1 h-[1px] bg-slate-300 dark:bg-slate-700" />
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Halaman 2: Sertifikat Bebas Gas (Gas Clearance)
            </span>
            <div className="flex-1 h-[1px] bg-slate-300 dark:bg-slate-700" />
          </div>

          <GasClearanceHtmlPreview
            data={mapTreatmentToGasClearanceData(data)}
            activeField={activeField}
          />
        </div>
      )}
    </div>
  );
};

export default TreatmentHtmlPreview;
