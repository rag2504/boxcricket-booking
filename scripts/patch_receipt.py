from pathlib import Path

p = Path(__file__).resolve().parent.parent / "server/templates/bookingReceiptTemplate.js"
s = p.read_text(encoding="utf-8")

if "Extra charge (10+ players)" in s:
    print("already patched")
    raise SystemExit(0)

insert = """
            ${
              (pricing.playerSurcharge || 0) > 0
                ? `
            <div class="info-row">
              <div class="info-item" style="border-top: none;">
                <div class="info-label">Extra charge (10+ players)</div>
                <div class="info-value">+₹${pricing.playerSurcharge}</div>
              </div>
            </div>
            `
                : ""
            }"""

needle = """            <div class="info-row">
              <div class="info-item" style="border-top: none;">
                <div class="info-label">Taxes & Fees</div>"""

if needle not in s:
    raise SystemExit("needle not found")

s = s.replace(needle, insert + needle, 1)
p.write_text(s, encoding="utf-8")
print("patched", p)
