from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parent
ASSETS = ROOT / "report-assets"
OUTPUT = WORKSPACE / "output" / "docx" / "Лабораторная работа №6 — отчёт.docx"
DIAGRAM = ASSETS / "use-case-diagram.png"

RED = "E30613"
DARK = "20242C"
GRAY = "5D6570"
LIGHT = "F1F3F6"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    regular = "/System/Library/Fonts/Supplemental/Arial.ttf"
    bold_path = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
    return ImageFont.truetype(bold_path if bold else regular, size)


def wrapped_lines(draw: ImageDraw.ImageDraw, text: str, selected_font: ImageFont.FreeTypeFont, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=selected_font)[2] <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def centered_text(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], text: str, selected_font: ImageFont.FreeTypeFont, fill: str = "#111111") -> None:
    x1, y1, x2, y2 = box
    lines = wrapped_lines(draw, text, selected_font, x2 - x1 - 34)
    spacing = 7
    heights = [draw.textbbox((0, 0), line, font=selected_font)[3] for line in lines]
    total = sum(heights) + spacing * max(0, len(lines) - 1)
    y = y1 + (y2 - y1 - total) / 2
    for line, height in zip(lines, heights):
        bbox = draw.textbbox((0, 0), line, font=selected_font)
        x = x1 + (x2 - x1 - (bbox[2] - bbox[0])) / 2
        draw.text((x, y), line, font=selected_font, fill=fill)
        y += height + spacing


def ellipse(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], text: str, size: int = 27) -> None:
    shadow = (box[0] + 9, box[1] + 10, box[2] + 9, box[3] + 10)
    draw.ellipse(shadow, fill="#E6E6E6")
    draw.ellipse(box, fill="#FFFFFF", outline="#111111", width=2)
    centered_text(draw, box, text, font(size, True))


def actor(draw: ImageDraw.ImageDraw, x: int, y: int, label: str) -> None:
    draw.ellipse((x - 20, y, x + 20, y + 40), outline="#111111", width=3)
    draw.line((x, y + 40, x, y + 116), fill="#111111", width=3)
    draw.line((x - 44, y + 68, x + 44, y + 68), fill="#111111", width=3)
    draw.line((x, y + 116, x - 43, y + 170), fill="#111111", width=3)
    draw.line((x, y + 116, x + 43, y + 170), fill="#111111", width=3)
    bbox = draw.textbbox((0, 0), label, font=font(27, True))
    draw.text((x - (bbox[2] - bbox[0]) / 2, y + 181), label, fill="#111111", font=font(27, True))


def dashed_arrow(draw: ImageDraw.ImageDraw, start: tuple[int, int], end: tuple[int, int], label: str) -> None:
    x1, y1 = start
    x2, y2 = end
    steps = 22
    for i in range(0, steps, 2):
        a = i / steps
        b = min((i + 1) / steps, 1)
        draw.line((x1 + (x2 - x1) * a, y1 + (y2 - y1) * a, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b), fill="#111111", width=2)
    angle_dx, angle_dy = x2 - x1, y2 - y1
    length = max((angle_dx * angle_dx + angle_dy * angle_dy) ** 0.5, 1)
    ux, uy = angle_dx / length, angle_dy / length
    px, py = -uy, ux
    p1 = (x2 - ux * 19 + px * 9, y2 - uy * 19 + py * 9)
    p2 = (x2 - ux * 19 - px * 9, y2 - uy * 19 - py * 9)
    draw.polygon((end, p1, p2), fill="#111111")
    tx = (x1 + x2) / 2
    ty = (y1 + y2) / 2 - 28
    label_box = draw.textbbox((0, 0), label, font=font(21))
    draw.rectangle((tx - 8, ty - 3, tx + label_box[2] + 8, ty + label_box[3] + 4), fill="#FFFFFF")
    draw.text((tx, ty), label, fill="#111111", font=font(21))


def create_diagram() -> None:
    canvas = Image.new("RGB", (2400, 1500), "white")
    draw = ImageDraw.Draw(canvas)
    draw.rectangle((250, 35, 2350, 1460), outline="#111111", width=3)
    draw.text((1100, 48), "React-приложение «Теплощит»", font=font(34, True), fill="#111111")

    draw.rectangle((285, 105, 2310, 620), outline="#111111", width=2)
    draw.text((1040, 120), "Интерфейс гостя", font=font(30, True), fill="#111111")
    draw.rectangle((285, 655, 2310, 1415), outline="#111111", width=2)
    draw.text((990, 670), "Интерфейс пользователя", font=font(30, True), fill="#111111")

    actor(draw, 130, 210, "Гость")
    actor(draw, 130, 880, "Пользователь")
    draw.line((130, 405, 130, 880), fill="#111111", width=2)
    draw.polygon(((130, 850), (120, 872), (140, 872)), fill="#111111")

    guest_boxes = [
        ((360, 190, 750, 320), "Просмотреть плитку теплоизоляционных материалов"),
        ((870, 190, 1270, 320), "Просмотреть информацию о материале"),
        ((1400, 190, 1810, 320), "Применить фильтры материалов"),
        ((1890, 190, 2225, 320), "Авторизоваться (login)"),
        ((450, 410, 860, 545), "Просмотреть ленту материалов"),
        ((1000, 410, 1450, 545), "Получить данные с backend"),
        ((1600, 390, 2180, 565), "Получить mock-объекты при недоступном backend"),
    ]
    for box, text in guest_boxes:
        ellipse(draw, box, text, 25)

    user_boxes = [
        ((350, 750, 790, 890), "Добавить теплоизоляционный материал"),
        ((930, 750, 1370, 890), "Заполнить данные материала"),
        ((1510, 750, 2070, 890), "Выбрать изображение и видео"),
        ((420, 1010, 900, 1150), "Предварительно просмотреть изображение"),
        ((1010, 1010, 1460, 1150), "Удалить свой материал"),
        ((1600, 1000, 2190, 1160), "Поставить или снять лайк"),
        ((835, 1245, 1160, 1360), "Выйти"),
        ((1380, 1245, 2170, 1375), "Фильтры хранятся в Redux и сохраняются между страницами"),
    ]
    for box, text in user_boxes:
        ellipse(draw, box, text, 24)

    for point in ((360, 255), (450, 475), (350, 820), (420, 1080), (835, 1300)):
        draw.line((174, 280 if point[1] < 650 else 950, point[0], point[1]), fill="#111111", width=2)

    dashed_arrow(draw, (750, 250), (870, 250), "«include»")
    dashed_arrow(draw, (860, 470), (1000, 470), "«extend»")
    dashed_arrow(draw, (1600, 470), (1450, 470), "«extend»")
    dashed_arrow(draw, (790, 820), (930, 820), "«include»")
    dashed_arrow(draw, (1370, 820), (1510, 820), "«include»")
    dashed_arrow(draw, (1740, 890), (760, 1010), "«include»")

    canvas.save(DIAGRAM, quality=95)


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=100, start=120, bottom=100, end=120) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def keep_with_next(paragraph, value: bool = True) -> None:
    paragraph.paragraph_format.keep_with_next = value


def add_page_number(paragraph) -> None:
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run()
    begin = OxmlElement("w:fldChar")
    begin.set(qn("w:fldCharType"), "begin")
    instruction = OxmlElement("w:instrText")
    instruction.set(qn("xml:space"), "preserve")
    instruction.text = "PAGE"
    separate = OxmlElement("w:fldChar")
    separate.set(qn("w:fldCharType"), "separate")
    text = OxmlElement("w:t")
    text.text = "1"
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    for node in (begin, instruction, separate, text, end):
        run._r.append(node)


def add_bottom_rule(paragraph) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "18")
    bottom.set(qn("w:space"), "5")
    bottom.set(qn("w:color"), RED)
    p_bdr.append(bottom)
    p_pr.append(p_bdr)


def configure_document(doc: Document) -> None:
    doc.settings.odd_and_even_pages_header_footer = False
    section = doc.sections[0]
    section.different_first_page_header_footer = False
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(1.8)
    section.bottom_margin = Cm(1.8)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(1.5)
    section.header_distance = Cm(0.7)
    section.footer_distance = Cm(0.8)

    normal = doc.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    normal.font.size = Pt(13)
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    normal.paragraph_format.first_line_indent = Cm(1.25)
    normal.paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    normal.paragraph_format.space_after = Pt(6)

    for style_name, size, color in (("Title", 26, DARK), ("Heading 1", 18, DARK), ("Heading 2", 15, DARK)):
        style = doc.styles[style_name]
        style.font.name = "Times New Roman"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
        style.font.size = Pt(size)
        style.font.bold = True
        style.font.color.rgb = RGBColor.from_string(color)
        style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        style.paragraph_format.first_line_indent = Cm(0)
        style.paragraph_format.space_before = Pt(10)
        style.paragraph_format.space_after = Pt(8)
        style.paragraph_format.keep_with_next = True

    caption = doc.styles.add_style("Figure Caption", WD_STYLE_TYPE.PARAGRAPH)
    caption.font.name = "Times New Roman"
    caption._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    caption.font.size = Pt(11)
    caption.font.italic = True
    caption.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    caption.paragraph_format.first_line_indent = Cm(0)
    caption.paragraph_format.space_before = Pt(5)
    caption.paragraph_format.space_after = Pt(8)
    caption.paragraph_format.keep_with_next = True

    header = section.header.paragraphs[0]
    header.text = "Лабораторная работа № 6  ·  React  ·  Redux Toolkit  ·  Axios"
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    header.runs[0].font.name = "Arial"
    header.runs[0].font.size = Pt(8)
    header.runs[0].font.color.rgb = RGBColor.from_string(GRAY)
    add_bottom_rule(header)

    add_page_number(section.footer.paragraphs[0])


def add_title_page(doc: Document) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(20)
    run = p.add_run("Московский государственный технический университет\nимени Н. Э. Баумана")
    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(14)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(90)
    run = p.add_run("ЛАБОРАТОРНАЯ РАБОТА № 6")
    run.bold = True
    run.font.name = "Arial"
    run.font.size = Pt(26)
    run.font.color.rgb = RGBColor.from_string(DARK)
    add_bottom_rule(p)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(16)
    run = p.add_run("Завершение пользовательского интерфейса React")
    run.bold = True
    run.font.name = "Times New Roman"
    run.font.size = Pt(20)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(12)
    run = p.add_run("Предметная область: теплоизоляционные материалы\nИнформационная система «Теплощит»")
    run.font.name = "Times New Roman"
    run.font.size = Pt(15)

    doc.add_paragraph("\n\n\n\n")
    table = doc.add_table(rows=2, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.RIGHT
    table.autofit = False
    table.columns[0].width = Cm(4)
    table.columns[1].width = Cm(7.5)
    for row, left, right in (
        (table.rows[0], "Выполнила:", "Хашиева Раяна"),
        (table.rows[1], "Группа:", "РТ5-51Б"),
    ):
        row.cells[0].text = left
        row.cells[1].text = right
        for cell in row.cells:
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            for paragraph in cell.paragraphs:
                paragraph.paragraph_format.first_line_indent = Cm(0)
                paragraph.paragraph_format.space_after = Pt(0)
                paragraph.runs[0].font.size = Pt(13)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(118)
    run = p.add_run("Москва, 2026")
    run.font.name = "Times New Roman"
    run.font.size = Pt(14)
    doc.add_page_break()


def heading(doc: Document, text: str, level: int = 1) -> None:
    p = doc.add_heading(text, level=level)
    if level == 1:
        add_bottom_rule(p)


def body(doc: Document, text: str, *, no_indent: bool = False, bold_prefix: str | None = None) -> None:
    p = doc.add_paragraph()
    if no_indent:
        p.paragraph_format.first_line_indent = Cm(0)
    if bold_prefix and text.startswith(bold_prefix):
        p.add_run(bold_prefix).bold = True
        p.add_run(text[len(bold_prefix):])
    else:
        p.add_run(text)


def bullets(doc: Document, items: Iterable[str]) -> None:
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.first_line_indent = Cm(0)
        p.paragraph_format.left_indent = Cm(0.7)
        p.paragraph_format.line_spacing = 1.15
        p.add_run(item)


def add_overview(doc: Document) -> None:
    heading(doc, "1. Цель и задание")
    body(doc, "Цель работы — завершить пользовательский интерфейс информационной системы «Теплощит» на React: внедрить централизованное состояние, авторизацию, фильтрацию, создание и удаление материалов, лайки и типизированное взаимодействие с веб-сервисом.")
    body(doc, "В Redux Toolkit размещены состояния авторизации, фильтров и теплоизоляционных материалов. Асинхронные операции предметной области реализованы через redux-thunk и сгенерированный по OpenAPI клиент Axios. Авторизация и выход выполняются обычным Axios и вручную изменяют Redux.")
    body(doc, "При недоступном backend гость получает коллекцию mock-объектов. Для авторизованного пользователя fallback запрещён. AJAX-запросы выполняются через /api, а объекты изображений и видео — через отдельный маршрут /silo к MinIO.")

    heading(doc, "2. Использованные средства")
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = "Table Grid"
    headers = ("Компонент", "Назначение")
    for index, text in enumerate(headers):
        cell = table.rows[0].cells[index]
        cell.text = text
        set_cell_shading(cell, DARK)
        cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
        cell.paragraphs[0].runs[0].bold = True
        cell.paragraphs[0].paragraph_format.first_line_indent = Cm(0)
        set_cell_margins(cell)
    set_repeat_table_header(table.rows[0])
    rows = (
        ("React, TypeScript, Vite", "Пользовательский интерфейс, маршрутизация и dev proxy"),
        ("Redux Toolkit", "auth, filters, materials; reducers, store, thunk middleware"),
        ("Axios + Orval", "HTTP-клиент и кодогенерация функций/типов из OpenAPI"),
        ("NestJS", "REST API авторизации и теплоизоляционных материалов"),
        ("PostgreSQL", "Карточки материалов и признаки владельца"),
        ("MinIO (Silo)", "Изображения и видео теплоизоляционных материалов"),
    )
    for row_index, values in enumerate(rows, start=1):
        cells = table.add_row().cells
        for index, text in enumerate(values):
            cells[index].text = text
            cells[index].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_margins(cells[index])
            if row_index % 2 == 0:
                set_cell_shading(cells[index], LIGHT)
            for p in cells[index].paragraphs:
                p.paragraph_format.first_line_indent = Cm(0)
                p.paragraph_format.line_spacing = 1.0
                p.paragraph_format.space_after = Pt(0)

    heading(doc, "3. Выполненная функциональность")
    bullets(doc, (
        "переключение гостевого и пользовательского интерфейса по кнопкам «Вход»/«Выход»;",
        "сохранение введённых фильтров в Redux при переходах между страницами и их сброс при выходе;",
        "передача фильтров search, insulationType и maxThicknessMm в backend;",
        "получение mock-коллекции только для гостя при недоступном backend;",
        "добавление материала, удаление собственной карточки и установка/снятие лайка через thunk;",
        "предварительный просмотр выбранного изображения до отправки формы;",
        "индикатор pending, блокирующий пользовательские кнопки во время AJAX-запросов;",
        "проксирование /api к backend и /silo к MinIO без прямого CORS-доступа браузера.",
    ))
    doc.add_page_break()


def add_diagram_page(doc: Document) -> None:
    heading(doc, "4. Диаграмма прецедентов React-интерфейса")
    body(doc, "На диаграмме показаны два состояния интерфейса. Гость просматривает ленту и плитку материалов, применяет фильтры и выполняет вход. После login Redux включает пользовательские функции: добавление материала, выбор и предварительный просмотр файла, удаление своей карточки, лайки и выход.")
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Cm(0)
    p.add_run().add_picture(str(DIAGRAM), width=Cm(16.7))
    caption = doc.add_paragraph("Рисунок 1 — Диаграмма прецедентов интерфейса React", style="Figure Caption")
    caption.paragraph_format.keep_with_next = False
    body(doc, "Состояние фильтров хранится централизованно, поэтому значения поля названия, типа и максимальной толщины не исчезают при переходах между страницами. Logout одновременно возвращает гостевой интерфейс и сбрасывает пользовательский фильтр.")
    doc.add_page_break()


SCREENSHOTS = [
    (1, "01-mock-feed.png", "Лента материалов в mock-режиме", "Backend остановлен. Thunk не получает ответ сервера и, поскольку пользователь является гостем, возвращает первый объект локальной коллекции. Внизу карточки явно указан источник «mock».", "portrait"),
    (2, "02-mock-catalog.png", "Каталог материалов в mock-режиме", "Вторая страница без запущенного сервиса показывает шесть mock-карточек. Над списком виден признак «mock · backend недоступен»; фильтры остаются работоспособными для локальной коллекции.", "portrait"),
    (3, "03-backend-feed.png", "Лента с данными веб-сервиса", "После запуска backend лента получает опубликованную карточку из PostgreSQL. Источник изменился на «web-service», а изображение загружено по объектному имени MinIO.", "portrait"),
    (4, "04-backend-catalog.png", "Каталог с серверной фильтрацией", "Введены название «Технолайт», тип «Минвата» и максимальная толщина 100 мм. Фильтры добавлены в query-параметры backend, поэтому возвращена одна подходящая карточка.", "portrait"),
    (5, "05-login.png", "Страница авторизации", "Форма входа вызывает метод authenticate обычным Axios. При успешном ответе полученный пользователь передаётся в authSlice вручную; сервер устанавливает HttpOnly-cookie sessionId.", "portrait"),
    (6, "06-add-preview.png", "Предпросмотр выбранного изображения", "Пользовательский интерфейс открывает страницу добавления. После выбора technolight-optima-50.jpg состояние компонента создаёт object URL и сразу отображает выбранное изображение; ниже выбран видеофайл. Пункт о смене картинки при выборе файла реализован.", "portrait"),
    (7, "07-database-update.png", "Изменение записи в PostgreSQL", "Командой UPDATE для материала 9001 изменены название и толщина. Следующий SELECT подтверждает значения «Эковата — изменено в БД (ЛР6)» и 175 мм в учебной базе.", "landscape"),
    (8, "08-frontend-after-update.png", "Отображение изменений БД во фронтенде", "После обновления каталога React заново выполняет AJAX-запрос. Во второй карточке без изменения frontend-кода отображены новое название и толщина 175 мм, то есть содержимое карточек поступает из веб-сервиса.", "portrait"),
    (9, "09-redux-cookie-after-f5.png", "Состояние после F5: Redux — гость, cookie сохранена", "Сначала выполнен login, затем страница перезагружена. Redux не персистентен: auth.user равен null, меню показывает «Вход», добавление недоступно. В Application при этом остаётся HttpOnly-cookie sessionId, что подтверждает разделение клиентского состояния и серверной сессии.", "landscape"),
    (10, "10-postman-owner-materials.png", "Запрос с cookie в Postman", "Значение sessionId из Application передано в заголовке Cookie. GET /api/insulation-materials возвращает карточки текущего пользователя с isCreator: 1. Этот признак используется интерфейсом для отображения возможности удаления.", "landscape"),
    (11, "11-redux-states-code.png", "Состояния Redux Toolkit", "Показаны три тематических slice: auth хранит пользователя и статус, filters — черновые и применённые фильтры, materials — каталог, ленту, источник данных, pending и ошибку. При logout reducer signedOut возвращает гостя, а resetFilters сбрасывает фильтры.", "landscape"),
    (12, "12-generated-axios.png", "Axios в кодогенерации Orval", "Единый Axios instance использует baseURL /api, withCredentials и timeout. Сгенерированный Orval-клиент импортирует mutator axiosInstance и предоставляет типизированные методы, включая getInsulationMaterials и createInsulationMaterial.", "landscape"),
    (13, "13-generated-api-in-thunk.png", "Применение сгенерированного API в thunk", "materialsSlice импортирует функции из generated/insulationMaterialsApi. Thunk loadCatalog получает applied-фильтры из store, передаёт их в getInsulationMaterials и преобразует DTO. Mock-fallback срабатывает только при отсутствии авторизованного пользователя.", "landscape"),
    (14, "14-thematic-thunks.png", "Тематические названия thunk", "Асинхронные действия названы по операциям предметной области: loadFirstFeedMaterial, loadNextFeedMaterial, addMaterial и removeMaterial. Внутри вызываются сгенерированные методы теплоизоляционных материалов.", "landscape"),
    (15, "15-network-api-proxy.png", "AJAX-запрос через proxy", "Network фиксирует адрес http://localhost:5176/api/insulation-materials с параметрами фильтра. Для браузера запрос остаётся в origin фронтенда; Vite перенаправляет /api на 127.0.0.1:3001, устраняя необходимость прямого CORS-запроса.", "landscape"),
    (16, "16-network-minio-proxy.png", "Изображения через маршрут Silo/MinIO", "Network показывает успешный GET /silo/insulation-materials/technolight-optima-50.jpg. Имя объекта хранится в PostgreSQL, bucket называется insulation-materials, а Vite переписывает /silo и проксирует запрос на локальный MinIO порт 9020.", "landscape"),
]


def add_screenshot_page(doc: Document, number: int, filename: str, title: str, explanation: str, orientation: str) -> None:
    if number == 1:
        heading(doc, "5. Результаты выполнения и порядок показа")
        body(doc, "Контрольные снимки приведены в порядке задания: mock без backend, страницы с сервисом, изменение БД, авторизация и cookie, код Redux/Axios/thunk и сетевые адреса proxy.")
        heading(doc, f"Скриншот {number}. {title}", level=2)
    else:
        heading(doc, f"Скриншот {number}. {title}")
    image_path = ASSETS / filename
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.first_line_indent = Cm(0)
    p.paragraph_format.space_after = Pt(3)
    if orientation == "portrait":
        p.add_run().add_picture(str(image_path), height=Cm(13.4 if number == 1 else 15.8))
    else:
        p.add_run().add_picture(str(image_path), width=Cm(16.5))
    caption = doc.add_paragraph(f"Рисунок {number + 1} — {title}", style="Figure Caption")
    caption.paragraph_format.keep_with_next = True
    body(doc, explanation)
    if number in (2, 6, 8, 10, 12, 14, 16):
        notes = {
            2: "Итог этапа: две страницы подтверждают работу гостевого интерфейса без сервиса.",
            6: "Итог этапа: четыре страницы подтверждают работу с backend, вход и доступ пользователя к добавлению материала.",
            8: "Итог этапа: изменение данных выполнено в БД и без дополнительного mock-кода появилось во фронтенде.",
            10: "Итог этапа: сессия сохраняется отдельно от Redux и может быть использована HTTP-клиентом.",
            12: "Итог этапа: показаны централизованные состояния и типизированный Axios-клиент из OpenAPI.",
            14: "Итог этапа: кодогенерация действительно используется внутри тематических Redux thunk.",
            16: "Итог этапа: оба маршрута proxy — /api и /silo — подтверждены фактическими сетевыми адресами.",
        }
        p = doc.add_paragraph()
        p.paragraph_format.first_line_indent = Cm(0)
        run = p.add_run(notes[number])
        run.bold = True
        run.font.color.rgb = RGBColor.from_string(RED)
    doc.add_page_break()


def add_control_questions(doc: Document) -> None:
    heading(doc, "6. Ответы на контрольные вопросы")

    questions = (
        ("6.1. Схема Redux Toolkit: reducer, store, middleware", "Store — единое хранилище состояния приложения. Reducer — чистая функция, формирующая новое состояние по текущему state и action. Middleware располагается между dispatch и reducer и может перехватывать, логировать или откладывать действия. configureStore из Redux Toolkit автоматически подключает thunk middleware, Redux DevTools и проверки dev-режима. createSlice объединяет имя slice, initialState, reducers и action creators; синтаксис видимой «мутации» безопасен благодаря Immer."),
        ("6.2. Axios", "Axios — HTTP-клиент на основе Promise. Он поддерживает baseURL, timeout, interceptors, автоматическое преобразование JSON и withCredentials. В работе создан instance с baseURL /api и withCredentials: true; этот instance используется Orval как mutator для всех сгенерированных функций предметной области."),
        ("6.3. Local Storage", "localStorage — синхронное строковое хранилище, разделённое по origin и не имеющее автоматического срока жизни. Оно доступно JavaScript, поэтому размещать там чувствительный session token опасно при XSS. В работе сессия хранится в HttpOnly-cookie, недоступной JavaScript, а Redux намеренно не восстанавливается после F5."),
        ("6.4. CORS и обратный proxy", "CORS — браузерный механизм контроля cross-origin-запросов. Reverse proxy принимает /api и /silo на origin фронтенда, а затем сам обращается к NestJS и MinIO. Для браузера запрос остаётся same-origin, поэтому не требуется открывать backend и объектное хранилище широкими CORS-разрешениями."),
        ("6.5. BFF и GraphQL", "BFF — backend, спроектированный под конкретный интерфейс: он агрегирует внутренние сервисы, скрывает топологию и возвращает удобные UI DTO. GraphQL предоставляет клиенту типизированную схему и выбор необходимых полей, уменьшая overfetching; при этом серверу нужны ограничения сложности, стратегия кеширования и защита от дорогих запросов."),
        ("6.6. Next.js и SSG", "Next.js — React-фреймворк с файловой маршрутизацией, серверными компонентами, SSR, SSG и backend-маршрутами. SSG формирует HTML во время сборки, поэтому страницы быстро отдаются через CDN. Динамические данные после публикации обновляют на клиенте, пересборкой либо Incremental Static Regeneration."),
        ("6.7. Feature-Sliced Design", "FSD делит frontend на слои app, pages, widgets, features, entities и shared. Зависимости направлены сверху вниз: верхние слои используют нижние, но не наоборот. Слайсы изолируют предметные области и предоставляют наружу контролируемый public API, благодаря чему крупный интерфейс проще развивать и тестировать."),
    )
    for title, answer in questions:
        heading(doc, title, level=2)
        body(doc, answer)
    doc.add_page_break()


def add_conclusion(doc: Document) -> None:
    heading(doc, "7. Заключение")
    body(doc, "В лабораторной работе завершён пользовательский интерфейс системы «Теплощит». Redux Toolkit хранит состояния авторизации, материалов и фильтров; значения фильтров сохраняются при маршрутизации и сбрасываются при выходе. Пользовательский интерфейс расширяется после login и возвращается к гостевому состоянию после logout.")
    body(doc, "Операции получения, создания, удаления и лайков выполняются типизированными функциями Axios, сгенерированными Orval из OpenAPI и подключёнными в redux-thunk. Авторизация и деавторизация реализованы отдельными ручными Axios-запросами. Во время асинхронных операций состояние pending позволяет блокировать повторные действия.")
    body(doc, "Подтверждены guest fallback на mock-объекты, серверная фильтрация, получение данных из PostgreSQL, предварительный просмотр выбранного изображения, сохранение HttpOnly-cookie после F5, признак владельца isCreator, а также два маршрута обратного прокси: /api для backend и /silo для MinIO.")
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(0)
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(26)
    run = p.add_run("Работа выполнена. Все 16 контрольных снимков получены автоматически без отображения указателя мыши.")
    run.bold = True
    run.font.color.rgb = RGBColor.from_string(RED)


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    create_diagram()
    doc = Document()
    configure_document(doc)
    add_title_page(doc)
    add_overview(doc)
    add_diagram_page(doc)
    for screenshot in SCREENSHOTS:
        add_screenshot_page(doc, *screenshot)
    add_control_questions(doc)
    add_conclusion(doc)
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    main()
