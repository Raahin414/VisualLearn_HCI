"""Build the project report from its editable Markdown source.

Requires reportlab. Optional rendering/QA uses PyMuPDF and Pillow.
Run from any directory: python output/pdf/build_documentation.py
"""
from pathlib import Path
import re
from html import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.pagesizes import A4

BASE = Path(__file__).resolve().parent
SOURCE = BASE / 'VisualLearn_Project_Documentation.md'
TARGET = BASE / 'VisualLearn_Project_Documentation.pdf'
TEAL = colors.HexColor('#215E55')
INK = colors.HexColor('#20302E')
MUTED = colors.HexColor('#5B6B67')
PALE = colors.HexColor('#EDF4F1')
RULE = colors.HexColor('#CFDDD7')
FONT_DIR = Path('C:/Windows/Fonts')
for name, filename in [('Body', 'calibri.ttf'), ('BodyBold', 'calibrib.ttf'), ('BodyItalic', 'calibrii.ttf'), ('Display', 'georgia.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / filename)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='BodyBold', italic='BodyItalic', boldItalic='BodyBold')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='ReportBody', fontName='Body', fontSize=10.5, leading=14, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name='ReportH1', fontName='Display', fontSize=23, leading=28, textColor=TEAL, spaceAfter=17))
styles.add(ParagraphStyle(name='ReportH2', fontName='BodyBold', fontSize=12.2, leading=16, textColor=TEAL, spaceBefore=8, spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle(name='ReportCell', fontName='Body', fontSize=9.3, leading=12, textColor=INK))
styles.add(ParagraphStyle(name='ReportHeadCell', fontName='BodyBold', fontSize=9.3, leading=12, textColor=colors.white))
styles.add(ParagraphStyle(name='ReportSource', fontName='BodyItalic', fontSize=8, leading=10.5, textColor=MUTED, spaceBefore=9))
styles.add(ParagraphStyle(name='ReportBullet', parent=styles['ReportBody'], leftIndent=12, firstLineIndent=-10, spaceAfter=5))
styles.add(ParagraphStyle(name='CoverTitle', fontName='Display', fontSize=36, leading=42, textColor=TEAL, spaceAfter=5))
styles.add(ParagraphStyle(name='CoverSub', fontName='BodyBold', fontSize=15, leading=20, textColor=INK, spaceAfter=11))

def inline(text):
    text = escape(text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', text)
    return text

def para(text, style='ReportBody'):
    return Paragraph(inline(text), styles[style])

class Architecture(Flowable):
    def __init__(self):
        Flowable.__init__(self)
        self.width = 491
        self.height = 67
    def draw(self):
        c = self.canv
        labels = [('Browser', 'Assigned screens'), ('Server API', 'Validation + service'), ('PostgreSQL', 'Private research data')]
        for i, (title, subtitle) in enumerate(labels):
            x = i * 168
            c.setFillColor(PALE); c.setStrokeColor(RULE)
            c.roundRect(x, 12, 151, 47, 5, fill=1, stroke=1)
            c.setFillColor(TEAL); c.setFont('BodyBold', 11)
            c.drawCentredString(x + 75.5, 40, title)
            c.setFillColor(MUTED); c.setFont('Body', 8.5)
            c.drawCentredString(x + 75.5, 25, subtitle)
            if i < 2:
                c.setStrokeColor(TEAL); c.line(x + 154, 35, x + 165, 35)
                c.line(x + 162, 38, x + 165, 35); c.line(x + 162, 32, x + 165, 35)

def table(lines):
    rows = [[cell.strip() for cell in row.strip().strip('|').split('|')] for row in lines]
    rows = [row for row in rows if not all(re.fullmatch(r'[:\- ]+', cell or '-') for cell in row)]
    cols = len(rows[0]); width = A4[0] - 104
    if cols == 2:
        widths = [width * .30, width * .70]
    elif cols == 3:
        widths = [width * .22, width * .36, width * .42]
    elif cols == 4:
        widths = [width * .09, width * .21, width * .39, width * .31]
    else:
        widths = [width / cols] * cols
    if 'Layer' in rows[0][0]:
        widths = [width * .49, width * .17, width * .17, width * .17]
    data = [[para(cell, 'ReportHeadCell' if i == 0 else 'ReportCell') for cell in row] for i, row in enumerate(rows)]
    t = Table(data, colWidths=widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), TEAL),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [PALE, colors.white]),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LINEBELOW', (0, -1), (-1, -1), .5, RULE),
    ]))
    return t

class ReportDoc(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == 'ReportH1':
            label = flowable.getPlainText()
            key = 'section-' + str(self.page)
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(label, key, 0)

def decorate(canvas, doc):
    w, h = A4
    canvas.saveState()
    canvas.setStrokeColor(RULE); canvas.setLineWidth(.6)
    canvas.line(52, h-43, w-52, h-43)
    canvas.setFont('BodyBold', 8); canvas.setFillColor(TEAL)
    canvas.drawString(52, h-33, 'VISUALLEARN  /  FIVE-COURSE EXPERIMENTAL PLAN')
    canvas.setFont('Body', 8); canvas.setFillColor(MUTED)
    canvas.drawRightString(w-52, h-33, '26 OCTOBER 2026')
    canvas.line(52, 42, w-52, 42)
    canvas.drawString(52, 28, 'HCI project  |  Proposed study design and procedure')
    canvas.drawRightString(w-52, 28, f'{doc.page:02d}')
    canvas.restoreState()

def build():
    story = []
    blocks = SOURCE.read_text(encoding='utf-8').split('\n---\n')
    for index, block in enumerate(blocks):
        if index:
            story.append(PageBreak())
        lines = block.strip().lstrip('\ufeff').splitlines()
        i = 0
        if index == 0:
            story.append(Spacer(1, 3))
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1; continue
            if line.startswith('|'):
                group = []
                while i < len(lines) and lines[i].strip().startswith('|'):
                    group.append(lines[i]); i += 1
                story.extend([table(group), Spacer(1, 10)])
                continue
            if line.startswith('# '):
                story.append(para(line[2:], 'CoverTitle' if index == 0 else 'ReportH1'))
            elif line.startswith('### '):
                story.append(para(line[4:], 'ReportH2'))
            elif line.startswith('## '):
                story.append(para(line[3:], 'CoverSub' if index == 0 else 'ReportH2'))
            elif line.startswith('- '):
                story.append(para('- ' + line[2:], 'ReportBullet'))
            else:
                group = [line]
                while i+1 < len(lines) and lines[i+1].strip() and not lines[i+1].startswith(('#', '|', '- ')):
                    i += 1; group.append(lines[i].strip())
                text = ' '.join(group)
                story.append(para(text, 'ReportSource' if text.startswith(('Sources:', 'Project basis:')) else 'ReportBody'))
                if index == 11 and text.startswith('VisualLearn is one Next.js'):
                    story.append(Architecture())
            i += 1
    doc = ReportDoc(str(TARGET), pagesize=A4, rightMargin=52, leftMargin=52, topMargin=62, bottomMargin=58,
                    title='VisualLearn - Project Documentation', author='VisualLearn Project Team',
                    subject='Five-course visual-density experimental plan and participant procedure', pageCompression=1)
    doc.build(story, onFirstPage=decorate, onLaterPages=decorate)
    print(TARGET)

if __name__ == '__main__':
    build()
