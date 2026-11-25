from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION_START
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Mm, Pt


PROJECT = Path("/Users/rayanakhashieva/Documents/Codex Projects/РИП/insulation-frontend-lab5")
SCREENSHOTS = PROJECT / "tmp" / "lab5-screenshots"
OUTPUT = Path("/Users/rayanakhashieva/Documents/Codex Projects/РИП/output/docx/лаб5.docx")

ITEMS = [
    ("01-feed.png", "Рисунок 1: Страница «Лента» с услугой из mock-коллекции."),
    ("02-catalog.png", "Рисунок 2: Страница «Плитка» с карточками mock-объектов и фильтром по цене."),
    ("03-details.png", "Рисунок 3: Страница подробной информации об услуге из mock-коллекции."),
    ("04-default-media-logic.png", "Рисунок 4: Выбор локальных изображения и видео по умолчанию в компоненте MaterialMedia."),
    ("05-default-media-render.png", "Рисунок 5: Пустые URL в mock-объектах и вывод медиа по умолчанию."),
    ("06-filter-component.png", "Рисунок 6: Компонент CatalogFilters и интерфейс передаваемых props."),
    ("07-filter-page.png", "Рисунок 7: Фильтрация mock-коллекции и передача props из CatalogPage."),
    ("08-hooks-state-effect-memo.png", "Рисунок 8: Использование хуков useState, useMemo и useEffect."),
    ("09-hooks-ref-router.png", "Рисунок 9: Использование хуков useRef, useState, useEffect, useParams и useNavigate."),
]


def set_run_font(run, *, italic=False):
    run.font.name = "Times New Roman"
    run.font.size = Pt(14)
    run.font.italic = italic
    props = run._element.get_or_add_rPr()
    fonts = props.get_or_add_rFonts()
    fonts.set(qn("w:ascii"), "Times New Roman")
    fonts.set(qn("w:hAnsi"), "Times New Roman")
    fonts.set(qn("w:eastAsia"), "Times New Roman")
    fonts.set(qn("w:cs"), "Times New Roman")


def format_text_paragraph(paragraph):
    paragraph.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    paragraph.paragraph_format.first_line_indent = Cm(1.25)
    paragraph.paragraph_format.line_spacing = 1.5
    paragraph.paragraph_format.space_before = Pt(0)
    paragraph.paragraph_format.space_after = Pt(0)


def add_text(document, text, *, italic=False):
    paragraph = document.add_paragraph()
    format_text_paragraph(paragraph)
    run = paragraph.add_run(text)
    set_run_font(run, italic=italic)
    return paragraph


def add_image(document, path):
    paragraph = document.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.first_line_indent = Mm(0)
    paragraph.paragraph_format.line_spacing = 1
    paragraph.paragraph_format.space_before = Pt(6)
    paragraph.paragraph_format.space_after = Pt(6)
    run = paragraph.add_run()
    run.add_picture(str(path), width=Cm(15.5))
    return paragraph


def build():
    missing = [str(SCREENSHOTS / name) for name, _ in ITEMS if not (SCREENSHOTS / name).exists()]
    if missing:
        raise FileNotFoundError("Missing screenshots:\n" + "\n".join(missing))

    document = Document()
    section = document.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Mm(20)
    section.bottom_margin = Mm(20)
    section.left_margin = Mm(30)
    section.right_margin = Mm(15)

    normal = document.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal.font.size = Pt(14)
    normal.element.rPr.rFonts.set(qn("w:ascii"), "Times New Roman")
    normal.element.rPr.rFonts.set(qn("w:hAnsi"), "Times New Roman")
    normal.element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")

    document.core_properties.title = "Лабораторная работа № 5 — порядок показа"
    document.core_properties.subject = "Скриншоты интерфейса, fallback-медиа, фильтрации, props и хуков"

    for index, (filename, caption) in enumerate(ITEMS, start=1):
        add_text(document, f"Скриншот {index}")
        add_image(document, SCREENSHOTS / filename)
        add_text(document, caption, italic=True)
        blank = document.add_paragraph()
        format_text_paragraph(blank)
        blank_run = blank.add_run("")
        set_run_font(blank_run, italic=False)
        if index != len(ITEMS):
            document.add_page_break()

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
