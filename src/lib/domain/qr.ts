import QRCode from "qrcode";

export interface QrStyle {
  foreground: string;
  background: string;
  margin: number;
  errorCorrection: "L" | "M" | "Q" | "H";
}

export const DEFAULT_QR_STYLE: QrStyle = {
  foreground: "#0C0D11",
  background: "#FFFFFF",
  margin: 2,
  errorCorrection: "Q",
};

export async function generateQrDataUrl(text: string, style: QrStyle): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 480,
    margin: style.margin,
    errorCorrectionLevel: style.errorCorrection,
    color: { dark: style.foreground, light: style.background },
  });
}

export async function generateQrSvg(text: string, style: QrStyle): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: style.margin,
    errorCorrectionLevel: style.errorCorrection,
    color: { dark: style.foreground, light: style.background },
  });
}
