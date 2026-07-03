#!/usr/bin/env python3
"""Generate client requirements PDF for Limitlessbrainlab."""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import Flowable
import datetime

OUTPUT_PATH = "/Users/murali/Sahil/Neuro Staging/Limitlessbrainlab/Client_Requirements_LimitlessBrainLab.pdf"

# ── Brand colours ──────────────────────────────────────────────────────────
BRAND_DARK   = colors.HexColor("#1A1A2E")
BRAND_BLUE   = colors.HexColor("#2563EB")
BRAND_ACCENT = colors.HexColor("#7C3AED")
BRAND_GOLD   = colors.HexColor("#D97706")
PRIORITY_RED = colors.HexColor("#DC2626")
LIGHT_GREY   = colors.HexColor("#F3F4F6")
MID_GREY     = colors.HexColor("#9CA3AF")
BORDER_GREY  = colors.HexColor("#E5E7EB")
WHITE        = colors.white
TEXT_DARK    = colors.HexColor("#111827")
TEXT_BODY    = colors.HexColor("#374151")

# ── Styles ─────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

def S(name, **kw):
    base = styles["Normal"]
    return ParagraphStyle(name, parent=base, **kw)

TITLE    = S("TITLE",    fontSize=26, fontName="Helvetica-Bold",
             textColor=WHITE, alignment=TA_CENTER, leading=32)
SUBTITLE = S("SUBTITLE", fontSize=12, fontName="Helvetica",
             textColor=colors.HexColor("#C7D2FE"), alignment=TA_CENTER, leading=18)
META     = S("META",     fontSize=9,  fontName="Helvetica",
             textColor=colors.HexColor("#A5B4FC"), alignment=TA_CENTER, leading=14)

H1 = S("H1", fontSize=14, fontName="Helvetica-Bold",
        textColor=BRAND_DARK, leading=20, spaceAfter=4)
H2 = S("H2", fontSize=11, fontName="Helvetica-Bold",
        textColor=BRAND_BLUE, leading=16, spaceAfter=2, spaceBefore=6)

BODY = S("BODY", fontSize=9.5, fontName="Helvetica",
          textColor=TEXT_BODY, leading=15, spaceAfter=3)
BODY_ITALIC = S("BODY_ITALIC", fontSize=9.5, fontName="Helvetica-Oblique",
                 textColor=MID_GREY, leading=14, spaceAfter=3)

BULLET = S("BULLET", fontSize=9.5, fontName="Helvetica",
            textColor=TEXT_BODY, leading=14, leftIndent=14,
            bulletIndent=4, spaceAfter=2)

NOTE = S("NOTE", fontSize=8.5, fontName="Helvetica-Oblique",
          textColor=colors.HexColor("#6B7280"), leading=13, spaceAfter=2)

URGENT_LABEL = S("URGENT_LABEL", fontSize=8, fontName="Helvetica-Bold",
                  textColor=WHITE)

FOOTER_STYLE = S("FOOTER", fontSize=7.5, fontName="Helvetica",
                  textColor=MID_GREY, alignment=TA_CENTER, leading=12)


# ── Custom Flowables ───────────────────────────────────────────────────────
class ColorBox(Flowable):
    """Full-width coloured banner used for the title block."""
    def __init__(self, height, color, radius=8):
        super().__init__()
        self.height = height
        self.color  = color
        self.radius = radius
        self._width = 0

    def wrap(self, availWidth, availHeight):
        self._width = availWidth
        return availWidth, self.height

    def draw(self):
        self.canv.saveState()
        self.canv.setFillColor(self.color)
        self.canv.roundRect(0, 0, self._width, self.height,
                             self.radius, stroke=0, fill=1)
        self.canv.restoreState()


class SectionHeader(Flowable):
    """Numbered section header with a left accent bar."""
    def __init__(self, number, title, priority=None, height=32):
        super().__init__()
        self.number   = number
        self.title    = title
        self.priority = priority   # None | "HIGH" | "CRITICAL"
        self.height   = height
        self._width   = 0

    def wrap(self, availWidth, availHeight):
        self._width = availWidth
        return availWidth, self.height

    def draw(self):
        c = self.canv
        c.saveState()

        # background strip
        c.setFillColor(LIGHT_GREY)
        c.roundRect(0, 0, self._width, self.height, 6, stroke=0, fill=1)

        # left accent bar
        bar_color = PRIORITY_RED if self.priority == "CRITICAL" else BRAND_BLUE
        c.setFillColor(bar_color)
        c.rect(0, 0, 5, self.height, stroke=0, fill=1)

        # circle badge
        badge_r = 11
        cx = 22
        cy = self.height / 2
        c.setFillColor(bar_color)
        c.circle(cx, cy, badge_r, stroke=0, fill=1)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(cx, cy - 3.5, str(self.number))

        # title text
        c.setFillColor(BRAND_DARK)
        c.setFont("Helvetica-Bold", 11.5)
        c.drawString(42, self.height / 2 - 4, self.title)

        # priority badge
        if self.priority:
            label  = self.priority
            bg     = PRIORITY_RED if self.priority == "CRITICAL" else BRAND_GOLD
            tw     = c.stringWidth(label, "Helvetica-Bold", 7.5)
            pad    = 6
            bw     = tw + pad * 2
            bx     = self._width - bw - 12
            by     = self.height / 2 - 7
            c.setFillColor(bg)
            c.roundRect(bx, by, bw, 14, 4, stroke=0, fill=1)
            c.setFillColor(WHITE)
            c.setFont("Helvetica-Bold", 7.5)
            c.drawString(bx + pad, by + 3.5, label)

        c.restoreState()


class RequirementTable(Flowable):
    """Two-column key-value table with alternating row shading."""
    def __init__(self, rows, col_widths=None):
        super().__init__()
        self.rows = rows
        self.col_widths = col_widths
        self._width = 0

    def wrap(self, availWidth, availHeight):
        self._width = availWidth
        return availWidth, self._calc_height()

    def _calc_height(self):
        return len(self.rows) * 22 + 4

    def draw(self):
        c = self.canv
        c.saveState()
        y = self._calc_height() - 22
        cw = self.col_widths or [self._width * 0.38, self._width * 0.62]

        for i, (key, val) in enumerate(self.rows):
            bg = colors.HexColor("#EFF6FF") if i % 2 == 0 else WHITE
            c.setFillColor(bg)
            c.rect(0, y, self._width, 22, stroke=0, fill=1)

            c.setFillColor(BORDER_GREY)
            c.rect(0, y, self._width, 0.5, stroke=0, fill=1)

            c.setFillColor(colors.HexColor("#1E40AF"))
            c.setFont("Helvetica-Bold", 8.5)
            c.drawString(10, y + 7, key)

            c.setFillColor(TEXT_BODY)
            c.setFont("Helvetica", 8.5)
            c.drawString(cw[0] + 6, y + 7, val)

            y -= 22

        # outer border
        c.setStrokeColor(BORDER_GREY)
        c.setLineWidth(0.8)
        c.rect(0, 0, self._width, self._calc_height(), stroke=1, fill=0)
        c.restoreState()


def bullet(text, level=0):
    indent = 14 + level * 12
    marker = "•" if level == 0 else "◦"
    return Paragraph(f"{marker}&nbsp;&nbsp;{text}", BULLET)


def sub_bullet(text):
    return bullet(text, level=1)


def info_box(text, color=colors.HexColor("#EFF6FF"), border=BRAND_BLUE):
    data = [[Paragraph(text, S("IB", fontSize=9, fontName="Helvetica",
                                textColor=TEXT_BODY, leading=14))]]
    t = Table(data, colWidths=["100%"])
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,-1), color),
        ("LEFTPADDING",  (0,0), (-1,-1), 10),
        ("RIGHTPADDING", (0,0), (-1,-1), 10),
        ("TOPPADDING",   (0,0), (-1,-1), 8),
        ("BOTTOMPADDING",(0,0), (-1,-1), 8),
        ("LINEAFTER",    (0,0), (0,-1),  2, border),
        ("BOX",          (0,0), (-1,-1), 0.5, border),
        ("ROUNDEDCORNERS", (0,0), (-1,-1), 4),
    ]))
    return t


# ── Build document ─────────────────────────────────────────────────────────
def build():
    doc = SimpleDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2*cm,  bottomMargin=2.5*cm,
        title="Client Requirements — Limitlessbrainlab",
        author="Limitlessbrainlab Dev Team",
    )

    today = datetime.date.today().strftime("%d %B %Y")
    story = []

    # ── HEADER BANNER ──────────────────────────────────────────────────────
    banner_height = 130
    story.append(ColorBox(banner_height, BRAND_DARK))

    # Overlay text on banner via a one-row table with transparent bg
    header_data = [[
        Paragraph("Limitlessbrainlab", TITLE),
    ]]
    ht = Table(header_data, colWidths=["100%"])
    ht.setStyle(TableStyle([
        ("BACKGROUND",    (0,0),(-1,-1), colors.transparent),
        ("TOPPADDING",    (0,0),(-1,-1), 14),
        ("BOTTOMPADDING", (0,0),(-1,-1), 0),
    ]))
    story.append(Spacer(1, -banner_height))   # move back up
    story.append(ht)

    sub_data = [[Paragraph("CLIENT REQUIREMENTS DOCUMENT", SUBTITLE)]]
    st = Table(sub_data, colWidths=["100%"])
    st.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), colors.transparent),
        ("TOPPADDING",   (0,0),(-1,-1), 6),
        ("BOTTOMPADDING",(0,0),(-1,-1), 4),
    ]))
    story.append(st)

    meta_data = [[Paragraph(f"Prepared by: Development Team &nbsp;|&nbsp; Date: {today} &nbsp;|&nbsp; Version: 1.0", META)]]
    mt = Table(meta_data, colWidths=["100%"])
    mt.setStyle(TableStyle([
        ("BACKGROUND",   (0,0),(-1,-1), colors.transparent),
        ("TOPPADDING",   (0,0),(-1,-1), 2),
        ("BOTTOMPADDING",(0,0),(-1,-1), 10),
    ]))
    story.append(mt)
    story.append(Spacer(1, 18))

    # ── DOCUMENT PURPOSE ───────────────────────────────────────────────────
    story.append(info_box(
        "<b>Purpose:</b> This document outlines the outstanding assets and information we require "
        "from the client in order to complete the Limitlessbrainlab platform. Please review each "
        "requirement and provide the requested items at the earliest so we can proceed without delays.",
        color=colors.HexColor("#EEF2FF"),
        border=BRAND_ACCENT,
    ))
    story.append(Spacer(1, 14))

    # ── SUMMARY TABLE ─────────────────────────────────────────────────────
    story.append(Paragraph("Requirements at a Glance", H1))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE, spaceAfter=8))

    summary_rows = [
        ("#", "Requirement", "Priority", "Section"),
        ("1", "Yoga Nidra Mantra Videos", "HIGH", "Video Library"),
        ("2", "Updated Payment Credentials", "CRITICAL", "Book Coach / Brain Coach"),
        ("3", "Systemized Care Program — Video URL Excel Sheet", "HIGH", "Customized Program"),
        ("4", "Nootropics Section — Banner Image", "MEDIUM", "Nootropics"),
        ("5", "About Brain / Academy Section — Content & Suggestions", "MEDIUM", "About Brain"),
    ]

    col_w = [1.2*cm, 7.8*cm, 2.2*cm, 4*cm]
    t = Table(summary_rows, colWidths=col_w, repeatRows=1)
    t.setStyle(TableStyle([
        # header
        ("BACKGROUND",    (0,0), (-1,0), BRAND_DARK),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,0), 8.5),
        ("TOPPADDING",    (0,0), (-1,0), 8),
        ("BOTTOMPADDING", (0,0), (-1,0), 8),
        ("ALIGN",         (0,0), (-1,0), "CENTER"),
        # data rows
        ("FONTNAME",      (0,1), (-1,-1), "Helvetica"),
        ("FONTSIZE",      (0,1), (-1,-1), 8.5),
        ("TOPPADDING",    (0,1), (-1,-1), 7),
        ("BOTTOMPADDING", (0,1), (-1,-1), 7),
        ("ALIGN",         (0,1), (0,-1),  "CENTER"),
        ("ALIGN",         (2,1), (2,-1),  "CENTER"),
        # alternating row bg
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        # grid
        ("GRID",          (0,0), (-1,-1), 0.5, BORDER_GREY),
        ("LINEBELOW",     (0,0), (-1,0),  1.5, BRAND_BLUE),
    ]))

    # Colour priority cells
    priority_map = {
        "CRITICAL": PRIORITY_RED,
        "HIGH":     colors.HexColor("#F59E0B"),
        "MEDIUM":   colors.HexColor("#10B981"),
    }
    for row_i, row in enumerate(summary_rows[1:], start=1):
        pri = row[2]
        bg  = priority_map.get(pri, BRAND_BLUE)
        t.setStyle(TableStyle([
            ("BACKGROUND",  (2, row_i), (2, row_i), bg),
            ("TEXTCOLOR",   (2, row_i), (2, row_i), WHITE),
            ("FONTNAME",    (2, row_i), (2, row_i), "Helvetica-Bold"),
            ("FONTSIZE",    (2, row_i), (2, row_i), 7.5),
        ]))

    story.append(t)
    story.append(Spacer(1, 20))

    # ══════════════════════════════════════════════════════════════════════
    # REQUIREMENT 1 — Yoga Nidra Mantra Videos
    # ══════════════════════════════════════════════════════════════════════
    story.append(KeepTogether([
        SectionHeader(1, "Yoga Nidra Mantra Videos", priority="HIGH"),
        Spacer(1, 8),
        Paragraph("What We Need", H2),
        bullet("All Yoga Nidra mantra video files — or hosted video URLs — to be integrated into the platform's video library."),
        bullet("Each video should be provided with the following details:"),
        sub_bullet("Video title (e.g., 'Yoga Nidra — Session 1', 'Morning Mantra', etc.)"),
        sub_bullet("Duration"),
        sub_bullet("Language / version (if multiple exist)"),
        sub_bullet("Hosted URL <i>or</i> downloadable file"),
        Spacer(1, 6),
        Paragraph("Preferred Format", H2),
    ]))
    pf_rows = [
        ("Video format",  "MP4 (H.264) preferred; YouTube / Vimeo / Wistia URL also accepted"),
        ("Resolution",    "720p minimum, 1080p preferred"),
        ("Delivery",      "Shared Google Drive folder, Dropbox link, or direct upload to our storage"),
        ("Thumbnail",     "One thumbnail image per video (JPG/PNG, 16:9 ratio)"),
    ]
    story.append(RequirementTable(pf_rows))
    story.append(Spacer(1, 8))
    story.append(info_box(
        "<b>Note:</b> Please share all Yoga Nidra mantra videos in one batch. "
        "If the videos are already hosted on a third-party platform (YouTube, Vimeo, etc.), "
        "please provide the exact shareable URLs — we will embed them directly.",
        color=colors.HexColor("#FFF7ED"),
        border=BRAND_GOLD,
    ))
    story.append(Spacer(1, 18))

    # ══════════════════════════════════════════════════════════════════════
    # REQUIREMENT 2 — Payment Credentials  (CRITICAL)
    # ══════════════════════════════════════════════════════════════════════
    story.append(KeepTogether([
        SectionHeader(2, "Updated Payment Credentials", priority="CRITICAL"),
        Spacer(1, 8),
        Paragraph("Background", H2),
        Paragraph(
            "During a previous discussion, <b>Dr. Sweta</b> raised a question regarding the payment "
            "gateway credentials associated with the coaching booking flow. We need clarity and "
            "updated credentials for the following feature (exact section name to be confirmed by the client):",
            BODY,
        ),
        Spacer(1, 6),
    ]))

    section_rows = [
        [Paragraph("Option A", S("OA", fontSize=9, fontName="Helvetica-Bold", textColor=BRAND_BLUE)),
         Paragraph("<b>Book Coach</b> — the booking button / flow labelled 'Book Coach'", BODY)],
        [Paragraph("Option B", S("OB", fontSize=9, fontName="Helvetica-Bold", textColor=BRAND_BLUE)),
         Paragraph("<b>Book a Coach</b> — labelled 'Book a Coach'", BODY)],
        [Paragraph("Option C", S("OC", fontSize=9, fontName="Helvetica-Bold", textColor=BRAND_BLUE)),
         Paragraph("<b>Brain Coach</b> — the 'Brain Coach' section or product", BODY)],
    ]
    sec_t = Table(section_rows, colWidths=[3*cm, 12.2*cm])
    sec_t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#FEF2F2")),
        ("BACKGROUND",    (0,0), (0,-1),  colors.HexColor("#FEE2E2")),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
        ("GRID",          (0,0), (-1,-1), 0.5, colors.HexColor("#FECACA")),
        ("LINEAFTER",     (0,0), (0,-1),  1.5, PRIORITY_RED),
    ]))
    story.append(sec_t)
    story.append(Spacer(1, 8))
    story.append(Paragraph("What We Need", H2))
    story.append(bullet("Confirmation of which section/label the payment gateway applies to (Book Coach / Book a Coach / Brain Coach)."))
    story.append(bullet("Updated payment gateway credentials including:"))
    story.append(sub_bullet("Merchant / Account ID"))
    story.append(sub_bullet("API Key & Secret Key"))
    story.append(sub_bullet("Payment gateway provider name (Razorpay, Stripe, PayU, etc.)"))
    story.append(sub_bullet("Test credentials (if applicable) for sandbox testing"))
    story.append(sub_bullet("Live / Production keys (to be shared securely)"))
    story.append(Spacer(1, 6))
    story.append(info_box(
        "<b>Security Note:</b> Please share live/production credentials via a secure, encrypted "
        "channel (e.g., 1Password shared vault, Bitwarden Send, or an encrypted email). "
        "<b>Do NOT share keys over plain email or WhatsApp.</b>",
        color=colors.HexColor("#FEF2F2"),
        border=PRIORITY_RED,
    ))
    story.append(Spacer(1, 18))

    # ══════════════════════════════════════════════════════════════════════
    # REQUIREMENT 3 — Systemized Care Program Video URLs
    # ══════════════════════════════════════════════════════════════════════
    story.append(KeepTogether([
        SectionHeader(3, "Systemized Care Program — Video URL Excel Sheet", priority="HIGH"),
        Spacer(1, 8),
        Paragraph("Context", H2),
        Paragraph(
            "The Customized Program module contains a structured set of video sessions "
            "mapped to the Systemized Care Program algorithms. Each video button on the platform "
            "must redirect the user to a specific video. For this to work, we require the "
            "<b>exact URL</b> for every video — we cannot use placeholder or generic links.",
            BODY,
        ),
        Spacer(1, 6),
        Paragraph("What We Need", H2),
        bullet("A single Excel workbook (or Google Sheet) containing all Systemized Care Program videos."),
        bullet("Each row in the sheet must include the following columns:"),
    ]))
    col_headers = [
        ["Column", "Description", "Example"],
        ["Program / Category", "The care program or algorithm group the video belongs to", "Stress Management, Sleep Protocol"],
        ["Session Number", "Sequence number of the session within the program", "1, 2, 3 …"],
        ["Video Title", "Exact title as it should appear on the platform", "Day 1 — Breath Awareness"],
        ["Video URL", "Full, direct URL to the video (YouTube, Vimeo, S3, etc.)", "https://youtu.be/xxxxxx"],
        ["Duration", "Length of the video in mm:ss", "12:30"],
        ["Description / Notes", "Any additional instructions for the user (optional)", "Watch before sleeping"],
    ]
    ct = Table(col_headers, colWidths=[3.5*cm, 6.5*cm, 5.2*cm], repeatRows=1)
    ct.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), BRAND_DARK),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 8),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ("GRID",          (0,0), (-1,-1), 0.5, BORDER_GREY),
        ("LINEBELOW",     (0,0), (-1,0),  1.5, BRAND_BLUE),
        ("FONTNAME",      (0,1), (0,-1),  "Helvetica-Bold"),
        ("TEXTCOLOR",     (0,1), (0,-1),  colors.HexColor("#1E40AF")),
    ]))
    story.append(ct)
    story.append(Spacer(1, 8))
    story.append(info_box(
        "<b>Important:</b> Each video URL <u>must be publicly accessible</u> or accessible with "
        "a shareable link. Private / password-protected links will not work for in-platform "
        "embedding or redirect. Please test each URL before sharing the sheet.",
        color=colors.HexColor("#EFF6FF"),
        border=BRAND_BLUE,
    ))
    story.append(Spacer(1, 18))

    # ══════════════════════════════════════════════════════════════════════
    # REQUIREMENT 4 — Nootropics Banner
    # ══════════════════════════════════════════════════════════════════════
    story.append(KeepTogether([
        SectionHeader(4, "Nootropics Section — Banner Image"),
        Spacer(1, 8),
        Paragraph("What We Need", H2),
        Paragraph(
            "The <b>Nootropics</b> section of the platform currently has a placeholder in the "
            "banner area because the client has not yet provided the banner artwork. "
            "We require the following:",
            BODY,
        ),
        Spacer(1, 6),
    ]))
    banner_rows = [
        ("Asset type",     "Hero / banner image for the Nootropics section"),
        ("Dimensions",     "1440 x 480 px (desktop) — mobile crop guidelines welcome"),
        ("File format",    "PNG or JPG; WebP also accepted; minimum 150 KB, maximum 5 MB"),
        ("Content",        "Brand-aligned imagery for nootropics / brain health (no copyright issues)"),
        ("Text overlay",   "Specify any headline or tagline to be placed on the banner (if any)"),
        ("Delivery",       "Google Drive / Dropbox / direct upload"),
    ]
    story.append(RequirementTable(banner_rows))
    story.append(Spacer(1, 8))
    story.append(info_box(
        "If no custom photography is available, please confirm whether you would like the "
        "development team to select a relevant stock image as a placeholder, or if you will "
        "arrange custom creative. <b>We cannot go live with this section without a banner.</b>",
        color=colors.HexColor("#F0FDF4"),
        border=colors.HexColor("#10B981"),
    ))
    story.append(Spacer(1, 18))

    # ══════════════════════════════════════════════════════════════════════
    # REQUIREMENT 5 — About Brain / Academy Content
    # ══════════════════════════════════════════════════════════════════════
    story.append(KeepTogether([
        SectionHeader(5, "About Brain / Academy Section — Content & Suggestions"),
        Spacer(1, 8),
        Paragraph("Background", H2),
        Paragraph(
            "The <b>About Brain</b> section currently contains claims and content that are "
            "expected to align with the <b>Academy</b> component of the platform. "
            "However, we do not have clarity on:",
            BODY,
        ),
        bullet("What the 'Academy' module/section covers in terms of content and scope."),
        bullet("Which specific claims or statements in 'About Brain' must match the Academy material."),
        bullet("The tone, depth, and target audience of the Academy content."),
        Spacer(1, 6),
        Paragraph("What We Need From the Client", H2),
    ]))
    story.append(bullet("A brief written description of what the Academy section should cover (topics, courses, articles, videos, etc.)."))
    story.append(bullet("Any existing Academy content — even draft or rough notes — so we can align the 'About Brain' claims accordingly."))
    story.append(bullet("Confirmation of which claims in 'About Brain' are directly tied to Academy offerings (e.g., research references, certifications, methodologies)."))
    story.append(bullet("Your suggestions for the tone: clinical & research-backed, motivational & wellness-focused, educational & layered, or a blend."))
    story.append(Spacer(1, 6))
    story.append(info_box(
        "<b>Why this matters:</b> The 'About Brain' section is often the first detailed section "
        "users read. Misalignment between what is claimed there and what the Academy actually "
        "delivers will create confusion and erode trust. We want to ensure perfect consistency "
        "before launch.",
        color=colors.HexColor("#EEF2FF"),
        border=BRAND_ACCENT,
    ))
    story.append(Spacer(1, 22))

    # ── NEXT STEPS / ACTION TABLE ─────────────────────────────────────────
    story.append(Paragraph("Action Items — Response Required", H1))
    story.append(HRFlowable(width="100%", thickness=1, color=BRAND_BLUE, spaceAfter=8))

    action_rows = [
        ["#", "Action Required", "Owner", "Deadline"],
        ["1", "Share Yoga Nidra mantra video files or hosted URLs", "Client", "TBD"],
        ["2", "Confirm payment section name + share updated credentials (securely)", "Client / Dr. Sweta", "ASAP"],
        ["3", "Provide Systemized Care Program video URL Excel sheet", "Client", "TBD"],
        ["4", "Deliver Nootropics section banner image", "Client", "TBD"],
        ["5", "Share Academy content brief & confirm About Brain alignment", "Client", "TBD"],
    ]
    at = Table(action_rows, colWidths=[0.8*cm, 8.2*cm, 4*cm, 2.2*cm], repeatRows=1)
    at.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), BRAND_DARK),
        ("TEXTCOLOR",     (0,0), (-1,0), WHITE),
        ("FONTNAME",      (0,0), (-1,0), "Helvetica-Bold"),
        ("FONTSIZE",      (0,0), (-1,-1), 8.5),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("ALIGN",         (0,0), (0,-1),  "CENTER"),
        ("ALIGN",         (3,0), (3,-1),  "CENTER"),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [WHITE, LIGHT_GREY]),
        ("GRID",          (0,0), (-1,-1), 0.5, BORDER_GREY),
        ("LINEBELOW",     (0,0), (-1,0),  1.5, BRAND_BLUE),
        # Highlight row 2 (ASAP)
        ("TEXTCOLOR",     (3,2), (3,2),  PRIORITY_RED),
        ("FONTNAME",      (3,2), (3,2),  "Helvetica-Bold"),
    ]))
    story.append(at)
    story.append(Spacer(1, 20))

    # ── FOOTER NOTE ───────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_GREY, spaceAfter=6))
    story.append(Paragraph(
        "For any questions regarding this document, please contact the Limitlessbrainlab Development Team. "
        "This is a working requirements document — deadlines marked 'TBD' will be finalised upon client confirmation.",
        FOOTER_STYLE,
    ))
    story.append(Paragraph(
        f"Limitlessbrainlab &nbsp;|&nbsp; Client Requirements Document &nbsp;|&nbsp; {today}",
        FOOTER_STYLE,
    ))

    doc.build(story)
    print(f"PDF generated: {OUTPUT_PATH}")


if __name__ == "__main__":
    build()
