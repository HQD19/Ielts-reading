"""Shared page shell, embedded into each standalone skill screen."""
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parent

def render_shared_ui(source, skill):
    css = (ROOT / 'src/ui.css').read_text(encoding='utf8')
    header = (ROOT / 'src/ui.header.html').read_text(encoding='utf8')
    marker = '/*__SHARED_UI_CSS__*/'
    assert source.count(marker) == 1, 'Shared CSS marker missing or duplicated'
    source = source.replace(marker, css)
    pattern = r'<!--__HEADER_ACTIONS_START__-->(.*?)<!--__HEADER_ACTIONS_END__-->'
    match = re.search(pattern, source, re.S)
    assert match and len(re.findall(pattern, source, re.S)) == 1, 'Header actions missing or duplicated'
    course = ('<b id="course-name">Cambridge</b><span>/</span><span>Reading</span><span class="pill" id="course-track">ACADEMIC</span>'
              if skill == 'reading' else 'IELTS Listening')
    header = header.replace('{{COURSE}}', course).replace('{{ACTIONS}}', match.group(1))
    for name in ('reading', 'listening'):
        header = header.replace('{{' + name.upper() + '_CURRENT}}',
                                'aria-current="page"' if name == skill else '')
    return source[:match.start()] + header + source[match.end():]
