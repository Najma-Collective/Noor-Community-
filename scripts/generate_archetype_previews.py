import os
from textwrap import dedent

BASE = dedent(
    """\
    <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1280 720\" role=\"img\" aria-hidden=\"true\">
      <defs>
        <style>
          .bg { fill: #f3f5fa; }
          .header { fill: #dbe7ff; }
          .card { fill: #ffffff; }
          .accent { fill: #2f5bea; }
          .muted { fill: #e5ebf5; }
          .chip { fill: #c9d6ff; }
          .placeholder { fill: none; stroke: #9aa9c8; stroke-width: 8; stroke-dasharray: 18 14; }
          .divider { stroke: #b9c4dd; stroke-width: 6; }
          .outline { fill: none; stroke: #94a3c7; stroke-width: 6; }
          .text-line { fill: #b1bed6; }
          .text-strong { fill: #7a8bb0; }
          .badge { fill: #2f5bea; opacity: 0.18; }
          .highlight { fill: #ffe7c2; }
        </style>
      </defs>
      <rect class=\"bg\" x=\"0\" y=\"0\" width=\"1280\" height=\"720\"/>
      {content}
    </svg>
    """
)

layouts = {
    "blank-canvas": """
      <rect class=\"card\" x=\"120\" y=\"80\" width=\"1040\" height=\"560\" rx=\"32\"/>
      <rect class=\"placeholder\" x=\"180\" y=\"140\" width=\"920\" height=\"440\" rx=\"24\"/>
      <rect class=\"muted\" x=\"180\" y=\"90\" width=\"240\" height=\"36\" rx=\"18\"/>
      <rect class=\"muted\" x=\"180\" y=\"592\" width=\"300\" height=\"28\" rx=\"14\"/>
    """,
    "learning-objectives": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"120\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"220\" width=\"1040\" height=\"420\" rx=\"32\"/>
      <rect class=\"text-strong\" x=\"160\" y=\"260\" width=\"520\" height=\"32\" rx=\"16\"/>
      <rect class=\"text-line\" x=\"160\" y=\"312\" width=\"480\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"160\" y=\"360\" width=\"520\" height=\"24\" rx=\"12\"/>
      <rect class=\"chip\" x=\"180\" y=\"408\" width=\"900\" height=\"48\" rx=\"24\"/>
      <rect class=\"chip\" x=\"180\" y=\"476\" width=\"900\" height=\"48\" rx=\"24\"/>
      <rect class=\"chip\" x=\"180\" y=\"544\" width=\"900\" height=\"48\" rx=\"24\"/>
    """,
    "model-dialogue": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"120\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"220\" width=\"660\" height=\"420\" rx=\"32\"/>
      <rect class=\"card\" x=\"820\" y=\"220\" width=\"340\" height=\"280\" rx=\"32\"/>
      <rect class=\"muted\" x=\"840\" y=\"524\" width=\"300\" height=\"96\" rx=\"20\"/>
      <rect class=\"text-line\" x=\"160\" y=\"260\" width=\"580\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"160\" y=\"304\" width=\"540\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"160\" y=\"348\" width=\"520\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"160\" y=\"392\" width=\"540\" height=\"24\" rx=\"12\"/>
      <line class=\"divider\" x1=\"160\" y1=\"440\" x2=\"720\" y2=\"440\"/>
      <rect class=\"text-line\" x=\"160\" y=\"456\" width=\"520\" height=\"24\" rx=\"12\"/>
      <rect class=\"muted\" x=\"160\" y=\"520\" width=\"560\" height=\"64\" rx=\"16\"/>
    """,
    "interactive-practice": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"badge\" x=\"980\" y=\"96\" width=\"140\" height=\"78\" rx=\"18\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"620\" height=\"160\" rx=\"28\"/>
      <rect class=\"card\" x=\"120\" y=\"390\" width=\"620\" height=\"250\" rx=\"28\"/>
      <rect class=\"card\" x=\"760\" y=\"210\" width=\"400\" height=\"430\" rx=\"32\"/>
      <rect class=\"muted\" x=\"780\" y=\"230\" width=\"360\" height=\"80\" rx=\"18\"/>
      <rect class=\"outline\" x=\"780\" y=\"330\" width=\"360\" height=\"260\" rx=\"24\" stroke-dasharray=\"22 16\"/>
      <rect class=\"text-line\" x=\"160\" y=\"240\" width=\"540\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"160\" y=\"286\" width=\"500\" height=\"20\" rx=\"10\"/>
      <rect class=\"text-line\" x=\"160\" y=\"420\" width=\"520\" height=\"20\" rx=\"10\"/>
      <rect class=\"text-line\" x=\"160\" y=\"460\" width=\"540\" height=\"20\" rx=\"10\"/>
      <rect class=\"text-line\" x=\"160\" y=\"500\" width=\"500\" height=\"20\" rx=\"10\"/>
      <rect class=\"muted\" x=\"160\" y=\"560\" width=\"560\" height=\"48\" rx=\"24\"/>
    """,
    "communicative-task": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"highlight\" x=\"160\" y=\"110\" width=\"620\" height=\"40\" rx=\"18\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"640\" height=\"430\" rx=\"32\"/>
      <rect class=\"muted\" x=\"160\" y=\"250\" width=\"560\" height=\"70\" rx=\"20\"/>
      <rect class=\"muted\" x=\"160\" y=\"340\" width=\"560\" height=\"70\" rx=\"20\"/>
      <rect class=\"card\" x=\"800\" y=\"210\" width=\"360\" height=\"430\" rx=\"32\"/>
      <rect class=\"text-line\" x=\"820\" y=\"250\" width=\"320\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"820\" y=\"296\" width=\"320\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"820\" y=\"342\" width=\"320\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"820\" y=\"388\" width=\"320\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"820\" y=\"434\" width=\"320\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"820\" y=\"480\" width=\"320\" height=\"24\" rx=\"12\"/>
    """,
    "pronunciation-focus": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"1040\" height=\"430\" rx=\"32\"/>
      <rect class=\"text-strong\" x=\"160\" y=\"250\" width=\"400\" height=\"28\" rx=\"14\"/>
      <rect class=\"chip\" x=\"160\" y=\"300\" width=\"920\" height=\"52\" rx=\"24\"/>
      <rect class=\"chip\" x=\"160\" y=\"372\" width=\"920\" height=\"52\" rx=\"24\"/>
      <rect class=\"muted\" x=\"160\" y=\"444\" width=\"920\" height=\"140\" rx=\"28\"/>
    """,
    "reflection": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"1040\" height=\"430\" rx=\"32\"/>
      <rect class=\"text-line\" x=\"180\" y=\"260\" width=\"820\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"180\" y=\"320\" width=\"780\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"180\" y=\"380\" width=\"840\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"180\" y=\"440\" width=\"800\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"180\" y=\"500\" width=\"760\" height=\"24\" rx=\"12\"/>
    """,
    "grounding-activity": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"1040\" height=\"430\" rx=\"32\"/>
      <rect class=\"badge\" x=\"160\" y=\"250\" width=\"80\" height=\"80\" rx=\"40\"/>
      <rect class=\"text-line\" x=\"260\" y=\"260\" width=\"840\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"260\" y=\"304\" width=\"760\" height=\"24\" rx=\"12\"/>
      <rect class=\"badge\" x=\"160\" y=\"360\" width=\"80\" height=\"80\" rx=\"40\"/>
      <rect class=\"text-line\" x=\"260\" y=\"370\" width=\"820\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"260\" y=\"414\" width=\"760\" height=\"24\" rx=\"12\"/>
      <rect class=\"badge\" x=\"160\" y=\"470\" width=\"80\" height=\"80\" rx=\"40\"/>
      <rect class=\"text-line\" x=\"260\" y=\"480\" width=\"820\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"260\" y=\"524\" width=\"760\" height=\"24\" rx=\"12\"/>
    """,
    "topic-introduction": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"460\" height=\"430\" rx=\"32\"/>
      <rect class=\"card\" x=\"600\" y=\"210\" width=\"560\" height=\"430\" rx=\"32\"/>
      <rect class=\"muted\" x=\"160\" y=\"250\" width=\"380\" height=\"280\" rx=\"24\"/>
      <rect class=\"text-line\" x=\"640\" y=\"250\" width=\"480\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"640\" y=\"294\" width=\"520\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"640\" y=\"338\" width=\"500\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"640\" y=\"382\" width=\"480\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"640\" y=\"426\" width=\"520\" height=\"24\" rx=\"12\"/>
      <rect class=\"highlight\" x=\"640\" y=\"470\" width=\"520\" height=\"90\" rx=\"24\"/>
      <rect class=\"chip\" x=\"640\" y=\"580\" width=\"240\" height=\"36\" rx=\"18\"/>
      <rect class=\"chip\" x=\"900\" y=\"580\" width=\"240\" height=\"36\" rx=\"18\"/>
    """,
    "guided-discovery": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"1040\" height=\"430\" rx=\"32\"/>
      <rect class=\"muted\" x=\"160\" y=\"250\" width=\"920\" height=\"120\" rx=\"24\"/>
      <rect class=\"highlight\" x=\"160\" y=\"390\" width=\"920\" height=\"90\" rx=\"24\"/>
      <rect class=\"muted\" x=\"160\" y=\"500\" width=\"920\" height=\"90\" rx=\"24\"/>
    """,
    "creative-practice": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"500\" height=\"430\" rx=\"32\"/>
      <rect class=\"card\" x=\"640\" y=\"210\" width=\"520\" height=\"430\" rx=\"32\"/>
      <rect class=\"muted\" x=\"160\" y=\"250\" width=\"420\" height=\"300\" rx=\"24\"/>
      <rect class=\"text-line\" x=\"680\" y=\"250\" width=\"440\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"680\" y=\"294\" width=\"460\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"680\" y=\"338\" width=\"420\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"680\" y=\"382\" width=\"460\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"680\" y=\"426\" width=\"440\" height=\"24\" rx=\"12\"/>
      <rect class=\"muted\" x=\"680\" y=\"480\" width=\"440\" height=\"120\" rx=\"24\"/>
    """,
    "task-divider": """
      <rect class=\"card\" x=\"160\" y=\"140\" width=\"960\" height=\"440\" rx=\"48\"/>
      <rect class=\"badge\" x=\"360\" y=\"220\" width=\"560\" height=\"200\" rx=\"100\"/>
      <rect class=\"muted\" x=\"440\" y=\"260\" width=\"400\" height=\"120\" rx=\"60\"/>
      <rect class=\"text-line\" x=\"320\" y=\"420\" width=\"640\" height=\"32\" rx=\"16\"/>
    """,
    "task-reporting": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"1040\" height=\"430\" rx=\"32\"/>
      <rect class=\"muted\" x=\"160\" y=\"250\" width=\"920\" height=\"80\" rx=\"24\"/>
      <line class=\"divider\" x1=\"240\" y1=\"380\" x2=\"1040\" y2=\"380\"/>
      <rect class=\"badge\" x=\"220\" y=\"360\" width=\"80\" height=\"80\" rx=\"40\"/>
      <rect class=\"badge\" x=\"460\" y=\"360\" width=\"80\" height=\"80\" rx=\"40\"/>
      <rect class=\"badge\" x=\"700\" y=\"360\" width=\"80\" height=\"80\" rx=\"40\"/>
      <rect class=\"badge\" x=\"940\" y=\"360\" width=\"80\" height=\"80\" rx=\"40\"/>
      <rect class=\"text-line\" x=\"180\" y=\"480\" width=\"880\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"180\" y=\"524\" width=\"840\" height=\"24\" rx=\"12\"/>
    """,
    "genre-deconstruction": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"1040\" height=\"430\" rx=\"32\"/>
      <rect class=\"card\" x=\"160\" y=\"260\" width=\"280\" height=\"320\" rx=\"24\"/>
      <rect class=\"card\" x=\"500\" y=\"260\" width=\"280\" height=\"320\" rx=\"24\"/>
      <rect class=\"card\" x=\"840\" y=\"260\" width=\"280\" height=\"320\" rx=\"24\"/>
      <rect class=\"text-line\" x=\"180\" y=\"300\" width=\"240\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"520\" y=\"300\" width=\"240\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"860\" y=\"300\" width=\"240\" height=\"24\" rx=\"12\"/>
      <rect class=\"muted\" x=\"180\" y=\"340\" width=\"240\" height=\"200\" rx=\"16\"/>
      <rect class=\"muted\" x=\"520\" y=\"340\" width=\"240\" height=\"200\" rx=\"16\"/>
      <rect class=\"muted\" x=\"860\" y=\"340\" width=\"240\" height=\"200\" rx=\"16\"/>
    """,
    "linguistic-feature-hunt": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"1040\" height=\"430\" rx=\"32\"/>
      <rect class=\"muted\" x=\"160\" y=\"260\" width=\"960\" height=\"220\" rx=\"24\"/>
      <rect class=\"highlight\" x=\"360\" y=\"320\" width=\"480\" height=\"100\" rx=\"20\"/>
      <rect class=\"text-line\" x=\"160\" y=\"510\" width=\"960\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"160\" y=\"554\" width=\"920\" height=\"24\" rx=\"12\"/>
    """,
    "text-reconstruction": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"1040\" height=\"430\" rx=\"32\"/>
      <rect class=\"chip\" x=\"160\" y=\"260\" width=\"960\" height=\"60\" rx=\"24\"/>
      <rect class=\"chip\" x=\"160\" y=\"340\" width=\"960\" height=\"60\" rx=\"24\"/>
      <rect class=\"chip\" x=\"160\" y=\"420\" width=\"960\" height=\"60\" rx=\"24\"/>
      <rect class=\"muted\" x=\"160\" y=\"500\" width=\"960\" height=\"100\" rx=\"24\"/>
    """,
    "jumbled-text-sequencing": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <g transform=\"rotate(-4 640 425)\">
        <rect class=\"card\" x=\"200\" y=\"260\" width=\"880\" height=\"100\" rx=\"24\"/>
      </g>
      <g transform=\"rotate(2 640 360)\">
        <rect class=\"card\" x=\"200\" y=\"360\" width=\"880\" height=\"100\" rx=\"24\"/>
      </g>
      <g transform=\"rotate(-6 640 460)\">
        <rect class=\"card\" x=\"200\" y=\"460\" width=\"880\" height=\"100\" rx=\"24\"/>
      </g>
      <rect class=\"muted\" x=\"240\" y=\"560\" width=\"800\" height=\"60\" rx=\"24\"/>
    """,
    "scaffolded-joint-construction": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"540\" height=\"430\" rx=\"32\"/>
      <rect class=\"card\" x=\"620\" y=\"210\" width=\"540\" height=\"430\" rx=\"32\"/>
      <rect class=\"text-line\" x=\"160\" y=\"250\" width=\"460\" height=\"24\" rx=\"12\"/>
      <rect class=\"muted\" x=\"160\" y=\"294\" width=\"460\" height=\"120\" rx=\"20\"/>
      <rect class=\"text-line\" x=\"660\" y=\"250\" width=\"460\" height=\"24\" rx=\"12\"/>
      <rect class=\"muted\" x=\"660\" y=\"294\" width=\"460\" height=\"120\" rx=\"20\"/>
      <rect class=\"highlight\" x=\"160\" y=\"440\" width=\"940\" height=\"160\" rx=\"24\"/>
    """,
    "independent-construction-checklist": """
      <rect class=\"header\" x=\"120\" y=\"80\" width=\"1040\" height=\"110\" rx=\"32\"/>
      <rect class=\"card\" x=\"120\" y=\"210\" width=\"1040\" height=\"430\" rx=\"32\"/>
      <rect class=\"text-line\" x=\"180\" y=\"260\" width=\"820\" height=\"24\" rx=\"12\"/>
      <rect class=\"outline\" x=\"180\" y=\"300\" width=\"860\" height=\"48\" rx=\"20\"/>
      <rect class=\"outline\" x=\"180\" y=\"364\" width=\"860\" height=\"48\" rx=\"20\"/>
      <rect class=\"outline\" x=\"180\" y=\"428\" width=\"860\" height=\"48\" rx=\"20\"/>
      <rect class=\"outline\" x=\"180\" y=\"492\" width=\"860\" height=\"48\" rx=\"20\"/>
      <rect class=\"muted\" x=\"180\" y=\"556\" width=\"480\" height=\"40\" rx=\"16\"/>
    """,
    "card-stack": """
      <g opacity=\"0.4\">
        <rect class=\"card\" x=\"420\" y=\"200\" width=\"440\" height=\"320\" rx=\"32\"/>
      </g>
      <g opacity=\"0.7\">
        <rect class=\"card\" x=\"380\" y=\"220\" width=\"440\" height=\"320\" rx=\"32\"/>
      </g>
      <rect class=\"card\" x=\"340\" y=\"240\" width=\"440\" height=\"320\" rx=\"32\"/>
      <rect class=\"text-line\" x=\"380\" y=\"280\" width=\"360\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"380\" y=\"324\" width=\"320\" height=\"24\" rx=\"12\"/>
      <rect class=\"muted\" x=\"380\" y=\"372\" width=\"360\" height=\"160\" rx=\"24\"/>
    """,
    "pill-with-gallery": """
      <rect class=\"card\" x=\"180\" y=\"200\" width=\"420\" height=\"320\" rx=\"160\"/>
      <rect class=\"muted\" x=\"660\" y=\"200\" width=\"420\" height=\"320\" rx=\"32\"/>
      <rect class=\"muted\" x=\"660\" y=\"540\" width=\"420\" height=\"80\" rx=\"28\"/>
      <rect class=\"text-line\" x=\"220\" y=\"260\" width=\"340\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"220\" y=\"304\" width=\"300\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"700\" y=\"240\" width=\"340\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"700\" y=\"284\" width=\"360\" height=\"24\" rx=\"12\"/>
      <rect class=\"text-line\" x=\"700\" y=\"328\" width=\"340\" height=\"24\" rx=\"12\"/>
    """,
}

OUTPUT_DIR = os.path.join("sandbox", "docs", "archetypes")
os.makedirs(OUTPUT_DIR, exist_ok=True)

for slug, content in layouts.items():
    svg = BASE.replace("{content}", content, 1)
    with open(os.path.join(OUTPUT_DIR, f"preview-{slug}.svg"), "w", encoding="utf-8") as fh:
        fh.write(svg)
