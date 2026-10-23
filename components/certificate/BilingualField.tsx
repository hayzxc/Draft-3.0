import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "flex-start",
  },
  labelBlock: {
    width: "42%",
    paddingRight: 6,
  },
  labelId: {
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#000000",
    lineHeight: 1.1,
  },
  labelEn: {
    fontSize: 7.5,
    fontFamily: "Times-Italic",
    color: "#333333",
    marginTop: 1,
    lineHeight: 1.1,
  },
  separator: {
    width: "4%",
    fontSize: 8.5,
    fontFamily: "Helvetica",
    color: "#000000",
  },
  valueBlock: {
    width: "54%",
  },
  value: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
    lineHeight: 1.2,
  },
  constantValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#000000",
  },
});

interface BilingualFieldProps {
  labelId: string;
  labelEn: string;
  value: string | number;
  isConstant?: boolean;
}

export const BilingualField: React.FC<BilingualFieldProps> = ({
  labelId,
  labelEn,
  value,
  isConstant = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelBlock}>
        <Text style={styles.labelId}>{labelId}</Text>
        <Text style={styles.labelEn}>/ {labelEn}</Text>
      </View>
      <Text style={styles.separator}>:</Text>
      <View style={styles.valueBlock}>
        <Text style={isConstant ? styles.constantValue : styles.value}>
          {value || "-"}
        </Text>
      </View>
    </View>
  );
};

export default BilingualField;
