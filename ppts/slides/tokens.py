"""
tokens.py - Design system constants for PPTX slides.

Parchment canvas, ink-blue accent, serif-led hierarchy, warm grays only.
Maps the print design system to python-pptx units.
"""

from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor

# ═══════════════════════════════════════════════════════════
# Surface palette (warm-toned, never cool gray)
# ═══════════════════════════════════════════════════════════

PARCHMENT   = RGBColor(0xf5, 0xf4, 0xed)   # Page background
IVORY       = RGBColor(0xfa, 0xf9, 0xf5)   # Card / lifted container
WARM_SAND   = RGBColor(0xe8, 0xe6, 0xdc)   # Button / interactive surface
DARK_SURFACE = RGBColor(0x30, 0x30, 0x2e)  # Dark container
DEEP_DARK   = RGBColor(0x14, 0x14, 0x13)   # Dark page background

# ═══════════════════════════════════════════════════════════
# Brand accent (≤5% of surface area)
# ═══════════════════════════════════════════════════════════

BRAND       = RGBColor(0x1B, 0x36, 0x5D)   # Ink Blue - the only chromatic color
BRAND_LIGHT = RGBColor(0x2D, 0x5A, 0x8A)   # Links on dark surfaces
BRAND_TINT  = RGBColor(0xEE, 0xF2, 0xF7)   # 0.08 solid equivalent

# Tag background tiers (solid hex, never rgba)
TAG_LIGHTEST = RGBColor(0xEE, 0xF2, 0xF7)  # 0.08 equivalent
TAG_STANDARD = RGBColor(0xE4, 0xEC, 0xF5)  # 0.18 equivalent
TAG_STRONG   = RGBColor(0xD0, 0xDC, 0xE9)  # 0.22 equivalent

# ═══════════════════════════════════════════════════════════
# Text palette (all warm-toned: R ≈ G > B)
# ═══════════════════════════════════════════════════════════

NEAR_BLACK  = RGBColor(0x14, 0x14, 0x13)   # Primary text
DARK_WARM   = RGBColor(0x3d, 0x3d, 0x3a)   # Secondary dark
CHARCOAL    = RGBColor(0x4d, 0x4c, 0x48)   # Button text / dense body
OLIVE       = RGBColor(0x5e, 0x5d, 0x59)   # Subtext, descriptions
STONE       = RGBColor(0x87, 0x86, 0x7f)   # Tertiary, metadata
WARM_SILVER = RGBColor(0xb0, 0xae, 0xa5)   # Light text on dark surfaces
WHITE       = RGBColor(0xff, 0xff, 0xff)

# ═══════════════════════════════════════════════════════════
# Border palette
# ═══════════════════════════════════════════════════════════

BORDER_CREAM = RGBColor(0xe8, 0xe5, 0xda)  # Softest border - default cards
BORDER_WARM  = RGBColor(0xe0, 0xdd, 0xd2)  # Prominent border - dividers
BORDER_SOFT  = RGBColor(0xe5, 0xe3, 0xd8)  # Dotted divider

# ═══════════════════════════════════════════════════════════
# Chart data series colors (from warm palette)
# ═══════════════════════════════════════════════════════════

SERIES_1 = BRAND                             # #1B365D ink-blue (focal)
SERIES_2 = RGBColor(0x5e, 0x5d, 0x59)       # olive
SERIES_3 = RGBColor(0x87, 0x86, 0x7f)       # stone
SERIES_4 = RGBColor(0xb8, 0xb7, 0xb0)       # light-stone
SERIES_5 = RGBColor(0xd4, 0xd3, 0xcd)       # mist
SERIES_6 = RGBColor(0xEE, 0xF2, 0xF7)       # brand-tint

# Functional
ERROR_RED   = RGBColor(0xb5, 0x33, 0x33)    # Deep warm red
AMBER_WARM  = RGBColor(0xC4, 0x8A, 0x2A)    # Warm amber for watch states

# ═══════════════════════════════════════════════════════════
# Typography
# ═══════════════════════════════════════════════════════════

SERIF = "Newsreader"
SANS  = "Inter"
MONO  = "JetBrains Mono"

# ═══════════════════════════════════════════════════════════
# Slide dimensions (16:9 widescreen)
# ═══════════════════════════════════════════════════════════

SLIDE_W = Inches(13.33)
SLIDE_H = Inches(7.5)

# Standard layout anchors
MARGIN_L  = Inches(1.0)
MARGIN_R  = Inches(1.0)
MARGIN_T  = Inches(0.5)
CONTENT_W = Inches(11.33)
HALF_W    = Inches(5.4)
THIRD_W   = Inches(3.5)
