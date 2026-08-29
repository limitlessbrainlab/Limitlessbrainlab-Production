import fitz

src = r"C:\Users\ruchi\Downloads\LimitlessBrainLab_DevTeam_Handoff_Response_v2.pdf"
out = r"C:\Users\ruchi\OneDrive\Desktop\limitless production\Limitlessbrainlab-Production\LimitlessBrainLab_DevTeam_Handoff_Response_v2_revised.pdf"

doc = fitz.open(src)

def redact(page, rect, replacement=None, fontsize=8.5):
    page.add_redact_annot(fitz.Rect(rect), fill=(1, 1, 1))
    page.apply_redactions()
    if replacement:
        page.insert_textbox(fitz.Rect(rect), replacement, fontname="helv", fontsize=fontsize,
                            color=(0.10, 0.13, 0.22), lineheight=1.15)

# Remove the purpose/introduction paragraph and the opening status-summary box.
redact(doc[0], (30, 214, 565, 285))
redact(doc[0], (30, 605, 565, 795))

# Remove the Material Findings, secondary observations, and mail-status summary pages.
doc.delete_pages(1, 2)

# Remove status labels from the PO and Sections A-K (pages 4-26 in the original).
# After deleting pages 2-3, these are now pages 2-24 (zero-based 1-23).
for page in doc[1:24]:
    for rect in page.search_for("TO BE PROVIDED"):
        page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions()

# Remove the Part A/C correction passages and their dangling references.
redact(doc[10], (60, 302, 555, 340))
redact(doc[10], (60, 382, 555, 420))
redact(doc[25], (310, 428, 555, 485))

# Update the surviving AI summary cross-reference after the findings pages are removed.
redact(doc[14], (45, 100, 555, 152),
       "Bettroi's v1 assumed a single provider. The verified position is two providers plus one third-party qEEG service, only\n"
       "one of which is client-owned. Full detail, key values and file references are in Section L3; the Anthropic Claude\n"
       "account and API-key requirement are recorded in L3.2.", 8.4)

# Change the Claude point number/reference and state the required source of the API key.
redact(doc[26], (30, 395, 565, 420),
       "L3.2 Anthropic Claude — API key from Dr. Shweta's account", 8.8)
redact(doc[26], (35, 452, 555, 488),
       "Account owner\nDr. Shweta's Anthropic account. Required action: obtain the Claude API key from Dr. Shweta's account and configure it on the sidecar.", 8.2)

# Remove the now-invalid Finding 3 label wherever it remains as a standalone reference.
for rect in doc[14].search_for("Finding 3"):
    redact(doc[14], rect, "L3.2", 8.4)

# Update the PO cross-reference to the renamed Claude point.
for rect in doc[3].search_for("Finding 3"):
    redact(doc[3], rect, "L3.2", 8.2)

doc.set_metadata({**doc.metadata, "title": "NeuroSense Web App MVP — Development Team Handoff Response (Revised)"})
doc.save(out, garbage=4, deflate=True)
doc.close()
print(out)
