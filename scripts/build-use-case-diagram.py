"""Build the Lab 6 use-case diagram from controls visible in the React UI."""

from pathlib import Path
from xml.etree import ElementTree as ET
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DRAWIO = ROOT / "docs" / "Диаграмма-прецедентов-React.drawio"
PREVIEW = ROOT / "report-assets" / "use-case-diagram.png"
SCALE = 2

# The captions in parentheses are the actual button or menu labels in Lab 6.
CASES = {
    "feed": (185, 100, 250, 70, "Открыть ленту\n«Лента»"),
    "catalog": (500, 100, 250, 70, "Открыть каталог\n«Плитка»"),
    "login_page": (815, 100, 260, 70, "Открыть страницу входа\n«Вход»"),
    "next": (185, 220, 250, 70, "Следующий материал\n«Следующая»"),
    "filter": (500, 220, 250, 70, "Применить фильтр цены\n«Подобрать»"),
    "sign_in": (815, 220, 260, 70, "Авторизоваться\n«Войти»"),
    "expand": (185, 340, 250, 70, "Раскрыть описание\n«Подробнее»"),
    "details": (500, 340, 250, 70, "Открыть карточку\n«Подробнее»"),
    "back": (815, 340, 260, 70, "Вернуться назад\n«Назад»"),
    "add": (185, 535, 250, 70, "Открыть добавление\n«Добавление»"),
    "continue": (500, 535, 250, 70, "Перейти ко второму шагу\n«Далее»"),
    "publish": (815, 535, 260, 70, "Опубликовать материал\n«Опубликовать»"),
    "file": (185, 655, 250, 70, "Выбрать фото и видео\n«Выберите файл»"),
    "like": (500, 655, 250, 70, "Поставить или снять лайк\nкнопка лайка"),
    "delete": (815, 655, 260, 70, "Удалить свой материал\nкнопка корзины"),
    "logout": (185, 780, 250, 70, "Выйти из приложения\n«Выход»"),
}

# Only visible UI actions are shown. Dashed links indicate an action
# available from the parent screen; the add/publish link shows the two steps.
RELATIONS = [
    ("next", "feed", "«extend»"),
    ("filter", "catalog", "«extend»"),
    ("sign_in", "login_page", "«extend»"),
    ("expand", "feed", "«extend»"),
    ("details", "catalog", "«extend»"),
    ("back", "details", "«extend»"),
    ("continue", "add", "«extend»"),
    ("publish", "continue", "«extend»"),
    ("file", "add", "«extend»"),
]


def cell(root, name, value, style, x, y, width, height):
    node = ET.SubElement(root, "mxCell", {
        "id": name, "value": value, "style": style,
        "vertex": "1", "parent": "1",
    })
    ET.SubElement(node, "mxGeometry", {
        "x": str(x), "y": str(y), "width": str(width),
        "height": str(height), "as": "geometry",
    })


def edge(root, name, source, target, label="", dashed=False, arrow=False):
    style = (
        "edgeStyle=none;html=1;rounded=0;strokeColor=#000000;strokeWidth=1;"
        f"dashed={int(dashed)};dashPattern=4 4;"
        f"endArrow={'open' if arrow else 'none'};endFill=0;startArrow=none;"
        "fontFamily=Arial;fontSize=13;labelBackgroundColor=#ffffff;"
    )
    node = ET.SubElement(root, "mxCell", {
        "id": name, "value": label, "style": style,
        "edge": "1", "parent": "1", "source": source, "target": target,
    })
    ET.SubElement(node, "mxGeometry", {"relative": "1", "as": "geometry"})


mxfile = ET.Element("mxfile", {
    "host": "app.diagrams.net", "modified": "2026-11-25T00:00:00.000Z",
    "agent": "Codex", "version": "24.7.17",
})
diagram = ET.SubElement(mxfile, "diagram", {
    "id": "teploshchit-react-use-cases", "name": "Кнопки и навигация",
})
model = ET.SubElement(diagram, "mxGraphModel", {
    "dx": "1200", "dy": "950", "grid": "1", "gridSize": "10",
    "guides": "1", "tooltips": "1", "connect": "1", "arrows": "1",
    "fold": "1", "page": "1", "pageScale": "1",
    "pageWidth": "1190", "pageHeight": "930", "math": "0", "shadow": "0",
})
root = ET.SubElement(model, "root")
ET.SubElement(root, "mxCell", {"id": "0"})
ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})

box = "rounded=0;whiteSpace=wrap;html=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;"
heading = "text;html=1;align=center;verticalAlign=middle;fontFamily=Arial;fontSize=16;fontStyle=1;strokeColor=none;fillColor=#ffffff;"
oval = "ellipse;whiteSpace=wrap;html=1;align=center;verticalAlign=middle;fontFamily=Arial;fontSize=14;fontStyle=1;fillColor=#ffffff;strokeColor=#000000;strokeWidth=1;shadow=1;"
actor = "shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;fontFamily=Arial;fontSize=15;fontStyle=1;strokeColor=#000000;fillColor=#ffffff;"

cell(root, "system", "", box, 145, 20, 1000, 890)
cell(root, "system_title", "React-приложение «Теплощит»", heading, 420, 9, 430, 27)
cell(root, "guest_section", "", box, 155, 60, 980, 400)
cell(root, "guest_notch", "", box, 155, 44, 300, 16)
cell(root, "guest_title", "Интерфейс гостя", heading, 495, 60, 300, 27)
cell(root, "user_section", "", box, 155, 490, 980, 400)
cell(root, "user_notch", "", box, 155, 474, 300, 16)
cell(root, "user_title", "Интерфейс пользователя", heading, 480, 490, 330, 27)
cell(root, "guest_actor", "Гость", actor, 20, 145, 85, 105)
cell(root, "user_actor", "Пользователь", actor, 13, 600, 100, 110)

for name, (x, y, width, height, label) in CASES.items():
    cell(root, name, label.replace("\n", "<br>"), oval, x, y, width, height)

for source, target in [
    ("guest_actor", "feed"), ("guest_actor", "catalog"),
    ("guest_actor", "login_page"), ("user_actor", "add"),
    ("user_actor", "like"), ("user_actor", "delete"),
    ("user_actor", "logout"),
]:
    edge(root, f"assoc_{source}_{target}", source, target)

edge(root, "generalization", "user_actor", "guest_actor", arrow=True)
for source, target, label in RELATIONS:
    edge(root, f"rel_{source}_{target}", source, target, label, dashed=True, arrow=True)

ET.indent(mxfile, space="  ")
DRAWIO.write_bytes(b'<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(mxfile, encoding="utf-8"))

# Matching static preview for the report. The .drawio file remains editable.
image = Image.new("RGB", (1190 * SCALE, 930 * SCALE), "white")
draw = ImageDraw.Draw(image)
font_path = "/System/Library/Fonts/Supplemental/Arial.ttf"
font = ImageFont.truetype(font_path, 14 * SCALE)
font_bold = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 14 * SCALE)
font_title = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 16 * SCALE)


def xy(box):
    return tuple(round(v * SCALE) for v in box)


def centered_text(label, box, chosen_font):
    x, y, width, height = box
    lines = label.split("\n")
    line_height = 18
    top = y + (height - len(lines) * line_height) / 2
    for index, line in enumerate(lines):
        draw.text(((x + width / 2) * SCALE, (top + index * line_height) * SCALE),
                  line, anchor="mt", font=chosen_font, fill="black")


def center(name):
    x, y, width, height, _ = CASES[name]
    return x + width / 2, y + height / 2


def dotted_relation(source, target):
    x1, y1 = center(source)
    x2, y2 = center(target)
    # Connect nearest ellipse edges, with a small arrowhead at the target.
    if abs(x2 - x1) > abs(y2 - y1) * 2:
        x1 += 125 if x2 > x1 else -125
        x2 -= 125 if x2 > x1 else -125
    else:
        y1 += 35 if y2 > y1 else -35
        y2 -= 35 if y2 > y1 else -35
    from math import hypot
    length = hypot(x2 - x1, y2 - y1)
    ux, uy = (x2 - x1) / length, (y2 - y1) / length
    for start in range(0, int(length), 10):
        end = min(start + 5, length)
        draw.line(xy((x1 + ux * start, y1 + uy * start,
                      x1 + ux * end, y1 + uy * end)), fill="black", width=SCALE)
    draw.line(xy((x2 - ux * 8 - uy * 5, y2 - uy * 8 + ux * 5, x2, y2)), fill="black", width=SCALE)
    draw.line(xy((x2 - ux * 8 + uy * 5, y2 - uy * 8 - ux * 5, x2, y2)), fill="black", width=SCALE)
    middle_x, middle_y = (x1 + x2) / 2, (y1 + y2) / 2
    label = "«extend»"
    text_box = draw.textbbox((middle_x * SCALE, middle_y * SCALE), label, font=font)
    draw.rectangle((text_box[0] - 4, text_box[1] - 2,
                    text_box[2] + 4, text_box[3] + 2), fill="white")
    draw.text((middle_x * SCALE, middle_y * SCALE), label, font=font, fill="black")


for box_coordinates in [(145, 20, 1145, 910), (155, 60, 1135, 460), (155, 490, 1135, 890)]:
    draw.rectangle(xy(box_coordinates), outline="black", width=SCALE)
for label, box_coordinates in [
    ("React-приложение «Теплощит»", (420, 9, 430, 27)),
    ("Интерфейс гостя", (495, 60, 300, 27)),
    ("Интерфейс пользователя", (480, 490, 330, 27)),
]:
    x, y, width, height = box_coordinates
    draw.rectangle(xy((x, y, x + width, y + height)), fill="white")
    centered_text(label, box_coordinates, font_title)

for source, target, _ in RELATIONS:
    dotted_relation(source, target)

# Actor associations are placed under the ellipses so they stop at each case.
draw.line(xy((96, 197, 185, 135)), fill="black", width=SCALE)
draw.line(xy((96, 205, 500, 135)), fill="black", width=SCALE)
draw.line(xy((96, 213, 815, 135)), fill="black", width=SCALE)
draw.line(xy((96, 650, 185, 570)), fill="black", width=SCALE)
draw.line(xy((96, 660, 500, 690)), fill="black", width=SCALE)
draw.line(xy((96, 670, 815, 690)), fill="black", width=SCALE)
draw.line(xy((96, 680, 185, 815)), fill="black", width=SCALE)

for name, (x, y, width, height, label) in CASES.items():
    draw.ellipse(xy((x + 5, y + 6, x + width + 5, y + height + 6)), fill="#eeeeee")
    draw.ellipse(xy((x, y, x + width, y + height)), fill="white", outline="black", width=SCALE)
    centered_text(label, (x, y, width, height), font_bold)


def draw_actor(cx, head_y, label):
    draw.ellipse(xy((cx - 10, head_y, cx + 10, head_y + 20)), outline="black", width=SCALE)
    draw.line(xy((cx, head_y + 20, cx, head_y + 57)), fill="black", width=SCALE)
    draw.line(xy((cx - 17, head_y + 33, cx + 17, head_y + 33)), fill="black", width=SCALE)
    draw.line(xy((cx, head_y + 57, cx - 17, head_y + 80)), fill="black", width=SCALE)
    draw.line(xy((cx, head_y + 57, cx + 17, head_y + 80)), fill="black", width=SCALE)
    draw.text((cx * SCALE, (head_y + 87) * SCALE), label, font=font_bold, anchor="mt", fill="black")


draw_actor(62, 145, "Гость")
draw_actor(62, 600, "Пользователь")
draw.line(xy((62, 600, 62, 255)), fill="black", width=SCALE)
draw.line(xy((56, 267, 62, 255)), fill="black", width=SCALE)
draw.line(xy((68, 267, 62, 255)), fill="black", width=SCALE)

PREVIEW.parent.mkdir(parents=True, exist_ok=True)
image.save(PREVIEW)
print(DRAWIO)
print(PREVIEW)
