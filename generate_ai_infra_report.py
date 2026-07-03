from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import Flowable
from reportlab.lib.colors import HexColor

DARK_NAVY   = HexColor("#0D1B2A")
BRAND_BLUE  = HexColor("#1A73E8")
ACCENT_TEAL = HexColor("#00BCD4")
LIGHT_BG    = HexColor("#F0F4F8")
MID_GRAY    = HexColor("#CBD5E0")
TEXT_DARK   = HexColor("#1A202C")
TEXT_MED    = HexColor("#4A5568")
WHITE       = colors.white
GREEN       = HexColor("#2E7D32")
GREEN_LIGHT = HexColor("#E8F5E9")
ORANGE      = HexColor("#E65100")
RED         = HexColor("#C0392B")
SHIELD      = HexColor("#1B5E20")

PAGE_W, PAGE_H = A4
MARGIN = 1.8 * cm


def S(name, **kw):
    return ParagraphStyle(name, **kw)


def p(text, style):
    return Paragraph(text, style)


# ── Shared styles ─────────────────────────────────────────────────────────────
BODY  = S("BD", fontName="Helvetica",      fontSize=9,   textColor=TEXT_DARK,  leading=14)
SMALL = S("SM", fontName="Helvetica",      fontSize=8,   textColor=TEXT_DARK,  leading=12)
LBL   = S("LB", fontName="Helvetica-Bold", fontSize=8.5, textColor=TEXT_MED,   leading=13)
TH    = S("TH", fontName="Helvetica-Bold", fontSize=8.5, textColor=WHITE,      leading=12, alignment=TA_CENTER)
PRICE = S("PR", fontName="Helvetica-Bold", fontSize=10,  textColor=GREEN,      leading=14)
NOTE  = S("NT", fontName="Helvetica-Oblique", fontSize=8.5, textColor=TEXT_MED, leading=13, leftIndent=8)
SUB   = S("SB", fontName="Helvetica-Bold", fontSize=12,  textColor=BRAND_BLUE, leading=17, spaceBefore=8, spaceAfter=4)
SEC   = S("SC", fontName="Helvetica-Bold", fontSize=15,  textColor=WHITE,      leading=20)
CMP_C = S("CC", fontName="Helvetica",      fontSize=7.5, textColor=TEXT_DARK,  leading=11)
CMP_H = S("CH", fontName="Helvetica-Bold", fontSize=7.5, textColor=WHITE,      leading=11, alignment=TA_CENTER)


def section_banner(text, color, cw):
    t = Table([[p(text, SEC)]], colWidths=[cw])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), color),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("TOPPADDING",    (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def vps_pricing_table(rows, cw):
    """
    rows = list of (provider, location, specs, monthly_inr, notes)
    """
    H = S("vph", fontName="Helvetica-Bold", fontSize=8, textColor=WHITE, leading=11, alignment=TA_CENTER)
    C = S("vpc", fontName="Helvetica",      fontSize=8, textColor=TEXT_DARK, leading=12)
    B = S("vpb", fontName="Helvetica-Bold", fontSize=8, textColor=TEXT_DARK, leading=12)
    G = S("vpg", fontName="Helvetica-Bold", fontSize=8, textColor=GREEN,     leading=12, alignment=TA_RIGHT)

    header = [p("Provider", H), p("Location", H), p("Specs", H), p("Monthly Cost (INR)", H), p("Notes", H)]
    data = [header]
    for provider, location, specs, cost, notes in rows:
        data.append([p(f"<b>{provider}</b>", B), p(location, C), p(specs, C), p(cost, G), p(notes, C)])

    col_w = [cw*0.17, cw*0.12, cw*0.28, cw*0.18, cw*0.25]
    t = Table(data, colWidths=col_w)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  DARK_NAVY),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG] * 20),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("GRID",          (0, 0), (-1, -1), 0.3, MID_GRAY),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    return t


def config_header(title, subtitle, color, cw):
    t = Table(
        [[p(f"<b>{title}</b>", S("ch1", fontName="Helvetica-Bold", fontSize=12, textColor=WHITE, leading=16))],
         [p(subtitle,          S("ch2", fontName="Helvetica",      fontSize=9,  textColor=HexColor("#E0E0E0"), leading=13))]],
        colWidths=[cw],
    )
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), color),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("TOPPADDING",    (0, 0), (-1, 0),  8),
        ("BOTTOMPADDING", (0, -1),(-1, -1), 9),
        ("TOPPADDING",    (0, 1), (-1, -1), 0),
    ]))
    return t


def cloud_card(provider, tagline, features, pricing_lines, region_text, cw):
    CMAP = {
        "AWS Bedrock":      HexColor("#FF9900"),
        "Google Vertex AI": HexColor("#4285F4"),
        "Anthropic Claude": HexColor("#7C3AED"),
    }
    c = CMAP.get(provider, BRAND_BLUE)

    hdr = Table(
        [[p(f"<b>{provider}</b>", S("cch", fontName="Helvetica-Bold", fontSize=12, textColor=WHITE, leading=16))],
         [p(tagline,              S("ccs", fontName="Helvetica",      fontSize=9,  textColor=HexColor("#E8E8E8"), leading=13))]],
        colWidths=[cw],
    )
    hdr.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), c),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("TOPPADDING",    (0, 0), (-1, 0),  8),
        ("BOTTOMPADDING", (0, -1),(-1, -1), 9),
        ("TOPPADDING",    (0, 1), (-1, -1), 0),
    ]))

    body_rows = [
        [p("Key Models", LBL),          p(features,      BODY)],
        [p("Pricing (approx.)", LBL),   p(pricing_lines, BODY)],
        [p("UAE / MENA Region", LBL),   p(region_text,   BODY)],
    ]
    body = Table(body_rows, colWidths=[cw * 0.22, cw * 0.78])
    body.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT_BG, WHITE]),
        ("LEFTPADDING",    (0, 0), (-1, -1), 9),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 9),
        ("TOPPADDING",     (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 6),
        ("LINEBELOW",      (0, 0), (-1, -2), 0.3, MID_GRAY),
        ("VALIGN",         (0, 0), (-1, -1), "TOP"),
    ]))

    card = Table([[hdr], [body]], colWidths=[cw])
    card.setStyle(TableStyle([
        ("BOX",           (0, 0), (-1, -1), 1.5, c),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    return card


def build_pdf(output_path):
    doc = SimpleDocTemplate(
        output_path, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=MARGIN,
        title="AI Infrastructure Options — VPS & Cloud",
        author="Limitless Brain Lab",
    )
    cw = PAGE_W - 2 * MARGIN
    story = []

    # ── COVER ──────────────────────────────────────────────────────────────────
    cover = Table(
        [
            [p("AI Infrastructure Options", S("ct", fontName="Helvetica-Bold", fontSize=26,
               textColor=WHITE, leading=34, alignment=TA_CENTER))],
            [p("VPS / Cloud Server  ·  Cloud AI Platforms", S("cs1", fontName="Helvetica",
               fontSize=13, textColor=HexColor("#B0C4DE"), leading=18, alignment=TA_CENTER))],
            [p("Technical Specifications &amp; Pricing Guide (INR)", S("cs2", fontName="Helvetica",
               fontSize=12, textColor=HexColor("#90A4AE"), leading=17, alignment=TA_CENTER))],
            [Spacer(1, 6)],
            [p("Limitless Brain Lab  |  June 2026", S("cd", fontName="Helvetica",
               fontSize=10, textColor=HexColor("#607D8B"), leading=14, alignment=TA_CENTER))],
        ],
        colWidths=[cw],
    )
    cover.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), DARK_NAVY),
        ("LEFTPADDING",   (0, 0), (-1, -1), 20),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 20),
        ("TOPPADDING",    (0, 0), (-1, -1), 50),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 50),
    ]))
    story.append(cover)
    story.append(Spacer(1, 14))

    def intro_box(tag, title, desc, c):
        t = Table(
            [[p(tag,   S(f"it{tag}", fontName="Helvetica-Bold", fontSize=9,  textColor=WHITE,      leading=12, alignment=TA_CENTER))],
             [p(title, S(f"iv{tag}", fontName="Helvetica-Bold", fontSize=11, textColor=c,          leading=15, alignment=TA_CENTER))],
             [p(desc,  S(f"id{tag}", fontName="Helvetica",      fontSize=9,  textColor=HexColor("#B0BEC5"), leading=13, alignment=TA_CENTER))]],
            colWidths=[(cw - 10) / 2],
        )
        t.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), HexColor("#1A2332")),
            ("BACKGROUND",    (0, 0), (-1, 0),  c),
            ("BOX",           (0, 0), (-1, -1), 1, c),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 10),
        ]))
        return t

    intro_row = Table(
        [[intro_box("OPTION 1", "VPS / Linux Server",
                    "Rent a cloud VPS with GPU for local AI model inference — fixed monthly cost, full OS control.",
                    ACCENT_TEAL),
          Spacer(10, 1),
          intro_box("OPTION 2", "Cloud AI Platforms",
                    "Managed AI APIs (AWS Bedrock, Vertex AI, Anthropic) — zero server management, pay-per-token.",
                    ORANGE)]],
        colWidths=[(cw - 10) / 2, 10, (cw - 10) / 2],
    )
    intro_row.setStyle(TableStyle([
        ("LEFTPADDING",   (0, 0), (-1, -1), 0), ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(intro_row)
    story.append(PageBreak())

    # ── PART 1: VPS SERVER ────────────────────────────────────────────────────
    story.append(section_banner("PART 1 — VPS / Linux Server  (Ubuntu)", DARK_NAVY, cw))
    story.append(Spacer(1, 10))
    story.append(p(
        "A VPS (Virtual Private Server) gives you a rented Linux server running 24/7 in a data centre. "
        "No upfront hardware purchase — you pay a fixed monthly fee. "
        "You get root/sudo access, install Ubuntu, and run your AI models exactly like a physical machine. "
        "Two VPS configurations are compared below.",
        BODY))
    story.append(Spacer(1, 14))

    # ── CONFIG A: GPU VPS ──────────────────────────────────────────────────────
    story.append(config_header(
        "Configuration A — GPU VPS  (6 vCPU · 32 GB RAM · 16 GB VRAM · 500 GB SSD)",
        "For running local AI models (LLaMA, Mistral, clinical LLMs) — requires dedicated GPU",
        ACCENT_TEAL, cw,
    ))
    story.append(Spacer(1, 6))

    story.append(vps_pricing_table([
        ("RunPod",        "Global / EU",  "RTX 4080 16GB VRAM\n6 vCPU · 32GB RAM\n500GB SSD",
         "INR 28,000 – 36,000/mo",  "Best value GPU cloud. Spot = cheaper. Good for LLaMA 3 70B (int4)"),
        ("Vast.ai",       "Global",       "RTX 4080 / 3090 16–24GB\n6 vCPU · 32GB RAM\n500GB SSD",
         "INR 22,000 – 34,000/mo",  "Marketplace — lowest price but shared infra. Good for dev/test."),
        ("Lambda Labs",   "US / EU",      "A10 24GB VRAM\n30 vCPU · 60GB RAM\n1TB SSD",
         "INR 52,000 – 68,000/mo",  "Reliable, dedicated GPU. Best for production inference workloads."),
        ("E2E Networks",  "India (Delhi/Mumbai)", "NVIDIA T4 16GB VRAM\n8 vCPU · 32GB RAM\n500GB SSD",
         "INR 18,000 – 35,000/mo",  "Indian data centre — best for data residency in India. Govt. compliant."),
        ("AWS EC2 g4dn.2xlarge", "ap-south-1 (Mumbai)", "T4 16GB VRAM\n8 vCPU · 32GB RAM\n225GB NVMe",
         "INR 40,000 – 58,000/mo",  "On-demand pricing. Reserve 1yr = ~40% cheaper (~INR 27,000/mo)."),
        ("Google Cloud N1 + T4", "asia-south1 (Mumbai)", "T4 16GB VRAM\n8 vCPU · 30GB RAM\n500GB SSD",
         "INR 38,000 – 54,000/mo",  "Preemptible / Spot VM = up to 60% cheaper (~INR 18,000/mo)."),
        ("Azure NV6",     "Central India",  "NVIDIA M60 8GB VRAM\n6 vCPU · 56GB RAM\n380GB SSD",
         "INR 35,000 – 48,000/mo",  "Good for inference. Spot pricing saves ~70% for dev workloads."),
    ], cw))

    story.append(Spacer(1, 8))
    story.append(p(
        "Recommended for AI Inference: <b>RunPod or E2E Networks</b> — RunPod for best cost globally, "
        "E2E Networks if data must stay within India. "
        "For LLaMA 3 70B at int4 quantisation, 16GB VRAM is the minimum requirement.",
        NOTE))

    story.append(Spacer(1, 18))

    # ── CONFIG B: STANDARD VPS ─────────────────────────────────────────────────
    story.append(config_header(
        "Configuration B — Standard VPS  (4 vCPU · 16 GB RAM · Large Storage)",
        "For web apps, databases, RAG backends, embedding servers — no GPU needed",
        GREEN, cw,
    ))
    story.append(Spacer(1, 6))

    story.append(vps_pricing_table([
        ("Hetzner CX32",     "Germany / Finland", "4 vCPU · 8GB RAM\n80GB SSD",
         "INR 630 – 820/mo",   "Cheapest reliable VPS. Good for small apps and APIs."),
        ("Hetzner CPX41",    "Germany / Finland", "8 vCPU · 16GB RAM\n240GB SSD",
         "INR 1,900 – 2,400/mo","Best price-to-performance. Ideal for RAG/embedding server."),
        ("DigitalOcean",     "Bangalore (India)",  "4 vCPU · 16GB RAM\n320GB SSD",
         "INR 6,500 – 8,500/mo","Indian region available. Simple dashboard, reliable uptime."),
        ("Linode (Akamai)",  "Mumbai (India)",     "4 vCPU · 16GB RAM\n320GB SSD",
         "INR 6,000 – 8,000/mo","Mumbai DC for India latency. Good support and SLA."),
        ("OVHcloud Advance-1", "Singapore / EU",  "4-core Xeon · 32GB RAM\n2×480GB SSD",
         "INR 5,500 – 7,500/mo","Dedicated server (not shared vCPU). More reliable for DB workloads."),
        ("E2E Networks",     "India (Delhi/Mumbai)", "4 vCPU · 16GB RAM\n200GB SSD",
         "INR 4,000 – 6,000/mo","Indian data centre. Best for Indian compliance requirements."),
        ("Hostinger VPS",    "India / Singapore",  "4 vCPU · 16GB RAM\n200GB NVMe",
         "INR 1,500 – 2,500/mo","Budget-friendly. Good for small-medium projects. NVMe SSD."),
    ], cw))

    story.append(Spacer(1, 8))
    story.append(p(
        "Recommended for Storage/Backend: <b>Hetzner CPX41 + Hetzner Storage Box</b> — unbeatable cost. "
        "For India data residency: <b>E2E Networks or DigitalOcean Bangalore</b>. "
        "For 200 TB storage, use object storage (Backblaze B2: ~INR 510/TB/mo or Wasabi: ~INR 600/TB/mo) "
        "instead of block storage VPS — block storage at 200 TB on any VPS would cost INR 5–15 lakh/month.",
        NOTE))

    story.append(Spacer(1, 14))

    # ── ADD-ON: STORAGE ────────────────────────────────────────────────────────
    story.append(p("Add-on: Storage Options for Large Data (INR / Month)", SUB))
    story.append(Spacer(1, 4))

    stor_data = [
        [p("Storage Type",   TH), p("Provider",    TH), p("Capacity",    TH),
         p("Cost (INR/mo)",  TH), p("Best For",    TH)],
        [p("Object Storage", BODY), p("Backblaze B2 (India-accessible)", BODY),
         p("Any size",  BODY), p("~INR 510/TB/mo", PRICE), p("Backups, model weights, documents", BODY)],
        [p("Object Storage", BODY), p("Wasabi Hot Cloud (no egress fee)", BODY),
         p("Any size",  BODY), p("~INR 600/TB/mo", PRICE), p("Frequent access, media files, datasets", BODY)],
        [p("Object Storage", BODY), p("AWS S3 (ap-south-1 Mumbai)",      BODY),
         p("Any size",  BODY), p("~INR 2,000/TB/mo", PRICE), p("Production apps needing AWS integration", BODY)],
        [p("Block Storage",  BODY), p("Hetzner Volume (attached to VPS)", BODY),
         p("Up to 10 TB",BODY), p("~INR 450/100GB/mo", PRICE), p("Database storage, pgvector index", BODY)],
        [p("NAS Storage Box", BODY), p("Hetzner Storage Box (SFTP/SMB)", BODY),
         p("Up to 20 TB",BODY), p("INR 1,000 – 2,800/mo", PRICE), p("RAG document store, backup target", BODY)],
        [p("Object Storage", BODY), p("E2E Networks Object Storage (India)", BODY),
         p("Any size",  BODY), p("~INR 400/TB/mo", PRICE), p("India data residency, DPDP Act compliant", BODY)],
    ]
    stor_t = Table(stor_data, colWidths=[cw*0.15, cw*0.27, cw*0.12, cw*0.17, cw*0.29])
    stor_t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  DARK_NAVY),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG] * 10),
        ("LEFTPADDING",   (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("GRID",          (0, 0), (-1, -1), 0.3, MID_GRAY),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(stor_t)
    story.append(Spacer(1, 8))
    story.append(p(
        "For 200 TB: Use Backblaze B2 or Wasabi — 200 TB × INR 510 = <b>~INR 1,02,000/mo</b> (Backblaze B2). "
        "Far cheaper than block VPS storage. Mount via s3fs or rclone from your VPS.",
        NOTE))

    story.append(PageBreak())

    # ── PART 2: CLOUD AI ───────────────────────────────────────────────────────
    story.append(section_banner("PART 2 — Cloud AI Platforms", DARK_NAVY, cw))
    story.append(Spacer(1, 10))
    story.append(p(
        "Cloud AI platforms let you call powerful AI models via API — no GPU server needed. "
        "You send text/data, get AI responses back. Pay only for what you use (per token). "
        "Three leading providers are evaluated below.",
        BODY))
    story.append(Spacer(1, 12))

    story.append(cloud_card(
        "AWS Bedrock",
        "Fully managed foundation model service on AWS",
        "Claude 3.5 Sonnet / Haiku, Llama 3.1 / 3.3, Mistral, Amazon Titan, "
        "Amazon Nova, Cohere Embed — all via single unified API.",
        "Pay-per-token (no upfront cost):<br/>"
        "• Claude 3.5 Haiku: $0.001 / 1K input  ·  $0.005 / 1K output<br/>"
        "• Claude 3.5 Sonnet: $0.003 / 1K input  ·  $0.015 / 1K output<br/>"
        "• Llama 3.3 70B: $0.00072 / 1K input  ·  $0.00099 / 1K output<br/>"
        "INR equivalent: approx. INR 500 – 1,200 per million tokens.<br/>"
        "Provisioned Throughput available for high volume at flat monthly rate.",
        "Region: me-central-1 (UAE — Abu Dhabi). Data stays within UAE. "
        "Supports AWS PrivateLink. SOC 2, ISO 27001, PCI DSS certified.",
        cw,
    ))
    story.append(Spacer(1, 12))

    story.append(cloud_card(
        "Google Vertex AI",
        "Unified ML platform with Gemini and 130+ partner models",
        "Gemini 2.0 Flash / Pro, Gemini 1.5 Flash / Pro, Imagen 3, "
        "Llama 3 (Model Garden), Mistral, Codey — plus AutoML and custom training.",
        "Pay-per-token. Typical rates:<br/>"
        "• Gemini 1.5 Flash: $0.000075 / 1K input  ·  $0.0003 / 1K output<br/>"
        "• Gemini 1.5 Pro: $0.00125 / 1K input  ·  $0.005 / 1K output<br/>"
        "• Gemini 2.0 Flash: $0.0001 / 1K input  ·  $0.0004 / 1K output<br/>"
        "INR equivalent: approx. INR 75 – 450 per million tokens.<br/>"
        "Committed Use Discounts (1yr/3yr) reduce cost by up to 57%.",
        "Nearest region: me-central1 (Qatar). UAE region not yet GA. "
        "Supports VPC Service Controls. ISO 27001, SOC 2, PCI DSS, HIPAA eligible.",
        cw,
    ))
    story.append(Spacer(1, 12))

    story.append(cloud_card(
        "Anthropic Claude",
        "Direct API  +  available via AWS Bedrock &amp; Google Vertex AI",
        "Claude 4 Opus (highest intelligence), Claude 4 Sonnet (balanced), "
        "Claude 3.5 Haiku (fastest / cheapest) — 200K token context. "
        "Best for clinical document analysis and long-form reasoning.",
        "Direct API (api.anthropic.com):<br/>"
        "• Claude 3.5 Haiku: $0.001 / 1K input  ·  $0.005 / 1K output<br/>"
        "• Claude 3.5 Sonnet: $0.003 / 1K input  ·  $0.015 / 1K output<br/>"
        "• Claude 4 Opus: $0.015 / 1K input  ·  $0.075 / 1K output<br/>"
        "INR equivalent: approx. INR 500 – 6,200 per million tokens.<br/>"
        "Prompt caching = 90% cost reduction on repeated context.",
        "No dedicated UAE DC on direct API. Use via AWS Bedrock (me-central-1 Abu Dhabi) "
        "for UAE data residency. GDPR + SOC 2 Type II. Data not used for training.",
        cw,
    ))
    story.append(Spacer(1, 16))

    # ── SECURITY ASSURANCE ─────────────────────────────────────────────────────
    SHIELD_BORDER = HexColor("#2E7D32")
    SHIELD_LIGHT  = HexColor("#E8F5E9")

    assurance_hdr = Table(
        [[p("&#9989;  Your Data Is Safe &amp; Secure — Complete Privacy Assurance",
            S("ah", fontName="Helvetica-Bold", fontSize=13, textColor=WHITE, leading=18))]],
        colWidths=[cw],
    )
    assurance_hdr.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), SHIELD),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))

    intro_block = Table(
        [[p(
            "All three cloud AI providers — <b>AWS Bedrock, Google Vertex AI, and Anthropic Claude</b> — operate "
            "under enterprise-grade security. Your data, patient records, and business information are fully protected. "
            "<b>You do not need to worry about privacy or data security</b> when using any of these platforms.",
            S("ab", fontName="Helvetica", fontSize=9.5, textColor=TEXT_DARK, leading=15)
        )]],
        colWidths=[cw],
    )
    intro_block.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), WHITE),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
        ("TOPPADDING",    (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))

    G_LBL = S("gl", fontName="Helvetica-Bold", fontSize=9,   textColor=SHIELD, leading=14)
    G_BDY = S("gb", fontName="Helvetica",      fontSize=9,   textColor=TEXT_DARK, leading=14)

    guarantees = [
        ("&#128274;  Data Never Used for Training",
         "AWS, Google, and Anthropic <b>never use your API data to train or improve their models</b>. "
         "Your inputs and outputs are completely private and isolated to your account only."),
        ("&#128272;  End-to-End Encryption",
         "All data in transit: <b>TLS 1.3 encryption</b>. All data at rest: <b>AES-256 encryption</b>. "
         "Even cloud provider employees cannot read your data."),
        ("&#127968;  Data Residency Control",
         "You choose which geographic region stores your data. "
         "AWS me-central-1 (Abu Dhabi) ensures data never leaves UAE borders."),
        ("&#128203;  Global Certifications",
         "All providers hold <b>SOC 2 Type II, ISO 27001, PCI DSS</b> — the highest global standards "
         "for data security, audited annually by independent third parties."),
        ("&#128202;  Full Audit Trails",
         "Every API call is logged with timestamps and user identity — "
         "full visibility for MOHAP, UAE PDPL, and DPDP Act compliance."),
        ("&#128101;  Complete Tenant Isolation",
         "Your data is <b>100% isolated</b> from other customers. No cross-tenant access possible. "
         "Role-based access controls (RBAC) ensure only authorised staff can call APIs."),
    ]
    g_rows = [[p(lbl, G_LBL), p(det, G_BDY)] for lbl, det in guarantees]
    g_table = Table(g_rows, colWidths=[cw * 0.30, cw * 0.70])
    g_table.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, SHIELD_LIGHT]),
        ("LEFTPADDING",    (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 10),
        ("TOPPADDING",     (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 7),
        ("LINEBELOW",      (0, 0), (-1, -2), 0.3, HexColor("#A5D6A7")),
        ("VALIGN",         (0, 0), (-1, -1), "TOP"),
    ]))

    summary_block = Table(
        [[p(
            "Bottom line: <b>All three cloud platforms are trusted by the world's largest hospitals, banks, "
            "and governments. Your data is in safe hands — protected by the same infrastructure that secures "
            "Fortune 500 companies globally.</b>",
            S("sl", fontName="Helvetica-Oblique", fontSize=9.5, textColor=SHIELD, leading=14,
              leftIndent=4, rightIndent=4)
        )]],
        colWidths=[cw],
    )
    summary_block.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), SHIELD_LIGHT),
        ("LEFTPADDING",   (0, 0), (-1, -1), 14),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 14),
        ("TOPPADDING",    (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))

    assurance_card = Table(
        [[assurance_hdr], [intro_block], [g_table], [summary_block]],
        colWidths=[cw],
    )
    assurance_card.setStyle(TableStyle([
        ("BOX",           (0, 0), (-1, -1), 2, SHIELD_BORDER),
        ("LEFTPADDING",   (0, 0), (-1, -1), 0),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 0),
        ("TOPPADDING",    (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(assurance_card)
    story.append(Spacer(1, 16))

    # ── UAE DATA PRIVACY ───────────────────────────────────────────────────────
    story.append(section_banner("UAE Data Privacy &amp; Compliance", RED, cw))
    story.append(Spacer(1, 10))

    uae_data = [
        [p("Regulation", TH), p("Scope", TH), p("Key Requirements", TH), p("Cloud Impact", TH)],
        [p("UAE PDPL<br/>(Fed. Law 45/2021)", SMALL),
         p("All entities processing UAE residents' personal data", SMALL),
         p("• Explicit consent for sensitive data<br/>• Data localisation for certain sectors<br/>"
           "• Right to access &amp; erasure<br/>• Breach notification within 72 hrs", SMALL),
         p("Use AWS me-central-1 (Abu Dhabi) for strict UAE data residency", SMALL)],
        [p("DIFC DPL 2020", SMALL),
         p("Companies in Dubai International Financial Centre", SMALL),
         p("• GDPR-aligned framework<br/>• Data Protection Officer mandatory<br/>"
           "• Cross-border transfer restrictions<br/>• Privacy impact assessments required", SMALL),
         p("AWS / GCP PrivateLink + VPC isolation recommended", SMALL)],
        [p("ADGM DPR 2021", SMALL),
         p("Entities in Abu Dhabi Global Market", SMALL),
         p("• Based on UK GDPR<br/>• Lawful basis for processing<br/>"
           "• Data retention limits<br/>• Subject Access Requests within 30 days", SMALL),
         p("Data must not leave UAE without adequacy decision", SMALL)],
        [p("MOHAP Health Data", SMALL),
         p("Healthcare providers &amp; medical platforms in UAE", SMALL),
         p("• Patient records classified as sensitive<br/>• Must be stored within UAE<br/>"
           "• Access limited to authorised clinical staff<br/>• Audit trails mandatory", SMALL),
         p("AWS Bedrock (me-central-1) + AES-256 at rest + TLS 1.3 in transit", SMALL)],
    ]
    uae_t = Table(uae_data, colWidths=[cw*0.17, cw*0.20, cw*0.37, cw*0.26])
    uae_t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  RED),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG, WHITE, LIGHT_BG]),
        ("LEFTPADDING",   (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("GRID",          (0, 0), (-1, -1), 0.3, MID_GRAY),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(uae_t)
    story.append(Spacer(1, 8))
    story.append(p(
        "Recommendation: Use AWS Bedrock (me-central-1 / Abu Dhabi) for all cloud AI inference to guarantee "
        "UAE data residency. Enable PrivateLink so patient data never traverses the public internet.",
        NOTE))
    story.append(PageBreak())

    # ── COMPARISON SUMMARY ─────────────────────────────────────────────────────
    story.append(section_banner("Side-by-Side Comparison Summary", DARK_NAVY, cw))
    story.append(Spacer(1, 10))

    factors = [
        ("Data Control",     "Full — your VPS",        "Full — your VPS",         "High — UAE region",        "Medium — Qatar",         "Medium — no UAE DC"),
        ("Setup Cost",       "Zero (no hardware)",     "Zero (no hardware)",      "Zero (PAYG)",              "Zero (PAYG)",            "Zero (PAYG)"),
        ("Monthly Cost",     "INR 18,000–68,000/mo\n(GPU VPS)", "INR 630–8,500/mo\n(no GPU)", "Per-token variable", "Per-token variable", "Per-token variable"),
        ("GPU / VRAM",       "16 GB VRAM (dedicated)", "None (CPU only)",         "Managed by AWS",           "Managed by GCP",         "Managed by Anthropic"),
        ("Model Choice",     "Any open-source model",  "Small / embed models",    "30+ models",               "130+ models",            "Claude family only"),
        ("Max Context",      "Depends on VRAM",        "Limited",                 "200K (Claude)",            "2M (Gemini)",            "200K tokens"),
        ("UAE Compliant",    "Yes — choose India DC",  "Yes — choose India DC",   "Yes — me-central-1",       "Partial — Qatar",        "Via Bedrock/Vertex"),
        ("Scalability",      "Fixed VPS capacity",     "Fixed VPS capacity",      "Instant auto-scale",       "Instant auto-scale",     "Instant auto-scale"),
        ("Maintenance",      "You manage OS/software", "You manage OS/software",  "Fully managed by AWS",     "Fully managed by GCP",   "Managed by Anthropic"),
        ("Best For",         "Clinical AI, LLM chatbot","RAG backend, storage",   "Production AI API",        "Multi-modal, big context","Highest quality text AI"),
    ]

    hdr_row = [
        p("Factor",                              CMP_H),
        p("Config A\nGPU VPS",                   CMP_H),
        p("Config B\nStandard VPS",              CMP_H),
        p("AWS Bedrock\n(Cloud AI)",             CMP_H),
        p("Vertex AI\n(Cloud AI)",               CMP_H),
        p("Anthropic\n(Cloud AI)",               CMP_H),
    ]
    cmp_rows = [hdr_row]
    for row in factors:
        cmp_rows.append([p(cell, CMP_C) for cell in row])

    cmp_t = Table(cmp_rows, colWidths=[cw*0.16, cw*0.165, cw*0.165, cw*0.148, cw*0.148, cw*0.174])
    cmp_t.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  DARK_NAVY),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [WHITE, LIGHT_BG] * 12),
        ("BACKGROUND",    (1, 1), (2, -1),  HexColor("#E8F5E9")),
        ("BACKGROUND",    (3, 1), (5, -1),  HexColor("#E3F2FD")),
        ("LEFTPADDING",   (0, 0), (-1, -1), 5),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 5),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("GRID",          (0, 0), (-1, -1), 0.3, MID_GRAY),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(cmp_t)

    story.append(Spacer(1, 14))
    story.append(p("Recommended Architecture for Healthcare AI (UAE)", SUB))

    arch = [
        ("Primary AI Inference",  "Config A GPU VPS on E2E Networks (India) or RunPod — runs AI models, zero data leaves the server."),
        ("Overflow / Burst",      "AWS Bedrock (me-central-1) when VPS GPU is at capacity — clinical data stays in UAE region."),
        ("Storage / RAG",         "Config B VPS (Hetzner/E2E) + Backblaze B2 / Wasabi object storage for document store feeding AI."),
        ("Embeddings",            "Local embedding model on Config B VPS — avoids sending raw patient text to cloud providers."),
        ("Monitoring",            "Prometheus + Grafana on VPS; CloudWatch for Bedrock usage and cost alerts."),
        ("Compliance Audit",      "All inference requests logged to PostgreSQL with patient_id hash per MOHAP/UAE PDPL guidelines."),
    ]
    lbl_s = S("al", fontName="Helvetica-Bold", fontSize=9, textColor=BRAND_BLUE, leading=14)
    for lbl, detail in arch:
        r = Table(
            [[p(f"&#9658;  {lbl}", lbl_s), p(detail, BODY)]],
            colWidths=[cw * 0.24, cw * 0.76],
        )
        r.setStyle(TableStyle([
            ("LEFTPADDING",   (0, 0), (-1, -1), 7),
            ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
            ("TOPPADDING",    (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LINEBELOW",     (0, 0), (-1, -1), 0.3, MID_GRAY),
            ("BACKGROUND",    (0, 0), (-1, -1), LIGHT_BG),
            ("VALIGN",        (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(r)

    story.append(Spacer(1, 14))
    story.append(HRFlowable(width=cw, color=MID_GRAY, thickness=0.5))
    story.append(Spacer(1, 6))
    story.append(p(
        "This document is a technical options guide prepared by Limitless Brain Lab (June 2026). "
        "VPS and cloud pricing is indicative and subject to change. All INR figures based on approx. USD/INR = 83.5. "
        "Regulatory guidance should be verified with qualified UAE/India legal counsel before deployment.",
        S("ft", fontName="Helvetica-Oblique", fontSize=8, textColor=TEXT_MED,
          leading=12, alignment=TA_CENTER)
    ))

    doc.build(story)
    print(f"PDF saved: {output_path}")


if __name__ == "__main__":
    out = "/Users/murali/Sahil/Neuro Staging/Limitlessbrainlab/AI_Infrastructure_Options_Report.pdf"
    build_pdf(out)
