import jsPDF from "jspdf";
import { toast } from "react-toastify";

export interface ReceiptItem {
  name: string;
  quantity: number;
  sell_price: number;
  effective_price?: number;
  subtotal: number;
}

export interface GlobalDiscount {
  name: string;
  amount: number;
}

export interface ReceiptData {
  reference_number: string;
  transaction_date: string;
  customer_name: string;
  payment_method: string;
  description?: string;
  items: ReceiptItem[];
  subtotal: number;
  product_discount: number;
  global_discount?: GlobalDiscount | null;
  total_income: number;
  cash_paid?: number;
  change?: number;
}

export interface StoreProfile {
  business_name?: string | null;
  branch_name?: string | null;
  address?: string | null;
  avatar_url?: string | null;
}

export const formatCurrency = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v);

export const wrapText = (text: string, maxWidth: number = 32): string[] => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + (currentLine ? " " : "") + word).length <= maxWidth) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      if (word.length > maxWidth) {
        let remaining = word;
        while (remaining.length > maxWidth) {
          lines.push(remaining.slice(0, maxWidth));
          remaining = remaining.slice(maxWidth);
        }
        currentLine = remaining;
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
};

export function buildReceiptDataFromSaleTransaction(tx: {
  reference_number?: string | null;
  transaction_date: string;
  customer_name?: string | null;
  description?: string | null;
  total_income: number;
  transaction_items: Array<{
    id?: string;
    name: string;
    amount: number;
    quantity: number | null;
    product_id?: string | null;
    payment_methods?: { name: string } | null;
  }>;
}): ReceiptData {
  let posMeta: any = null;
  let userNote = tx.description || "";

  if (tx.description && tx.description.startsWith("{")) {
    try {
      const parsed = JSON.parse(tx.description);
      if (parsed && parsed.pos_meta) {
        posMeta = parsed.pos_meta;
        userNote = parsed.note || "";
      }
    } catch (_) {}
  }

  const items: ReceiptItem[] = tx.transaction_items.map((it) => {
    const cleanName = it.name.replace(/\s*\(x\d+\)/, "");
    const qty = it.quantity || 1;

    const metaItem = posMeta?.items?.find(
      (m: any) => m.product_id === it.product_id || m.name === cleanName
    );

    const sellPrice = metaItem ? Number(metaItem.sell_price) : Math.round(it.amount / qty);
    const effectivePrice = metaItem ? Number(metaItem.effective_price) : Math.round(it.amount / qty);
    const subtotal = effectivePrice * qty;

    return {
      name: cleanName,
      quantity: qty,
      sell_price: sellPrice,
      effective_price: effectivePrice,
      subtotal: subtotal,
    };
  });

  const calcSubtotal = posMeta?.subtotal ?? items.reduce((sum, i) => sum + (i.sell_price * i.quantity), 0);
  const calcProdDisc = posMeta?.product_discount ?? items.reduce((sum, i) => sum + Math.max(0, (i.sell_price - (i.effective_price ?? i.sell_price)) * i.quantity), 0);
  const globalDiscount = posMeta?.global_discount || null;
  const cashPaid = posMeta?.cash_paid ?? undefined;
  const change = posMeta?.change ?? undefined;

  return {
    reference_number: tx.reference_number || "—",
    transaction_date: tx.transaction_date,
    customer_name: tx.customer_name || "Pembeli Umum",
    payment_method: tx.transaction_items[0]?.payment_methods?.name || "Tunai",
    description: userNote,
    items,
    subtotal: calcSubtotal,
    product_discount: calcProdDisc,
    global_discount: globalDiscount,
    total_income: Number(tx.total_income),
    cash_paid: cashPaid,
    change: change,
  };
}

export async function loadLogoDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:image/")) return url;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (e) {
        resolve(null);
      }
    };
    img.onerror = () => {
      fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        })
        .catch(() => resolve(null));
    };
    img.src = url;
  });
}

export async function getEscPosRasterLogoBytes(url: string | null | undefined, maxPixelWidth: number = 192): Promise<Uint8Array | null> {
  const dataUrl = await loadLogoDataUrl(url);
  if (!dataUrl) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        if (w > maxPixelWidth) {
          h = Math.round((h * maxPixelWidth) / w);
          w = maxPixelWidth;
        }

        const widthBytes = Math.ceil(w / 8);
        const alignedWidth = widthBytes * 8;

        const canvas = document.createElement("canvas");
        canvas.width = alignedWidth;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(null);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, alignedWidth, h);

        const offsetX = Math.floor((alignedWidth - w) / 2);
        ctx.drawImage(img, offsetX, 0, w, h);

        const imgData = ctx.getImageData(0, 0, alignedWidth, h);
        const pixels = imgData.data;

        const xL = widthBytes % 256;
        const xH = Math.floor(widthBytes / 256);
        const yL = h % 256;
        const yH = Math.floor(h / 256);

        const header = new Uint8Array([0x1b, 0x61, 0x01, 0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
        const bitmapBytes = new Uint8Array(widthBytes * h);

        let byteIdx = 0;
        for (let y = 0; y < h; y++) {
          for (let xByte = 0; xByte < widthBytes; xByte++) {
            let b = 0;
            for (let bit = 0; bit < 8; bit++) {
              const x = xByte * 8 + bit;
              const pxIdx = (y * alignedWidth + x) * 4;
              const r = pixels[pxIdx];
              const g = pixels[pxIdx + 1];
              const bColor = pixels[pxIdx + 2];
              const alpha = pixels[pxIdx + 3];

              const lum = r * 0.299 + g * 0.587 + bColor * 0.114;
              if (alpha > 50 && lum < 180) {
                b |= 1 << (7 - bit);
              }
            }
            bitmapBytes[byteIdx++] = b;
          }
        }

        const total = new Uint8Array(header.length + bitmapBytes.length + 1);
        total.set(header, 0);
        total.set(bitmapBytes, header.length);
        total[total.length - 1] = 0x0a;

        resolve(total);
      } catch (e) {
        console.warn("ESC/POS raster error:", e);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

export async function printReceiptPdf(profile: StoreProfile, data: ReceiptData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 200] });
  let currentY = 8;

  if (profile.avatar_url) {
    try {
      const dataUrl = await loadLogoDataUrl(profile.avatar_url);
      if (dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        });
        if (img.complete && img.naturalWidth > 0) {
          const maxDim = 22;
          let w = maxDim;
          let h = maxDim;
          if (img.naturalWidth > img.naturalHeight) {
            w = maxDim;
            h = (img.naturalHeight / img.naturalWidth) * maxDim;
          } else {
            h = maxDim;
            w = (img.naturalWidth / img.naturalHeight) * maxDim;
          }
          const posX = (80 - w) / 2;
          doc.addImage(dataUrl, "PNG", posX, currentY, w, h);
          currentY += h + 4;
        }
      }
    } catch (e) {
      console.warn("Logo load failed", e);
    }
  }

  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.text((profile.business_name || "SIPPETO POS").toUpperCase(), 40, currentY, { align: "center" });

  doc.setFont("courier", "normal");
  doc.setFontSize(8);

  if (profile.branch_name) {
    currentY += 4;
    doc.text(profile.branch_name, 40, currentY, { align: "center" });
  }

  if (profile.address) {
    doc.setFontSize(7);
    const splitAddress = doc.splitTextToSize(profile.address, 70);
    splitAddress.forEach((line: string) => {
      currentY += 4;
      doc.text(line, 40, currentY, { align: "center" });
    });
    doc.setFontSize(8);
  }

  currentY += 4;
  doc.text("---------------------------------", 40, currentY, { align: "center" });
  doc.text(`Nota : #${data.reference_number || "-"}`, 5, currentY + 5);
  doc.text(`Tgl  : ${new Date(data.transaction_date).toLocaleDateString("id-ID")}`, 5, currentY + 9);
  doc.text(`Cust : ${data.customer_name || "Pembeli Umum"}`, 5, currentY + 13);
  doc.text(`Bayar: ${data.payment_method || "Tunai"}`, 5, currentY + 17);

  currentY += 22;
  doc.text("---------------------------------", 40, currentY, { align: "center" });

  let yPos = currentY + 5;
  data.items.forEach((item) => {
    const cleanName = item.name.replace(/\s*\(x\d+\)/, "");
    const qty = item.quantity || 1;
    const origPrice = item.sell_price || 0;
    const effPrice = item.effective_price ?? origPrice;
    const hasDisc = origPrice > effPrice;

    const origFmt = formatCurrency(origPrice).replace("Rp", "").trim();
    const effFmt = formatCurrency(effPrice).replace("Rp", "").trim();
    const subtotalFmt = formatCurrency(item.subtotal || effPrice * qty).replace("Rp", "").trim();

    doc.setFont("courier", "bold");
    const nameLines = doc.splitTextToSize(cleanName, 70);
    nameLines.forEach((line: string) => {
      doc.text(line, 5, yPos);
      yPos += 4;
    });

    doc.setFont("courier", "normal");
    if (hasDisc) {
      doc.text(`${qty} x ${origFmt}`, 5, yPos);
      yPos += 4;
      doc.text(`      -> ${effFmt}`, 5, yPos);
      doc.text(subtotalFmt, 75, yPos, { align: "right" });
      yPos += 6;
    } else {
      doc.text(`${qty} x ${effFmt}`, 5, yPos);
      doc.text(subtotalFmt, 75, yPos, { align: "right" });
      yPos += 6;
    }
  });

  doc.text("---------------------------------", 40, yPos, { align: "center" });

  const subtotalVal = data.subtotal > 0 
    ? data.subtotal 
    : data.items.reduce((sum, item) => sum + ((item.sell_price || 0) * (item.quantity || 1)), 0);
  const prodDiscountVal = data.product_discount > 0 
    ? data.product_discount 
    : data.items.reduce((sum, item) => sum + (Math.max(0, (item.sell_price || 0) - (item.effective_price ?? (item.sell_price || 0))) * (item.quantity || 1)), 0);
  const globalDiscountVal = data.global_discount?.amount || 0;

  doc.setFont("courier", "normal");
  doc.text("Subtotal:", 5, yPos + 5);
  doc.text(formatCurrency(subtotalVal).replace("Rp", "").trim(), 75, yPos + 5, { align: "right" });
  yPos += 4;

  if (prodDiscountVal > 0) {
    doc.text("Diskon Produk:", 5, yPos + 5);
    doc.text(`-${formatCurrency(prodDiscountVal).replace("Rp", "").trim()}`, 75, yPos + 5, { align: "right" });
    yPos += 4;
  }

  if (globalDiscountVal > 0) {
    const discName = (data.global_discount?.name || "Global").slice(0, 10);
    doc.text(`Diskon (${discName}):`, 5, yPos + 5);
    doc.text(`-${formatCurrency(globalDiscountVal).replace("Rp", "").trim()}`, 75, yPos + 5, { align: "right" });
    yPos += 4;
  }

  doc.setFont("courier", "bold");
  doc.text("TOTAL BAYAR:", 5, yPos + 5);
  doc.text(formatCurrency(data.total_income).replace("Rp", "").trim(), 75, yPos + 5, { align: "right" });

  let nextY = yPos + 9;
  if (data.cash_paid !== undefined && data.cash_paid > 0) {
    doc.setFont("courier", "normal");
    doc.text("BAYAR :", 5, nextY);
    doc.text(formatCurrency(data.cash_paid).replace("Rp", "").trim(), 75, nextY, { align: "right" });
    nextY += 4;
    doc.text("KEMBALI:", 5, nextY);
    doc.text(formatCurrency(data.change || 0).replace("Rp", "").trim(), 75, nextY, { align: "right" });
    nextY += 5;
  } else {
    nextY += 5;
  }

  doc.setFont("courier", "normal");
  doc.setFontSize(7);
  doc.text("terima kasih atas pesanan anda .", 40, nextY + 5, { align: "center" });
  doc.text("dicetak dari Sippeto POS system", 40, nextY + 9, { align: "center" });

  const pdfBlobUrl = doc.output("bloburl");
  window.open(pdfBlobUrl);
}

export async function printReceiptUsb(profile: StoreProfile, data: ReceiptData) {
  if (!(navigator as any).usb) {
    toast.error("Browser Anda tidak mendukung WebUSB.");
    return;
  }
  try {
    const paired = await (navigator as any).usb.getDevices();
    let device = paired.length > 0 ? paired[0] : await (navigator as any).usb.requestDevice({ filters: [] });
    if (!device.opened) await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);

    let interfaceNumber: number | null = null;
    let endpointNumber: number | null = null;
    for (const config of device.configurations) {
      for (const iface of config.interfaces) {
        for (const alternate of iface.alternates) {
          const outEndpoint = alternate.endpoints.find((ep: any) => ep.direction === "out" && ep.type === "bulk");
          if (outEndpoint) {
            interfaceNumber = iface.interfaceNumber;
            endpointNumber = outEndpoint.endpointNumber;
            break;
          }
        }
        if (interfaceNumber !== null) break;
      }
      if (interfaceNumber !== null) break;
    }
    if (interfaceNumber === null || endpointNumber === null) throw new Error("Endpoint USB tidak ditemukan.");
    try { await device.claimInterface(interfaceNumber); } catch (_) {}

    const encoder = new TextEncoder();
    const ESC = "\x1b";
    const GS = "\x1d";
    const LF = "\n";

    let payload = "";
    payload += ESC + "@";
    payload += ESC + "a" + "\x01";
    payload += ESC + "!" + "\x10";
    payload += (profile.business_name || "SIPPETO POS").toUpperCase() + LF;
    payload += ESC + "!" + "\x00";

    if (profile.branch_name) payload += profile.branch_name + LF;
    if (profile.address) payload += profile.address + LF;
    payload += "--------------------------------" + LF;

    payload += ESC + "a" + "\x00";
    payload += `Nota : #${data.reference_number}` + LF;
    payload += `Tgl  : ${new Date(data.transaction_date).toLocaleDateString("id-ID")}` + LF;
    payload += `Cust : ${data.customer_name || "Pembeli Umum"}` + LF;
    payload += `Bayar: ${data.payment_method}` + LF;
    payload += "--------------------------------" + LF;

    data.items.forEach((item) => {
      const cleanName = item.name.replace(/\s*\(x\d+\)/, "");
      const qty = item.quantity || 1;
      const origPrice = item.sell_price || 0;
      const effPrice = item.effective_price ?? origPrice;
      const hasDisc = origPrice > effPrice;

      const origFmt = formatCurrency(origPrice).replace("Rp", "").trim();
      const effFmt = formatCurrency(effPrice).replace("Rp", "").trim();
      const subtotalFmt = formatCurrency(item.subtotal || effPrice * qty).replace("Rp", "").trim();

      const nameLines = wrapText(cleanName, 32);
      nameLines.forEach((l: string) => { payload += l + LF; });

      if (hasDisc) {
        payload += `${qty} x ${origFmt}` + LF;
        const discText = `   -> ${effFmt}`;
        const spacesCount = 32 - discText.length - subtotalFmt.length;
        if (spacesCount >= 1) {
          payload += discText + " ".repeat(spacesCount) + subtotalFmt + LF;
        } else {
          payload += discText + LF;
          payload += " ".repeat(Math.max(0, 32 - subtotalFmt.length)) + subtotalFmt + LF;
        }
      } else {
        const qtyText = `${qty} x ${effFmt}`;
        const spacesCount = 32 - qtyText.length - subtotalFmt.length;
        if (spacesCount >= 1) {
          payload += qtyText + " ".repeat(spacesCount) + subtotalFmt + LF;
        } else {
          payload += qtyText + LF;
          payload += " ".repeat(Math.max(0, 32 - subtotalFmt.length)) + subtotalFmt + LF;
        }
      }
    });

    payload += "--------------------------------" + LF;

    const subtotalVal = data.subtotal > 0 
      ? data.subtotal 
      : data.items.reduce((sum, item) => sum + ((item.sell_price || 0) * (item.quantity || 1)), 0);
    const prodDiscountVal = data.product_discount > 0 
      ? data.product_discount 
      : data.items.reduce((sum, item) => sum + (Math.max(0, (item.sell_price || 0) - (item.effective_price ?? (item.sell_price || 0))) * (item.quantity || 1)), 0);
    const globalDiscountVal = data.global_discount?.amount || 0;

    const subText = "Subtotal:";
    const subVal = formatCurrency(subtotalVal).replace("Rp", "").trim();
    payload += subText + " ".repeat(Math.max(1, 32 - subText.length - subVal.length)) + subVal + LF;

    if (prodDiscountVal > 0) {
      const discText = "Diskon Produk:";
      const discVal = `-${formatCurrency(prodDiscountVal).replace("Rp", "").trim()}`;
      payload += discText + " ".repeat(Math.max(1, 32 - discText.length - discVal.length)) + discVal + LF;
    }
    if (globalDiscountVal > 0) {
      const gDiscText = `Diskon (${(data.global_discount?.name || "Global").slice(0, 10)}):`;
      const gDiscVal = `-${formatCurrency(globalDiscountVal).replace("Rp", "").trim()}`;
      payload += gDiscText + " ".repeat(Math.max(1, 32 - gDiscText.length - gDiscVal.length)) + gDiscVal + LF;
    }

    const totalText = "TOTAL BAYAR:";
    const totalVal = formatCurrency(data.total_income).replace("Rp", "").trim();
    payload += totalText + " ".repeat(Math.max(1, 32 - totalText.length - totalVal.length)) + totalVal + LF;

    if (data.cash_paid !== undefined && data.cash_paid > 0) {
      const bayarText = "BAYAR :";
      const bayarVal = formatCurrency(data.cash_paid).replace("Rp", "").trim();
      payload += bayarText + " ".repeat(Math.max(1, 32 - bayarText.length - bayarVal.length)) + bayarVal + LF;

      const kembaliText = "KEMBALI:";
      const kembaliVal = formatCurrency(data.change || 0).replace("Rp", "").trim();
      payload += kembaliText + " ".repeat(Math.max(1, 32 - kembaliText.length - kembaliVal.length)) + kembaliVal + LF;
    }

    payload += LF;
    payload += ESC + "a" + "\x01";
    payload += "terima kasih atas pesanan anda ." + LF;
    payload += "dicetak dari Sippeto POS system" + LF;
    payload += LF + LF + LF;
    payload += GS + "V" + "\x41" + "\x03";

    const logoBytes = await getEscPosRasterLogoBytes(profile.avatar_url, 192);
    const textBytes = encoder.encode(payload);

    const fullPayload = logoBytes 
      ? new Uint8Array([...logoBytes, ...textBytes])
      : textBytes;

    for (let i = 0; i < fullPayload.length; i += 64) {
      await device.transferOut(endpointNumber, fullPayload.slice(i, i + 64));
    }
    toast.success("Nota berhasil dicetak via USB!");
  } catch (e: any) {
    if (e.name !== "NotFoundError") toast.error(`Gagal cetak USB: ${e.message || e}`);
  }
}

export async function printReceiptBluetooth(profile: StoreProfile, data: ReceiptData, device: any) {
  if (!device || !device.gatt || !device.gatt.connected) {
    throw new Error("Printer Bluetooth tidak terhubung.");
  }
  const server = device.gatt;
  const services = await server.getPrimaryServices();
  let targetChar: any = null;

  for (const service of services) {
    const characteristics = await service.getCharacteristics();
    for (const char of characteristics) {
      if (char.properties.write || char.properties.writeWithoutResponse) {
        targetChar = char;
        break;
      }
    }
    if (targetChar) break;
  }

  if (!targetChar) throw new Error("Karakteristik Bluetooth tidak ditemukan.");

  const encoder = new TextEncoder();
  const ESC = "\x1b";
  const GS = "\x1d";
  const LF = "\n";

  let payload = "";
  payload += ESC + "@";
  payload += ESC + "a" + "\x01";
  payload += ESC + "!" + "\x10";
  payload += (profile.business_name || "SIPPETO POS").toUpperCase() + LF;
  payload += ESC + "!" + "\x00";

  if (profile.branch_name) payload += profile.branch_name + LF;
  if (profile.address) payload += profile.address + LF;
  payload += "--------------------------------" + LF;

  payload += ESC + "a" + "\x00";
  payload += `Nota : #${data.reference_number}` + LF;
  payload += `Tgl  : ${new Date(data.transaction_date).toLocaleDateString("id-ID")}` + LF;
  payload += `Cust : ${data.customer_name || "Pembeli Umum"}` + LF;
  payload += `Bayar: ${data.payment_method}` + LF;
  payload += "--------------------------------" + LF;

  data.items.forEach((item) => {
    const cleanName = item.name.replace(/\s*\(x\d+\)/, "");
    const qty = item.quantity || 1;
    const origPrice = item.sell_price || 0;
    const effPrice = item.effective_price ?? origPrice;
    const hasDisc = origPrice > effPrice;

    const origFmt = formatCurrency(origPrice).replace("Rp", "").trim();
    const effFmt = formatCurrency(effPrice).replace("Rp", "").trim();
    const subtotalFmt = formatCurrency(item.subtotal || effPrice * qty).replace("Rp", "").trim();

    const nameLines = wrapText(cleanName, 32);
    nameLines.forEach((l: string) => { payload += l + LF; });

    if (hasDisc) {
      payload += `${qty} x ${origFmt}` + LF;
      const discText = `   -> ${effFmt}`;
      const spacesCount = 32 - discText.length - subtotalFmt.length;
      if (spacesCount >= 1) {
        payload += discText + " ".repeat(spacesCount) + subtotalFmt + LF;
      } else {
        payload += discText + LF;
        payload += " ".repeat(Math.max(0, 32 - subtotalFmt.length)) + subtotalFmt + LF;
      }
    } else {
      const qtyText = `${qty} x ${effFmt}`;
      const spacesCount = 32 - qtyText.length - subtotalFmt.length;
      if (spacesCount >= 1) {
        payload += qtyText + " ".repeat(spacesCount) + subtotalFmt + LF;
      } else {
        payload += qtyText + LF;
        payload += " ".repeat(Math.max(0, 32 - subtotalFmt.length)) + subtotalFmt + LF;
      }
    }
  });

  payload += "--------------------------------" + LF;

  const subtotalVal = data.subtotal > 0 
    ? data.subtotal 
    : data.items.reduce((sum, item) => sum + ((item.sell_price || 0) * (item.quantity || 1)), 0);
  const prodDiscountVal = data.product_discount > 0 
    ? data.product_discount 
    : data.items.reduce((sum, item) => sum + (Math.max(0, (item.sell_price || 0) - (item.effective_price ?? (item.sell_price || 0))) * (item.quantity || 1)), 0);
  const globalDiscountVal = data.global_discount?.amount || 0;

  const subText = "Subtotal:";
  const subVal = formatCurrency(subtotalVal).replace("Rp", "").trim();
  payload += subText + " ".repeat(Math.max(1, 32 - subText.length - subVal.length)) + subVal + LF;

  if (prodDiscountVal > 0) {
    const discText = "Diskon Produk:";
    const discVal = `-${formatCurrency(prodDiscountVal).replace("Rp", "").trim()}`;
    payload += discText + " ".repeat(Math.max(1, 32 - discText.length - discVal.length)) + discVal + LF;
  }
  if (globalDiscountVal > 0) {
    const gDiscText = `Diskon (${(data.global_discount?.name || "Global").slice(0, 10)}):`;
    const gDiscVal = `-${formatCurrency(globalDiscountVal).replace("Rp", "").trim()}`;
    payload += gDiscText + " ".repeat(Math.max(1, 32 - gDiscText.length - gDiscVal.length)) + gDiscVal + LF;
  }

  const totalText = "TOTAL BAYAR:";
  const totalVal = formatCurrency(data.total_income).replace("Rp", "").trim();
  payload += totalText + " ".repeat(Math.max(1, 32 - totalText.length - totalVal.length)) + totalVal + LF;

  if (data.cash_paid !== undefined && data.cash_paid > 0) {
    const bayarText = "BAYAR :";
    const bayarVal = formatCurrency(data.cash_paid).replace("Rp", "").trim();
    payload += bayarText + " ".repeat(Math.max(1, 32 - bayarText.length - bayarVal.length)) + bayarVal + LF;

    const kembaliText = "KEMBALI:";
    const kembaliVal = formatCurrency(data.change || 0).replace("Rp", "").trim();
    payload += kembaliText + " ".repeat(Math.max(1, 32 - kembaliText.length - kembaliVal.length)) + kembaliVal + LF;
  }

  payload += LF;
  payload += ESC + "a" + "\x01";
  payload += "terima kasih atas pesanan anda ." + LF;
  payload += "dicetak dari Sippeto POS system" + LF;
  payload += LF + LF + LF;
  payload += GS + "V" + "\x41" + "\x03";

  const logoBytes = await getEscPosRasterLogoBytes(profile.avatar_url, 192);
  const textBytes = encoder.encode(payload);

  const fullPayload = logoBytes 
    ? new Uint8Array([...logoBytes, ...textBytes])
    : textBytes;

  const chunkSize = 100;
  for (let i = 0; i < fullPayload.length; i += chunkSize) {
    const chunk = fullPayload.slice(i, i + chunkSize);
    await targetChar.writeValue(chunk);
  }
  toast.success("Nota berhasil dicetak via Bluetooth!");
}
