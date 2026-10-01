import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";

function SignaturePad({ value, onChange }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  useEffect(() => {
    if (!value) return;
    const image = new Image();
    image.onload = () =>
      ref.current.getContext("2d").drawImage(image, 0, 0, 620, 100);
    image.src = value;
  }, [value]);
  const point = (e) => {
    const r = ref.current.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * ref.current.width) / r.width,
      y: ((e.clientY - r.top) * ref.current.height) / r.height,
    };
  };
  const start = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    const c = ref.current.getContext("2d");
    drawing.current = true;
    c.lineWidth = 2;
    c.lineCap = "round";
    c.strokeStyle = "#172233";
    c.beginPath();
    c.moveTo(p.x, p.y);
  };
  const move = (e) => {
    if (!drawing.current) return;
    const p = point(e);
    const c = ref.current.getContext("2d");
    c.lineTo(p.x, p.y);
    c.stroke();
    onChange(ref.current.toDataURL("image/png"));
  };
  const stop = () => {
    if (drawing.current) {
      drawing.current = false;
      onChange(ref.current.toDataURL("image/png"));
    }
  };
  return (
    <div className="signature-pad">
      <canvas
        ref={ref}
        width="620"
        height="100"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
      />
      <img src={value || ""} alt="Issuer signature" />
      <button
        type="button"
        onClick={() => {
          ref.current.getContext("2d").clearRect(0, 0, 620, 100);
          onChange("");
        }}
      >
        Clear signature
      </button>
    </div>
  );
}

export default function AcknowledgmentForm({
  person,
  assets,
  onClose,
  onUpload,
}) {
  const [signature, setSignature] = useState("");
  const [signedFile, setSignedFile] = useState("");
  const [savingPdf, setSavingPdf] = useState(false);
  const today = new Date().toLocaleDateString("en-ZA");
  function buildPages() {
    const source = document.querySelector(".ack-document")?.cloneNode(true);
    if (!source) return null;
    source
      .querySelectorAll("input")
      .forEach((input) => input.setAttribute("value", input.value));
    source.querySelectorAll(".signature-pad").forEach((pad) => {
      const image = document.createElement("img");
      image.src = signature;
      image.className = "printed-signature";
      pad.replaceChildren(image);
    });
    const parts = source.querySelector(".ack-page-break");
    const pageOne = document.createElement("div");
    const pageTwo = document.createElement("div");
    pageOne.className = "print-page ack-document";
    pageTwo.className = "print-page ack-document";
    if (parts) {
      let node = source.firstChild;
      while (node && node !== parts) {
        const next = node.nextSibling;
        pageOne.appendChild(node);
        node = next;
      }
      node = parts.nextSibling;
      while (node) {
        const next = node.nextSibling;
        pageTwo.appendChild(node);
        node = next;
      }
    } else pageOne.append(...source.childNodes);
    [pageOne, pageTwo].forEach((page) => {
      page.style.display = "flex";
      page.style.flexDirection = "column";
      const footer = page.querySelector(".ack-footer");
      if (footer) {
        footer.style.marginTop = "auto";
        footer.style.paddingTop = "24px";
      }
    });
    return [pageOne, pageTwo];
  }
  function printForm() {
    if (!signature) return;
    const pages = buildPages();
    if (!pages) return;
    const [pageOne, pageTwo] = pages;
    const popup = window.open("", "_blank", "width=900,height=1100");
    if (!popup) {
      window.print();
      return;
    }
    popup.document.write(
      `<html><head><title>Company Asset Acknowledgment</title><style>@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#fff;color:#15191f;font-family:Arial,sans-serif}.print-page{width:210mm;min-height:297mm;padding:25mm 22mm;page-break-after:always;break-after:page}.print-page:last-child{page-break-after:auto}.ack-logo-image{display:block;width:175px;margin:0 auto 24px}.ack-document h2{text-align:center;font-size:21px;margin:0 0 28px}.ack-fields,.ack-asset-row{display:grid;grid-template-columns:1fr 1fr;gap:12px 25px}.ack-document label{font-size:11px;font-weight:700;display:grid;gap:4px}.ack-document input{border:0;border-bottom:1px solid #777;padding:5px 2px;font-size:12px;background:transparent}.ack-document h3{font-size:14px;margin:23px 0 10px}.ack-assets-list{display:grid;gap:18px}.ack-asset-row{padding:0}.ack-asset-row>b{grid-column:1/-1}.terms{font-size:10px;line-height:1.5;padding-left:22px}.terms li{padding:3px}.ack-footer{font-size:9px;line-height:1.35;margin-top:24px;font-weight:700}.ack-footer span{font-weight:400}.signature-grid{display:grid;grid-template-columns:2fr 1fr;gap:20px 25px;margin-top:30px}.signature-grid>label:nth-child(5){grid-column:1/-1}.signature-grid>label>div{height:25px;border-bottom:1px solid #555}.signature-pad{max-width:390px}.printed-signature{display:block;width:100%;height:76px;object-fit:contain;object-position:left bottom;border-bottom:1px solid #555}.ack-copy{font-size:10px;line-height:1.5}hr{border:0;border-top:1px solid #999;margin:28px 0 22px}</style></head><body>${pageOne.outerHTML}${pageTwo.outerHTML}</body></html>`,
    );
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 250);
  }
  async function savePdf() {
    if (!signature || savingPdf) return;
    const pages = buildPages();
    if (!pages) return;
    setSavingPdf(true);
    const stage = document.createElement("div");
    stage.style.cssText = "position:fixed;left:-10000px;top:0;background:#fff;z-index:-1";
    pages.forEach((page) => {
      page.classList.add("pdf-page");
      page.style.cssText = "width:794px;min-height:1123px;margin:0;padding:70px 80px;box-shadow:none;background:#fff;overflow:visible;display:flex;flex-direction:column";
      const footer = page.querySelector(".ack-footer");
      if (footer) footer.style.cssText = "margin-top:auto;padding-top:24px";
      stage.appendChild(page);
    });
    document.body.appendChild(stage);
    try {
      await document.fonts?.ready;
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await html2canvas(pages[index], { scale: 2, useCORS: true, backgroundColor: "#ffffff", windowWidth: pages[index].scrollWidth, windowHeight: pages[index].scrollHeight });
        if (index > 0) pdf.addPage("a4", "portrait");
        const scale = Math.min(210 / canvas.width, 297 / canvas.height);
        const width = canvas.width * scale;
        const height = canvas.height * scale;
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.96), "JPEG", (210 - width) / 2, 0, width, height);
      }
      const filename = `${person.name}-asset-acknowledgment.pdf`.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase();
      pdf.save(filename);
    } finally {
      stage.remove();
      setSavingPdf(false);
    }
  }
  async function uploadSigned(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const path = `people/${person.id}/${Date.now()}-${file.name}`;
    if (supabase)
      await supabase.storage
        .from("asset-acknowledgments")
        .upload(path, file, { upsert: true });
    setSignedFile(file.name);
    onUpload?.(file, path);
  }
  return (
    <div className="modal-backdrop ack-backdrop" onClick={onClose}>
      <div className="ack-card" onClick={(e) => e.stopPropagation()}>
        <div className="ack-toolbar">
          <div>
            <b>Company asset acknowledgment</b>
            <small>
              {person.name} / {assets.length} asset
              {assets.length === 1 ? "" : "s"}
            </small>
          </div>
          <button className="close" onClick={onClose}>
            x
          </button>
        </div>
        <div className="ack-document">
          <img
            className="ack-logo-image"
            src="/logo.png"
            alt="IBV International Vaults"
          />
          <h2>COMPANY ASSET ACKNOWLEDGMENT FORM</h2>
          <div className="ack-fields">
            <label>
              Employee Name
              <input defaultValue={person.name} />
            </label>
            <label>
              Employee Number
              <input defaultValue={person.employeeNumber || ""} />
            </label>
            <label>
              Position
              <input defaultValue={person.position || ""} />
            </label>
            <label>
              Date of Issue
              <input defaultValue={today} />
            </label>
          </div>
          <h3>ASSET DETAILS</h3>
          <div className="ack-assets-list">
            {assets.map((asset, index) => (
              <div className="ack-asset-row" key={asset.id}>
                <b>Asset {index + 1}</b>
                <label>
                  Item Description
                  <input defaultValue={`${asset.category} equipment`} />
                </label>
                <label>
                  Make/Model
                  <input defaultValue={`${asset.make} ${asset.model}`} />
                </label>
                <label>
                  Serial Number
                  <input defaultValue={asset.serial} />
                </label>
                <label>
                  IMEI Number (if applicable)
                  <input defaultValue={asset.imei || ""} />
                </label>
                <label>
                  Condition (New/Used)
                  <input defaultValue={asset.condition} />
                </label>
              </div>
            ))}
          </div>
          <h3>Terms of Issuance and Use</h3>
          <ol className="terms">
            <li>
              <b>Ownership:</b>
              <br />
              The issued equipment remains the property of IBV International
              Vaults Pty Ltd at all times.
            </li>
            <li>
              <b>Business Use:</b>
              <br />
              The device is provided strictly for business-related purposes.
              Limited personal use may be permitted in accordance with company
              policy but should not interfere with work duties or result in
              additional costs to the company.
            </li>
            <li>
              <b>Care and Maintenance:</b>
              <ol type="a">
                <li>
                  The employee is responsible for the proper care and
                  safekeeping of the issued equipment.
                </li>
                <li>
                  Equipment must be kept secure and protected from loss, theft,
                  or damage.
                </li>
                <li>
                  Any faults, damages, or loss must be reported immediately to
                  the IT/HR Department.
                </li>
              </ol>
            </li>
          </ol>
          <div className="ack-footer">
            IBV International Vaults, South Africa
            <br />
            <span>
              Registration Number - 2004/012419/07
              <br />
              Suite 2C, Royal Palm, 6 Palm Boulevard, Umhlanga, KZN, 4021
              <br />
              <br />
              M: info@ibvglobal.com
              <br />
              T: +27 31 566 7050
              <br />
              <b>www.ibvinternationalvaults.com</b>
            </span>
          </div>
          <div className="ack-page-break" />
          <img
            className="ack-logo-image ack-logo-page-two"
            src="/logo.png"
            alt="IBV International Vaults"
          />
          <ol className="terms terms-two" start="4">
            <li>
              <b>Loss, Theft, or Damage:</b>
              <br />
              If the issued cellphone, iPad, or any other company equipment is
              lost, stolen, or damaged while in my possession, the employee
              ackonwledges that he/she will be responsible for the cost of
              repair or replacement of the item, as determined by IBV
              International Vaults Pty Ltd.
            </li>
            <li>
              <b>Prohibited Use:</b>
              <br />
              Employees may not install unauthorized applications, software, or
              make modifications to the device that compromise its security or
              functionality.
            </li>
            <li>
              <b>Monitoring:</b>
              <br />
              The company reserves the right to monitor usage in accordance with
              applicable laws and company policy.
            </li>
            <li>
              <b>Return of Property:</b>
              <br />
              Upon termination of employment, transfer, or request by
              management, the employee must return the equipment in good working
              condition (fair wear and tear accepted) along with all accessories
              (chargers, cases, SIM cards, etc.).
            </li>
            <li>
              <b>Liability:</b>
              <br />
              The employee acknowledges that they may be held liable for the
              cost of replacement or repair in cases of negligence, misuse, or
              failure to return the equipment.
            </li>
          </ol>
          <hr />
          <h3>Acknowledgment and Acceptance</h3>
          <p className="ack-copy">
            I, __________________________________________, acknowledge receipt
            of the above-listed company asset(s). I understand that these items
            remain the property of <b>IBV International Vaults Pty Ltd</b> and
            agree to use and maintain them in accordance with the terms outlined
            in this form.
          </p>
          <div className="signature-grid">
            <label>
              Employee Signature
              <div />
            </label>
            <label>
              Date<div>{today}</div>
            </label>
            <label>
              Issued By Name
              <input defaultValue="Avirash Sewcharran" readOnly />
            </label>
            <label>
              Date<div>{today}</div>
            </label>
            <div className="issuer-signature-label">
              <span>Issued By Signature</span>
              <SignaturePad value={signature} onChange={setSignature} />
            </div>
            <label>
              Date<div>{today}</div>
            </label>
          </div>
          <div className="ack-footer">
            IBV International Vaults, South Africa
            <br />
            <span>
              Registration Number - 2004/012419/07
              <br />
              Suite 2C, Royal Palm, 6 Palm Boulevard, Umhlanga, KZN, 4021
              <br />
              <br />
              M: info@ibvglobal.com
              <br />
              T: +27 31 566 7050
              <br />
              <b>www.ibvinternationalvaults.com</b>
            </span>
          </div>
        </div>
        <div className="ack-actions">
          <small>
            {signedFile
              ? `Signed PDF: ${signedFile}`
              : signature
                ? "Issuer signature captured. Save this PDF and send it."
                : "Sign as issuer before saving."}
          </small>
          <label className="upload-button">
            {signedFile ? "Replace signed PDF" : "Upload returned signed PDF"}
            <input
              type="file"
              accept="application/pdf"
              onChange={uploadSigned}
            />
          </label>
          <button type="button" className="secondary ack-print-button" disabled={!signature} onClick={printForm}>Print</button>
          <button type="button" className="primary" disabled={!signature || savingPdf} onClick={savePdf}>{savingPdf ? "Creating PDF..." : "Save PDF"}</button>
        </div>
      </div>
    </div>
  );
}
