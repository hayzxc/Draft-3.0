import React from "react";
import { Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { splitContainerColumns } from "@/lib/attachment/attachment";

const PRIMARY_BLUE = "#0047AB";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 40,
    backgroundColor: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica",
    color: "#000000",
  },
  title: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_BLUE,
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 12,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.75,
    borderBottomColor: "#000000",
    alignItems: "stretch",
  },
  tableHeader: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  cell: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRightWidth: 0.75,
    borderRightColor: "#000000",
    justifyContent: "center",
  },
  cellLast: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  headerCellText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  cellText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
  commodityBoxSection: {
    width: "100%",
    marginBottom: 8,
  },
  commodityBoxTitle: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: PRIMARY_BLUE,
    marginBottom: 4,
  },
  commodityBoxContainer: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000000",
    padding: 6,
    minHeight: 120,
  },
  commodityBoxLine: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    lineHeight: 1.35,
  },
  legalNote: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: "#1e293b",
    borderTopWidth: 0.75,
    borderTopColor: "#000000",
    paddingTop: 4,
    marginTop: 4,
  },
  pageNumberBox: {
    marginTop: "auto",
    alignItems: "flex-end",
  },
  pageNumberText: {
    fontSize: 6.8,
    fontFamily: "Helvetica",
    color: "#555555",
    marginTop: 2,
    textAlign: "right",
  },
});

export interface AttachmentContainerItem {
  id?: string;
  containerNumber?: string;
  sealNumber?: string;
  tlvPpm?: string | number;
}

export interface AttachmentPageProps {
  title?: string;
  certificatePrefix?: string;
  certificateNumber?: string | null;
  noticeRef?: string | null;
  certificateDate?: Date | string | null;
  commodity?: string | null;
  containers?: AttachmentContainerItem[];
  showContainersTable?: boolean;
  pageNumber?: number;
  totalPages?: number;
}

const formatDate = (date: Date | string | undefined | null): string => {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return format(d, "dd/MM/yyyy");
  } catch {
    return String(date);
  }
};

export const AttachmentPage: React.FC<AttachmentPageProps> = ({
  title = "ATTACHMENT — Consignment Details",
  certificatePrefix = "GC No.",
  certificateNumber = "-",
  noticeRef = "-",
  certificateDate,
  commodity = "-",
  containers = [],
  showContainersTable,
  pageNumber = 2,
  totalPages = 2,
}) => {
  const shouldRenderContainerTable =
    showContainersTable !== undefined
      ? showContainersTable
      : containers.length >= 4;

  const resolvedNoticeRef =
    noticeRef && noticeRef !== "-"
      ? noticeRef
      : certificateNumber && certificateNumber.includes("/")
      ? certificateNumber.split("/")[3] || "-"
      : "-";

  const { left, right } = splitContainerColumns(containers);
  const leftCount = left.length;
  const rowCount = Math.max(leftCount, 1);
  const rows: [AttachmentContainerItem | null, AttachmentContainerItem | null][] = [];

  for (let i = 0; i < rowCount; i++) {
    rows.push([left[i] || null, right[i] || null]);
  }

  const commodityLines = (commodity || "-").split("\n");

  return (
    <Page size="A4" style={styles.page}>
      {/* 5.1 Header */}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>
        {certificatePrefix} {certificateNumber || "-"}  |  Ref. Notice: {resolvedNoticeRef}  |  Date issued: {formatDate(certificateDate)}
      </Text>

      {/* 5.2 Container Table: Dual 4-column (Rendered when 4+ containers or explicit) */}
      {shouldRenderContainerTable && (
        <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          {/* Left Column Group */}
          <View style={[styles.cell, { width: "6%" }]}>
            <Text style={[styles.headerCellText, { textAlign: "center" }]}>No.</Text>
          </View>
          <View style={[styles.cell, { width: "22%" }]}>
            <Text style={styles.headerCellText}>Container No.</Text>
          </View>
          <View style={[styles.cell, { width: "14%" }]}>
            <Text style={styles.headerCellText}>Seal No.</Text>
          </View>
          <View style={[styles.cell, { width: "8%" }]}>
            <Text style={[styles.headerCellText, { textAlign: "center" }]}>TLV (ppm)</Text>
          </View>

          {/* Right Column Group */}
          <View style={[styles.cell, { width: "6%" }]}>
            <Text style={[styles.headerCellText, { textAlign: "center" }]}>No.</Text>
          </View>
          <View style={[styles.cell, { width: "22%" }]}>
            <Text style={styles.headerCellText}>Container No.</Text>
          </View>
          <View style={[styles.cell, { width: "14%" }]}>
            <Text style={styles.headerCellText}>Seal No.</Text>
          </View>
          <View style={[styles.cellLast, { width: "8%" }]}>
            <Text style={[styles.headerCellText, { textAlign: "center" }]}>TLV (ppm)</Text>
          </View>
        </View>

        {/* Rows */}
        {rows.map(([leftItem, rightItem], idx) => {
          const leftIndex = idx + 1;
          const rightIndex = leftCount + idx + 1;
          const isLastRow = idx === rows.length - 1;

          return (
            <View
              key={idx}
              style={[
                styles.tableRow,
                isLastRow ? { borderBottomWidth: 0 } : {},
              ]}
            >
              {/* Left Item */}
              <View style={[styles.cell, { width: "6%" }]}>
                <Text style={[styles.cellText, { textAlign: "center" }]}>
                  {leftItem ? leftIndex : ""}
                </Text>
              </View>
              <View style={[styles.cell, { width: "22%" }]}>
                <Text style={styles.cellText}>{leftItem?.containerNumber || ""}</Text>
              </View>
              <View style={[styles.cell, { width: "14%" }]}>
                <Text style={styles.cellText}>{leftItem?.sealNumber || ""}</Text>
              </View>
              <View style={[styles.cell, { width: "8%" }]}>
                <Text style={[styles.cellText, { textAlign: "center" }]}>
                  {leftItem?.tlvPpm !== undefined && leftItem?.tlvPpm !== null
                    ? String(leftItem.tlvPpm)
                    : ""}
                </Text>
              </View>

              {/* Right Item */}
              <View style={[styles.cell, { width: "6%" }]}>
                <Text style={[styles.cellText, { textAlign: "center" }]}>
                  {rightItem ? rightIndex : ""}
                </Text>
              </View>
              <View style={[styles.cell, { width: "22%" }]}>
                <Text style={styles.cellText}>{rightItem?.containerNumber || ""}</Text>
              </View>
              <View style={[styles.cell, { width: "14%" }]}>
                <Text style={styles.cellText}>{rightItem?.sealNumber || ""}</Text>
              </View>
              <View style={[styles.cellLast, { width: "8%" }]}>
                <Text style={[styles.cellText, { textAlign: "center" }]}>
                  {rightItem?.tlvPpm !== undefined && rightItem?.tlvPpm !== null
                    ? String(rightItem.tlvPpm)
                    : ""}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      )}

      {/* 5.3 Commodity / Article Box */}
      <View style={styles.commodityBoxSection}>
        <Text style={styles.commodityBoxTitle}>Commodity / Article</Text>
        <View style={styles.commodityBoxContainer}>
          {commodityLines.map((line, idx) => (
            <Text key={idx} style={styles.commodityBoxLine}>
              {line || " "}
            </Text>
          ))}
        </View>
      </View>

      {/* 5.4 Legal Note */}
      <Text style={styles.legalNote}>
        This attachment is an integral part of certificate{" "}
        <Text style={{ fontFamily: "Helvetica-Bold" }}>{certificateNumber || "-"}</Text> and is
        issued because the details do not fit on the main page.
      </Text>

      {/* 5.5 Footer */}
      <View style={styles.pageNumberBox}>
        <Text style={styles.pageNumberText}>
          Page {pageNumber} of {totalPages}
        </Text>
      </View>
    </Page>
  );
};

export default AttachmentPage;
