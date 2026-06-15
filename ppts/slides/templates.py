"""
templates.py - High-level slide templates using design tokens and helpers.
"""

from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

from .tokens import *
from .helpers import (
    blank_slide, add_text, add_line, add_brand_left_bar,
    add_bullet_list, add_eyebrow_header, add_page_number, add_multiline_text
)

def cover_slide(prs, title, subtitle, author, date):
    s = blank_slide(prs, bg_color=PARCHMENT)
    
    # Title - Display size (48pt)
    add_text(s, title,
             Inches(1), Inches(2.5), CONTENT_W, Inches(1.5),
             font=SERIF, size=48, color=NEAR_BLACK, align=PP_ALIGN.CENTER)
             
    # Separator
    add_line(s, HALF_W, Inches(4.3), Inches(2.5), weight_pt=1.5)
    
    # Subtitle
    add_text(s, subtitle,
             Inches(1), Inches(4.6), CONTENT_W, Inches(0.8),
             font=SANS, size=18, color=OLIVE, align=PP_ALIGN.CENTER)
             
    # Meta
    add_text(s, f"{author} · {date}",
             Inches(1), Inches(6.5), CONTENT_W, Inches(0.4),
             font=MONO, size=11, color=STONE, align=PP_ALIGN.CENTER)
             
    return s


def toc_slide(prs, items):
    s = blank_slide(prs, bg_color=IVORY)
    
    # Header
    add_text(s, "Contents",
             Inches(1.2), Inches(0.8), Inches(10), Inches(0.8),
             font=SERIF, size=34, color=NEAR_BLACK)
    add_line(s, Inches(1.2), Inches(1.8), Inches(11), weight_pt=1, color=BORDER_WARM)

    # List items
    for i, item in enumerate(items):
        y = Inches(2.2 + i * 0.75)
        # Number indicator
        add_text(s, f"0{i+1}",
                 Inches(1.2), y, Inches(1), Inches(0.6),
                 font=MONO, size=24, color=BRAND)
        # Title
        add_text(s, item,
                 Inches(2.4), y, Inches(9), Inches(0.6),
                 font=SERIF, size=22, color=NEAR_BLACK, vanchor=MSO_ANCHOR.MIDDLE)
    return s


def chapter_slide(prs, number, title):
    """Chapter start: serif heading + 2.5pt brand left bar"""
    s = blank_slide(prs, bg_color=PARCHMENT)
    
    add_text(s, f"0{number}",
             Inches(1.5), Inches(2.8), Inches(2), Inches(0.8),
             font=MONO, size=20, color=STONE)
             
    # Brand left bar
    add_brand_left_bar(s, Inches(1.2), Inches(3.5), Inches(1.2), width=Pt(4))
    
    add_text(s, title,
             Inches(1.5), Inches(3.3), Inches(10.5), Inches(1.5),
             font=SERIF, size=48, color=NEAR_BLACK, vanchor=MSO_ANCHOR.MIDDLE)
             
    return s


def content_slide(prs, eyebrow, title, body, bullets=None, page_num=None, total_pages=None):
    s = blank_slide(prs)
    
    y = add_eyebrow_header(s, eyebrow, title)
    
    # Body
    add_multiline_text(s, [body],
                       Inches(1.2), y, Inches(11), Inches(1.5),
                       font=SANS, size=16, color=DARK_WARM, line_spacing=24)
    
    if bullets:
        add_bullet_list(s, bullets, Inches(1.2), y + Inches(1.2), Inches(10.5), 
                        font_size=15, item_height=0.6)
            
    if page_num is not None:
        add_page_number(s, page_num, total=total_pages)
        
    return s


def metrics_slide(prs, eyebrow, title, body, metrics, page_num=None, total_pages=None):
    """metrics: [(value, label), ...]"""
    s = blank_slide(prs)
    y = add_eyebrow_header(s, eyebrow, title)
    
    add_text(s, body,
             Inches(1.2), y, Inches(11), Inches(0.8),
             font=SANS, size=16, color=DARK_WARM)
             
    n = len(metrics)
    card_w = Inches(2.5)
    gap = Inches(0.4)
    total_w = card_w * n + gap * (n - 1)
    start = (SLIDE_W - total_w) / 2
    
    cards_y = y + Inches(1.2)

    for i, (value, label) in enumerate(metrics):
        x = start + (card_w + gap) * i
        
        # Draw metric card
        from .helpers import add_card
        add_card(s, x, cards_y, card_w, Inches(2.0), fill=IVORY, border=BORDER_CREAM)
        
        add_text(s, value,
                 x, cards_y + Inches(0.4), card_w, Inches(0.8),
                 font=SERIF, size=44, color=BRAND, align=PP_ALIGN.CENTER)
                 
        add_text(s, label,
                 x, cards_y + Inches(1.2), card_w, Inches(0.4),
                 font=SANS, size=12, color=OLIVE, align=PP_ALIGN.CENTER)
                 
    if page_num is not None:
        add_page_number(s, page_num, total=total_pages)
        
    return s


def split_image_slide(prs, eyebrow, title, image_path, body, bullets=None, page_num=None, total_pages=None):
    s = blank_slide(prs)
    y = add_eyebrow_header(s, eyebrow, title)
    
    # Left side content
    add_multiline_text(s, [body],
                       Inches(1.2), y, Inches(5.0), Inches(1.5),
                       font=SANS, size=16, color=DARK_WARM, line_spacing=24)
                       
    if bullets:
        add_bullet_list(s, bullets, Inches(1.2), y + Inches(1.5), Inches(4.8), 
                        font_size=14, item_height=0.6)
    
    # Right side image inside a soft border container
    img_x = Inches(6.8)
    img_y = y
    img_w = Inches(5.5)
    img_h = Inches(4.5)
    
    from .helpers import add_card
    add_card(s, img_x - Inches(0.1), img_y - Inches(0.1), img_w + Inches(0.2), img_h + Inches(0.2), 
             fill=IVORY, border=BORDER_CREAM, border_weight=1)
             
    try:
        s.shapes.add_picture(image_path, img_x, img_y, width=img_w)
    except Exception as e:
        add_text(s, f"[Image Placeholder: {image_path}]", img_x, img_y + Inches(2.0), img_w, Inches(1.0), align=PP_ALIGN.CENTER, font=MONO, color=STONE)
    
    if page_num is not None:
        add_page_number(s, page_num, total=total_pages)
        
    return s


def quote_slide(prs, quote, source, page_num=None, total_pages=None):
    s = blank_slide(prs, bg_color=DEEP_DARK)
    
    add_brand_left_bar(s, Inches(1.5), Inches(3.0), Inches(1.5), width=Pt(4))
    
    add_text(s, f"\u201c{quote}\u201d",
             Inches(2.0), Inches(2.5), Inches(9.8), Inches(2.5),
             font=SERIF, size=32, color=IVORY, vanchor=MSO_ANCHOR.MIDDLE, line_spacing=42)
             
    add_text(s, f"—— {source}",
             Inches(2.0), Inches(5.2), Inches(9.8), Inches(0.4),
             font=SANS, size=14, color=STONE)
             
    if page_num is not None:
        add_page_number(s, page_num, total=total_pages)
        
    return s


def ending_slide(prs, message, contact):
    s = blank_slide(prs, bg_color=PARCHMENT)
    
    add_text(s, message,
             Inches(1), Inches(3), CONTENT_W, Inches(1.2),
             font=SERIF, size=44, color=NEAR_BLACK, align=PP_ALIGN.CENTER)
             
    add_line(s, HALF_W, Inches(4.5), Inches(2.5), weight_pt=1.5)
    
    add_text(s, contact,
             Inches(1), Inches(4.8), CONTENT_W, Inches(0.6),
             font=MONO, size=12, color=OLIVE, align=PP_ALIGN.CENTER)
             
    return s
