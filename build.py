"""Build the standalone app using only the Python standard library."""
from pathlib import Path
import base64
import json
from ui_template import render_shared_ui

ROOT = Path(__file__).resolve().parent


def build():
    books = json.loads((ROOT / 'data/books.json').read_text(encoding='utf-8'))
    passages = []
    for book in books:
        source = ROOT / f'data/books/{book["book"]}.json'
        rows = [p for p in json.loads(source.read_text(encoding='utf-8'))
                if p.get('track', 'academic') == 'academic']
        for passage in rows:
            for figure in passage.get('sourceFigures', []):
                path = (ROOT / figure.pop('path')).resolve()
                path.relative_to(ROOT)
                figure['src'] = 'data:image/webp;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')
        passages.extend(rows)
    passages.sort(key=lambda p: (p['book'], p['track'] != 'academic', p['test'], p['number']))
    ids = [p['id'] for p in passages]
    assert len(ids) == len(set(ids)), 'Duplicate passage IDs'
    template = render_shared_ui((ROOT / 'src/index.template.html').read_text(encoding='utf-8'), 'reading')
    replacements = {
        '/*__PASSAGE_DATA__*/': json.dumps(passages, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/'),
        '/*__BOOK_DATA__*/': json.dumps(books, ensure_ascii=False),
    }
    for marker, value in replacements.items():
        assert template.count(marker) == 1, f'Missing or duplicated marker: {marker}'
        template = template.replace(marker, value)
    output = ROOT / 'index.html'
    output.write_text(template, encoding='utf-8')
    print(f'Built {output.name}: {len(books)} books, {len(passages)} passages, {output.stat().st_size:,} bytes')


if __name__ == '__main__':
    import build_listening
    build_listening.build()
    build()
