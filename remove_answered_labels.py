import fitz

src = r"C:\Users\ruchi\Downloads\LimitlessBrainLab_DevTeam_Handoff_Response_v2_revised.pdf"
out = r"C:\Users\ruchi\OneDrive\Desktop\limitless production\Limitlessbrainlab-Production\LimitlessBrainLab_DevTeam_Handoff_Response_v2_no_answered.pdf"

doc = fitz.open(src)
count = 0
for page in doc:
    rects = page.search_for("ANSWERED")
    for rect in rects:
        # Cover the text and the surrounding colored status pill, but not RESPONSE or the answer.
        cover = fitz.Rect(rect.x0 - 10, rect.y0 - 4, rect.x1 + 42, rect.y1 + 4)
        page.add_redact_annot(cover, fill=(1, 1, 1))
        count += 1
    if rects:
        page.apply_redactions()

doc.save(out, garbage=4, deflate=True)
doc.close()
print(f"removed {count} ANSWERED labels")
print(out)
