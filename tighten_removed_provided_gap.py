import fitz

src = r"C:\Users\ruchi\Downloads\LimitlessBrainLab_DevTeam_Handoff_Response_v2_complete.pdf"
reference = r"C:\Users\ruchi\Downloads\LimitlessBrainLab_DevTeam_Handoff_Response_v2.pdf"
out = r"C:\Users\ruchi\OneDrive\Desktop\limitless production\LimitlessBrainLab_DevTeam_Handoff_Response_v2_complete2.pdf"

doc = fitz.open(src)
ref = fitz.open(reference)
count = 0

# Original pages 4-26 are current pages 2-24 after removing original pages 2-3.
for old_index in range(3, 26):
    page = doc[old_index - 2]
    old_page = ref[old_index]
    for block in old_page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            spans = line.get("spans", [])
            label = next((s for s in spans if s["text"].strip().upper() == "TO BE PROVIDED"), None)
            if not label:
                continue
            after = spans[spans.index(label) + 1:]
            line_rect = fitz.Rect(line["bbox"])
            erase = fitz.Rect(label["bbox"][0] - 10, line_rect.y0 - 4,
                              line_rect.x1 + 3, line_rect.y1 + 4)
            page.add_redact_annot(erase, fill=(1, 1, 1))
            page.apply_redactions()

            x = label["bbox"][0]
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
            count += 1

doc.save(out, garbage=4, deflate=True)
doc.close()
ref.close()
print(f"tightened {count} TO BE PROVIDED response lines")
print(out)
