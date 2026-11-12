"""Check library coverage and source quotations using the standard library."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def validate():
    books = json.loads((ROOT / 'data/books.json').read_text(encoding='utf-8'))
    passages = []
    for book in books:
        passages.extend(json.loads((ROOT / f'data/books/{book["book"]}.json').read_text(encoding='utf-8')))
    errors = []
    ids = set()
    for p in passages:
        if p['id'] in ids:
            errors.append(f'{p["id"]}: duplicate passage ID')
        ids.add(p['id'])
        if p.get('track') != 'academic':
            errors.append(f'{p["id"]}: non-Academic passage')
        if len(p['vocab']) < 21:
            errors.append(f'{p["id"]}: fewer than 21 vocabulary entries')
        source = '\n'.join([p.get('subtitle', ''), *(r['text'] for r in p['paragraphs'])])
        terms = set()
        for v in p['vocab']:
            label = f'{p["id"]}: {v["term"]}'
            term = v['term'].casefold()
            if term in terms:
                errors.append(f'{label}: duplicate term')
            terms.add(term)
            if not all(isinstance(v.get(k), str) and v[k].strip()
                       for k in ('term', 'pos', 'ipa', 'meaning', 'synonyms', 'example')):
                errors.append(f'{label}: incomplete entry')
            if v['example'] not in source:
                errors.append(f'{label}: example not present verbatim in passage')
            form = v.get('sourceForm') or v.get('needle') or v['term']
            if form.casefold() not in v['example'].casefold():
                errors.append(f'{label}: source form absent from example')
        for figure in p.get('sourceFigures', []):
            path = (ROOT / figure['path']).resolve()
            path.relative_to(ROOT)
            if not path.is_file():
                errors.append(f'{p["id"]}: missing figure {figure["path"]}')
    if errors:
        raise SystemExit('\n'.join(errors))
    counts = [len(p['vocab']) for p in passages]
    result = dict(books=len(books), passages=len(passages),
                  tests=len({(p['book'], p['test']) for p in passages}),
                  questions=sum(len(g['questions']) for p in passages for g in p['groups']),
                  vocabulary=sum(counts), minimum=min(counts), maximum=max(counts),
                  figures=sum(len(p.get('sourceFigures', [])) for p in passages))
    print(json.dumps(result, indent=2))
    return result


if __name__ == '__main__':
    validate()
