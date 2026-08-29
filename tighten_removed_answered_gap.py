import fitz

src = r"C:\Users\ruchi\Downloads\LimitlessBrainLab_DevTeam_Handoff_Response_v2_no_answered.pdf"
reference = r"C:\Users\ruchi\Downloads\LimitlessBrainLab_DevTeam_Handoff_Response_v2_revised.pdf"
out = r"C:\Users\ruchi\OneDrive\Desktop\limitless production\Limitlessbrainlab-Production\LimitlessBrainLab_DevTeam_Handoff_Response_v2_final.pdf"

doc = fitz.open(src)
ref = fitz.open(reference)
shifted = 0

for page, old_page in zip(doc, ref):
    for block in old_page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            spans = line.get("spans", [])
            answered = next((s for s in spans if s["text"].strip().upper() == "ANSWERED"), None)
            if not answered:
                continue
            after = spans[spans.index(answered) + 1:]
            if not after:
                continue

            line_rect = fitz.Rect(line["bbox"])
            # The current PDF contains the answer at the old post-label position.
            erase = fitz.Rect(answered["bbox"][0] - 10, line_rect.y0 - 4,
                              line_rect.x1 + 3, line_rect.y1 + 4)
            page.add_redact_annot(erase, fill=(1, 1, 1))
            page.apply_redactions()

            x = answered["bbox"][0]
            baseline = line_rect.y1 - 1.5
            first = True
            for span in after:
                text = span["text"]
                if first:
                    text = text.lstrip()
                    first = False
                if not text:
                    continue
                font = "hebo" if "Bold" in span.get("font", "") else "helv"
                size = span.get("size", 9.6)
                page.insert_text((x, baseline), text, fontname=font, fontsize=size,
                                 color=(0.10, 0.13, 0.22))
                x += fitz.Font(font).text_length(text, fontsize=size)
            shifted += 1

doc.save(out, garbage=4, deflate=True)
doc.close()
ref.close()
print(f"tightened {shifted} response lines")
print(out)
